import { readFileSync, createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import minimist from "minimist";

import packageJson from "../../package.json";
import { ts2typebox } from "../programmatic-usage";

const readCliOptions = (): minimist.ParsedArgs => {
  return minimist(process.argv.slice(2), {
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
};

/**
 * This functions is executed when running schema2typebox via the cli.
 *
 * @param getCliOptionsFn This function was added to be able to overwrite the
 * default behaviour of reading in the cli options in order to make them easily
 * testable by bassing a custom readCliOptions function.
 */
export const runCli = async (
  getCliOptionsFn: typeof readCliOptions = readCliOptions
) => {
  const args = getCliOptionsFn();

  // TODO: narrow condition.
  if (args.help) {
    return process.stdout.write(getHelpText.run());
  }

  const inputPath = process.cwd() + `/${args.input ?? "schema.json"}`;
  const inputFileAsString = readFileSync(inputPath, "utf-8");

  const typeboxCode = await ts2typebox({
    input: inputFileAsString,
    disableAutogenComment: args["disable-autogen-comment"],
    skipTypeCreation: args["skip-type-creation"],
  });

  const generatedCodeStream = Readable.from(typeboxCode.split(/(\r\n|\r|\n)/));
  if (args["output-stdout"]) {
    return generatedCodeStream.pipe(process.stdout);
  }

  const outputPath =
    process.cwd() + `/${args.output ?? "generated-typebox.ts"}`;
  return generatedCodeStream.pipe(createWriteStream(outputPath));
};

/**
 * Declaring this as function in order to make it better testable.
 * Using an object to be able to mock it and track its usage.
 */
export const getHelpText = {
  run: () => {
    return `
    schema2typebox generates TypeBox code from JSON schemas. The generated
    output is formatted based on the prettier config inside your repo (or the
    default one, if you don't have one). Version: ${packageJson.version}

    Usage:

    schema2typebox [ARGUMENTS]

    Arguments:

    -h, --help
       Displays this menu.

    -i, --input
       Specifies the relative path to the file containing the JSON schema that
       will be used to generated typebox code. Defaults to "schema.json".

    -o, --output
       Specifies the relative path to generated file that will contain the
       typebox code. Defaults to "generated-typebox.ts".

    --output-stdout
       Does not generate an output file and prints the generated code to stdout
       instead. Has precedence over -o/--output.
   `;
  },
};
