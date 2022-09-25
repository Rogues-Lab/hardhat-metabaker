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

// Import the NFTStorage class and File constructor from the 'nft.storage' package
// import { NodeStringDecoder } from "string_decoder";

const TEMPLATE_NAME = "template.json";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    const definedPath = userConfig.metabaker.baseMetadataPath ?? "./metadata";
    config.paths.baseMetadataPath = path.normalize(
      path.join(config.paths.root, definedPath)
    );
    config.metabaker = userConfig.metabaker;
  }
);

// Using this guide
// https://medium.com/laika-lab/building-your-own-custom-hardhat-plugins-from-scratch-232ab433b078
task("collectNftMetadata", "Collects Metadata into local folder for processing")
  .addParam("contract", "Contract name to sync") // add contract parameters
  .addOptionalParam(
    // add optional address parameters
    "address",
    "Address of that specific contract",
    "", // default value
    types.string
  )
  .addOptionalParam(
    // add optional address parameters
    "tokenList",
    "List of that token numbers for that contract",
    "", // default value
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    // Logic for that task here
    const { contract, address: contractAddress } = taskArgs;
    const { abi } = await hre.artifacts.readArtifact(contract);
    console.log(`Syncing the ABI of ${contract} contract...`);

    // Hit contract to get number of tokens, then start iterating
    // Check if IERC721Enumerable compatible
    // TODO Call contract

    // Get Metadata for token X
    // TODO

    // retrieve image data from meta
    const imgUrl =
      "https://lh3.googleusercontent.com/d5OHtpPscz6VLMbA5vizoZ0vZhMEcUtm03No-r8sgpzORgitkU8pSvlBqb2TMb_Wfky2hHfzKhtAbQGTag9F4JGM94C72z2Qk3GvVqs=s0";
    const imgResponse = await fetch(imgUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    // Store in folder for token

    console.log(`Got data of ${imgResponse}...`);
  });

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

task(TASK_COMPILE, async (_taskArgs, env) => {
  const basePath = env.config.paths.baseMetadataPath;

  const imagesPath = getImageDir(env);
  const metaPath = getMetaDir(env);
  const templateFile = path.normalize(path.join(basePath, TEMPLATE_NAME));

  fs.mkdirSync(imagesPath, { recursive: true });
  fs.mkdirSync(metaPath, { recursive: true });

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
      return new File([blob], value);
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
  let i = 1;
  for (; i <= count.toNumber(); i++) {
    const metaFile = path.normalize(path.join(metaDir, `${i}.json`));
    const json = JSON.parse(fs.readFileSync(metaFile, { encoding: "utf-8" }));
    json.image = `ipfs://${cid}/${i}.${env.config.metabaker.imageExtension}`;
    const uploadFile = path.normalize(path.join(uploadDir, `${i}.json`));
    fs.writeFileSync(uploadFile, JSON.stringify(json, null, 2));
  }
  const templateContent = fs.readFileSync(
    path.normalize(path.join(env.config.paths.baseMetadataPath, TEMPLATE_NAME)),
    { encoding: "utf-8" }
  );
  for (; i <= totalNumber; i++) {
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

async function processImages(env: HardhatRuntimeEnvironment, count: BigNumber) {
  const uploadDir = getUploadDir(env);
  const imageDir = getImageDir(env);
  for (let i = 1; i <= count.toNumber(); i++) {
    const originalPath = path.normalize(
      path.join(imageDir, `${i}.${env.config.metabaker.imageExtension}`)
    );
    const uploadPath = path.normalize(
      path.join(uploadDir, `${i}.${env.config.metabaker.imageExtension}`)
    );
    fs.copyFileSync(originalPath, uploadPath);
  }
}

// Using this guide
// https://medium.com/laika-lab/building-your-own-custom-hardhat-plugins-from-scratch-232ab433b078
task("publishMetaToNFTStorage", "send data to web3")
  .addParam("contract", "Contract name to sync") // add contract parameters
  .addOptionalParam(
    // add optional address parameters
    "address",
    "Address of that specific contract",
    "", // default value
    types.string
  )
  .addParam(
    // token count will be either a number or the string 'contract' specifying that we use the contract's totalSupply
    "count",
    "The number of tokens to reveal, or 'contract' to use the current ERC721 totalSupply value",
    "contract",
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    // Logic for that task here
    const nftStorageKey: string | null = hre.config.metabaker.nftStorageKey;
    const { contract, address: contractAddress } = taskArgs;
    const { abi } = await hre.artifacts.readArtifact(contract);

    // get count from input or optionally from contract
    const countAsString: string = taskArgs.count;
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
        count = await ethersContract.functions.totalSupply();
        if (count.eq(BigNumber.from(0))) {
          throw new HardhatPluginError(
            `Invalid count parameter: ${countAsString}`
          );
        }
      } else {
        count = BigNumber.from(countAsString);
      }
    } catch (e: Error | any) {
      throw new HardhatPluginError(
        e?.message ?? "Error parsing count parameter"
      ); // parse error or our own
    }

    // require nftStorageKey
    if (!nftStorageKey) {
      throw new HardhatPluginError(
        "Please set your nftStorageKey in the metabaker config"
      );
    }

    // make sure the upload dir is refreshed
    fs.rmSync(getUploadDir(hre), { recursive: true, force: true });

    await processImages(hre, count);
    const imageFiles = await getImages(hre, count);
    // Publish to nft storage
    // https://nft.storage/docs/#using-the-javascript-api
    const endpoint = new URL("https://api.nft.storage");
    const storage = new NFTStorage({ endpoint, token: nftStorageKey });
    const cid = await storage.storeDirectory(imageFiles);

    await processMetadata(hre, cid, count);
    const metaFiles = await getMetadata(hre);

    if (imageFiles.length === 0) {
      console.error("Empty images");
      return;
    }

    if (metaFiles.length === 0) {
      console.error("Empty metadata");
      return;
    }

    // TODO: make CAR for upload optimization

    const cidMeta = await storage.storeDirectory(metaFiles);
    console.log("Image CID:", cid);
    console.log("Meta CID:", cidMeta);
    const status = await storage.status(cid);
    const statusMeta = await storage.status(cidMeta);
    console.log("Image pin status:", status.pin.status);
    console.log("Meta pin status:", statusMeta.pin.status);

    // storeNFT()
  });
