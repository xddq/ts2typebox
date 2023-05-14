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
  age: Type.Number(),
  address: Address,
  contact: Contact,
});
