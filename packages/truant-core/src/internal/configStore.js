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
/**
 * @param  {} rootState: root level state. The state is not redux state, but object should contain saga and reducer
 * @param  {} additionMiddles=[]: redux middlewares
 */
export default function configureStore(rootState, additionMiddles = []) {
  const store = createStore(
    composeReducer(rootState),
    // TODO support initial state
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
/**
 * @param  {} store: redux sore
 * @param  {} name: name of the property in store which preduced by this reducer
 * @param  {} asyncReducer: async reducer injected to store
 */
export const injectAsyncReducer = (store, name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer;
  store.replaceReducer(injectReducer(store.asyncReducers));
};

export const injectAsyncSaga = (...sagas) => {
  sagas.forEach(saga => sagaMiddle.run(saga));
};
/**
 * @param  {} store: redux store
 * @param  {} state: state include sagas and reducers injected to store
 */
export const injectAsyncState = (store, state) => {
  injectAsyncSaga(...generateSagaMap(state));
  Object.keys(state)
    .filter(key => typeof state[key].reducer === 'function')
    .forEach(key => {
      injectAsyncReducer(store, key, state[key].reducer);
    });
};
