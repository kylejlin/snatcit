# Cmamek

Cmamek is a minimal programming language for performing simple numerical calculations.

The primary goal is simplicity.

## Datatypes

Everything is a (IEEE 754 double-precision) number.

## Syntax

- Everything is an s-expression (like Lisp). Examples:
  - `(+ 1 2 foo)`
  - `($if 1 2 3)`
  - `2` (top level unparenthesized numbers are permitted)
  - `foo` (top level unparenthesized identifiers are permitted)
- Identifiers must start with "\$", "\_", or a letter. After that, they can be followed by zero or more "\$", "\_", letters, or digits.
  - Any identifier that does not begin with "\$" may be used as a variable name.
- Numbers may not have a "-". They may contain "." and "e"/"E" (for exponential notation).
- Booleans: There are no booleans, just numbers. `0` is falsy, all other non-`($nan)` numbers are truthy. `($nan)`is treated specially. For more information about`($nan)`, see the Operators section.
- Operators: see the Operators section.

## Operators

- `$nan` - Takes zero operands. Returns a value representing "not-a-number".
- `$max` - Must have one or more operands.
- `$min` - Must have one or more operands.
- `$abs` - Must have exactly one operand.
- `$floor` - Must have exactly one operand.
- `$ceil` - Must have exactly one operand.
- `$if` - Must have exactly three operands.
  - Case 1: First operand is `0` => Evaluates to third operand. For example, `($if 0 200 404)` is `404`.
  - Case 2: First operand is non-zero non-($nan) => Evaluates to second operand. For example, `($if 1 200 404)`is`200`.
  - Case 3: First operand is `($nan)` => Evaluates to `($nan)`.
- `$and` - Takes zero or more operands.
  - If any operand is `($nan)`, it evaluates to `($nan)`.
  - If there are zero operand, it evaluates to `1`.
  - Otherwise, it returns the first falsy operand, or the last operand if all are truthy.
- `$or` - The dual of `$and`. If there are zero operands, it evaluates to `0`.
- `$not` - Takes exactly one operand.
  - Case 1: Operand is `($nan)` => Evaluates to `($nan)`
  - Case 2: Operand is `0` => Evaluates to `1`
  - Else => Evaluates to `0`.
- `$is_nan` - Takes exactly one operand. Returns `1` if operand is `($nan)`, and `0` otherwise.
- `$is_integer` - Takes exactly one operand. Returns `1` or `0`. Returns `0` if operand is `($nan)`.
- `<`, `<=`, `>` `>=` - Take exactly two operands. Returns `1` or `0`.
- `==` - Takes zero or more operands. Returns `1` or `0`.
  - Case 1: zero operands => `1`
  - Case 2: one or more operands, at least one is `($nan)` => `($nan)`
  - Case 3: one or more operands, none are `($nan)` => returns whether all the operands are equal.
- `^` - Takes exactly two operands. `(^ 0 0)` is `($nan)`.
- `/` - Takes exactly two operands. `(^ n 0)` is `($nan)` for any `n`.
- `-` - Takes exactly two operands.
- `*` - Takes zero or more operands. If there are zero operands, this evaluates to `1`.
- `+` - Takes zero or more operands. If there are zero operands, this evaluates to `0`.

## Variables

Variables cannot be declared inside a program.
They must be provided by the interpreting/compiling environment.

This might sound like it defeats the purpose of having variables, but
this feature can still be useful.
For example, if your config file supports Cmamek, then you could write
something like

`config.json`:

```json
{
  "file_name": "a2.wav",
  "pitch": 440,
  "start_in_ms": 0,
  "end_in_ms": "(+ start_in_ms 2000)"
}
```

The above example is trivial, but hopefully you get the idea--the program
that parses `config.json` can evaluate the Cmamek expression `(+ start_in_ms 2000)`, providing `file_name`, `pitch`, and `start_in_ms` as variables.

## Errors

- Calling an operator with the wrong number of operands results in an error.
- Referencing a variable that is not defined will result in an error.
- Evaluation is "eager", so `($if 1 5 this_is_not_defined)` will result in an error (assuming `this_is_not_defined` is indeed not defined). This contrasts to some "lazy" languages, where the `$if` might "short-circuit" and skip evaluating the "else" branch.

## Non-features

- Variable declarations (variables must be provided by the interpreter/compiler).
- Function declarations.
- Side effects.
