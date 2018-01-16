import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

let originReducermap = {};

const extractReducerFromState = state => Object.keys(state)
  .filter(key => typeof state[key].reducer === 'function')
  .reduce((pre, cur) => {
    pre[cur] = state[cur].reducer;
    return pre;
  }, {});

const composeReducer = rootState => {
  originReducermap = extractReducerFromState(rootState);
  return combineReducers({
    ...originReducermap,
    routing: routerReducer
  });
};

export const injectReducer = asyncReducers =>
  combineReducers({
    ...originReducermap,
    routing: routerReducer,
    ...asyncReducers
  });
export default composeReducer;
