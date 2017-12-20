import { put, takeEvery, select, call } from 'redux-saga/effects';

/**
 *  construct initial state. this should be immutable object
 */
const initialState = {
  url: null,
};

export default {
  managedSaga: {
    sagaNamespace: 'unit',
    * getRandom() {
      yield put({ type: 'dd', payload: {} });
    },
  },

  topSaga: {},
  reducer: (state = initialState, action) => {
    switch (action.type) {
      case '':
        return {
          ...state,
          random: action.payload,
        };

      default:
        return state;
    }
  }
};
