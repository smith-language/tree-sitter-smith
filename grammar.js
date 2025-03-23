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
  call: 6,
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

  conflicts: ($) => [
    [$._expression, $._pattern],
    [$.array_expression, $.array_pattern],
  ],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice($.variable_definition, $.function_definition, $._expression),

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.tuple_expression,
        $.array_expression,
        $.call_expression,
        $.boolean_literal,
        $.integer_literal,
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
        sepBy(",", $._expression),
        optional(","),
        ")",
      ),

    array_expression: ($) =>
      seq("[", seq(sepBy(",", seq($._expression)), optional(",")), "]"),

    call_expression: ($) =>
      prec(
        PREC.call,
        seq(field("function", $._expression), field("arguments", $.arguments)),
      ),

    arguments: ($) =>
      seq(
        "(",
        sepBy(",", choice($._expression, $.keyword_argument)),
        optional(","),
        ")",
      ),

    keyword_argument: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._expression)),

    variable_definition: ($) =>
      seq(
        field("pattern", $._pattern),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression),
      ),

    function_definition: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameters)),
        field("parameters", $.parameters),
        "->",
        field("return_type", $._type),
        field("body", $.block),
      ),

    type_parameters: ($) =>
      seq("[", sepBy1(",", $.type_parameter), optional(","), "]"),

    type_parameter: ($) =>
      seq(
        field("name", $._type_identifier),
        optional(field("bounds", $.trait_bounds)),
      ),

    trait_bounds: ($) => seq(":", sepBy1("+", $._type)),

    parameters: ($) => seq("(", sepBy(",", $.parameter), optional(","), ")"),

    parameter: ($) =>
      seq(field("pattern", $._pattern), ":", field("type", $._type)),

    block: ($) => seq("{", repeat($._statement), "}"),

    _type: ($) =>
      choice(
        $.tuple_type,
        $.array_type,
        alias(choice(...primitiveTypes), $.primitive_type),
        $._type_identifier,
      ),

    _type_identifier: ($) => alias($.identifier, $.type_identifier),

    tuple_type: ($) => seq("(", sepBy1(",", $._type), optional(","), ")"),

    array_type: ($) =>
      seq(
        "[",
        field("dimensions", $.array_dimensions),
        "]",
        field("element", $._type),
      ),

    array_dimensions: ($) =>
      sepBy1(",", choice($.integer_literal, $.identifier, $.anonymous)),

    _pattern: ($) => choice($.tuple_pattern, $.array_pattern, $.identifier),

    tuple_pattern: ($) => seq("(", sepBy(",", $._pattern), optional(","), ")"),

    array_pattern: ($) => seq("[", sepBy(",", $._pattern), optional(","), "]"),

    integer_literal: ($) => /\d+/,

    boolean_literal: ($) => choice("true", "false"),

    identifier: (_) => /[_\p{XID_Start}][_\p{XID_Continue}]*/u,

    anonymous: (_) => "_",
  },
});

/**
 * Creates a rule to match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
