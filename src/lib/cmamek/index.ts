export enum CmamekErrorKind {
  InvalidSyntax,
  UndefinedVariable,
  IllegalOperation,
}

type SymbolType =
  | "$nan"
  | "$max"
  | "$min"
  | "$abs"
  | "$floor"
  | "$ceil"
  | "$if"
  | "$and"
  | "$or"
  | "$not"
  | "$is_nan"
  | "$is_integer"
  | "<"
  | "<="
  | ">"
  | ">="
  | "=="
  | "^"
  | "*"
  | "/"
  | "+"
  | "-";

interface Operator {
  readonly symbol: SymbolType;
  eval(args: readonly number[]): undefined | number;
}

const OPS: readonly Operator[] = [
  {
    symbol: "$nan",
    eval: (args) => (args.length === 0 ? NaN : undefined),
  },
  {
    symbol: "$max",
    eval: (args) => (args.length === 0 ? undefined : Math.max(...args)),
  },
  {
    symbol: "$min",
    eval: (args) => (args.length === 0 ? undefined : Math.min(...args)),
  },
  {
    symbol: "$abs",
    eval: (args) => (args.length === 1 ? Math.abs(args[0]) : undefined),
  },
  {
    symbol: "$floor",
    eval: (args) => (args.length === 1 ? Math.floor(args[0]) : undefined),
  },
  {
    symbol: "$ceil",
    eval: (args) => (args.length === 1 ? Math.ceil(args[0]) : undefined),
  },
  {
    symbol: "$if",
    eval: (args) =>
      args.length === 3
        ? Number.isNaN(args[0])
          ? NaN
          : args[0] !== 0
          ? args[1]
          : args[2]
        : undefined,
  },
  {
    symbol: "$and",
    eval: (args) =>
      args.some((a) => Number.isNaN(a))
        ? NaN
        : args.reduce((a, b) => a && b, 1),
  },
  {
    symbol: "$or",
    eval: (args) =>
      args.some((a) => Number.isNaN(a))
        ? NaN
        : args.reduce((a, b) => a || b, 0),
  },
  {
    symbol: "$not",
    eval: (args) =>
      args.length === 1
        ? Number.isNaN(args[0])
          ? NaN
          : !args[0]
          ? 1
          : 0
        : undefined,
  },
  {
    symbol: "$is_nan",
    eval: (args) =>
      args.length === 1 ? (Number.isNaN(args[0]) ? 1 : 0) : undefined,
  },
  {
    symbol: "$is_integer",
    eval: (args) =>
      args.length === 1 ? (Number.isInteger(args[0]) ? 1 : 0) : undefined,
  },
  {
    symbol: "<",
    eval: (args) =>
      args.length === 2 ? (args[0] < args[1] ? 1 : 0) : undefined,
  },
  {
    symbol: "<=",
    eval: (args) =>
      args.length === 2 ? (args[0] <= args[1] ? 1 : 0) : undefined,
  },
  {
    symbol: ">",
    eval: (args) =>
      args.length === 2 ? (args[0] > args[1] ? 1 : 0) : undefined,
  },
  {
    symbol: ">=",
    eval: (args) =>
      args.length === 2 ? (args[0] >= args[1] ? 1 : 0) : undefined,
  },
  {
    symbol: "==",
    eval: (args) => {
      if (args.length === 0) {
        return 1;
      }
      if (args.some((a) => Number.isNaN(a))) {
        return NaN;
      }
      return args.slice(1).every((v) => v === args[0]) ? 1 : 0;
    },
  },
  {
    symbol: "^",
    eval: (args) =>
      args.length === 2
        ? args[0] === 0 && args[1] === 0
          ? NaN
          : Math.pow(args[0], args[1])
        : undefined,
  },
  { symbol: "*", eval: (args) => args.reduce((a, b) => a * b, 1) },
  {
    symbol: "/",
    eval: (args) =>
      args.length === 2 ? (args[1] === 0 ? NaN : args[0] / args[1]) : undefined,
  },
  { symbol: "+", eval: (args) => args.reduce((a, b) => a + b, 0) },
  {
    symbol: "-",
    eval: (args) =>
      args.length === 1
        ? -args[0]
        : args.length === 2
        ? args[0] - args[1]
        : undefined,
  },
];

