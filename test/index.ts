import { describe, test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as prettier from "prettier";
import fs from "node:fs";
import path from "node:path";
import shell from "shelljs";
import { ts2typebox } from "../src/programmatic-usage";

const SHELLJS_RETURN_CODE_OK = 0;
const buildOsIndependentPath = (foldersOrFiles: string[]) => {
  return foldersOrFiles.join(path.sep);
};

const formatWithPrettier = (input: string): string => {
  return prettier.format(input, { parser: "typescript" });
};

/**
 * Formats given input with prettier and returns the result. This is used for
 * testing to be able to compare generated types with expected types without
 * having to take care of formatting.
 * @throws Error
 **/
export const expectEqualIgnoreFormatting = (
  input1: string,
  input2: string
): void => {
  assert.equal(formatWithPrettier(input1), formatWithPrettier(input2));
};

describe("programmatic usage API", () => {
  beforeEach(() => {
    // Reset the globally tracked mocks.
    mock.reset();
  });
  test("generates TypeBox code", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const expectedOutput = `
    /**
     * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
     * your use case, there is a high chance that direct changes to this file get
     * lost. Consider making changes to the underlying Typescript code you use to
     * generate this file instead. The default file is called "types.ts", perhaps
     * have a look there! :]
     */

    import { Type, Static } from '@sinclair/typebox';

    type T = Static<typeof T>;
    const T = Type.Object({
      a: Type.Number(),
      b: Type.String(),
    });
    `;
    const generatedTypeBox = await ts2typebox({
      input: dummyTypes,
    });
    expectEqualIgnoreFormatting(generatedTypeBox, expectedOutput);
  });
  test("disableAutogenComment option", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const expectedOutput = `
    import { Type, Static } from '@sinclair/typebox';

    type T = Static<typeof T>;
    const T = Type.Object({
      a: Type.Number(),
      b: Type.String(),
    });
    `;
    const generatedTypeBox = await ts2typebox({
      input: dummyTypes,
      disableAutogenComment: true,
    });
    expectEqualIgnoreFormatting(generatedTypeBox, expectedOutput);
  });
  test("skipTypeCreation option", async () => {
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const expectedOutput = `
     /**
     * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
     * your use case, there is a high chance that direct changes to this file get
     * lost. Consider making changes to the underlying Typescript code you use to
     * generate this file instead. The default file is called "types.ts", perhaps
     * have a look there! :]
     */

    import { Type } from '@sinclair/typebox';

    const T = Type.Object({
      a: Type.Number(),
      b: Type.String(),
    });
    `;
    const generatedTypeBox = await ts2typebox({
      input: dummyTypes,
      skipTypeCreation: true,
    });
    expectEqualIgnoreFormatting(generatedTypeBox, expectedOutput);
  });
  test("with prettier config", async () => {
    // TODO: .prettierrc.yml should not exist before

    // prepares and writes a test prettierrc.yml file.
    const dummyPretterConfig = "singleQuote: true";
    const configFileAbsolute = buildOsIndependentPath([
      __dirname,
      "..",
      "..",
      ".prettierrc.yml",
    ]);
    // check that file does not exist yet
    await assert.rejects(async () => {
      return await fs.promises.access(configFileAbsolute);
    });

    fs.writeFileSync(configFileAbsolute, dummyPretterConfig);

    const dummyTypes = `
    type T = {
      a: number;
      b: string;
    };
    `;
    const generatedTypeBox = await ts2typebox({
      input: dummyTypes,
    });
    // We expect that all " will be converted to '
    // Therefore something like (default)
    // import { Type, Static } from "@sinclair/typebox";
    // will become (with our custom config)
    // import { Type, Static } from '@sinclair/typebox';
    assert.equal(generatedTypeBox.includes("'@sinclair/typebox'"), true);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [configFileAbsolute]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });

  test("with .ts2typeboxrc.cjs config", async () => {
    const dummyTs2TypeboxRc = `
    const transformTypeName = (input) => {
      return "TestType" + input;
    };
    const transformValueName = (input) => {
      return "testValue" + input;
    };

    module.exports = {
      transformTypeName,
      transformValueName,
    };
    `;
    const configFileAbsolute = buildOsIndependentPath([
      __dirname,
      "..",
      "..",
      ".ts2typeboxrc.cjs",
    ]);
    // check that file does not exist yet
    await assert.rejects(async () => {
      return await fs.promises.access(configFileAbsolute);
    });
    fs.writeFileSync(configFileAbsolute, dummyTs2TypeboxRc);

    // prepares and writes a test types.ts file.
    const dummyTypes = `
    type T = number;
    export type U = number;
    `;

    const expectedOutput = `
    /**
     * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
     * your use case, there is a high chance that direct changes to this file get
     * lost. Consider making changes to the underlying Typescript code you use to
     * generate this file instead. The default file is called "types.ts", perhaps
     * have a look there! :]
     */

    import { Type, Static } from "@sinclair/typebox";

    type TestTypeT = Static<typeof testValueT>;
    const testValueT = Type.Number();

    export type TestTypeU = Static<typeof testValueU>;
    export const testValueU = Type.Number();
    `;
    const generatedTypeBox = await ts2typebox({
      input: dummyTypes,
    });
    expectEqualIgnoreFormatting(generatedTypeBox, expectedOutput);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [configFileAbsolute]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });
});
// TODO: create cli usage tests with the refactored/fixed new cli file
// describe("cli usage", () => {});
