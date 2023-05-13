import { Type, Static } from "@sinclair/typebox";

export type T = Static<typeof T>;
export const T = Type.Object({
  a: Type.Number({
    minimum: 100,
    maximum: 200,
    multipleOf: 2,
    default: 150,
    description: "it's a number",
    anotherDescription: null,
    foobar: "should support unknown props",
  }),
});
