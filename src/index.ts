// // The 'mime' npm package helps us set the correct file type on our File objects
// import mime from 'mime';
// The 'fs' builtin module on Node.js provides access to the file system
// tslint:disable-next-line:no-implicit-dependencies
import "@nomiclabs/hardhat-ethers/internal/type-extensions";
import { BigNumber } from "ethers";
import fs from "fs";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";
import axios from "axios";
import {
  HardhatConfig,
  HardhatRuntimeEnvironment,
  HardhatUserConfig,
} from "hardhat/types";
import { Blob, File, NFTStorage } from "nft.storage";
import path from "path";

// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

const TEMPLATE_NAME = "template.json";

//Load config
extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    const definedPath = userConfig.metabaker.baseMetadataPath ?? "./metadata";
    config.paths.baseMetadataPath = path.normalize(
      path.join(config.paths.root, definedPath)
    );
    config.metabaker = userConfig.metabaker;
  }
);

/**
 * A helper to read a file from a location on disk and return a File object.
 * Note that this reads the entire file into memory and should not be used for
 * very large files.
 * @param {string} filePath the path to a file to store
 * @returns {File} a File object containing the file content
 */
async function fileFromPath(filePath: string) {
  const content = fs.readFileSync(filePath);
  // const type = mime.getType(filePath)

  // return new File([content], path.basename(filePath), { type })
  return new File([content], path.basename(filePath));
}

function checkDirs(env: HardhatRuntimeEnvironment) {
  const basePath = env.config.paths.baseMetadataPath;

  const imagesPath = getImageDir(env);
  const metaPath = getMetaDir(env);

  fs.mkdirSync(imagesPath, { recursive: true });
  fs.mkdirSync(metaPath, { recursive: true });
}

task(TASK_COMPILE, async (_taskArgs, env, runSuper) => {
  await runSuper(_taskArgs);
  checkDirs(env);
});

function checkTemplate(env: HardhatRuntimeEnvironment) {
  const basePath = env.config.paths.baseMetadataPath;
  const templateFile = path.normalize(path.join(basePath, TEMPLATE_NAME));

  // add the template file if it doesn't exist already
  if (!fs.existsSync(templateFile)) {
    const templateFileContents = {
      name: "nft name template token number $TOKEN_NUMBER",
      description: "nft description",
      image: "put a placeholder image here.jpg",
    };
    fs.writeFileSync(
      templateFile,
      JSON.stringify(templateFileContents, null, 2)
    );
  }
}

task(TASK_COMPILE, async (_taskArgs, env) => {
  checkDirs(env);
  checkTemplate(env);
});

task(TASK_CLEAN, async (_taskArgs, env) => {
  const tempPath = getUploadDir(env);
  fs.rmdirSync(tempPath);
});

function getImageDir(hre: HardhatRuntimeEnvironment): string {
  const basePath = hre.config.paths.baseMetadataPath;
  return path.normalize(path.join(basePath, "./images"));
}

function getMetaDir(hre: HardhatRuntimeEnvironment): string {
  const basePath = hre.config.paths.baseMetadataPath;
  return path.normalize(path.join(basePath, "./metadata"));
}

function getUploadDir(hre: HardhatRuntimeEnvironment): string {
  const basePath = hre.config.paths.baseMetadataPath;
  const uploadPath = path.normalize(path.join(basePath, ".upload"));
  fs.mkdirSync(uploadPath, { recursive: true });
  return uploadPath;
}

async function getMetadata(env: HardhatRuntimeEnvironment): Promise<File[]> {
  const uploadDir = getUploadDir(env);
  return fs
    .readdirSync(uploadDir)
    .filter((value) => {
      return value.endsWith(".json");
    })
    .map((value) => {
      const blob = new Blob([
        fs.readFileSync(path.normalize(path.join(uploadDir, value))),
      ]);
      //Remove the .json extension so the baseURI default implementation works correctly(baseuri / tokenid)
      return new File([blob], value.replace(".json", ""));
    });
}

async function processMetadata(
  env: HardhatRuntimeEnvironment,
  cid: string,
  count: BigNumber
) {
  const uploadDir = getUploadDir(env);
  const metaDir = getMetaDir(env);
  const totalNumber = fs.readdirSync(getMetaDir(env)).length;
  let i = 0;
  for (; i < count.toNumber(); i++) {
    const metaFile = path.normalize(path.join(metaDir, `${i}.json`));
    const json = JSON.parse(fs.readFileSync(metaFile, { encoding: "utf-8" }));
    const imageName = json.image.split("/").pop();
    json.image = `ipfs://${cid}/${imageName}`;
    const uploadFile = path.normalize(path.join(uploadDir, `${i}.json`));
    fs.writeFileSync(uploadFile, JSON.stringify(json, null, 2));
  }
}


