const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');
const Dashboard = require('webpack-dashboard');
const baseConfig = require('./base.config');

const dashboard = new Dashboard();

const onProxyReq = (proxyReq, req, res) => {
  proxyReq.setHeader('Origin', 'https://schooluat.englishtown.com');
  proxyReq.setHeader('Host', 'schooluat.englishtown.com');
  proxyReq.setHeader('Referer', 'https://schooluat.englishtown.com/');
};

module.exports = {
  devtool: 'inline-source-map',
  cache: true,
  /*eslint-disable*/
  context: path.join(__dirname, 'src'),
  entry: {
    // dynamically add by server.js
  },
  output: {
    path: path.join(__dirname, 'build/static'),
    filename: '[name].bundle.js',
    publicPath: baseConfig.publicPath,
    chunkFilename: '[name].[chunkhash:8].chunk.js',
    sourceMapFilename: '[name].map'
  },
  devServer: {
    contentBase: path.join(__dirname, 'src'),
    /*eslint-enable*/
    proxy: [
      {
        context: ['/services/api/proxy/queryproxy', '/login/secure.ashx'],
        target: 'https://localhost:8079/',
        secure: false
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin({ filename: 'styles.css' }),
    new webpack.DefinePlugin({
      ENV: '"dev"'
    }),
    new DashboardPlugin(dashboard.setData)
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules|build/,
        use: ['babel-loader?cacheDirectory=true']
      },
      {
        test: /\.(ttf|eot|woff|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader'
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: true,
              plugins: loader => [require('autoprefixer')()]
            }
          },
          { loader: 'less-loader', options: { sourceMap: true } }
        ]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: 'url-loader?limit=8192'
      }
    ]
  }
};
