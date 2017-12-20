import {
  take,
  put,
  call,
  fork,
  race,
  cancelled,
  takeEvery,
} from 'redux-saga/effects';
import { ADD_GLOBAL_ERROR } from './commonErrorState.js';

const PROMISE_META = '@@meta';
let aNamespace = [],
  aPattern = [];

const generateTopSagaMap = _state => {
  return Object.keys(_state)
    .filter(key => typeof _state[key].topSaga !== 'undefined')
    .reduce((pre, cur) => {
      let _saga = _state[cur].topSaga;
      Object.keys(_saga).forEach(sKey => {
        const _func = function* (...args) {
          yield fork([_state[cur], _saga[sKey]], ...args);
        };
        pre.push(_func);
      });
      return pre;
    }, []);
};

const exec = (saga, context) => {
  return function* (...args) {
    if (args[0][PROMISE_META]) {
      const { res, rej } = args[0][PROMISE_META];
      try {
        const { [PROMISE_META]: x, ...action } = args[0];
        let __arg = args.slice();
        __arg.splice(0, 1, action);
        yield call([context, saga], ...__arg, res, rej);
        res();
      } catch (error) {
        if (args[0] && args[0].cb) {
          args[0].cb(error);
        }
        rej(error);
        //TODO handle error
        throw error;
      }
    } else {
      yield call([context, saga], ...args);
    }
  };
}

const generateManagedSagaMap = _state => {
  return Object.keys(_state)
    .filter(key => _state[key].managedSaga)
    .reduce((pre, key) => {
      let namespace = _state[key].managedSaga.sagaNamespace;
      if (!namespace) {
        console.error(`sagaNamespace for ${key} managedSaga is missed`);
        throw new Error(`sagaNamespace for ${key} managedSaga is missed`);
      }
      if (aNamespace.indexOf(namespace) >= 0) {
        console.error(`duplicated namespace for ${namespace}`);
        throw new Error(`duplicated namespace for ${namespace}`);
      } else {
        aNamespace.push(namespace);
      }
      Object.keys(_state[key].managedSaga)
        .filter(_key => _key !== namespace)
        .map(_key => {
          pre.push(function* () {
            const pattern = `${namespace}/${_key}`;
            aPattern.push(pattern);
            yield takeEvery(
              pattern,
              exec(_state[key].managedSaga[_key], _state[key].managedSaga),
            );
          });
        });
      return pre;
    }, []);
};

/**
 * @param  {} state : root state for entire application
 */
export const generateSagaMap = state => {
  return [
    ...generateManagedSagaMap(state),
    ...generateTopSagaMap(state)
  ];
};

/**
 *  redux middleware used to generate a promise for top level saga, this
 *  promise return to View layer
 */
export const sagaEnhancer = () => ({ dispatch, getState }) => next => action => {
  // make sure only one saga monitor the action so we can provide one promise for this saga
  if (action && aPattern.filter(_pattern => _pattern === action.type).length === 1) {
    return new Promise((res, rej) => {
      return next({
        ...action,
        [PROMISE_META]: { res, rej },
      });
    });
  } else {
    return next(action);
  }
};
