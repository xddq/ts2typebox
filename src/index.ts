#!/usr/bin/env node
import fs from "fs";
import minimist from "minimist";
import * as prettier from "prettier";

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
    types. Version: ${process.env.npm_package_version}

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
  fs.writeFileSync(process.cwd() + `/${args.output}`, resultFormatted, {
    encoding: "utf8",
  });
};

main();