async function scaffoldMetadataFromTemplate(
  env: HardhatRuntimeEnvironment
) {
  const uploadDir = getUploadDir(env);
  const metaDir = getMetaDir(env);
  const totalNumber = fs.readdirSync(getMetaDir(env)).length;
  let i = 0

  // Will create it if it doesn't exist
  checkTemplate(env);
  // load template for metadata generation
  const templateContent = fs.readFileSync(
    path.normalize(path.join(env.config.paths.baseMetadataPath, TEMPLATE_NAME)),
    { encoding: "utf-8" }
  );
  
  for (; i < totalNumber; i++) {
    // do template variables
    const template = JSON.parse(templateContent);
    template.name = template.name.replace("$TOKEN_NUMBER", `#${i}`);
    const uploadFile = path.normalize(path.join(uploadDir, `${i}.json`));
    fs.writeFileSync(uploadFile, JSON.stringify(template, null, 2));
  }
}

async function getImages(
  env: HardhatRuntimeEnvironment,
  count: BigNumber
): Promise<File[]> {
  const uploadDir = getUploadDir(env);
  return fs
    .readdirSync(uploadDir)
    .filter((value) => {
      return value.endsWith(env.config.metabaker.imageExtension);
    })
    .map((value) => {
      const blob = new Blob([
        fs.readFileSync(path.normalize(path.join(uploadDir, value))),
      ]);
      return new File([blob], value);
    });
}

async function processCountArg(countAsString: string, contractAddress: string, abi: any, hre: HardhatRuntimeEnvironment) {
  let count: BigNumber = BigNumber.from(0);
  try {
    if (countAsString === "contract") {
      // use count from contract
      if (contractAddress.length === 0) {
        throw new HardhatPluginError(
          "hardhat-metabaker",
          `Invalid address param: ${contractAddress}`
        );
      }
      const ethers = hre.ethers;
      const ethersContract = await ethers.getContractAt(abi, contractAddress);
      const results = await ethersContract.functions.totalSupply();
      count = results[0];
      console.log("count from contract: ", count);
    } else {
      count = BigNumber.from(countAsString);
    }
    if ((BigNumber.from(0)).eq(count)) {
      throw new HardhatPluginError(
        "hardhat-metabaker",
        `Invalid count parameter: ${countAsString}`
      );
    }
  } catch (e: Error | any) {
    throw new HardhatPluginError(
      "hardhat-metabaker",
      e?.message ?? "Error parsing count parameter",
      e
    ); // parse error or our own
  }

  return count;
}

async function processImages(env: HardhatRuntimeEnvironment, count: BigNumber) {
  const uploadDir = getUploadDir(env);
  const imageDir = getImageDir(env);
  for (let i = 0; i < count.toNumber(); i++) {
    const originalPath = path.normalize(
      path.join(imageDir, `${i}.${env.config.metabaker.imageExtension}`)
    );
    const uploadPath = path.normalize(
      path.join(uploadDir, `${i}.${env.config.metabaker.imageExtension}`)
    );
    fs.copyFileSync(originalPath, uploadPath);
  }
}

