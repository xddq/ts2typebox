#!/usr/bin/env node
import fs from "fs";
import minimist from "minimist";
import * as prettier from "prettier";
import packageJson from "../package.json";

import { TypeScriptToTypeBox } from "./typescript-to-typebox";

export type Ts2TypeboxOptions = {
  /**
   * The file containing the type definitions in the current working directory.
   * Defaults to "types.ts" if none is given.
   **/
  input?: string;
  /**
   * The resulting file containing the typebox code in the current working
   * directory.  Defaults to "generated-types.ts" if none is given.
   **/
  output?: string;
  /**
   * Makes the function print the help text and quit. Precendence over all other
   * options.
   **/
  help?: "h" | "help";
  /**
   * Makes the function print the result to stdout.
   **/
  outputStdout?: boolean;
};

/**
 * Use this function for programmatic usage of ts2typebox.
 **/
export const ts2typebox = ({
  input,
  output,
  help,
  outputStdout,
}: Ts2TypeboxOptions) => {
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
       Does not generate an output file and prints the generated code to stdout instead.
      `);
    return;
  }

  const fileWithTsTypes = fs.readFileSync(process.cwd() + `/${input}`, "utf8");
  const result = TypeScriptToTypeBox.Generate(fileWithTsTypes);
  const resultFormatted = prettier.format(result, {
    parser: "typescript",
  });

  if (outputStdout) {
    console.log(resultFormatted);
    return;
  }

  fs.writeFileSync(process.cwd() + `/${output}`, resultFormatted, {
    encoding: "utf8",
  });
  return;
};

const main = () => {
  const args = minimist(process.argv.slice(2), {
    alias: {
      input: "i",
      output: "o",
      help: "h",
    },
    default: {
      input: "types.ts",
      output: "generated-types.ts",
    },
  });

  ts2typebox({
    help: args.help,
    input: args.input,
    output: args.output,
    outputStdout: args["output-stdout"],
  });
};

main();
