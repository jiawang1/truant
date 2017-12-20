import { createStore, applyMiddleware, compose } from 'redux';
import composeReducer, { injectReducer } from './reducer';
import createSagaMiddleware from 'redux-saga';
import { generateSagaMap, sagaEnhancer } from './sagaManager';

const sagaMiddle = createSagaMiddleware();

const middlewares = [sagaEnhancer(), sagaMiddle];

if (process.env.NODE_ENV !== 'production') {
  const logger = require('redux-logger').default;
  middlewares.push(logger);
}

export default function configureStore(rootState, additionMiddles = []) {
  const store = createStore(
    composeReducer(rootState),
    // TODO support initial state?
    compose(
      applyMiddleware(...middlewares, ...additionMiddles),
      typeof window !== 'undefined' && window.devToolsExtension
        ? window.devToolsExtension()
        : f => f
    )
  );
  generateSagaMap(rootState).map(saga => sagaMiddle.run(saga));
  store.asyncReducers = {};
  return store;
}

export const injectAsyncReducer = (store, name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer;
  store.replaceReducer(injectReducer(store.asyncReducers));
};

export const injectAsyncSaga = (...sagas) => {
  sagas.forEach(saga => sagaMiddle.runSaga(saga));
};

export const injectAsyncState = (store, state, name) => {
  injectAsyncSaga(...generateSagaMap(state));
  injectAsyncReducer(store, name, state.reducer);
};
