

/*eslint-disable*/
const path = require('path');
const shell = require('shelljs');
const util = require('util');
const webpack = require('webpack');
const  exec = util.promisify(require('child_process').exec);
const commandDiff = 'lerna updated --json';
const logger = (...text) => { console.log('\x1b[36m', ...text, '\x1b[0m'); };
let envirnPath = path.join(__dirname, '../packages');
let commandBuild = 'npm run dist';
/*eslint-enable*/

const params = process.argv.slice(2);
const forceBuild = params.indexOf('--force') >= 0;
console.log(process.pid);

const buildProjects = async ()=> {
  if (forceBuild) {

  } else {
    let buildCommand = null;
    const { err, stdout } = await exec(commandDiff);
    if(err){
      console.error(err);
      return;
    }
    const results = JSON.parse(stdout);
    if (results.some(rel => rel.name === 'truant-dll')) {
      let dllBuildPath = path.join(envirnPath, 'truant-dll');
      const { err, stdout } = await exec(commandBuild, { cwd: dllBuildPath});
      console.log(stdout);
      console.log(`build done ${new Date().getTime()}`);

      results.filter(rel=>rel.name !== 'truant-dll').map(rel=>{
        let buildPath = path.join(envirnPath, rel.name);
        exec(commandBuild, { cwd: buildPath}).then(stdout=>{
          console.log(new Date().getTime());
          console.log(stdout);
        }).catch(err=>{
          console.log(err);
        });

      });

    } else {

    }



  }
};

buildProjects();
