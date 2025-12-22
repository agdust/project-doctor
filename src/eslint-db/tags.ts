// Rule Tags Database
// Our custom categorization on top of ESLint plugin metadata

import type { RuleTagsMap } from "./types.js";

// =============================================================================
// ESLint Core Rules
// =============================================================================

const coreRules: RuleTagsMap = {
  // Error Prevention - Essential
  "no-cond-assign": ["error-prevention", "essential"],
  "no-const-assign": ["error-prevention", "essential"],
  "no-debugger": ["error-prevention", "essential"],
  "no-dupe-args": ["error-prevention", "essential"],
  "no-dupe-keys": ["error-prevention", "essential"],
  "no-duplicate-case": ["error-prevention", "essential"],
  "no-ex-assign": ["error-prevention", "essential"],
  "no-func-assign": ["error-prevention", "essential"],
  "no-import-assign": ["error-prevention", "essential"],
  "no-invalid-regexp": ["error-prevention", "essential"],
  "no-obj-calls": ["error-prevention", "essential"],
  "no-setter-return": ["error-prevention", "essential"],
  "no-undef": ["error-prevention", "essential"],
  "no-unreachable": ["error-prevention", "essential"],
  "no-unsafe-finally": ["error-prevention", "essential"],
  "no-unsafe-negation": ["error-prevention", "essential"],
  "no-unused-vars": ["error-prevention", "essential"],
  "use-isnan": ["error-prevention", "essential"],
  "valid-typeof": ["error-prevention", "essential"],
  "no-fallthrough": ["error-prevention", "essential"],
  "no-global-assign": ["error-prevention", "essential"],
  "no-octal": ["error-prevention", "essential"],
  "no-redeclare": ["error-prevention", "essential"],
  "no-class-assign": ["error-prevention", "essential"],
  "no-dupe-class-members": ["error-prevention", "essential"],
  "no-this-before-super": ["error-prevention", "essential"],
  "no-delete-var": ["error-prevention", "essential"],
  "no-shadow-restricted-names": ["error-prevention", "essential"],

  // Error Prevention - Recommended
  "no-constant-condition": ["error-prevention", "recommended"],
  "no-empty": ["error-prevention", "recommended"],
  "no-irregular-whitespace": ["error-prevention", "recommended"],
  "no-loss-of-precision": ["error-prevention", "recommended"],
  "no-prototype-builtins": ["error-prevention", "recommended"],
  "no-self-assign": ["error-prevention", "recommended"],
  "no-sparse-arrays": ["error-prevention", "recommended"],
  "no-self-compare": ["error-prevention", "recommended"],
  "no-unmodified-loop-condition": ["error-prevention", "recommended"],
  "no-unused-expressions": ["error-prevention", "recommended"],
  "no-octal-escape": ["error-prevention", "recommended"],
  "no-use-before-define": ["error-prevention", "recommended"],
  "require-yield": ["error-prevention", "recommended"],

  // Security
  "no-eval": ["security", "essential"],
  "no-implied-eval": ["security", "essential"],

  // Best Practice - Essential
  "eqeqeq": ["best-practice", "essential"],
  "no-var": ["best-practice", "essential"],
  "prefer-const": ["best-practice", "essential"],
  "no-with": ["best-practice", "essential"],

  // Best Practice - Recommended
  "curly": ["best-practice", "recommended"],
  "default-case-last": ["best-practice", "recommended"],
  "dot-notation": ["best-practice", "recommended"],
  "no-caller": ["best-practice", "recommended"],
  "no-empty-function": ["best-practice", "recommended"],
  "no-extend-native": ["best-practice", "recommended"],
  "no-extra-bind": ["best-practice", "recommended"],
  "no-lone-blocks": ["best-practice", "recommended"],
  "no-new-wrappers": ["best-practice", "recommended"],
  "no-return-assign": ["best-practice", "recommended"],
  "no-sequences": ["best-practice", "recommended"],
  "no-throw-literal": ["best-practice", "recommended"],
  "no-useless-call": ["best-practice", "recommended"],
  "no-useless-catch": ["best-practice", "recommended"],
  "no-useless-concat": ["best-practice", "recommended"],
  "no-useless-escape": ["best-practice", "recommended"],
  "no-useless-return": ["best-practice", "recommended"],
  "prefer-promise-reject-errors": ["best-practice", "recommended"],
  "radix": ["best-practice", "recommended"],
  "no-useless-computed-key": ["best-practice", "recommended"],
  "no-useless-constructor": ["best-practice", "recommended"],
  "no-useless-rename": ["best-practice", "recommended"],
  "prefer-rest-params": ["best-practice", "recommended"],
  "prefer-spread": ["best-practice", "recommended"],
  "symbol-description": ["best-practice", "recommended"],

  // Best Practice - Strict
  "no-else-return": ["best-practice", "strict"],

  // Style - Recommended
  "object-shorthand": ["style", "recommended"],
  "prefer-arrow-callback": ["style", "recommended"],
  "prefer-template": ["style", "recommended"],

  // Maintainability
  "no-duplicate-imports": ["maintainability", "recommended"],
  "no-shadow": ["maintainability", "strict"],
};

