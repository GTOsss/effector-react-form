import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.ts',
  plugins: [
    babel({
      babelHelpers: 'runtime',
    }),
  ],
  external: ['lodash.topath', 'src/__test__'],
  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
    },
  ],
};
