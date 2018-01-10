"use strict";
const path = require('path');
const fs = require('fs');
const util = require('util');
const shell = require('shelljs');
const webpack = require('webpack');
const exec = util.promisify(require('child_process').exec);
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const devConfig = require('../webpack.dev.config');
const baseConfig = require('../base.config.js');

const buildDLL = 'npm run dev';
const dllRelativePath = `${baseConfig.dllRootFolder}/dev`;
const dllFolder = path.join(__dirname, '../', dllRelativePath);
const folderTmp = './src/_tmp/';


function startDevServer() {
  // if DDL not exist, will throw error and trigger rebuild DLL

  let manifest;
  let dllName;
  try {
    manifest = require(path.join(dllFolder, baseConfig.manifestName));
    dllName = fs.readdirSync(dllFolder).filter(file => file !== baseConfig.manifestName)[0];
    shell.rm('-rf', folderTmp);
    shell.mkdir(folderTmp);
    shell.cp(`${dllFolder}/${dllName}`, folderTmp);
  } catch (err) {
    console.error();
    throw err;
  }
  devConfig.entry = {
    main: [
      'react-hot-loader/patch',
      `webpack-dev-server/client?http://localhost:${baseConfig.webpackDevServerPort}`,
      'webpack/hot/only-dev-server',
      './styles/index.less',
      './index'
    ]
  };
  devConfig.plugins.push(new webpack.DllReferencePlugin({    // include dll
    manifest
  }));

  devConfig.plugins.push(
    new HtmlWebpackPlugin({       // generate HTML
      fileName: 'index.html',
      template: 'index.ejs',
      inject: true,
      dllName: path.join('/_tmp', dllName),
      publicContext: devConfig.output.publicPath.match(/^(\/[^/]*)\/.*/)[1]
    })
  );

  new WebpackDevServer(webpack(devConfig), {
    publicPath: devConfig.output.publicPath,
    contentBase: devConfig.devServer.contentBase,
    proxy: devConfig.devServer.proxy,
    // chunkFilename: devConfig.output.chunkFilename,
    hot: true,
    noInfo: false,
    quiet: true,
    index: 'index.html',
    https: true,
    historyApiFallback: true
  }).listen(baseConfig.webpackDevServerPort, err => {
    if (err) {
      console.error(err);
    }
    console.log(`Listening at localhost:${baseConfig.webpackDevServerPort}`);
  });
}

try {
  startDevServer();
} catch (err) {
  console.log('manifest or DLL file not found , start to build DLL');
  exec(buildDLL, { cwd: path.join(__dirname, '../../truant-dll') }).then(startDevServer).catch(error => console.error(error));
}
