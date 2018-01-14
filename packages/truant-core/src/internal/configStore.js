import { createStore, applyMiddleware, compose } from 'redux';
import invariant from 'invariant';
import composeReducer, { injectReducer } from './reducer';
import createSagaMiddleware from 'redux-saga';
import { generateSagaMap, sagaEnhancer } from './sagaManager';

const sagaMiddle = createSagaMiddleware();
const middlewares = [sagaEnhancer(), sagaMiddle];
let store = null;

if (process.env.NODE_ENV !== 'production') {
  const logger = require('redux-logger').default;
  middlewares.push(logger);
}
/**
 * @param  {} rootState: root level state. The state is not redux state, but object should contain saga and reducer
 * @param  {} additionMiddles=[]: redux middlewares
 */
export default function configureStore(rootState, additionalMiddles = []) {
  store = createStore(
    composeReducer(rootState),
    // TODO support initial state
    compose(
      applyMiddleware(...additionalMiddles, ...middlewares),
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
 * @param  {} name: name of the property in store which preduced by this reducer
 * @param  {} asyncReducer: async reducer injected to store
 */
export const injectAsyncReducer = (name, asyncReducer) => {
  invariant(store !== null, 'sore must be initalize before, please call configureStore firstly');
  store.asyncReducers[name] = asyncReducer;
  store.replaceReducer(injectReducer(store.asyncReducers));
};

export const injectAsyncSaga = (...sagas) => {
  sagas.forEach(saga => sagaMiddle.run(saga));
};
/**
 * @param  {} state: state include sagas and reducers injected to store
 */
export const injectAsyncState = state => {
  invariant(store !== null, 'sore must be initalize before, please call configureStore firstly');
  injectAsyncSaga(...generateSagaMap(state));
  Object.keys(state)
    .filter(key => typeof state[key].reducer === 'function')
    .forEach(key => {
      injectAsyncReducer(key, state[key].reducer);
    });
};
