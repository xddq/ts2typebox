#!/usr/bin/env node
import fs from "fs";
import { TypeScriptToTypeBox } from "./typescript-to-typebox";

const main = () => {
  const fileWithTsTypes = fs.readFileSync(process.cwd() + "/types.ts", "utf8");

  const result = TypeScriptToTypeBox.Generate(fileWithTsTypes);

  fs.writeFileSync(process.cwd() + "/generated-types.ts", result, {
    encoding: "utf8",
  });
};

main();
