import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { configureStore } from 'truant-core';
import RootApp from './containers/Routes';
import rootState from './containers/rootState';
import { loadingMiddleware } from './common/loadingMiddleware';

const store = configureStore(rootState, [loadingMiddleware()]);
const root = document.createElement('div');
root.className = 'app-root';
root.id = 'app-root';
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
    const RootContainer = require('./containers/Routes').default;
    render(
      <AppContainer>
        <RootContainer store={store} />
      </AppContainer>,
      root
    );
  });
}

