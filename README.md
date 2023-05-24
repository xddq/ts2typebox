<h1 align="center">
    ts2typebox
</h1>

Cli tool used to generate typebox JSON schemas based on given typescript types.
Based on the initial codegen code from
[typebox](https://github.com/sinclairzx81/typebox) by
[sinclairzx81](https://github.com/sinclairzx81).

<p align="center">
  <a href="https://github.com/xddq/ts2typebox/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="ts2typebox is released under the MIT license." />
  </a>
  <a href="https://www.npmjs.org/package/ts2typebox">
    <img src="https://img.shields.io/npm/v/ts2typebox?color=brightgreen&label=npm%20package" alt="Current npm package version." />
  </a>
  <a href="https://github.com/xddq/ts2typebox/actions/workflows/buildAndTest.yaml">
    <img src="https://github.com/xddq/ts2typebox/actions/workflows/buildAndTest.yaml/badge.svg" alt="State of Github Action" />
  </a>
</p>

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

//
// Well, what if I don't like that the generated type and value has the same
// name?! No worries, you can define your own transformation functions!
// So that this..
//

export type Person = {
  age: number;
  name: string;
};

//
// Can easily become
//

import { Type, Static } from "@sinclair/typebox";

export type PersonType = Static<typeof PersonSchema>;
export const PersonSchema = Type.Object({
  age: Type.Number(),
  name: Type.String(),
});

//
// Sounds great! But I have many comments in my Typescript types and I want to
// use them as source of truth for my code. Can this be done..?
// Yup! We can start with this...
//

export type Person = {
  /**
   * @minimum 18
   */
  age: number;
  /**
   * @description full name of the person
   */
  name: string;
};

//
// And end up only generating the JSON schema/TypeBox values.
//

export const PersonSchema = Type.Object({
  age: Type.Number({ minimum: 18 }),
  name: Type.String({ description: "full name of the person" }),
});
```

To cut the slack, all the [standard
types](https://github.com/sinclairzx81/typebox#standard-types) supported in
typebox are supported by ts2typebox. For hands on examples, you can follow the
simple snippets stored inside the
[examples](https://github.com/xddq/ts2typebox/tree/main/examples) folder. For a
more complete set of examples (every feature is tested) you can take a look at
the tests inside the repo.

## cli usage

The following text is the output that will be displayed when you issue `ts2typebox -h` or
`ts2typebox --help`.

```

    ts2typebox is a cli tool to generate typebox JSON schemas based on given
    typescript types. The generated output is formatted based on the prettier
    config inside your repo (or the default one, if you don't have one).
    Version: ${packageJson.version}

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

    --disable-autogen-comment
       When used, it does not add the comment at the beginning of the generated
       file which is stating that the code was automatically generated.

    --skip-type-creation
      When used, strips all types from the generated code. This can be helpful
      if you want to use your Typescript types inside your input file (which
      probably contains comments) as source of truth and still use the generated
      JSON schema validators (typebox values) to validate data based on these
      types. When using this option you probably want to also provide a custom
      transformValue function since two same symbols can't be imported from two
      different files. For an example take a look inside the repo under
      ./examples/skip-type-creation.

    Additional:

    You can adapt the names of the generated types (as well as the names of the
    generated values) using custom transformation functions which take a string
    as an input and return a string as their output. These will run on each of
    the generated types and values, respectively. Please take a look inside the
    repo under ./examples/transform-value-transform-type for an example of this.

```
