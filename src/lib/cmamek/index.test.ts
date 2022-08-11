import { evalCmamek, EvalResult } from ".";

export {};

function getValue(result: EvalResult): undefined | number {
  if (result.succeeded) {
    return result.value;
  }
  return;
}

describe("number", () => {
  test("int", () => {
    const result = evalCmamek("0", {});
    expect(getValue(result)).toBe(0);
  });

  test("negative number fails", () => {
    const result = evalCmamek("-1", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("float", () => {
    const result = evalCmamek("1.5", {});
    expect(getValue(result)).toBe(1.5);
  });

  test("underscore separator", () => {
    const result = evalCmamek("1_000_000.5_001", {});
    expect(getValue(result)).toBe(1_000_000.5_001);
  });

  test("trailing underscore", () => {
    const result = evalCmamek("1_.5_", {});
    expect(getValue(result)).toBe(1.5);
  });

  test("exponential lowercase", () => {
    const result = evalCmamek("1_5.5e3", {});
    expect(getValue(result)).toBe(1_5.5e3);
  });

  test("exponential uppercase", () => {
    const result = evalCmamek("1_5.5E3", {});
    expect(getValue(result)).toBe(1_5.5e3);
  });

  test("exponential with underscore exponent fails", () => {
    const result = evalCmamek("1_5.5e3_", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("variable", () => {
  test("defined", () => {
    const result = evalCmamek("a", { a: 5 });
    expect(getValue(result)).toBe(5);
  });

  test("undefined", () => {
    const result = evalCmamek("b", { a: 5 });
    expect(getValue(result)).toBe(undefined);
  });
});

describe("nan", () => {
  test("[0] nan", () => {
    const result = evalCmamek("($nan)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[1] fails", () => {
    const result = evalCmamek("($nan 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("max", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($max)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("($max 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2]", () => {
    const result = evalCmamek("($max 2 1)", {});
    expect(getValue(result)).toBe(2);
  });

  test("[3]", () => {
    const result = evalCmamek("($max 2 1 3)", {});
    expect(getValue(result)).toBe(3);
  });
});

describe("min", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($min)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("($min 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2]", () => {
    const result = evalCmamek("($min 2 1)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3]", () => {
    const result = evalCmamek("($min 2 1 3)", {});
    expect(getValue(result)).toBe(1);
  });
});

describe("abs", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($abs)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("($abs (- 1))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($abs 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("floor", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($floor)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("($floor 1.5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] negative", () => {
    const result = evalCmamek("($floor (- 1.5))", {});
    expect(getValue(result)).toBe(-2);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($floor 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("ceil", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($ceil)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("($ceil 1.5)", {});
    expect(getValue(result)).toBe(2);
  });

  test("[1] negative", () => {
    const result = evalCmamek("($ceil (- 1.5))", {});
    expect(getValue(result)).toBe(-1);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($ceil 2 1)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("if", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($if)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("($if 1.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($if 1.5 2)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[3] true", () => {
    const result = evalCmamek("($if 1 5 9)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[3] false", () => {
    const result = evalCmamek("($if 0 5 9)", {});
    expect(getValue(result)).toBe(9);
  });

  test("[3] nan", () => {
    const result = evalCmamek("($if ($nan) 5 9)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[4] fails", () => {
    const result = evalCmamek("($if 1 5 9 23)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("and", () => {
  test("[0] 1", () => {
    const result = evalCmamek("($and)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] 5", () => {
    const result = evalCmamek("($and 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2] 7", () => {
    const result = evalCmamek("($and 5 7)", {});
    expect(getValue(result)).toBe(7);
  });

  test("[2] nan", () => {
    const result = evalCmamek("($and 0 ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 0", () => {
    const result = evalCmamek("($and 5 0 7)", {});
    expect(getValue(result)).toBe(0);
  });
});

describe("or", () => {
  test("[0] 0", () => {
    const result = evalCmamek("($or)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 0", () => {
    const result = evalCmamek("($or 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 5", () => {
    const result = evalCmamek("($or 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2] 0", () => {
    const result = evalCmamek("($or 0 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 7", () => {
    const result = evalCmamek("($or 7 8)", {});
    expect(getValue(result)).toBe(7);
  });

  test("[2] nan", () => {
    const result = evalCmamek("($or 1 ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 0", () => {
    const result = evalCmamek("($or 0 0 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[3] 7", () => {
    const result = evalCmamek("($or 7 0 8)", {});
    expect(getValue(result)).toBe(7);
  });
});

describe("not", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($not)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamek("($not 1)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 0 alternative", () => {
    const result = evalCmamek("($not 2)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamek("($not 0)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] nan", () => {
    const result = evalCmamek("($not ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($not 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("is_nan", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($is_nan)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamek("($is_nan 0)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamek("($is_nan ($nan))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($is_nan 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("is_integer", () => {
  test("[0] fails", () => {
    const result = evalCmamek("($is_integer)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] 0", () => {
    const result = evalCmamek("($is_integer 5.5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1] 1", () => {
    const result = evalCmamek("($is_integer (- 5))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] fails", () => {
    const result = evalCmamek("($is_integer 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("<", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(<)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(< 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamek("(< 5 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamek("(< 5 7)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(< 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("<=", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(<=)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(<= 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamek("(<= 5 4)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamek("(<= 5 7)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] 1 alt", () => {
    const result = evalCmamek("(<= 5 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(<= 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe(">", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(>)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(> 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamek("(> 5 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamek("(> 7 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(> 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe(">=", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(>=)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(>= 5.5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2] 0", () => {
    const result = evalCmamek("(>= 4 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] 1", () => {
    const result = evalCmamek("(>= 7 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[2] 1 alt", () => {
    const result = evalCmamek("(>= 5 5)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(>= 5 5 5)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("==", () => {
  test("[0] 1", () => {
    const result = evalCmamek("(==)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] 1", () => {
    const result = evalCmamek("(== 0)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1] nan is nan", () => {
    const result = evalCmamek("(== ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] 0", () => {
    const result = evalCmamek("(== 4 5)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[2] nan is nan", () => {
    const result = evalCmamek("(== ($nan) ($nan))", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] 1", () => {
    const result = evalCmamek("(== 4 (+ 2 2) (* 2 2))", {});
    expect(getValue(result)).toBe(1);
  });

  test("[3] 0", () => {
    const result = evalCmamek("(== 4 5 5)", {});
    expect(getValue(result)).toBe(0);
  });
});

describe("^", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(^)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(^ 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2]", () => {
    const result = evalCmamek("(^ 2 3)", {});
    expect(getValue(result)).toBe(8);
  });

  test("[2] 0^0 is nan", () => {
    const result = evalCmamek("(^ 0 0)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[2] negative", () => {
    const result = evalCmamek("(^ 2 (- 3))", {});
    expect(getValue(result)).toBe(1 / 8);
  });

  test("[2] fractional", () => {
    const result = evalCmamek("(^ 8 (/ 1 3))", {});
    expect(getValue(result)).toBe(2);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(^ 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("*", () => {
  test("[0]", () => {
    const result = evalCmamek("(*)", {});
    expect(getValue(result)).toBe(1);
  });

  test("[1]", () => {
    const result = evalCmamek("(* 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2]", () => {
    const result = evalCmamek("(* 2 3)", {});
    expect(getValue(result)).toBe(6);
  });

  test("[3]", () => {
    const result = evalCmamek("(* 2 3 4)", {});
    expect(getValue(result)).toBe(24);
  });
});

describe("/", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(/)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1] fails", () => {
    const result = evalCmamek("(/ 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[2]", () => {
    const result = evalCmamek("(/ 2 3)", {});
    expect(getValue(result)).toBe(2 / 3);
  });

  test("[2 n/0 is nan]", () => {
    const result = evalCmamek("(/ 5 0)", {});
    expect(getValue(result)).toBe(NaN);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(/ 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("+", () => {
  test("[0]", () => {
    const result = evalCmamek("(+)", {});
    expect(getValue(result)).toBe(0);
  });

  test("[1]", () => {
    const result = evalCmamek("(+ 5)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[2]", () => {
    const result = evalCmamek("(+ 2 3)", {});
    expect(getValue(result)).toBe(5);
  });

  test("[3]", () => {
    const result = evalCmamek("(+ 2 3 4)", {});
    expect(getValue(result)).toBe(9);
  });
});

describe("-", () => {
  test("[0] fails", () => {
    const result = evalCmamek("(-)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("[1]", () => {
    const result = evalCmamek("(- 5)", {});
    expect(getValue(result)).toBe(-5);
  });

  test("[2]", () => {
    const result = evalCmamek("(- 2 3)", {});
    expect(getValue(result)).toBe(-1);
  });

  test("[3] fails", () => {
    const result = evalCmamek("(- 1 2 3)", {});
    expect(getValue(result)).toBe(undefined);
  });
});

describe("eager eval", () => {
  test("and", () => {
    const result = evalCmamek("($and 0 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("or", () => {
    const result = evalCmamek("($or 1 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("if 0", () => {
    const result = evalCmamek("($if 0 (+ 1 crash) 5)", {});
    expect(getValue(result)).toBe(undefined);
  });

  test("if 1", () => {
    const result = evalCmamek("($if 1 5 (+ 1 crash))", {});
    expect(getValue(result)).toBe(undefined);
  });
});
