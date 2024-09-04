const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const rollup = require('rollup');

const input = 'src/index.ts';

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
  external: ['lodash.topath', 'react', 'effector', 'effector-react', 'effector-react'],
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

const build = async () => {
  const bundle = await rollup.rollup(configCSR);
  await Promise.all(outputCSR.map((el) => bundle.write(el)));
};

build();
