// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import path from "path";

import { ExampleHardhatRuntimeEnvironmentField } from "../src/ExampleHardhatRuntimeEnvironmentField";

import { useEnvironment } from "./helpers";

describe("Unit tests examples", function () {
  describe("ExampleHardhatRuntimeEnvironmentField", function () {
    describe("sayHello", function () {
      it("Should say hello", function () {
        const field = new ExampleHardhatRuntimeEnvironmentField();
        assert.equal(field.sayHello(), "hello");
      });
    });
  });
});
