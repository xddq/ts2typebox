#!/usr/bin/env node
import minimist from "minimist";

import { ts2typebox } from "./programmatic-usage";

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
