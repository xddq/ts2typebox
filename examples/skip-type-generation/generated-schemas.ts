/**
 * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
 * your use case, there is a high chance that direct changes to this file get
 * lost. Consider making changes to the underlying Typescript code you use to
 * generate this file instead. The default file is called "types.ts", perhaps
 * have a look there! :]
 */

import { Type } from "@sinclair/typebox";

export const PersonSchema = Type.Object({
  age: Type.Number({ minimum: 18 }),
  name: Type.String({ description: "full name of the person" }),
});