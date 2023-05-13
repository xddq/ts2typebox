// Arbitrary example types

export type T = {
  /**
   * @minimum 100
   * @maximum 200
   * @multipleOf 2
   * @default 150
   * @description "it's a number" - strings must be quoted
   * @anotherDescription 'can also use as quotes'
   * @foobar "should support unknown props"
   */
  a: number;
};
