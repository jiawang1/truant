import { put } from 'truant-core';

/**
 *  construct initial state. this should be immutable object
 */
const initialState = {
  num: 0
};

export default {
  managedSaga: {
    sagaNamespace: 'course',
    * getRandom() {
      yield put({ type: 'dd', payload: {} });
    }
  },
  topSaga: {},
  reducer: (state = initialState, action) => {
    switch (action.type) {
    case '':
      return {
        ...state,
        random: action.payload
      };

    default:
      return state;
    }
  }
};
