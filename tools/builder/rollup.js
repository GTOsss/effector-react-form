const { nodeResolve } = require('@rollup/plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const rollup = require('rollup');
const pkg = require('../../package.json');

const input = 'src/index.ts';
const externalCSR = ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react/ssr'];
const externalSSR = ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react/ssr'];

configCSR = {
  input,
  plugins: [
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    // babel({
    //   presets: [
    //     [
    //       '@babel/env',
    //       {
    //         loose: true,
    //         modules: false,
    //       },
    //     ],
    //     '@babel/preset-react',
    //   ],
    //   babelHelpers: 'runtime',
    //   exclude: 'node_modules/**',
    //   extensions: ['.js', '.ts'],
    //   plugins: [['@babel/plugin-transform-typescript']],
    // }),
    typescript(),
    // terser(),
  ],
  external: [Object.keys(pkg.peerDependencies | {})],
};

const outputCSR = [
  {
    file: `lib/index.cjs.js`,
    format: 'cjs',
  },
  {
    file: `lib/index.esm.js`,
    format: 'esm',
  },
];

const configSSR = {
  input,
  plugins: [
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    // babel({
    //   presets: [
    //     [
    //       '@babel/env',
    //       {
    //         loose: true,
    //         modules: false,
    //       },
    //     ],
    //     '@babel/preset-react',
    //   ],
    //   babelHelpers: 'runtime',
    //   exclude: 'node_modules/**',
    //   extensions: ['.js', '.ts'],
    //   plugins: [['@babel/plugin-transform-typescript'], ['effector/babel-plugin', { reactSsr: true }]],
    // }),
    typescript(),
    // terser(),
  ],
  external: [Object.keys(pkg.peerDependencies | {})],
};

const outputSSR = [
  {
    file: `lib/ssr/index.cjs.js`,
    format: 'cjs',
  },
  {
    file: `lib/ssr/index.esm.js`,
    format: 'esm',
  },
];

const build = async () => {
  // CSR
  const bundleCSR = await rollup.rollup(configCSR);
  await Promise.all(outputCSR.map((el) => bundleCSR.write(el)));

  // SSR
  const bundleSSR = await rollup.rollup(configSSR);
  await Promise.all(outputSSR.map((el) => bundleSSR.write(el)));
};

build();
