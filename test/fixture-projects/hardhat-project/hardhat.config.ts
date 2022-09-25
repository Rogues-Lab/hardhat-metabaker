// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.7.3",
  defaultNetwork: "hardhat",
  paths: {
    newPath: "asd",
  },
  metabaker: {
    nftStorageKey: "",
    baseMetadataPath: "./metadata",
    imageExtension: "jpg",
  },
};

export default config;
