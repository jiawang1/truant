/*eslint-disable*/
const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const crypto = require('crypto');
const dllConfig = require('../webpack.dll.config.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const distPath = '../../dist';
const oPackage = require(path.join(__dirname, '../', 'package.json'));
const projectName = oPackage.name;
const relativeTargetPath = path.join(__dirname, '../', distPath, projectName);
/*eslint-enable*/

const params = process.argv.slice(2);
const forceBuild = params.indexOf('--force') >= 0;
const mode = params.indexOf('--dev') >= 0 ? 'dev' : 'dist';

const generateHash = () => {
  const nameVersions = dllConfig.entry.vendors
    .map(pkgName => {
      const pkgJson = require(path.join(pkgName.split('/')[0], 'package.json'));
      return `${pkgJson.name}_${pkgJson.version}`;
    })
    .join('-');
  return crypto
    .createHash('md5')
    .update(nameVersions)
    .digest('hex');
};

const cleanUp = target => {
  shell.rm('-rf', target);
  shell.mkdir(target);
};

function buildDll(env = 'dist') {
  const dllHash = generateHash();
  const dllName = `vendors_${dllHash}`;
  const dllFileName = `${dllName}.dll.js`;
  console.log('dll name: ', dllName);

  const targetPath = path.join(relativeTargetPath, env);
  const manifestPath = path.join(relativeTargetPath, env, 'vendors-manifest.json');

  return new Promise((resolve, reject) => {
    if (
      forceBuild ||
      !shell.test('-e', manifestPath) || // dll doesn't exist
      require(manifestPath).name !== dllName // dll hash has changed
    ) {
      delete require.cache[manifestPath]; // force reload the new manifest
      cleanUp(targetPath);
      console.log('vendors have changed, rebuilding dll...');

      dllConfig.output = {
        path: targetPath,
        filename: dllFileName,
        library: dllName // reference to current dll, should be the same with dll plugin name
      };
      const oEnvironment = {
        ENV: `"${env}"`,
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      };

      if (env === 'dist') {
        dllConfig.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
        dllConfig.plugins.push(new webpack.optimize.DedupePlugin());
        dllConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
        dllConfig.plugins.push(new webpack.optimize.AggressiveMergingPlugin());
      }
      dllConfig.plugins.push(new webpack.DefinePlugin(oEnvironment));
      dllConfig.plugins.push(
        new webpack.DllPlugin({
          path: manifestPath,
          name: dllName,
          context: path.join(__dirname, '../..')
        })
      );

      webpack(dllConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error('dll build failed:');
          console.error((err && err.stack) || stats.hasErrors());
          reject(err || stats.hasErrors());
          console.log(`DLL build exit time ${new Date().getTime()}`);
          process.exit(1);
        }
        console.log('dll build success.');
        resolve({
          dllFileName,
          targetPath
        });
        console.log(`DLL build exit time ${new Date().getTime()}`);
        process.exit(0);
      });
    } else {
      console.log('vendors dll is up to date, no need to rebuild.');
      resolve({
        dllFileName,
        targetPath
      });
      console.log(`DLL build exit time ${new Date().getTime()}`);
      process.exit(0);
    }
  });
}
buildDll(mode);
