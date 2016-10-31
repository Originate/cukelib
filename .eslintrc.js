module.exports = {
    "extends": "airbnb",
    "rules": {
      "func-names": "off",
      "new-cap": ["error", { "capIsNewExceptions": ["Given", "Then", "And", "When", "But", "Before", "After"] }],
      "import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/harness/support/**"]}]
    },
    "installedESLint": true,
    "plugins": [
        "react",
        "jsx-a11y",
        "import"
    ]
};