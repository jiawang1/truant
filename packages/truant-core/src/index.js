import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import configStore from './internal/configStore';
import { RootApp } from './containers/Routes';
import rootState from './containers/rootState';

const store = configStore(rootState);
const root = document.createElement('div');
root.className = 'app-root';
document.body.appendChild(root);

render(
  <AppContainer>
    <RootApp store={store} />
  </AppContainer>,
  root
);

if (module.hot) {
  module.hot.accept('./containers/Routes', () => {
    /*
       * must load the entry module here, therwise hot replaod can
       * not work
       * */
    const RootContainer = require('./containers/Routes').RootApp;
    render(
      <AppContainer>
        <RootContainer store={store} />
      </AppContainer>,
      root
    );
  });
}

// if (module.hot) {
//   module.hot.accept('./containers/App.js', () => {
//     const RootContainer = require('./containers/App').RootApp;
//     render(
//       <AppContainer>
//         <RootContainer store={store} history={history} />
//       </AppContainer>,
//       root,
//     );
//   });
// }
