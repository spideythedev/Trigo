import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'trigo.js',
    output: {
      file: 'trigo.min.js',
      format: 'umd',
      name: 'Trigo',
      sourcemap: false
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  }
];