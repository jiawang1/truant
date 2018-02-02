'use strict';

/*eslint-disable*/
const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const config = require('../webpack.module.config');
const projectName = require(path.join(__dirname, '../', 'package.json')).name;

const distFolder =  path.join(__dirname, '../dist');
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
/*eslint-enable*/
const params = process.argv.slice(2);
const showAnalyze = params.indexOf('--analyze') >= 0;
// Clean folder
logger(`start to build module ${projectName}`);
shell.rm('-rf', distFolder);
shell.mkdir(distFolder);
logger(`clear dist folder ${distFolder}`);

const buildProcess = () => {
  config.output = {
    path: distFolder,
    filename: '[name].bundle.js',
    libraryTarget: 'commonjs2'
  };
  !!showAnalyze && config.plugins.push(new BundleAnalyzerPlugin({ generateStatsFile: true }));
  const start = new Date().getTime();
  logger(`start to build main resources at ${start}`);
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
