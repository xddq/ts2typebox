/**
 * ATTENTION. This code was AUTO GENERATED by ts2typebox. While I don't know
 * your use case, there is a high chance that direct changes to this file get
 * lost. Consider making changes to the underlying Typescript code you use to
 * generate this file instead. The default file is called "types.ts", perhaps
 * have a look there! :]
 */

import { Type, Static } from "@sinclair/typebox";

type Age = Static<typeof Age>;
const Age = Type.Number();

export type Address = Static<typeof Address>;
export const Address = Type.Object({
  street: Type.String(),
  city: Type.String(),
  state: Type.String(),
  postalCode: Type.String(),
});

export type Contact = Static<typeof Contact>;
export const Contact = Type.Object({
  phone: Type.String(),
  email: Type.String(),
});

export type Person = Static<typeof Person>;
export const Person = Type.Object({
  name: Type.String(),
  age: Age,
  address: Address,
  contact: Contact,
});
