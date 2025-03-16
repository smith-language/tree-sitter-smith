/**
 * @file Smith grammar for tree-sitter
 * @author Adam Kowalski <adam.kowalski.work@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  additive: 1,
  multiplicative: 2,
};

module.exports = grammar({
  name: "smith",

  rules: {
    source_file: ($) => repeat($._expression),

    _expression: ($) => choice($.binary_expression, $.integer),

    add: ($) => "+",
    subtract: ($) => "-",
    multiply: ($) => "*",
    divide: ($) => "/",

    binary_expression: ($) => {
      /** @type {Array<[number, RuleOrLiteral, (precedence: number, rule: Rule)=>Rule]>} */
      const table = [
        [PREC.additive, choice($.add, $.subtract), prec.left],
        [PREC.multiplicative, choice($.multiply, $.divide), prec.left],
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

    integer: ($) => /\d+/,
  },
});
