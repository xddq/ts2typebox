/**
 * For providing your own transform functions, you can basically copy paste this
 * file into your root directory, name it ".ts2typeboxrc.cjs" and adapt the
 * functions to your needs!
 *
 * Only options which have to be passed via code (options that are functions) may
 * be specified here. For now, these are transformTypeName and
 * transformValueName.
 */

/**
 * This function will be run on every type name. For a given code
 *
 * ```
 * type T = number
 * ```
 *
 * the default output would be:
 *
 * ```
 * type T = Static<typeof T>
 * const T = Type.Number()
 * ```
 * This function will run on the first "T". The generated code will contain the
 * transformed values.
 *
 * @param input {string}
 */
const transformTypeName = (input) => {
  return input;
};

/**
 * This function will be run on every value name. For a given code
 *
 * ```
 * type T = number
 * ```
 *
 * the default output would be:
 * ```
 * type T = Static<typeof T>
 * const T = Type.Number()
 * ```
 *
 * This function will run on the second and third "T". The generated code will
 * contain the transformed values.
 *
 * @param input {string}
 */
const transformValueName = (input) => {
  return input + "Schema";
};

/**
 * Options that can only be passed via code (will probably only contain
 * functions since they are not serializeable in JS).
 */
module.exports = {
  transformTypeName,
  transformValueName,
};
