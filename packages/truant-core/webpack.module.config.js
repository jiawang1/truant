const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: false,
  context: path.normalize(__dirname), // eslint-disable-line
  entry: {
    truantCore: ['./index']
  },
  output: {},
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.DefinePlugin({
      ENV: '"dist"',
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
