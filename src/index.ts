import { extendConfig, extendEnvironment, task, types } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

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

    config.paths.newPath = newPath;
  }
);

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.example = lazyObject(() => new ExampleHardhatRuntimeEnvironmentField());
});

task("sayHello", async (args, hre) => {
  console.log(hre.example.sayHello());
});

// Using this guide
// https://medium.com/laika-lab/building-your-own-custom-hardhat-plugins-from-scratch-232ab433b078
task("collectNftMetadata", "Collects Metadata into local folder for processing")
    .addParam("contract", "Contract name to sync") // add contract parameters
    .addOptionalParam( // add optional address parameters
      "address",
      "Address of that specific contract",
      "", // default value
      types.string
    )
  .addOptionalParam( // add optional address parameters
    "tokenList",
    "List of that token numbers for that contract",
    "", // default value
    types.string
  ).setAction(async (taskArgs, hre) => {
    // Logic for that task here
    const { contract, address: contractAddress } = taskArgs;
    const { abi } = await hre.artifacts.readArtifact(contract);
    console.log(`Syncing the ABI of ${contract} contract...`);

    // Hit contract to get number of tokens, then start iterating
    // Check if IERC721Enumerable compatible
    // TODO Call contract
    
    // Get Metadata for token X
    //TODO

    // retrieve image data from meta
    const imgUrl = "https://lh3.googleusercontent.com/d5OHtpPscz6VLMbA5vizoZ0vZhMEcUtm03No-r8sgpzORgitkU8pSvlBqb2TMb_Wfky2hHfzKhtAbQGTag9F4JGM94C72z2Qk3GvVqs=s0";
    const imgResponse = await fetch(
      imgUrl,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    // Store in folder for token

    console.log(`Got data of ${imgResponse}...`);


  })