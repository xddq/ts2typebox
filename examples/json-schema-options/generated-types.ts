/**
 * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
 * your use case, there is a high chance that direct changes to this file get
 * lost. Consider making changes to the underlying Typescript code you use to
 * generate this file instead. The default file is called "types.ts", perhaps
 * have a look there! :]
 */

import { Type, Static } from "@sinclair/typebox";

export type T = Static<typeof T>;
export const T = Type.Object({
  a: Type.Number({
    minimum: 100,
    maximum: 200,
    multipleOf: 2,
    default: 150,
    description: "it's a number",
    anotherDescription: "can also use as quotes",
    foobar: "should support unknown props",
  }),
});
