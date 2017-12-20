"use strict";
module.exports = {
  entry: {
    vendors: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      'react-router-redux',
      'redux',
      'redux-logger',
      'redux-saga',
      'whatwg-fetch'
    ],
  },
  plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['react-hot-loader/webpack', 'babel-loader?cacheDirectory=true']
      }
    ]
  }
};
