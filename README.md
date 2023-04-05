# ts2typebox

Cli tool used to generate typebox types based on typescript types. Simple wrapper for
the code from creator of [typebox](https://github.com/sinclairzx81/typebox),
`Haydn Paterson (sinclair) <haydn.developer@gmail.com>`.

## Installation

- `npm i -g ts2typebox`

## Use Case

- You want clean runtime validation with type inference and got a typescript
  project with already existing typescript types.

## Usage

- The cli can be used with `ts2typebox --input <fileName> --output <fileName>`.
  Can also be used by simply invoking `ts2typebox`. The input defaults to
  "types.ts" and the output to "generated-types.ts" relative to the current
  working directory.
- Example: You need a file containing your types. E.g. `types.ts` in the current working
  directory which could look like this:

```
// Arbitrary example types

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
};

export type Contact = {
  phone: string;
  email: string;
};

export type Person = {
  name: string;
  age: number;
  address: Address;
  contact: Contact;
};
```

- Run `ts2typebox` to generate the according typebox types. The resulting file
  will be named `generated-types.ts` and is created in the current working
  directory. The output would look like this:

```
import { Type, Static } from '@sinclair/typebox'

export type Address = Static<typeof Address>
export const Address = Type.Object({
  street: Type.String(),
  city: Type.String(),
  state: Type.String(),
  postalCode: Type.String()
})

export type Contact = Static<typeof Contact>
export const Contact = Type.Object({
  phone: Type.String(),
  email: Type.String()
})

export type Person = Static<typeof Person>
export const Person = Type.Object({
  name: Type.String(),
  age: Type.Number(),
  address: Address,
  contact: Contact
})

```
