import * as prettier from "prettier";
import fs from "fs";
import { cosmiconfig } from "cosmiconfig";
import packageJson from "../package.json";
import { default as defaultCodeOptions } from "./codeOptions.cjs";
import { TypeScriptToTypeBox } from "./typescript-to-typebox";

export type Ts2TypeboxOptions = {
  /**
   * Makes the function print and return help text and quit. Has precendence
   * over all other options. Uses console.log to print the help text to stdout.
   */
  help?: true;
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
  outputStdout?: true;
  /**
   * Removes the comment at the beginning of the generated typebox code which
   * mentions that the code was auto generated and should not be changed since
   * there is a high risk that changes might get lost.
   */
  disableAutogenComment?: true;
  /**
   * Skips the creation of types in the generated file. Only creates the typebox
   * validators containing the JSON schemas based on your typescript types. See
   * the output of ts2typebox -h for more info.
   */
  skipTypeCreation?: boolean;
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
export const ts2typebox = async ({
  help,
  input,
  output,
  outputStdout,
  disableAutogenComment,
  skipTypeCreation,
}: Ts2TypeboxOptions): Promise<GeneratedTypes | undefined> => {
  if (help) {
    console.log(getHelpText.run());
    return;
  }

  const fileWithTsTypes = fs.readFileSync(
    process.cwd() + `/${input === undefined ? "types.ts" : input}`,
    "utf8"
  );
  const generatedTs = TypeScriptToTypeBox.Generate(fileWithTsTypes);

  // post-processing
  // 1. transformations
  const ts2typeboxCodeOptions = await cosmiconfig("ts2typebox").search();
  // TODO: perhaps validate with typebox that these are indeed valid codeOption
  // configs (ts2typebox options)
  const usedCodeOptions =
    ts2typeboxCodeOptions === null
      ? defaultCodeOptions
      : (ts2typeboxCodeOptions.config as typeof defaultCodeOptions);
  const transformedTs = transformValuesAndTypes(generatedTs, usedCodeOptions);

  // 2. formatting
  const explorer = cosmiconfig("prettier");
  const searchResult = await explorer.search();
  // TODO: perhaps validate with typebox that these are indeed valid prettier configs
  const prettierConfig =
    searchResult === null ? {} : (searchResult.config as prettier.Options);
  const resultFormatted = prettier.format(transformedTs, {
    parser: "typescript",
    ...prettierConfig,
  });

  const resultFiltered =
    skipTypeCreation === undefined
      ? resultFormatted
      : filterTypes(resultFormatted);
  const result =
    disableAutogenComment === undefined
      ? addCommentThatCodeIsGenerated.run(resultFiltered)
      : resultFiltered;

  // output (write or stdout and return)
  if (outputStdout) {
    console.log(result);
    return result;
  }

  fs.writeFileSync(
    process.cwd() + `/${output === undefined ? "generated-types.ts" : output}`,
    result,
    {
      encoding: "utf8",
    }
  );
};

/**
 * Post-processing after successful code generation.
 * Transforms all values and types based on given functions.
 */
const transformValuesAndTypes = (
  generatedTypes: string,
  transformFns: typeof defaultCodeOptions
) => {
  const tsWithTransformedTypes = generatedTypes.replace(
    /(type)\s(\w+)/gm,
    (_match, group1, group2) => {
      return group1 + " " + transformFns.transformTypeName(group2);
    }
  );
  const result = tsWithTransformedTypes.replace(
    /(typeof|const)\s(\w+)/gm,
    (_match, group1, group2) => {
      return group1 + " " + transformFns.transformValueName(group2);
    }
  );
  return result;
};

/**
 * Post-processing after successful code generation.
 * Removes each line starting with "export type" or "type".
 */
const filterTypes = (input: GeneratedTypes) => {
  const result = input.replace(/^(export\s+)?type.*(\r?\n|$)/gm, "");
  // Now we still have to adapt the import line since we would otherwise get
  // "unused imports". For now, we simply remove the first line and append the
  // correct one.
  return (
    'import { Type } from "@sinclair/typebox";\n' +
    result.split("\n").slice(1).join("\n")
  );
};

/**
 * Declaring this as function in order to make it better testable.
 * Using an object to be able to mock it and track its usage.
 */
export const getHelpText = {
  run: () => {
    return `
    ts2typebox is a cli tool to generate typebox JSON schemas based on given
    typescript types. The generated output is formatted based on the prettier
    config inside your repo (or the default one, if you don't have one).
    Version: ${packageJson.version}

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

    --disable-autogen-comment
       When used, it does not add the comment at the beginning of the generated
       file which is stating that the code was automatically generated.

    --skip-type-creation
      When used, strips all types from the generated code. This can be helpful
      if you want to use your Typescript types inside your input file (which
      probably contains comments) as source of truth and still use the generated
      JSON schema validators (typebox values) to validate data based on these
      types. When using this option you probably want to also provide a custom
      transformValue function since two same symbols can't be imported from two
      different files. For an example take a look inside the repo under
      ./examples/skip-type-creation.

    Additional:

    You can adapt the names of the generated types (as well as the names of the
    generated values) using custom transformation functions which take a string
    as an input and return a string as their output. These will run on each of
    the generated types and values, respectively. Please take a look inside the
    repo under ./examples/transform-value-transform-type for an example of this.
   `;
  },
};

/**
 * Declaring this as an object with a function in order to make it better
 * testable with mocks. Allows for tracking the call count.
 */
export const addCommentThatCodeIsGenerated = {
  run: (code: string) => {
    return `/**
 * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
 * your use case, there is a high chance that direct changes to this file get
 * lost. Consider making changes to the underlying Typescript code you use to
 * generate this file instead. The default file is called "types.ts", perhaps
 * have a look there! :]
 */

${code}`;
  },
};
