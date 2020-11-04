const { NODE_ENV, BABEL_ENV } = process.env;
const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs';
const loose = true;
const isTest = NODE_ENV === 'test';

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        loose,
        modules: false,
      },
    ],
    '@babel/preset-react',
  ],
  ignore: isTest
    ? []
    : ['./src/__tests__', '**/__snapshots__', '**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
  plugins: [
    ['@babel/plugin-transform-typescript'],
    ['@babel/plugin-proposal-object-rest-spread', { loose }],
    ['@babel/plugin-transform-runtime', { useESModules: !cjs }],
    cjs && ['@babel/plugin-transform-modules-commonjs', { loose }],
  ].filter(Boolean),
};
