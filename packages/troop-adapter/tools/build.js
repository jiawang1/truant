const execSync = require('child_process').execSync;
const params = process.argv.slice(2);

const _env = params.indexOf('--production') >= 0 ? 'production' : 'development';

const env = {
  ...process.env,
  NODE_ENV: _env
};

const command = `rollup -c ${_env === 'development' ? ' --watch' : ''}`;
execSync(command, {
  env,
  stdio: 'inherit'
});
