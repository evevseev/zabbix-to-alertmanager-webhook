var js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 5,
            sourceType: "commonjs"
        }
    }
];
