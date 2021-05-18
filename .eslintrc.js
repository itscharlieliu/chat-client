module.exports = {
    parser: "@typescript-eslint/parser", // Specifies the ESLint parser
    extends: [
        "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:import/warnings",
        "plugin:import/typescript",
    ],
    plugins: ["react", "jest"],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: "module", // Allows for the use of imports
    },
    rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        "max-len": ["warn", { code: 120 }],
        quotes: ["warn", "double"],
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/typedef": ["error", { arrowParameter: true }],
        "@typescript-eslint/no-unused-vars": "warn",
        "no-unused-vars": "off",
        "import/order": [
            "warn",
            {
                alphabetize: {
                    order: "asc",
                },
                "newlines-between": "always",
            },
        ],
    },
    env: {
        browser: true,
        node: true,
        "jest/globals": true,
    },
    globals: {
        process: "readonly",
        JSX: "readonly",
    },
    ignorePatterns: ["**/*.css", "**/*.png", "**/*.svg", "**/*.gif", "src/serviceWorker.ts", "node_modules/"],
};
