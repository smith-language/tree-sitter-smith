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

module.exports = grammar({
  name: "smith",

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._expression),

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
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

    integer_literal: ($) => /\d+/,

    boolean_literal: ($) => choice("true", "false"),

    identifier: (_) => /[_\p{XID_Start}][_\p{XID_Continue}]*/u,
  },
});
