import * as prettier from "prettier";
import fs from "fs";
import packageJson from "../package.json";
import { TypeScriptToTypeBox } from "./typescript-to-typebox";

export type Ts2TypeboxOptions = {
  /**
   * Makes the function print and return help text and quit. Has precendence
   * over all other options. Uses console.log to print the help text to stdout.
   */
  help?: "h" | "help";
  /**
   * The file containing the type definitions in the current working directory.
   * Defaults to "types.ts" if none is given.
   */
  input?: string;
  /**
   * The resulting file containing the typebox code in the current working
   * directory. Defaults to "generated-types.ts" if none is given.
   */
  output?: string;
  /**
   * Makes the function print the result to stdout instead of writing it to a
   * file. When using in code it makes the function also return a string
   * containing the generated types. Has precedence over "output" argument. Uses
   * console.log to print to stdout.
   */
  outputStdout?: boolean;
};

/**
 * Just an alias for string. This gets returned by the ts2typebox function and
 * contains the generated types as string.
 */
type GeneratedTypes = string;

/**
 * Use this function for programmatic usage of ts2typebox. The options are typed
 * and commented.
 *
 * @returns The generated types as string if (outputStdout was set) or undefined
 * otherwise.
 *
 * @throws Error
 **/
export const ts2typebox = ({
  help,
  input,
  output,
  outputStdout,
}: Ts2TypeboxOptions): GeneratedTypes | undefined => {
  if (help === "h" || help === "help") {
    console.log(`
    ts2typebox is a cli tool to generate typebox types based on typescript
    types. Version: ${packageJson.version}

    Usage:

    ts2typebox [ARGUMENTS]

    Arguments:

    -h, --help
       Displays this menu.

    -i, --input
       Specifies the relative path to the file containing the typescript types
       that will be used to generated typebox types. Defaults to "types.ts".

    -o, --output
       Specifies the relative path to generated file that will contain the
       typebox types. Defaults to "generated-types.ts".

    --output-stdout
       Does not generate an output file and prints the generated code to stdout
       instead. Has precedence over -o/--output.
      `);
    return;
  }

  const fileWithTsTypes = fs.readFileSync(
    process.cwd() + `/${input === undefined ? "types.ts" : input}`,
    "utf8"
  );
  const result = TypeScriptToTypeBox.Generate(fileWithTsTypes);
  const resultFormatted = prettier.format(result, {
    parser: "typescript",
  });

  if (outputStdout) {
    console.log(resultFormatted);
    return;
  }

  fs.writeFileSync(
    process.cwd() + `/${output === undefined ? "generated-types.ts" : output}`,
    resultFormatted,
    {
      encoding: "utf8",
    }
  );
};
