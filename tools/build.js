/*eslint-disable*/
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const util = require('util');
const webpack = require('webpack');
const exec = require('child_process').exec;
const execPromise = util.promisify(exec);
const commandDiff = 'lerna updated --json';
let envirnPath = path.join(__dirname, '../packages');
let commandBuild = 'npm run dist';
/*eslint-enable*/

const params = process.argv.slice(2);
const forceBuild = params.indexOf('--force') >= 0;

const buildDLL = async () => {
  let dllprojectsBuildPath = path.join(envirnPath, 'truant-dll');
  const { err, stdout } = await execPromise(commandBuild, { cwd: dllprojectsBuildPath });
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
  files.filter(f => f.indexOf('truant-dll') < 0 && f.indexOf('.') !== 0).map(f => {
    let projectsBuildPath = path.join(envirnPath, f);
    let startTime = new Date().getTime();
    const child = exec(commandBuild, { cwd: projectsBuildPath });

    return new Promise((res, rej) => {
      child.stdout.on('data', data => {
        console.log(`${f} : ${data}`);
      });
      child.stderr.on('data', data => {
        console.error(`${f} :  error ${data}`);
      });
      child.on('error', error => {
        console.error(`build project ${f} failed`);
        console.error(error);
        rej(error);
      });
      child.on('exit', code => {
        res();
      })
    });
  });
};

/**
 * this function used to build all projects managed in current repo
 * @param  boolean force: if true, will re-builde all projects, else, only build projects
 *  changed
 */
const buildProjects = async force => {
  if (force) {
    let files = fs.readdirSync(envirnPath);
    if (!await buildDLL()) {
      return;
    }
    runBuildParall(files);
  } else {
    let buildCommand = null;
    const { err, stdout } = await execPromise(commandDiff);
    if (err) {
      console.error(err);
      return;
    }
    const projects = JSON.parse(stdout).map(project=>project.name);
    let files;
    if (projects.some(project => project.indexOf('truant-dll') >= 0)) {
      if (!await buildDLL()) {
        return;
      }
      files = fs.readdirSync(envirnPath);
    }
    // if DLL changed, all projects should be re-build
    runBuildParall(files || projects);
  }
};

buildProjects(forceBuild);
