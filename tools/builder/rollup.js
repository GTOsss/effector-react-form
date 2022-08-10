const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const rollup = require('rollup');

const input = 'src/index.ts';
const externalCSR = ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react/scope'];
const externalSSR = ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react/scope'];

const configCSR = {
  input,
  plugins: [
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    babel({
      presets: [
        [
          '@babel/env',
          {
            loose: true,
            modules: false,
          },
        ],
        '@babel/preset-react',
      ],
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      plugins: [['@babel/plugin-transform-typescript']],
    }),
    // terser(),
  ],
  external: externalCSR,
};

const outputCSR = [
  {
    file: `effector-react-form.cjs.js`,
    format: 'cjs',
  },
  {
    file: `effector-react-form.esm.js`,
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
      presets: [
        [
          '@babel/env',
          {
            loose: true,
            modules: false,
          },
        ],
        '@babel/preset-react',
      ],
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      plugins: [['@babel/plugin-transform-typescript'], ['effector/babel-plugin', {
        reactSsr: true,
        factories: ['src/factories/create-form', 'src/factories/create-field-array']
      }]],
    }),
    // terser(),
  ],
  external: externalSSR,
};

const outputSSR = [
  {
    file: `scope.js`,
    format: 'cjs',
  },
  {
    file: `scope.esm.js`,
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
