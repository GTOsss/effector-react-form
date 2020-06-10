const {NODE_ENV, BABEL_ENV} = process.env;
const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs';
const loose = true;

module.exports = {
  presets: [['@babel/env', {loose, modules: false}]],
  ignore: [
    './src/examples',
    '**/__snapshots__',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.js',
    '**/*.test.jsx',
  ],
  plugins: [
    ['@babel/plugin-transform-typescript'],
    ['@babel/plugin-proposal-object-rest-spread', {loose}],
    ['@babel/plugin-transform-runtime', {useESModules: !cjs}],
    cjs && ['@babel/plugin-transform-modules-commonjs', {loose}],
  ].filter(Boolean),
};
