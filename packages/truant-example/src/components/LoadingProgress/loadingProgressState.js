import { put, take } from '@school/truant-core';

const LOADING_STATE = 'loading/state';
/**
 *  construct initial state. this should be immutable object
 */
const initialState = { shown: false };

export default {
  topSaga: {
    * takeState() {
      while (true) {
        const { shown } = yield take('loading/changeState');
        yield put({ type: LOADING_STATE, payload: shown });
      }
    }
  },
  reducer: (state = initialState, action) => {
    switch (action.type) {
    case LOADING_STATE:
      return {
        ...state,
        shown: action.payload
      };
    default:
      return state;
    }
  }
};
