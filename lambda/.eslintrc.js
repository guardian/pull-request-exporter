module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
    jest: true
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true
    },
    sourceType: "module"
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    quotes: ["warn", "double"],
    semi: ["error", "always"],
    "no-console": "off",
    "comma-dangle": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-var-requires": 0,
    "prefer-spread": "warn"
  },
  overrides: [
    {
      files: ["tests/*.test.ts"],
      rules: {
        "@typescript-eslint/no-use-before-define": "off"
      }
    },
    {
      files: ["src/interfaces.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};
