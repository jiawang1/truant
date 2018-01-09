'use strict';

/*eslint-disable*/
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const webpack = require('webpack');
const config = require('../webpack.dist.config');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const distRelativePath = '../../dist';
const distFolder = path.join(__dirname, '../', distRelativePath);
const dllFolder = path.join(distFolder, 'truant-dll', 'dist');
const pkgJson = require(path.join(__dirname, '../', 'package.json'));
const { defaultContext, name: projectName } = pkgJson;
const buildFolder = path.join(distFolder, projectName);
const manifestName = 'vendors-manifest.json';
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
/*eslint-enable*/
const params = process.argv.slice(2);
const showAnalyze = params.indexOf('--analyze') >= 0;
const contextRoot = params.indexOf('--contextRoot') >= 0 ? params[params.indexOf('--contextRoot') + 1] : defaultContext;


// Clean folder
logger('start to build front end resources');
shell.rm('-rf', buildFolder);
shell.mkdir(buildFolder);
shell.mkdir(`${buildFolder}/static`);
logger(`clear dist folder ${buildFolder}`);
const timestamp = require('crypto')
  .createHash('md5')
  .update(new Date().getTime().toString())
  .digest('hex')
  .substring(0, 8);

const buildApp = () => {
  let manifestFile = null;
  let dllName = null;
  try {
    manifestFile = require(path.join(dllFolder, manifestName));
    dllName = fs.readdirSync(dllFolder).filter(file => file !== manifestName && !file.startsWith('.'))[0];
    logger(`found manifest file ${path.join(dllFolder, manifestName)}`);
    logger(`found DLL file ${dllName}`);
  } catch (err) {
    console.error('manifest or DLL file not found , build process stopped');
    console.error(err);
    throw err;
  }
  config.output = {
    path: path.join(buildFolder, './static'),
    filename: `[name].bundle.${timestamp}.js`,
    publicPath: `${contextRoot}/_admin/static/`,
    chunkFilename: '[name].[chunkhash:8].chunk.js'
  };
  if (showAnalyze) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }
  config.plugins.push(
    new webpack.DllReferencePlugin({    //  include dll
      manifest: manifestFile,
      context: path.join(__dirname, '../..')
    }));
  config.plugins.push(
    new HtmlWebpackPlugin({       // generate HTML
      fileName: 'index.html',
      template: 'index.ejs',
      inject: true,
      dllName: config.output.publicPath + dllName,
      publicContext: contextRoot
    })
  );
  const start = new Date().getTime();
  logger(`start to build main resources at ${start}`);
  webpack(config, err => {
    if (err) {
      console.error(err);
      throw err;
    }
    else {
      shell.mv(path.join(buildFolder, './static/index.html'), path.join(buildFolder, './index.html'));
      logger('Done, build time: ', new Date().getTime() - start, 'ms');
    }
  });
};

buildApp();

