import pkg from './package.json';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

const config = {
  input: 'index.js',
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
  ],
  watch:{
    include: 'src/**'
  }
};

export default [
  Object.assign(
    {
      output: {
        file: `es/${pkg.name.indexOf('/') > 0 ? pkg.name.split('/')[1] : pkg.name}.bundle.js`,
        format: 'es'
      }
    },
    config
  ),

  Object.assign(
    {
      output: {
        file: `dist/${pkg.name.indexOf('/') > 0 ? pkg.name.split('/')[1] : pkg.name}.bundle.min.js`,
        format: 'umd'
      },
      name: 'troop-adapter'
    },
    { plugins: uglify() },
    config
  )
];
