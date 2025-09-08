module.exports = {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.{ts,tsx}": [
    () => "tsc --noEmit", // Type check all files
  ],
};
