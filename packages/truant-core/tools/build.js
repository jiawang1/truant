'use strict';
/*eslint-disable*/
const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const config = require('../webpack.dist.config');
const buildDll = require('./buildDistDll.js').buildDll;
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
/*eslint-enable*/
const params = process.argv.slice(2);
const buildMode = params.indexOf('--build') >= 0 ? 'build' : 'dist';
const showAnalyze = params.indexOf('--analyze') >= 0;

// Clean folder
logger('start to build front end resources');
const buildFolder = path.join(__dirname, '../build');
shell.rm('-rf', buildFolder);
shell.mkdir(buildFolder);

const timestamp = require('crypto')
  .createHash('md5')
  .update(new Date().getTime().toString())
  .digest('hex')
  .substring(0, 10);

const buildProcess = (oDllInfo) => {
  let targetFileName = null;
  if (oDllInfo) {
    const srcPath = path.join(__dirname, '../src');
    const manifestPath = path.join(oDllInfo.tmpPath, 'vendors-manifest.json');
    config.plugins.push(
      new webpack.DllReferencePlugin({    //include dll
        context: srcPath,
        manifest: require(manifestPath),
      }));
    targetFileName = `[name].bundle.${timestamp}.js`;
  } else {
    targetFileName = `[name].bundle.js`;
  }
  config.output = {
    path: path.join(__dirname, '../build'),
    filename: targetFileName,
    libraryTarget: 'commonjs2'
  };
  !!showAnalyze && config.plugins.push(new BundleAnalyzerPlugin());
  const start = new Date().getTime();
  logger(`start to build main resources at ${start}`);
  console.log(config);
  webpack(config, (err) => {
    if (err) console.error(err);
    else {
      !!oDllInfo && shell.cp(path.join(oDllInfo.tmpPath, './' + oDllInfo.dllFileName), path.join(buildFolder, `./${oDllInfo.dllFileName}`));
      const end = new Date().getTime();
      logger('Done, build time: ', end - start, 'ms');
    }
  });
};

if (buildMode === 'build') {
  buildProcess();
} else {
  buildDll('dist').then(buildProcess).catch(err => logger(err.message || err));
}

