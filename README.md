# Hardhat Metabaker plugin

This is a Hardhat plugin that is used for publishing metadata to web3 storage.

We supply tasks to aid in the Metadata storage:

- Generate example metadata
- Batch metadata uploads (supporting reveals)
- Bake a projects metadata, reads contract and web3 pushes metadata.

https://nft.storage/ is used as the web3 storage.

https://nft.storage/docs/#using-the-javascript-api

## Installation

To use this plugins

```bash
npm install @rogueslab/hardhat-metabaker
```

Extend your hardhat.config and supply the `nft.storage` API key:

in JavaScript (`hardhat.config.js`):
```javascript
require("@rogueslab/hardhat-metabaker");

const config = {
  // solidity etc
  metabaker: {
    nftStorageKey: "your nft.storage API key here, ideally loaded from .env",
    imageExtension: "jpg",
    baseMetadataPath: "./metadata"
  }
}

```

in TypeScript (`hardhat.config.ts`):

```typescript
import { HardhatUserConfig } from "hardhat/types";
import "@rogueslab/hardhat-metabaker";

const config: HardhatUserConfig = {
  // solidity etc
  metabaker: {
    nftStorageKey: "your nft.storage API key here, ideally loaded from .env",
    imageExtension: "jpg",
    baseMetadataPath: "./metadata"
  }
}

```

## Plugin development

Make sure to read our [Plugin Development Guide](https://hardhat.org/advanced/building-plugins.html) to learn how to build a plugin.

## Testing

Running `npm run test` will run every test located in the `test/` folder. They
use [mocha](https://mochajs.org) and [chai](https://www.chaijs.com/),
but you can customize them.

We recommend creating unit tests for your own modules, and integration tests for
the interaction of the plugin with Hardhat and its dependencies.

## Linting and autoformat

All of Hardhat projects use [prettier](https://prettier.io/) and
[tslint](https://palantir.github.io/tslint/).

You can check if your code style is correct by running `npm run lint`, and fix
it with `npm run lint:fix`.

## Building the project

Just run `npm run build` ️👷



## How to package up code 
`npm pack` can be used to package up the library.

`"hardhat-metabaker-0.0.1.tgz"` will be generated


## using this lib before NPM publish
(recommend deleting from node_module before reinstalling)

We need to add the plugin into the packages.json of the hardhard project that we are used in.
    `"hardhat-metabaker": "file:../../../../../rogues/hardhat-metabaker/hardhat-metabaker-0.0.1.tgz"`

Then install (with npm install / yarn install), this will copy the files into the local node_modules

## Hardhat Config
`hardhat.config.ts` we need to add `import "hardhat-metabaker";`

## Testing it
Once it is installed and config added.

```bash
npm or yarn run hardhat
```

We should now see the new tasks in hardhat output, like below:

```bash
AVAILABLE TASKS:

  accounts                   Prints the list of accounts
  check                      Check whatever you need
  clean                      Clears the cache and deletes all artifacts
  downloadMintedData         Collects Metadata into local folder for processing
  publishMetaToNFTStorage    Publish metadata to NFT Storage
```
