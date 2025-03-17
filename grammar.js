/**
 * @file Smith grammar for tree-sitter
 * @author Adam Kowalski <adam.kowalski.work@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  or: 0,
  and: 1,
  compare: 2,
  add: 3,
  multiply: 4,
  unary: 5,
};

const primitiveTypes = [
  "u8",
  "i8",
  "u16",
  "i16",
  "u32",
  "i32",
  "u64",
  "i64",
  "u128",
  "i128",
  "isize",
  "usize",
  "f32",
  "f64",
  "bool",
  "str",
];

module.exports = grammar({
  name: "smith",

  word: ($) => $.identifier,

  conflicts: ($) => [[$._expression, $._pattern]],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($.variable_definition, $._expression),

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.tuple_expression,
        $.integer_literal,
        $.boolean_literal,
        $.identifier,
      ),

    or: ($) => "or",
    and: ($) => "and",
    equal: ($) => "==",
    not_equal: ($) => "!=",
    less: ($) => "<",
    less_equal: ($) => "<=",
    greater: ($) => ">",
    greater_equal: ($) => ">=",
    add: ($) => "+",
    subtract: ($) => "-",
    multiply: ($) => "*",
    divide: ($) => "/",
    modulo: ($) => "%",
    negative: ($) => "-",
    not: ($) => "not",

    binary_expression: ($) => {
      /** @type {Array<[number, RuleOrLiteral, (precedence: number, rule: Rule)=>Rule]>} */
      const table = [
        [PREC.or, $.or, prec.left],
        [PREC.and, $.and, prec.left],
        [
          PREC.compare,
          choice(
            $.equal,
            $.not_equal,
            $.less,
            $.less_equal,
            $.greater,
            $.greater_equal,
          ),
          prec.left,
        ],
        [PREC.add, choice($.add, $.subtract), prec.left],
        [PREC.multiply, choice($.multiply, $.divide, $.modulo), prec.left],
      ];

      return choice(
        ...table.map(([precedence, operator, associativity]) =>
          associativity(
            precedence,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression),
            ),
          ),
        ),
      );
    },

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          field("operator", choice($.negative, $.not)),
          field("operand", $._expression),
        ),
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    tuple_expression: ($) =>
      seq(
        "(",
        seq($._expression, ","),
        repeat(seq($._expression, ",")),
        optional($._expression),
        ")",
      ),

    variable_definition: ($) =>
      seq(
        field("pattern", $._pattern),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression),
      ),

    _type: ($) =>
      choice(
        $.tuple_type,
        alias(choice(...primitiveTypes), $.primitive_type),
        $._type_identifier,
      ),

    tuple_type: ($) =>
      seq("(", seq($._type, repeat(seq(",", $._type))), optional(","), ")"),

    _type_identifier: ($) => alias($.identifier, $.type_identifier),

    _pattern: ($) => choice($.tuple_pattern, $.identifier),

    tuple_pattern: ($) =>
      seq(
        "(",
        optional(seq($._pattern, repeat(seq(",", $._pattern)))),
        optional(","),
        ")",
      ),

    integer_literal: ($) => /\d+/,

    boolean_literal: ($) => choice("true", "false"),

    identifier: (_) => /[_\p{XID_Start}][_\p{XID_Continue}]*/u,
  },
});
