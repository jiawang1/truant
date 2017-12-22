/*eslint-disable*/
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const util = require('util');
const webpack = require('webpack');
const exec = util.promisify(require('child_process').exec);
const commandDiff = 'lerna updated --json';
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
let envirnPath = path.join(__dirname, '../packages');
let commandBuild = 'npm run dist';
/*eslint-enable*/

const params = process.argv.slice(2);
const forceBuild = params.indexOf('--force') >= 0;

const buildDLL = async () => {
  let dllprojectsBuildPath = path.join(envirnPath, 'truant-dll');
  const { err, stdout } = await exec(commandBuild, { cwd: dllprojectsBuildPath });
  if (err) {
    console.log(`DLL building failed caused by:`);
    console.error(err);
    return false;
  }
  console.log(`DLL building done at ${new Date()}`);
  return true;
};
/**
 * this function used to build projects except project DLL
 * @param  {} files: projects folder
 */
const runBuildParall = (files) => {
  files.filter(f => f !== 'truant-dll' && f.indexOf('.') !== 0).map(f => {
    let projectsBuildPath = path.join(envirnPath, f);
    let startTime = new Date().getTime();
    exec(commandBuild, { cwd: projectsBuildPath }).then(stdout => {
      console.log(`projects ${f} build successed within ${new Date().getTime() - startTime} ms`);
    }).catch(err => {
      console.error(`projects ${f} build failed caused by :`);
      console.error(err);
    });
  });
};

const buildProjects = async () => {
  if (forceBuild) {
    let files = fs.readdirSync(envirnPath);
    if (!await buildDLL()) {
      return;
    }
    runBuildParall(files);
  } else {
    let buildCommand = null;
    const { err, stdout } = await exec(commandDiff);
    if (err) {
      console.error(err);
      return;
    }
    const results = JSON.parse(stdout);
    if (results.some(rel => rel.name === 'truant-dll')) {
      if (!await buildDLL()) {
        return;
      }
    }
    runBuildParall(results.map(rel => rel.name));
  }
};

buildProjects();
