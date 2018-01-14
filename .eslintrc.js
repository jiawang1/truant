module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": ["eslint-config-airbnb"],
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "eslint-plugin-jsx-a11y",
    "import"
  ],
  "rules": {
    "indent": [
      "error",
      2
    ],
    // "linebreak-style": [
    //     "error",
    //     "unix"
    // ],
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
    "comma-dangle": ["error", "never"],
    "arrow-parens": ["error", "as-needed"],
    "no-underscore-dangle":[0],
    "semi": [
      "error",
      "always"
    ]
  }
};
