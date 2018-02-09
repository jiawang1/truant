import pkg from './package.json';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import sizes from 'rollup-plugin-sizes';

const config = {
  input: 'index.js',
  sourcemap: true,
  external: ['react', 'prop-types', 'react-dom', 'whatwg-fetch'],
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      preferBuiltins: false
    }),
    commonjs({
      exclude: 'src/**'
    }),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true
    }),
    sizes()
  ],
  watch: {
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
        format: 'cjs'
      },
      name: 'troop-adapter'
    },
    config,
    { plugins: [...config.plugins, uglify()] }
  )
];
