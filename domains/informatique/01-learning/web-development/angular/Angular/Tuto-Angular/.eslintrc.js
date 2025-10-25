{
  "extends": [
    "@angular-eslint/recommended",
    "@angular-eslint/template/process-inline-templates"
  ],
  "rules": {
    "@angular-eslint/directive-selector": [
      "error",
      {
        "type": "attribute",
        "prefix": "app",
        "style": "camelCase"
      }
    ],
    "@angular-eslint/component-selector": [
      "error",
      {
        "type": "element",
        "prefix": "app",
        "style": "kebab-case"
      }
    ],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-readonly": "warn",
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn"
  }
}
