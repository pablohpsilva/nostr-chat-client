module.exports = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "lf",

  // React/JSX specific
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Import sorting
  importOrder: [
    "^react",
    "^react-native",
    "^expo",
    "^@expo/(.*)$",
    "^@react-navigation/(.*)$",
    "^@nostr-dev-kit/(.*)$",
    "^@/(.*)$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // File type overrides
  overrides: [
    {
      files: "*.json",
      options: {
        printWidth: 120,
      },
    },
    {
      files: "*.md",
      options: {
        printWidth: 100,
        proseWrap: "preserve",
      },
    },
    {
      files: "*.{yml,yaml}",
      options: {
        tabWidth: 2,
        singleQuote: true,
      },
    },
  ],
};
