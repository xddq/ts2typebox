#!/usr/bin/env node
import minimist from "minimist";

import { ts2typebox } from "./programmatic-usage";
export { ts2typebox, Ts2TypeboxOptions } from "./programmatic-usage";

const main = async () => {
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

  await ts2typebox({
    help: args.help,
    input: args.input,
    output: args.output,
    outputStdout: args["output-stdout"],
    disableAutogenComment: args["disable-autogen-comment"],
    skipTypeCreation: args["skip-type-creation"],
  });
};

main();
