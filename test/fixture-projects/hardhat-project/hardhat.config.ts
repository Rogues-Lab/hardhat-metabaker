// We load the plugin here.
import { BigNumber } from "ethers";
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.7.3",
  defaultNetwork: "hardhat",
  metabaker: {
    nftStorageKey: "",
    baseMetadataPath: "./metadata",
    imageExtension: "jpg",
  },
};

export default config;
