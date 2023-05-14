# Example

When ts2typebox is installed (simply issue npm i -g ts2typebox to do so), clone
the repo, cd into this directory and:

- Remove the old generated-types.ts file `rm generated-types.ts`
- Take a look at the '.ts2typeboxrc.cjs' file. Here you can define
  transformation functions which will get applied to all values and types in the
  generated output. This file has to exist inside the directory from which you
  run ts2typebox.
- Use ts2typebox to generate the typebox types based on the types.ts file
  `ts2typebox`
- done :]
