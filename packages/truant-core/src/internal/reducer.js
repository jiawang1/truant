import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

let originReducermap = {};

const composeReducer = (rootState) => {
  originReducermap = Object.keys(rootState)
    .filter(key => typeof rootState[key].reducer === 'function')
    .reduce((pre, cur) => {
      pre[cur] = rootState[cur].reducer;
      return pre;
    }, {});

  return combineReducers({
    ...originReducermap,
    routing: routerReducer,
  });
};

export const injectReducer = asyncReducers =>
  combineReducers({
    ...originReducermap,
    routing: routerReducer,
    ...asyncReducers,
  });
export default composeReducer;
