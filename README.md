# ts2typebox

Cli tool used to generate typebox JSON schemas based on given typescript types.
Based on the initial codegen code from
[typebox](https://github.com/sinclairzx81/typebox) by
[sinclairzx81](https://github.com/sinclairzx81).

## Installation

- `npm i -g ts2typebox`

## Use Case

- You got a typescript project with types already lying around and are looking
  for a quick and easy way to get validations and JSON schemas based on them.
- You prefer leveraging typescript to define your data types and to generate
  your validators and/or JSON schemas.

## Usage

- The cli can be used with `ts2typebox --input <fileName> --output <fileName>`,
  or by simply running `ts2typebox`. The input defaults to "types.ts" and the
  output to "generated-types.ts" relative to the current working directory. For
  more see [cli usage](#cli-usage).

## Examples

```typescript
//
// Let's start with a simple type
//

export type Person = {
  age: number;
  name: string;
};

//
// Which becomes
//

import { Type, Static } from "@sinclair/typebox";

export type Person = Static<typeof Person>;
export const Person = Type.Object({
  age: Type.Number(),
  name: Type.String(),
});

//
// Similarly, with an interface
//

export interface IPerson {
  age: number;
  name: string;
}

//
// Which becomes
//

import { Type, Static } from "@sinclair/typebox";

export type IPerson = Static<typeof IPerson>;
export const IPerson = Type.Object({
  age: Type.Number(),
  name: Type.String(),
});

//
// Let's add some more complicated types. What about unions and intersections?
//

export type T = { x: number } & { y: number };
export type U = { x: number } | { y: number };

//
// Which becomes
//

import { Type, Static } from "@sinclair/typebox";

export type T = Static<typeof T>;
export const T = Type.Intersect([
  Type.Object({
    x: Type.Number(),
  }),
  Type.Object({
    y: Type.Number(),
  }),
]);

export type U = Static<typeof U>;
export const U = Type.Union([
  Type.Object({
    x: Type.Number(),
  }),
  Type.Object({
    y: Type.Number(),
  }),
]);

//
// Nice! But I will need some JSON schema options here and there, which can't be
// expressed in typescript at all...
// No worries, simply use jsdoc in your types!
//
/**
 * @minimum 100
 * @maximum 200
 * @multipleOf 2
 * @default 150
 * @description "it's a number" - strings must be quoted
 * @foobar "should support unknown props"
 */
export type T = number;

//
// Which becomes
//

import { Type, Static } from "@sinclair/typebox";

export type T = Static<typeof T>;
export const T = Type.Number({
  minimum: 100,
  maximum: 200,
  multipleOf: 2,
  default: 150,
  description: "it's a number",
  foobar: "should support unknown props",
});
```

To cut it here, all the [standard types](https://github.com/sinclairzx81/typebox#standard-types)
supported in typebox are supported by ts2typebox. For more examples take a
look at the tests inside the repo.

## cli usage

The following text is the output that will be displayed when you issue `ts2typebox -h` or
`ts2typebox --help`.

```
    ts2typebox is a cli tool to generate typebox types based on typescript
    types. Version: ${packageJson.version}

    Usage:

    ts2typebox [ARGUMENTS]

    Arguments:

    -h, --help
       Displays this menu.

    -i, --input
       Specifies the relative path to the file containing the typescript types
       that will be used to generated typebox types. Defaults to "types.ts".

    -o, --output
       Specifies the relative path to generated file that will contain the
       typebox types. Defaults to "generated-types.ts".

    --output-stdout
       Does not generate an output file and prints the generated code to stdout
       instead. Has precedence over -o/--output.
```
