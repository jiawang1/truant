[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)


truant is a javascript framework for building scalable web applications base on React, redux, redux-saga and some other libraries. This repository is a monorepo that we manage using [Lerna](https://github.com/lerna/lerna).

### Quick Start
1. You can get source code from git or just down load code. 
2. install lerna globaly
````shell
 npm install -g lerna
````
3. navigate to root folder and run following command to initialize projects
````shell
 lerna bootstrap --hoist
````
4. when the installation finished, go to folder truant/packages/truant-example/ and startup example project
````shell
 npm start
````
5. open address http://localhost:8012/school/_admin/#/sample in browser, you will see the example page.

### build projects

navigate to root folder and run command
````shell
 npm run dist
````
this command will build all packages and put generated stuff in dist folder

