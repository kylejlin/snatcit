import { evalCmamekExpression, EvalResult } from ".";

export {};

function getValue(result: EvalResult): undefined | number {
  if (result.succeeded) {
    return result.value;
  }
  return;
}

describe("number", () => {
  test("int", () => {
    const result = evalCmamekExpression("0", {});
    expect(getValue(result)).toBe(0);
  });

  test("negative number fails", () => {
    const result = evalCmamekExpression("-1", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("float", () => {
    const result = evalCmamekExpression("1.5", {});
    expect(getValue(result)).toBe(1.5);
  });

  test("underscore separator", () => {
    const result = evalCmamekExpression("1_000_000.5_001", {});
    expect(getValue(result)).toBe(1_000_000.5_001);
  });

  test("trailing underscore", () => {
    const result = evalCmamekExpression("1_.5_", {});
    expect(getValue(result)).toBe(1.5);
  });

  test("exponential lowercase", () => {
    const result = evalCmamekExpression("1_5.5e3", {});
    expect(getValue(result)).toBe(1_5.5e3);
  });

  test("exponential uppercase", () => {
    const result = evalCmamekExpression("1_5.5E3", {});
    expect(getValue(result)).toBe(1_5.5e3);
  });

  test("exponential with underscore exponent fails", () => {
    const result = evalCmamekExpression("1_5.5e3_", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("variable", () => {
  test("defined", () => {
    const result = evalCmamekExpression("a", { a: 5 });
    expect(getValue(result)).toBe(5);
  });

  test("undefined", () => {
    const result = evalCmamekExpression("b", { a: 5 });
    expect(getValue(result)).toBe(undefined);
  });
});

describe("nan", () => {
  test("[0] nan", () => {
    const result = evalCmamekExpression("($nan)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("($nan 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("max", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($max)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("($max 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("($max 2 1)", {});
    expect(getValue(result)).toBe(2);
  });

  test("[3]", () => {
    const result = evalCmamekExpression("($max 2 1 3)", {});
    expect(getValue(result)).toBe(3);
  });
});

describe("min", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($min)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("($min 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("($min 2 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3]", () => {
    const result = evalCmamekExpression("($min 2 1 3)", {});
    expect(getValue(result)).toBe(1);
  });
});

describe("abs", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($abs)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("($abs (- 1))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($abs 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("floor", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($floor)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("($floor 1.5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] negative", () => {
    const result = evalCmamekExpression("($floor (- 1.5))", {});
    expect(getValue(result)).toBe(-2);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($floor 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("ceil", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($ceil)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("($ceil 1.5)", {});
    expect(getValue(result)).toBe(2);
  });

  test("[1] negative", () => {
    const result = evalCmamekExpression("($ceil (- 1.5))", {});
    expect(getValue(result)).toBe(-1);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($ceil 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("if", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($if)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("($if 1.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($if 1.5 2)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[3] true", () => {
    const result = evalCmamekExpression("($if 1 5 9)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[3] false", () => {
    const result = evalCmamekExpression("($if 0 5 9)", {});
    expect(getValue(result)).toBe(9);
  });

  test("[3] nan", () => {
    const result = evalCmamekExpression("($if ($nan) 5 9)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[4] fails", () => {
    const result = evalCmamekExpression("($if 1 5 9 23)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("and", () => {
  test("[0] 1", () => {
    const result = evalCmamekExpression("($and)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] 5", () => {
    const result = evalCmamekExpression("($and 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2] 7", () => {
    const result = evalCmamekExpression("($and 5 7)", {});
    expect(getValue(result)).toBe(7);
  });

  test("[2] nan", () => {
    const result = evalCmamekExpression("($and 0 ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 0", () => {
    const result = evalCmamekExpression("($and 5 0 7)", {});
    expect(getValue(result)).toBe(0);
  });
});

describe("or", () => {
  test("[0] 0", () => {
    const result = evalCmamekExpression("($or)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 0", () => {
    const result = evalCmamekExpression("($or 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 5", () => {
    const result = evalCmamekExpression("($or 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("($or 0 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 7", () => {
    const result = evalCmamekExpression("($or 7 8)", {});
    expect(getValue(result)).toBe(7);
  });

  test("[2] nan", () => {
    const result = evalCmamekExpression("($or 1 ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 0", () => {
    const result = evalCmamekExpression("($or 0 0 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[3] 7", () => {
    const result = evalCmamekExpression("($or 7 0 8)", {});
    expect(getValue(result)).toBe(7);
  });
});

describe("not", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($not)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamekExpression("($not 1)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 0 alternative", () => {
    const result = evalCmamekExpression("($not 2)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamekExpression("($not 0)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] nan", () => {
    const result = evalCmamekExpression("($not ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($not 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("is_nan", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($is_nan)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamekExpression("($is_nan 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamekExpression("($is_nan ($nan))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($is_nan 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("is_integer", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("($is_integer)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamekExpression("($is_integer 5.5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamekExpression("($is_integer (- 5))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamekExpression("($is_integer 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("<", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(<)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(< 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("(< 5 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamekExpression("(< 5 7)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(< 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("<=", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(<=)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(<= 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("(<= 5 4)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamekExpression("(<= 5 7)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] 1 alt", () => {
    const result = evalCmamekExpression("(<= 5 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(<= 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe(">", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(>)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(> 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("(> 5 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamekExpression("(> 7 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(> 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe(">=", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(>=)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(>= 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("(>= 4 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamekExpression("(>= 7 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] 1 alt", () => {
    const result = evalCmamekExpression("(>= 5 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(>= 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("==", () => {
  test("[0] 1", () => {
    const result = evalCmamekExpression("(==)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] 1", () => {
    const result = evalCmamekExpression("(== 0)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] nan is nan", () => {
    const result = evalCmamekExpression("(== ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] 0", () => {
    const result = evalCmamekExpression("(== 4 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] nan is nan", () => {
    const result = evalCmamekExpression("(== ($nan) ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 1", () => {
    const result = evalCmamekExpression("(== 4 (+ 2 2) (* 2 2))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] 0", () => {
    const result = evalCmamekExpression("(== 4 5 5)", {});
    expect(getValue(result)).toBe(0);
  });
});

describe("^", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(^)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(^ 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("(^ 2 3)", {});
    expect(getValue(result)).toBe(8);
  });

  test("[2] 0^0 is nan", () => {
    const result = evalCmamekExpression("(^ 0 0)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] negative", () => {
    const result = evalCmamekExpression("(^ 2 (- 3))", {});
    expect(getValue(result)).toBe(1 / 8);
  });

  test("[2] fractional", () => {
    const result = evalCmamekExpression("(^ 8 (/ 1 3))", {});
    expect(getValue(result)).toBe(2);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(^ 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("*", () => {
  test("[0]", () => {
    const result = evalCmamekExpression("(*)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("(* 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("(* 2 3)", {});
    expect(getValue(result)).toBe(6);
  });

  test("[3]", () => {
    const result = evalCmamekExpression("(* 2 3 4)", {});
    expect(getValue(result)).toBe(24);
  });
});

describe("/", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(/)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamekExpression("(/ 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("(/ 2 3)", {});
    expect(getValue(result)).toBe(2 / 3);
  });

  test("[2 n/0 is nan]", () => {
    const result = evalCmamekExpression("(/ 5 0)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(/ 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("+", () => {
  test("[0]", () => {
    const result = evalCmamekExpression("(+)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("(+ 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("(+ 2 3)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[3]", () => {
    const result = evalCmamekExpression("(+ 2 3 4)", {});
    expect(getValue(result)).toBe(9);
  });
});

describe("-", () => {
  test("[0] fails", () => {
    const result = evalCmamekExpression("(-)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamekExpression("(- 5)", {});
    expect(getValue(result)).toBe(-5);
  });

  test("[2]", () => {
    const result = evalCmamekExpression("(- 2 3)", {});
    expect(getValue(result)).toBe(-1);
  });

  test("[3] fails", () => {
    const result = evalCmamekExpression("(- 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("eager eval", () => {
  test("and", () => {
    const result = evalCmamekExpression("($and 0 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("or", () => {
    const result = evalCmamekExpression("($or 1 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("if 0", () => {
    const result = evalCmamekExpression("($if 0 (+ 1 crash) 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("if 1", () => {
    const result = evalCmamekExpression("($if 1 5 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });
});
