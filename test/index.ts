import { describe, test, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as prettier from "prettier";
import fs from "node:fs";
import path from "node:path";
import shell from "shelljs";
import { TypeScriptToTypeBox } from "../src/typescript-to-typebox";
import { getHelpText, ts2typebox } from "../src/programmatic-usage";

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

describe("ts2typebox - Typescript to Typebox", () => {
  test("string", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = string`);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.String();
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("number", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = number`);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Number();
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("boolean", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = boolean`);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Boolean();
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("any", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = any`);
    const expectedResult = `
      import { Type, Static } from '@sinclair/typebox'

      type T = Static<typeof T>
      const T = Type.Any()
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("unknown", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = unknown`);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Unknown();
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("never", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = never`);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Never();
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("null", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = null`);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Null();
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Array<string>", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Array<string>`
    );
    const expectedResult = `
        import { Type, Static } from "@sinclair/typebox";

        type T = Static<typeof T>;
        const T = Type.Array(Type.String());
        `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("string[]", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = string[]`);
    const expectedResult = `
        import { Type, Static } from "@sinclair/typebox";

        type T = Static<typeof T>;
        const T = Type.Array(Type.String());
        `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Union", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type A = number;
      type B = string;

      type T = A | B;
        `);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type A = Static<typeof A>;
      const A = Type.Number();

      type B = Static<typeof B>;
      const B = Type.String();

      type T = Static<typeof T>;
      const T = Type.Union([A, B]);`;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Intersect", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
        x: number;
      } & {
        y: string;
      };
    `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Intersect([
      Type.Object({
        x: Type.Number(),
      }),
      Type.Object({
        y: Type.String(),
      }),
    ]);
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Literal", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = "a" | "b";
      `);
    const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Union([Type.Literal("a"), Type.Literal("b")]);`;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Object", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
       type T = {
         a: number;
         b: string;
       };
      `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Object({
      a: Type.Number(),
      b: Type.String(),
    });
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Tuple", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
    type T = [number, null];
      `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Tuple([Type.Number(), Type.Null()]);
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Enum", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
    enum A {
      A,
      B,
    }

    type T = A;
    `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    enum AEnum {
      A,
      B,
    }

    const A = Type.Enum(AEnum);

    type T = Static<typeof T>;
    const T = A;
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("keyof", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
    type T = keyof {
      x: number;
      y: string;
    };
    `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.KeyOf(
      Type.Object({
        x: Type.Number(),
        y: Type.String(),
      })
    );
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Record", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Record<string, number>;`
    );
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Record(Type.String(), Type.Number());
      `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Utility - Partial", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Partial<{ a: 1; b: 2 }>;`
    );
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Partial(
      Type.Object({
        a: Type.Literal(1),
        b: Type.Literal(2),
      })
    );
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Utility - Pick", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Pick<{ a: 1; b: 2 }, "a">;`
    );
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Pick(
      Type.Object({
        a: Type.Literal(1),
        b: Type.Literal(2),
      }),
      Type.Literal("a")
    );
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Utility - Omit", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Omit<{ a: 1; b: 2 }, "a">;`
    );
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Omit(
      Type.Object({
        a: Type.Literal(1),
        b: Type.Literal(2),
      }),
      Type.Literal("a")
    );
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Utility - Required", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(
      `type T = Required<{ a?: 1; b?: 2 }>;`
    );
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Required(
      Type.Object({
        a: Type.Optional(Type.Literal(1)),
        b: Type.Optional(Type.Literal(2)),
      })
    );
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  test("Indexed Access", () => {
    const generatedTypebox = TypeScriptToTypeBox.Generate(`
    type A = {
      a: number;
    };

    type T = A["a"];
    `);
    const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type A = Static<typeof A>;
    const A = Type.Object({
      a: Type.Number(),
    });

    type T = Static<typeof T>;
    const T = Type.Index(A, Type.Literal("a"));
    `;
    expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
  });
  describe("jsdoc to JSON schema options", () => {
    test("flat type - number", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      /**
       * @minimum 100
       * @maximum 200
       * @multipleOf 2
       * @default 150
       * @description "it's a number" - strings must be quoted
       * @foobar "should support unknown props"
       */
      type T = number;
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Number({
          minimum: 100,
          maximum: 200,
          multipleOf: 2,
          default: 150,
          description: "it's a number",
          foobar: "should support unknown props",
      });
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test("type with properties - number", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
       /**
        * @minimum 100
        * @maximum 200
        * @multipleOf 2
        * @default 150
        * @description "it's a number" - strings must be quoted
        * @foobar "should support unknown props"
        */
        a: number;
      }
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({a: Type.Number({
          minimum: 100,
          maximum: 200,
          multipleOf: 2,
          default: 150,
          description: "it's a number",
          foobar: "should support unknown props",
      })});
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test("type with properties - string", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
       /**
        * @minimum 100
        * @maximum 200
        * @multipleOf 2
        * @default 150
        * @description "it's a number" - strings must be quoted
        * @foobar "should support unknown props"
        */
        a: string;
      }
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({a: Type.String({
          minimum: 100,
          maximum: 200,
          multipleOf: 2,
          default: 150,
          description: "it's a number",
          foobar: "should support unknown props",
      })});
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test(`supports ' as well as " for string JSON schema options`, () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
        /**
         * @test "should be supported"
         * @anotherTest 'should be supported'
         */
        a: number;
      };
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({
        a: Type.Number({
          test: "should be supported",
          anotherTest: "should be supported",
        }),
      });
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test("type - optional", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
        /**
         * @multipleOf 2
         */
        a?: number;
      }
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({
        a: Type.Optional(Type.Number({ multipleOf: 2 })),
      });
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test("type - number[]", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
        /**
         * @minItems 2
         * @maxItems 4
         */
        a: number[];
      }
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({
        a: Type.Array(Type.Number(), { minItems: 2, maxItems: 4 }),
      });
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    // TODO: For now Array<number> is unsupported. Seems to be that Array<number>
    // is treated like it is a "number" instead of Array<number> on the first
    // look. For now ignore it, perhaps check if something is of type
    // Numberkeyword if it is wrapped by an Array in typescript to typebox code
    // (if my assumption is correct :]).
    // test("type - Array<number>", () => {
    //   const generatedTypebox = TypeScriptToTypeBox.Generate(`
    //     type T = {
    //       /**
    //        * @minItems 2
    //        * @maxItems 4
    //        */
    //       a: Array<number>;
    //     }
    //     `);
    //   const expectedResult = `
    //     import { Type, Static } from "@sinclair/typebox";
    //
    //     type T = Static<typeof T>;
    //     const T = Type.Object({
    //       a: Type.Array(Type.Number(), { minItems: 2, maxItems: 4 }),
    //     });
    //     `;
    //   expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    // });
    test("type - readonly number[]", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
    type T = {
     /**
     * @minItems 2
     * @maxItems 4
     */
      a: readonly number[];
    };
    `);
      const expectedResult = `
    import { Type, Static } from "@sinclair/typebox";

    type T = Static<typeof T>;
    const T = Type.Object({
      a: Type.Readonly(Type.Array(Type.Number(), { minItems: 2, maxItems: 4 })),
    });
    `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });

    test("type - number | string", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
      type T = {
       /**
       * @minItems 2
       * @maxItems 4
       */
      a: number | string;
      }
      `);
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Object({
        a: Type.Union([Type.Number(), Type.String()], { minItems: 2, maxItems: 4 }),
      });
      `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
    test("interface", () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`
        interface T {
          /**
           * @minimum 100
           * @maximum 200
           * @multipleOf 2
           * @default 150
           * @description "it's a number" - strings must be quoted
           * @foobar "should support unknown props"
           */
          x: number;
        }
        `);
      const expectedResult = `
        import { Type, Static } from "@sinclair/typebox";

        type T = Static<typeof T>;
        const T = Type.Object({
          x: Type.Number({
            minimum: 100,
            maximum: 200,
            multipleOf: 2,
            default: 150,
            description: "it's a number",
            foobar: "should support unknown props",
          }),
        });
        `;
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult);
    });
  });
});
describe("programmatic cli usage", () => {
  beforeEach(() => {
    // Reset the globally tracked mocks.
    mock.reset();
  });

  it("prints help", async () => {
    const getHelpTextMock = mock.method(getHelpText, "run", () => {});
    assert.equal(await ts2typebox({ help: true }), undefined);
    assert.equal(getHelpTextMock.mock.callCount(), 1);

    // expect to throw since we have no "types.ts" in cwd.
    // assert.throws(async () => await ts2typebox({ input: "fileDoesNotExist" }));
    // TODO: for now use this because I did not find assert.throwsAsync
    // directly. the line above this comment resulted in an issue with async
    // code
    try {
      await ts2typebox({ input: "fileDoesNotExist" });
      assert.equal("should have thrown!", true);
    } catch (error) {}
    // help text should not have been called again
    assert.equal(getHelpTextMock.mock.callCount(), 1);
  });
  // TODO: these are really hacky right now. Probably look at any other cli tool
  // and see how they handle absolute and relative paths and then adapt the
  // tests after implementing that.
  // NOTE: We are starting/executing from the root of the repo and the built files
  // will live in process.cwd(). Meaning when we give no output path the output
  // path will be the root.
  it("generates 'generated-types.ts' file", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const inputTypesPath = buildOsIndependentPath([__dirname, "types.ts"]);
    fs.writeFileSync(inputTypesPath, dummyTypes);

    const expectedOutputPath = buildOsIndependentPath([
      __dirname,
      "..",
      "..",
      "generated-types.ts",
    ]);
    // clean up output path in case the project was invoked manually before
    shell.rm("-f", [expectedOutputPath]);
    await ts2typebox({
      input: buildOsIndependentPath(["dist", "test", "types.ts"]),
    });

    assert.equal(fs.existsSync(expectedOutputPath), true);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [
      inputTypesPath,
      expectedOutputPath,
    ]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });
  it("generates output for given path", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const inputAbsolute = buildOsIndependentPath([__dirname, "types.ts"]);
    const outputAbsolute = buildOsIndependentPath([__dirname, "output.ts"]);
    fs.writeFileSync(inputAbsolute, dummyTypes);

    await ts2typebox({
      input: buildOsIndependentPath(["dist", "test", "types.ts"]),
      output: buildOsIndependentPath(["dist", "test", "output.ts"]),
    });

    assert.equal(fs.existsSync(outputAbsolute), true);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [
      inputAbsolute,
      outputAbsolute,
    ]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });
  it("returns the generated types and logs them to stdout if 'outputStdout' is true", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const inputAbsolute = buildOsIndependentPath([__dirname, "types.ts"]);
    const outputAbsolute = buildOsIndependentPath([__dirname, "output.ts"]);
    fs.writeFileSync(inputAbsolute, dummyTypes);

    const consoleLogMock = mock.method(console, "log", () => {});
    await ts2typebox({
      input: buildOsIndependentPath(["dist", "test", "types.ts"]),
      outputStdout: true,
    });

    assert.equal(consoleLogMock.mock.callCount(), 1);
    assert.equal(fs.existsSync(outputAbsolute), false);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [
      inputAbsolute,
      outputAbsolute,
    ]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });
  it("option 'outputStdout' has precedence over 'output'", async () => {
    // prepares and writes a test types.ts file.
    const dummyTypes = `
      type T = {
        a: number;
        b: string;
      };
    `;
    const inputAbsolute = buildOsIndependentPath([__dirname, "types.ts"]);
    const outputAbsolute = buildOsIndependentPath([__dirname, "output.ts"]);
    fs.writeFileSync(inputAbsolute, dummyTypes);

    const consoleLogMock = mock.method(console, "log", () => {});
    await ts2typebox({
      input: buildOsIndependentPath(["dist", "test", "types.ts"]),
      output: buildOsIndependentPath(["dist", "test", "output.ts"]),
      outputStdout: true,
    });

    assert.equal(consoleLogMock.mock.callCount(), 1);
    assert.equal(fs.existsSync(outputAbsolute), false);

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [
      inputAbsolute,
      outputAbsolute,
    ]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });

  it("picks up prettier config and formats accordingly", async () => {
    // prepares and writes a test prettierrc.yml file.
    const dummyPretterConfig = "singleQuote: true";
    const configFileAbsolute = buildOsIndependentPath([
      __dirname,
      "..",
      "..",
      ".prettierrc.yml",
    ]);
    fs.writeFileSync(configFileAbsolute, dummyPretterConfig);

    // prepares and writes a test types.ts file.
    const dummyTypes = `
    type T = {
      a: "a" | "b";
    };
    `;
    const inputAbsolute = buildOsIndependentPath([__dirname, "types.ts"]);
    fs.writeFileSync(inputAbsolute, dummyTypes);
    const outputAbsolute = buildOsIndependentPath([__dirname, "output.ts"]);

    // This should now automatically pick up the prettier config. (singleQuote
    // true is not a default and we are normally just using the default prettier
    // config). NOTE/TODO: this test will become useless/false positive if we
    // ever decide to make singleQuote:true the default config of this repo.
    // Probably adapt later, for now just implement it first.
    await ts2typebox({
      input: buildOsIndependentPath(["dist", "test", "types.ts"]),
      output: buildOsIndependentPath(["dist", "test", "output.ts"]),
    });

    // Read generated types and check for quotes
    const generatedTypes = fs.readFileSync(outputAbsolute, "utf-8");
    assert.equal(
      generatedTypes.includes(
        "a: Type.Union([Type.Literal('a'), Type.Literal('b')]),"
      ),
      true
    );

    // cleanup generated files
    const { code: returnCode } = shell.rm("-f", [
      inputAbsolute,
      outputAbsolute,
      configFileAbsolute,
    ]);
    assert.equal(returnCode, SHELLJS_RETURN_CODE_OK);
  });
});
