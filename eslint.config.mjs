import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginPrettier from "eslint-plugin-prettier";
import airbnb from "eslint-config-airbnb-base";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      js,
      react: pluginReact,
      prettier: pluginPrettier,
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    extends: [
      "js/recommended",
      airbnb,
      pluginPrettier.configs.recommended,
      "plugin:react-hooks/recommended",
    ],
    rules: {
      "no-console": "off",
    },
  },
  pluginReact.configs.flat.recommended,
]);
