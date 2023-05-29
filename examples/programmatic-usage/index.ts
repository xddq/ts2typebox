// Replace this with the 'import { ts2typebox} from "ts2typebox"' when you
// install the package.
import { readFileSync, writeFileSync } from "node:fs";
import { ts2typebox } from "../../src/index";

(async () => {
  const file = readFileSync(__dirname + "/types.ts", "utf-8");
  const result = await ts2typebox({ input: file });
  writeFileSync(__dirname + "/generated-typebox.ts", result);
})();
