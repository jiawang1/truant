import { expect } from 'chai';
import { put } from 'redux-saga/effects';
import createSagaMiddleware from 'redux-saga';
import configureStore, {
  injectAsyncReducer,
  injectAsyncState
} from '../../src/internal/configStore';

describe('test configure store', () => {
  let store;
 // const sagaMiddle = createSagaMiddleware();

  // beforeEach(() => {
  //   store = createStore(() => { }, [sagaMiddle]);
  //   store.asyncReducers = {};
  // });
  it('test injectAsyncReducer', () => {
    const test = (state, action) => {
      if (action.type === 'test') {
        return {
          value: true
        };
      } else {
        return {};
      }
    };
    store = configureStore({});
    injectAsyncReducer('@@unitTest', test);
    expect(store.asyncReducers['@@unitTest']).to.equal(test);
    store.dispatch({ type: 'test' });
    expect(store.getState()['@@unitTest']).to.have.property('value');
  });

  it('test inject state', () => {
    const mockState = {
      managedSaga: {
        sagaNamespace: 'testSaga',
        *testManage() {
          yield put({ type: 'test1' });
        }
      },
      reducer: (state = {}, action) => {
        console.log(action);
        if (action.type === 'test1') {
          return {
            ...state,
            value: true
          };
        }
        return {};
      }
    };
    const mockInitState = {
      managedSaga: {
        sagaNamespace: 'mock',
        *testMock() {
          yield true;
        }
      },
      reducer: () => ({})
    };
    store = configureStore({ mockInitState });
    injectAsyncState({ mockState }, 'test');
    store.dispatch({ type: 'mock/testMock' });
    expect(store.getState()).has.property('mockInitState');
    store.dispatch({ type: 'testSaga/testManage' });
    expect(store.getState()).has.property('mockState');
    expect(store.getState().mockState.value).to.equal(true);
  });
});
