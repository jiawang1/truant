import { put, select, call, take } from 'truant-core';
import * as immutable from 'immutable';

const SAMPLE_RANDOM = 'sample/random';
const SAMPLE_INCREASE = 'sample/store_increase';
const SAMPLE_DECREASE = 'sample/store_decrease';

const delayAction = (fn, ...args) =>
  new Promise(res => {
    setTimeout(() => {
      res(fn.call(null, ...args));
    }, 1000);
  });

const getRandom = () => Math.floor(Math.random() * 1000);
const increase = () => 1;
const decrease = () => -1;

const selectNum = ({ sampleState }) => sampleState.get('num');

/**
 *  construct initial state. this should be immutable object
 */
const initialState = immutable.fromJS({ num: 0, random: 0 });

export default {
  /*
   *  action creator trigger managed saga will get a promise object
   */
  managedSaga: {
    sagaNamespace: 'sample',
    *getRandom() {
      const payload = yield call(delayAction, getRandom);
      yield put({ type: SAMPLE_RANDOM, payload });
    },
    *increase(action, resolve, reject) {
      const num = yield select(selectNum);
      const change = yield delayAction(increase);
      yield put({ type: SAMPLE_INCREASE, payload: num + change });
      resolve && resolve(`finish ${num + change}`);
    },
    *decrease() {
      const num = yield select(selectNum);
      const change = yield delayAction(decrease);
      yield put({ type: SAMPLE_DECREASE, payload: num + change });
    },
    *calculate() {
      // call other saga synchronisely
      yield call(this.increase, { type: 'sample/increase' });
      /** call other sagas async with promise returned, return this promise to saga middleware
       * will enable middleware to control the async transaction
       */
      return yield put({ type: 'sample/decrease' });
    }
  },

  topSaga: {
    *checkIncrease() {
      while (true) {
        const action = yield take('sample/increase');
        console.log(`got action ${action}`);
      }
    }
  },
  reducer: (state = initialState, action) => {
    switch (action.type) {
      case SAMPLE_RANDOM:
        return state.set('random', action.payload);
      case SAMPLE_INCREASE:
        return state.set('num', action.payload);

      case SAMPLE_DECREASE:
        return state.set('num', action.payload);
      default:
        return state;
    }
  }
};