// =============================================================================
// @typescript-eslint Rules
// =============================================================================

const typescriptRules: RuleTagsMap = {
  // Type Safety - Essential
  "@typescript-eslint/no-explicit-any": ["type-safety", "essential"],
  "@typescript-eslint/no-non-null-assertion": ["type-safety", "essential"],
  "@typescript-eslint/no-floating-promises": ["error-prevention", "essential"],
  "@typescript-eslint/no-misused-promises": ["error-prevention", "essential"],
  "@typescript-eslint/no-unused-vars": ["error-prevention", "essential"],

  // Type Safety - Recommended
  "@typescript-eslint/await-thenable": ["error-prevention", "recommended"],
  "@typescript-eslint/no-for-in-array": ["error-prevention", "recommended"],
  "@typescript-eslint/no-unnecessary-type-assertion": ["type-safety", "recommended"],
  "@typescript-eslint/restrict-plus-operands": ["type-safety", "recommended"],
  "@typescript-eslint/restrict-template-expressions": ["type-safety", "recommended"],
  "@typescript-eslint/unbound-method": ["error-prevention", "recommended"],
  "@typescript-eslint/require-await": ["best-practice", "recommended"],
  "@typescript-eslint/return-await": ["best-practice", "recommended"],
  "@typescript-eslint/no-redundant-type-constituents": ["type-safety", "recommended"],
  "@typescript-eslint/ban-ts-comment": ["type-safety", "recommended"],
  "@typescript-eslint/no-confusing-non-null-assertion": ["type-safety", "recommended"],
  "@typescript-eslint/no-duplicate-enum-values": ["error-prevention", "recommended"],
  "@typescript-eslint/no-empty-object-type": ["type-safety", "recommended"],
  "@typescript-eslint/no-extra-non-null-assertion": ["type-safety", "recommended"],
  "@typescript-eslint/no-inferrable-types": ["style", "recommended"],
  "@typescript-eslint/no-misused-new": ["error-prevention", "recommended"],
  "@typescript-eslint/no-namespace": ["best-practice", "recommended"],
  "@typescript-eslint/no-non-null-asserted-optional-chain": ["type-safety", "recommended"],
  "@typescript-eslint/no-require-imports": ["best-practice", "recommended"],
  "@typescript-eslint/no-this-alias": ["best-practice", "recommended"],
  "@typescript-eslint/no-unnecessary-type-constraint": ["type-safety", "recommended"],
  "@typescript-eslint/no-unsafe-declaration-merging": ["type-safety", "recommended"],
  "@typescript-eslint/no-unsafe-function-type": ["type-safety", "recommended"],
  "@typescript-eslint/no-wrapper-object-types": ["type-safety", "recommended"],
  "@typescript-eslint/prefer-as-const": ["style", "recommended"],
  "@typescript-eslint/prefer-namespace-keyword": ["style", "recommended"],
  "@typescript-eslint/triple-slash-reference": ["best-practice", "recommended"],
  "@typescript-eslint/no-use-before-define": ["error-prevention", "recommended"],
  "@typescript-eslint/no-empty-function": ["best-practice", "recommended"],
  "@typescript-eslint/no-useless-constructor": ["best-practice", "recommended"],
  "@typescript-eslint/no-redeclare": ["error-prevention", "recommended"],
  "@typescript-eslint/consistent-type-imports": ["style", "recommended"],

  // Type Safety - Strict
  "@typescript-eslint/no-unsafe-argument": ["type-safety", "strict"],
  "@typescript-eslint/no-unsafe-assignment": ["type-safety", "strict"],
  "@typescript-eslint/no-unsafe-call": ["type-safety", "strict"],
  "@typescript-eslint/no-unsafe-member-access": ["type-safety", "strict"],
  "@typescript-eslint/no-unsafe-return": ["type-safety", "strict"],
  "@typescript-eslint/no-unnecessary-condition": ["type-safety", "strict"],
  "@typescript-eslint/promise-function-async": ["best-practice", "strict"],
  "@typescript-eslint/array-type": ["style", "strict"],
  "@typescript-eslint/consistent-type-assertions": ["style", "strict"],
  "@typescript-eslint/consistent-type-definitions": ["style", "strict"],
  "@typescript-eslint/consistent-type-exports": ["style", "strict"],
  "@typescript-eslint/method-signature-style": ["style", "strict"],
  "@typescript-eslint/no-extraneous-class": ["best-practice", "strict"],
  "@typescript-eslint/no-import-type-side-effects": ["style", "strict"],
  "@typescript-eslint/prefer-for-of": ["style", "strict"],
  "@typescript-eslint/prefer-function-type": ["style", "strict"],
  "@typescript-eslint/prefer-optional-chain": ["style", "strict"],
  "@typescript-eslint/unified-signatures": ["maintainability", "strict"],
  "@typescript-eslint/no-shadow": ["maintainability", "strict"],
  "@typescript-eslint/naming-convention": ["style", "strict"],
  "@typescript-eslint/class-literal-property-style": ["style", "strict"],
  "@typescript-eslint/consistent-generic-constructors": ["style", "strict"],
  "@typescript-eslint/consistent-indexed-object-style": ["style", "strict"],

  // Type Safety - Pedantic
  "@typescript-eslint/explicit-function-return-type": ["type-safety", "pedantic"],
  "@typescript-eslint/explicit-member-accessibility": ["style", "pedantic"],
  "@typescript-eslint/explicit-module-boundary-types": ["type-safety", "strict"],

  // Maintainability
  "@typescript-eslint/ban-tslint-comment": ["maintainability", "recommended"],
  "@typescript-eslint/no-useless-empty-export": ["maintainability", "recommended"],
  "@typescript-eslint/adjacent-overload-signatures": ["style", "recommended"],
};

