'use strict';

/*eslint-disable*/
const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const config = require('../webpack.dist.config');

const distRelativePath = '../../dist';
const centralDistFolder = path.join(__dirname, '../', distRelativePath);
const projectName = require(path.join(__dirname, '../', 'package.json')).name;
const distFolder = path.join(centralDistFolder, projectName);
const dllFolder = path.join(centralDistFolder, 'truant-dll');
const manifestName = 'vendors-manifest.json';
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
/*eslint-enable*/
const params = process.argv.slice(2);
const buildMode = params.indexOf('--build') >= 0 ? 'build' : 'dist';
const showAnalyze = params.indexOf('--analyze') >= 0;
// Clean folder
logger('start to build front end resources');
shell.rm('-rf', distFolder);
shell.mkdir(distFolder);
logger(`clear dist folder ${distFolder}`);

const timestamp = require('crypto')
  .createHash('md5')
  .update(new Date().getTime().toString())
  .digest('hex')
  .substring(0, 10);

const buildProcess = () => {
  if (buildMode === 'dist') {
    try {
      const manifestFile = require(path.join(dllFolder, manifestName));
      logger(`found manifest file ${path.join(dllFolder, manifestName)}`);
      config.plugins.push(
        new webpack.DllReferencePlugin({    //include dll
          manifest: manifestFile
        }));
    } catch (err) {
      console.error('manifest not found , build process stopped');
      console.error(err);
      return;
    }
  }
  config.output = {
    path: distFolder,
    filename: buildMode === 'dist' ? `[name].bundle.${timestamp}.js` : '[name].min.js',
    libraryTarget: 'commonjs2'
  };
  !!showAnalyze && config.plugins.push(new BundleAnalyzerPlugin());
  const start = new Date().getTime();
  logger(`start to build main resources at ${start}`);
  console.log(config);
  webpack(config, err => {
    if (err) {
      console.error(err);
      return;
    }
    const end = new Date().getTime();
    logger('Done, build time: ', end - start, 'ms');
  });
};

buildProcess();