export type EvalContext = { readonly [varName: string]: undefined | number };
export type EvalResult =
  | { succeeded: true; value: number }
  | { succeeded: false; error: CmamekErrorKind };

export function evalCmamek(src: string, context: EvalContext): EvalResult {
  const tokens = tokenize(src);
  if (tokens === undefined) {
    return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
  }

  const stack: (string | number)[][] = [];
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];

    if (token === "(") {
      stack.push([]);
      continue;
    }

    if (token === ")") {
      const top = stack.pop();
      if (top === undefined) {
        return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
      }

      const topVal = evalSExWithValueArgs(top, context);
      if (!topVal.succeeded) {
        return topVal;
      }

      if (stack.length === 0) {
        if (i === tokens.length - 1) {
          return topVal;
        } else {
          return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
        }
      }

      stack[stack.length - 1].push(topVal.value);
      continue;
    }

    if (stack.length === 0) {
      if (i === tokens.length - 1) {
        const atomVal = evalAtom(token, context);
        if (atomVal === undefined) {
          return { succeeded: false, error: CmamekErrorKind.UndefinedVariable };
        }
        return { succeeded: true, value: atomVal };
      }
      return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
    }

    stack[stack.length - 1].push(token);
  }

  return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
}

function tokenize(src: string): undefined | string[] {
  const tokens: string[] = [];
  let remaining = src;
  while (remaining.length > 0) {
    // Whitespace
    {
      const len = remaining.match(/^\s+/)?.[0]?.length;
      if (len !== undefined && len > 0) {
        remaining = remaining.slice(len);
        continue;
      }
    }

    // Identifier
    {
      const len = remaining.match(/^[a-zA-Z_$]\w*/)?.[0]?.length;
      if (len !== undefined && len > 0) {
        tokens.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
        continue;
      }
    }

    // Number
    {
      const len = remaining.match(/^\d[\d_]*(?:\.\d[\d_]*)?(?:[eE]\d+)?/)?.[0]
        ?.length;
      if (len !== undefined && len > 0) {
        tokens.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
        continue;
      }
    }

    // Operator symbol
    {
      const len = remaining.match(/^(?:<=|>=|==|[<>^*/+-])/)?.[0]?.length;
      if (len !== undefined && len > 0) {
        tokens.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
        continue;
      }
    }

    // Left paren
    {
      const len = remaining.match(/^\(/)?.[0]?.length;
      if (len !== undefined && len > 0) {
        tokens.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
        continue;
      }
    }

    // Right paren
    {
      const len = remaining.match(/^\)/)?.[0]?.length;
      if (len !== undefined && len > 0) {
        tokens.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
        continue;
      }
    }

    return;
  }

  return tokens;
}

function evalSExWithValueArgs(
  sEx: readonly (number | string)[],
  context: EvalContext
): EvalResult {
  if (sEx.length === 0) {
    return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
  }

  const [operatorSymbol, ...rawArgs] = sEx;
  const op = OPS.find((o) => o.symbol === operatorSymbol);
  if (op === undefined) {
    return { succeeded: false, error: CmamekErrorKind.InvalidSyntax };
  }

  const args = [];
  for (let i = 0; i < rawArgs.length; ++i) {
    const atomVal = evalAtom(rawArgs[i], context);
    if (atomVal === undefined) {
      return { succeeded: false, error: CmamekErrorKind.UndefinedVariable };
    }
    args.push(atomVal);
    continue;
  }

  const result = op.eval(args);
  if (result === undefined) {
    return { succeeded: false, error: CmamekErrorKind.IllegalOperation };
  }
  return { succeeded: true, value: result };
}

/** Returns `undefined` if and only if the atom is an undefined variable. */
function evalAtom(
  atom: number | string,
  context: EvalContext
): undefined | number {
  if (typeof atom === "number") {
    return atom;
  }

  if (/^\d[\d_]*(?:\.\d[\d_]*)?(?:[eE]\d+)?$/.test(atom)) {
    const n = Number(atom.replace(/_/g, ""));
    if (Number.isFinite(n)) {
      return n;
    }
  }

  const varVal = context[atom];
  if (varVal !== undefined) {
    return varVal;
  }
  return;
}
