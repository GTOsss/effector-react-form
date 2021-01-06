module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    // 'airbnb-typescript', not working todo resolve error
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-param-reassign': 'off',
    'prefer-destructuring': 'off',
    'object-curly-newline': 'off',
    'arrow-body-style': 'off',
    'implicit-arrow-linebreak': 'off',
    'function-paren-newline': 'off',
    'import/no-extraneous-dependencies': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'no-empty-pattern': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-useless-computed-key': 'off',
    'no-plusplus': 'off',
    'react/jsx-one-expression-per-line': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    '@typescript-eslint/ban-types': 'off',
  },
};
