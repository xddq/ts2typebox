#!/usr/bin/env node
import fs from "fs";
import minimist from "minimist";
import * as prettier from "prettier";
import packageJson from "../package.json";

import { TypeScriptToTypeBox } from "./typescript-to-typebox";

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

  if (args.help) {
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
    process.exit(0);
  }

  const fileWithTsTypes = fs.readFileSync(
    process.cwd() + `/${args.input}`,
    "utf8"
  );
  const result = TypeScriptToTypeBox.Generate(fileWithTsTypes);
  const resultFormatted = prettier.format(result, {
    parser: "typescript",
  });

  if (args["output-stdout"]) {
    console.log(resultFormatted);
    process.exit(0);
  }

  fs.writeFileSync(process.cwd() + `/${args.output}`, resultFormatted, {
    encoding: "utf8",
  });
  process.exit(0);
};

main();
