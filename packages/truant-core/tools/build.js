'use strict';

const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const config = require('../webpack.dist.config');
const buildDll = require('./buildDistDll.js').buildDll;
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


var params = process.argv.slice(2),
  showAnalyze = params.indexOf('--analyze') >= 0;

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


buildDll('dist').then(oDllInfo => {
  const srcPath = path.join(__dirname, '../src');
  const tmpPath = oDllInfo.tmpPath;
  const manifestPath = path.join(tmpPath, 'vendors-manifest.json');
  config.output = {
    path: path.join(__dirname, '../build'),
    filename: `[name].bundle.${timestamp}.js`,
    libraryTarget: 'commonjs2'
  };
  showAnalyze && config.plugins.push(new BundleAnalyzerPlugin());
  config.plugins.push(
    new webpack.DllReferencePlugin({    //include dll
      context: srcPath,
      manifest: require(manifestPath),
    }));

  const start = new Date().getTime();
  logger(`start to build main resources at ${start}`);
  console.log(config);
  webpack(config, (err) => {
    if (err) console.error(err);
    else {
      shell.cp(path.join(oDllInfo.tmpPath, './' + oDllInfo.dllFileName), path.join(buildFolder, `./${oDllInfo.dllFileName}`));
      const end = new Date().getTime();
      logger('Done, build time: ', end - start, 'ms');
    }
  });

}).catch(err => {
  logger(err.message || err);
}
  );
