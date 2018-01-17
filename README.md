# truant

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)


truant is a javascript framework for building scalable web applications base on React, redux, redux-saga and some other libraries. This repository is a monorepo that managed by [Lerna](https://github.com/lerna/lerna).

### Quick Start
1. You can get source code from git or just down load code. 
2. install lerna globaly
````shell
 npm install -g lerna
````
3. navigate to root folder and run following command to initialize projects
````shell
 npm run init
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

### current packages

1. [truant-dll](https://github.com/jiawang1/truant/blob/master/packages/truant-dll/README.md): all open source libraries shared by other packages in the repo. This package will be built as webpack DLL. 
2. [truant-core](https://github.com/jiawang1/truant/blob/master/packages/truant-core/README.md): provide some functions like code spliting, error handling, manage the global state.
3. [truant-example](https://github.com/jiawang1/truant/blob/master/packages/truant-example/README.md): an example page show how to use functions from truant-core.