task("publishMetaToNFTStorage", "send data to web3")
  .addParam("contract", "Contract name to sync") // add contract parameters
  .addOptionalParam(
    // add optional address parameters
    "address",
    "Address of that specific contract",
    "", // default value
    types.string
  )
  .addOptionalParam(
    // token count will be either a number or the string 'contract' specifying that we use the contract's totalSupply
    "count",
    "The number of tokens to reveal, or 'contract' to use the current ERC721 totalSupply value",
    "contract",
    types.string
  )
  .addOptionalParam(
    // token count will be either a number or the string 'contract' specifying that we use the contract's totalSupply
    "scaffoldmetadata",
    "A flag to indicate whether to scaffold metadata or not. If false, the metadata will be read from the metadata directory. If true, the metadata will be scaffolded using the template.json file.",
    "false",
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    // Logic for that task here
    const nftStorageKey: string | null = hre.config.metabaker.nftStorageKey;
    const { contract, address: contractAddress } = taskArgs;
    const { abi } = await hre.artifacts.readArtifact(contract);

    // get count from input or optionally from contract
    const countAsString: string = taskArgs.count;
    const count: BigNumber = await processCountArg(countAsString, contractAddress, abi, hre);  


    let count: BigNumber = BigNumber.from(0);
    try {
      if (countAsString === "contract") {
        // use count from contract
        if (contractAddress.length === 0) {
          throw new HardhatPluginError(
            `Invalid address param: ${contractAddress}`
          );
        }
        const ethers = hre.ethers;
        const ethersContract = await ethers.getContractAt(abi, contractAddress);
        count = await ethersContract.totalSupply();
      } else {
        count = BigNumber.from(countAsString);
      }
      if (count.eq(BigNumber.from(0))) {
        throw new HardhatPluginError(
          `Invalid count parameter: ${countAsString}`
        );
      }
    } catch (e: Error | any) {
      throw new HardhatPluginError(
        e?.message ?? "Error parsing count parameter"
      ); // parse error or our own
    }

    // require nftStorageKey
    if (!nftStorageKey) {
      throw new HardhatPluginError(
        "hardhat-metabaker",
        "Please set your nftStorageKey in the metabaker config"
      );
    }

    // make sure the upload dir is refreshed
    fs.rmSync(getUploadDir(hre), { recursive: true, force: true });

    console.log(`Processing ${count.toString()} images...`);
    await processImages(hre, count);
    const imageFiles = await getImages(hre, count);
    // Publish to nft storage
    // https://nft.storage/docs/#using-the-javascript-api
    const endpoint = new URL("https://api.nft.storage");
    const storage = new NFTStorage({ endpoint, token: nftStorageKey });
    console.log(`Storing ${count.toString()} images...`);
    const cid = await storage.storeDirectory(imageFiles);

    console.log("Processing metadata...");

    // scaffold metadata if requested
    const scaffoldMetadata: boolean = taskArgs.scaffoldmetadata === "true";
    console.log("Processing metadata...");

    if (scaffoldMetadata === true) {
      await scaffoldMetadataFromTemplate(hre);
    } else{
      await processMetadata(hre, cid, count);
    }
    const metaFiles = await getMetadata(hre);

    if (imageFiles.length === 0) {
      console.error("Empty images");
      return;
    }

    if (metaFiles.length === 0) {
      console.error("Empty metadata");
      return;
    }

    console.log("Storing metadata...");
    const cidMeta = await storage.storeDirectory(metaFiles);

    fs.rmSync(getUploadDir(hre), { recursive: true, force: true });

    console.log("Image CID:", cid);
    console.log("Meta CID:", cidMeta);
    const status = await storage.status(cid);
    const statusMeta = await storage.status(cidMeta);
    console.log("Image pin status:", status.pin.status);
    console.log("Meta pin status:", statusMeta.pin.status);

    console.log("\nSet your nft base uri to:", `ipfs://${cidMeta}`);
    console.log(
      "(you may need a trailing slash depending on your smart contract)"
    );


  });

  
// Define task to download NFT metadata and images
task("downloadMintedData", "Downloads metadata and images for an NFT contract")
  .addParam("contract", "Contract name to sync") // add contract parameters
  .addParam("address", "The contract address of the NFT")
  .addOptionalParam(
    // token count will be either a number or the string 'contract' specifying that we use the contract's totalSupply
    "count",
    "The number of tokens to process, or 'contract' to use the current ERC721 totalSupply value",
    "contract",
    types.string
  )
  .setAction(async (args, hre) => {
    // Get directories
    const metaDir = getMetaDir(hre);
    const imageDir = getImageDir(hre);
    checkDirs(hre);

    // read the artifact contract   
    const { contract, address: contractAddress } = args;
    const { abi } = await hre.artifacts.readArtifact(contract);


    // Load ERC721 contract
    const ethers = hre.ethers;
    const ethersContract = await ethers.getContractAt(abi, contractAddress);

    // get count from input or optionally from contract
    const countAsString: string = args.count;
    const count: BigNumber = await processCountArg(countAsString, contractAddress, abi, hre);  


    console.log(`About to  download ${count.toNumber()} tokens`);
    // Loop through all token IDs and download metadata and image
    for (let i = 0; i < count.toNumber(); i++) {
      try {
        // Get token metadata URI
        const tokenURI = await ethersContract.functions.tokenURI(i);

        // Download metadata
        const metadata = await axios.get(tokenURI);
        // console.log(`Finished tokenURI ${tokenURI}`);

        fs.writeFileSync(`${metaDir}/${i}.json`,  JSON.stringify(metadata.data));

        // Get token image URI (assumes image is stored at "image" key in metadata)
        const imageURI = metadata.data.image;
        const filename = path.basename(new URL(imageURI).pathname);

        // Download image
        const image = await axios.get(imageURI, { responseType: "arraybuffer" });
        fs.writeFileSync(`${imageDir}/${filename}`, Buffer.from(image.data), { encoding: null });
        console.log(`Finished downloading ${i} token - ${imageDir}/${filename}`);
      } catch (err) {
        console.error(`Error downloading token ${i}: ${err}`);
      }
    }

    console.log(`Finished downloading ${count.toNumber()} tokens`);
  });
