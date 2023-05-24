# Example

When ts2typebox is installed (simply issue npm i -g ts2typebox to do so), clone
the repo, cd into this directory and:

- Remove the old generated-schemas.ts file `rm generated-schemas.ts`
- Take a look at the '.ts2typeboxrc.cjs' file. Here you can define
  transformation functions which will get applied to all values and types in the
  generated output. This file has to exist inside the directory from which you
  run ts2typebox.
  - Here we use the transformValue function to simply append "Schema" to each
    generated value.
- Use ts2typebox to generate the typebox code based on the types.ts file
  `ts2typebox --skip-type-creation --output generated-schemas.ts`
- To understand how to possibly use this, take a quick look into ./index.ts
- done :]
