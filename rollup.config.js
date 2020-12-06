import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import rollup from 'rollup';
import pkg from './package.json';

const IS_SSR = process.env.NODE_ENV === 'ssr';

const PATH = {
  input: 'src/index.ts',
  output: IS_SSR ? 'lib/ssr/' : 'lib/',
};
const plugins = [];

export default {
  input: PATH.input,
  external: [].concat(Object.keys(pkg.peerDependencies || {})).concat('effector-react/ssr'),
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
        '@babel/react',
        '@babel/typescript',
      ],
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      plugins: IS_SSR ? [['effector/babel-plugin', { reactSsr: true }]] : [],
    }),
  ],
  output: [
    {
      file: `${PATH.output}index.cjs.js`,
      format: 'cjs',
    },
    {
      file: `${PATH.output}index.esm.js`,
      format: 'esm',
    },
  ],
};
