// // The 'mime' npm package helps us set the correct file type on our File objects
// import mime from 'mime';
// The 'fs' builtin module on Node.js provides access to the file system
// tslint:disable-next-line:no-implicit-dependencies
import "@nomiclabs/hardhat-ethers/internal/type-extensions";
import { BigNumber } from "ethers";
import fs from "fs";
import { extendConfig, extendEnvironment, task, types } from "hardhat/config";
import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import {HardhatConfig, HardhatRuntimeEnvironment, HardhatUserConfig} from "hardhat/types";
import { File, NFTStorage } from "nft.storage";
import path from "path";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

// Import the NFTStorage class and File constructor from the 'nft.storage' package
// import { NodeStringDecoder } from "string_decoder";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // We apply our default config here. Any other kind of config resolution
    // or normalization should be placed here.
    //
    // `config` is the resolved config, which will be used during runtime and
    // you should modify.
    // `userConfig` is the config as provided by the user. You should not modify
    // it.
    //
    // If you extended the `HardhatConfig` type, you need to make sure that
    // executing this function ensures that the `config` object is in a valid
    // state for its type, including its extensions. For example, you may
    // need to apply a default value, like in this example.
    const userPath = userConfig.paths?.newPath;

    let newPath: string;
    if (userPath === undefined) {
      newPath = path.join(config.paths.root, "newPath");
    } else {
      if (path.isAbsolute(userPath)) {
        newPath = userPath;
      } else {
        // We resolve relative paths starting from the project's root.
        // Please keep this convention to avoid confusion.
        newPath = path.normalize(path.join(config.paths.root, userPath));
      }
    }

    config.metabaker = userConfig.metabaker;

    config.paths.newPath = newPath;
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

async function storeNFT(
  imagePath: string,
  name: string,
  description: string,
  NFTStorageKey: string
) {
  // load the file from disk
  const image = await fileFromPath(imagePath);

  // create a new NFTStorage client using our API key
  const nftstorage = new NFTStorage({ token: NFTStorageKey });

  // call client.store, passing in the image & metadata
  return nftstorage.store({
    image,
    name,
    description,
  });
}

async function getMetadata(count: BigNumber): Promise<File[]> {
  // TODO
  return [];
}

async function getImages(count: BigNumber): Promise<File[]> {
  // TODO
  return [];
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
        const ethers = hre.ethers;
        const ethersContract = await ethers.getContractAt(abi, contractAddress);
        count = await ethersContract.functions.totalSupply();
        if (count.eq(BigNumber.from(0))) {
          throw new HardhatPluginError(
            `Invalid count parameter: ${countAsString}`
          );
        }
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

    const imageFiles = await getImages(count);
    const metaFiles = await getMetadata(count);

    if (imageFiles.length === 0) {
      console.error("Empty images");
      return;
    }

    if (metaFiles.length === 0) {
      console.error("Empty metadata");
      return;
    }

    // Publish to nft storage
    // https://nft.storage/docs/#using-the-javascript-api
    const endpoint = new URL("https://api.nft.storage");
    const storage = new NFTStorage({ endpoint, token: nftStorageKey });

    // TODO: make CAR or upload directory
    const cid = await storage.storeDirectory(imageFiles);
    const cidMeta = await storage.storeDirectory(imageFiles);
    console.log("Image CID:", cid);
    console.log("Meta CID:", cidMeta);
    const status = await storage.status(cid);
    const statusMeta = await storage.status(cidMeta);
    console.log(status);
    console.log(statusMeta);

    // storeNFT()
  });