// =============================================================================
// @stylistic Rules
// =============================================================================

const stylisticRules: RuleTagsMap = {
  // All stylistic rules are style concern
  // Most are recommended strictness
  "@stylistic/array-bracket-spacing": ["style", "recommended"],
  "@stylistic/arrow-spacing": ["style", "recommended"],
  "@stylistic/block-spacing": ["style", "recommended"],
  "@stylistic/brace-style": ["style", "recommended"],
  "@stylistic/comma-dangle": ["style", "recommended"],
  "@stylistic/comma-spacing": ["style", "recommended"],
  "@stylistic/comma-style": ["style", "recommended"],
  "@stylistic/computed-property-spacing": ["style", "recommended"],
  "@stylistic/dot-location": ["style", "recommended"],
  "@stylistic/eol-last": ["style", "recommended"],
  "@stylistic/func-call-spacing": ["style", "recommended"],
  "@stylistic/indent": ["style", "recommended"],
  "@stylistic/key-spacing": ["style", "recommended"],
  "@stylistic/keyword-spacing": ["style", "recommended"],
  "@stylistic/linebreak-style": ["style", "recommended"],
  "@stylistic/member-delimiter-style": ["style", "recommended"],
  "@stylistic/new-parens": ["style", "recommended"],
  "@stylistic/no-extra-semi": ["style", "recommended"],
  "@stylistic/no-mixed-operators": ["error-prevention", "recommended"],
  "@stylistic/no-multi-spaces": ["style", "recommended"],
  "@stylistic/no-multiple-empty-lines": ["style", "recommended"],
  "@stylistic/no-tabs": ["style", "recommended"],
  "@stylistic/no-trailing-spaces": ["style", "recommended"],
  "@stylistic/no-whitespace-before-property": ["style", "recommended"],
  "@stylistic/object-curly-spacing": ["style", "recommended"],
  "@stylistic/operator-linebreak": ["style", "recommended"],
  "@stylistic/padded-blocks": ["style", "recommended"],
  "@stylistic/quote-props": ["style", "recommended"],
  "@stylistic/quotes": ["style", "recommended"],
  "@stylistic/rest-spread-spacing": ["style", "recommended"],
  "@stylistic/semi": ["style", "recommended"],
  "@stylistic/semi-spacing": ["style", "recommended"],
  "@stylistic/space-before-blocks": ["style", "recommended"],
  "@stylistic/space-before-function-paren": ["style", "recommended"],
  "@stylistic/space-in-parens": ["style", "recommended"],
  "@stylistic/space-infix-ops": ["style", "recommended"],
  "@stylistic/space-unary-ops": ["style", "recommended"],
  "@stylistic/spaced-comment": ["style", "recommended"],
  "@stylistic/template-curly-spacing": ["style", "recommended"],
  "@stylistic/template-tag-spacing": ["style", "recommended"],
  "@stylistic/type-annotation-spacing": ["style", "recommended"],
  "@stylistic/wrap-iife": ["style", "recommended"],
  "@stylistic/jsx-quotes": ["style", "recommended"],

  // Strict
  "@stylistic/max-len": ["style", "strict"],
};

// =============================================================================
// Combined Registry
// =============================================================================

export const ruleTags: RuleTagsMap = {
  ...coreRules,
  ...typescriptRules,
  ...stylisticRules,
};
