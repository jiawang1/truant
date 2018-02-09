import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { configureStore } from '@school/truant-core';
import RootApp from './containers/Routes';
import rootState from './containers/rootState';
import { loadingMiddleware } from './common/loadingMiddleware';
import { getTroopConnector } from '@school/troop-adapter';

const startUp = () => {
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
};

const tryConnectTroop = async () => {
   await getTroopConnector();

  // connector.subscribe('load/results', function(result){
  //   console.log('conme to results')
  //   console.log(result)
  // });

  // connector.publish('load/results', {react:function(){ console.log("react true")  }}).then(data=>{
  //   console.log('conme to final')
  //   console.log(data);
  // });
  startUp();
};

tryConnectTroop();
