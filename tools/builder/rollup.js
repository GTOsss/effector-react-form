const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const rollup = require('rollup');

const input = 'src/index.ts';
const external = ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react/ssr'];
const outputDirCSR = 'dist';
const outputDirSSR = 'dist/ssr';

configCSR = {
  input,
  plugins: [
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
    }),
    terser(),
  ],
  external,
};

const outputCSR = [
  {
    file: `${outputDirCSR}/bundle.cjs.js`,
    format: 'cjs',
  },
  {
    file: `${outputDirCSR}/bundle.esm.js`,
    format: 'esm',
  },
];

const configSSR = {
  input,
  plugins: [
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      plugins: [['effector/babel-plugin', { reactSsr: true }]],
    }),
    terser(),
  ],
  external,
};

const outputSSR = [
  {
    file: `${outputDirSSR}/bundle.cjs.js`,
    format: 'cjs',
  },
  {
    file: `${outputDirSSR}/bundle.esm.js`,
    format: 'esm',
  },
];

const build = async () => {
  // CSR
  const bundleCSR = await rollup.rollup(configCSR);
  await Promise.all(outputCSR.map((el) => bundleCSR.write(el)));

  //SSR
  const bundleSSR = await rollup.rollup(configSSR);
  await Promise.all(outputSSR.map((el) => bundleSSR.write(el)));
};

build();
