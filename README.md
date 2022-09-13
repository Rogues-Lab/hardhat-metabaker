# Hardhat TypeScript plugin boilerplate

This is a sample Hardhat plugin written in TypeScript. Creating a Hardhat plugin
can be as easy as extracting a part of your config into a different file and
publishing it to npm.

This sample project contains an example on how to do that, but also comes with
many more features:

- A mocha test suite ready to use
- TravisCI already setup
- A package.json with scripts and publishing info
- Examples on how to do different things

## Installation

To start working on your project, just run

```bash
npm install
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

## README file

This README describes this boilerplate project, but won't be very useful to your
plugin users.

Take a look at `README-TEMPLATE.md` for an example of what a Hardhat plugin's
README should look like.

## Migrating from Buidler?

Take a look at [the migration guide](MIGRATION.md)!


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

  accounts              Prints the list of accounts
  check                 Check whatever you need
  clean                 Clears the cache and deletes all artifacts
  collectNftMetadata    Collects Metadata into local folder for processing
```