import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/core/Trigo.js',
    output: {
      file: 'trigo.min.js',
      format: 'umd',
      name: 'Trigo',
      sourcemap: false
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  }
];