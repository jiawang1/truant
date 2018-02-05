import pkg from './package.json';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: `es/${pkg.name.indexOf('/') > 0 ? split('/')[1] : pkg.name}.bundle.js`,
    format: 'es'
  },
  sourcemap: true,
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      preferBuiltins: true
    }),
    commonjs({
      exclude: 'src/**'
    }),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true
    })
  ]
};
