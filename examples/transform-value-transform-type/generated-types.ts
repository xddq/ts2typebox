import { Type, Static } from "@sinclair/typebox";

export type PersonType = Static<typeof PersonSchema>;
export const PersonSchema = Type.Object({
  age: Type.Number(),
  name: Type.String(),
});
