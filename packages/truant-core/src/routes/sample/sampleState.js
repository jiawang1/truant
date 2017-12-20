import { put, select, call, take } from 'truant-core';
import * as immutable from 'immutable';

export const SAMPLE_RANDOM = 'sample/random';
export const SAMPLE_INCREASE = 'sample/store_increase';
export const SAMPLE_DECREASE = 'sample/store_decrease';

export const PRODUCT_INFO_META = 'productInfo/PRODUCT_INFO_META';

const delayAction = (fn, ...args) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(fn.apply(null, args));
    }, 1000);
  });
};

const noop = () => { };

const getRandom = () => Math.floor(Math.random() * 1000);
const increase = () => 1;
const decrease = () => -1;

const selectNum = ({ sampleState }) => sampleState.get('num');

function* retrievePageMeta() {
  let data = yield service.retrievePageMeta();
  yield put({ type: PRODUCT_INFO_META, data });
}

function* searchProductInfo(ops) {
  let data = yield service.searchProductInfo(ops.data);
  yield put({ type: SEARCH_PRODUCT_INFO, data });
  if (ops.cb) {
    ops.cb(null, data);
  }
}

function* queryCategoryAttribute(ops) {
  let data = yield service.queryCategoryAttribute(ops.data);
  yield put({ type: GET_CATEGORY_ATTRIBUTE, attr: data });
}

function* queryCity(ops) {
  let data = yield service.queryCity(ops.data);
  yield put({ type: PRODUCT_INFO_QUERY_CITY, attr: data });
}

function* queryPointOfService(ops) {
  let data = yield service.queryPointOfService(ops.data);
  yield put({ type: PRODUCT_INFO_QUERY_POINTOFSERVICE, attr: data });
}

function* getProductDetail(ops) {
  let data = yield service.getProductDetail(ops.data);
  yield put({ type: UPDATE_PRODUCT_DETAIL_INFO, data });
  if (ops.cb) {
    ops.cb(null);
    return;
  }
}

function* retrieveProductDetailPriceList(option) {
  let productInfo = select(state => state.productInfo);
  if (productInfo && productInfo.priceData && productInfo.priceData.results) {
    if (
      option.currentPage === productInfo.priceData.pagination.currentPage &&
      option.pageSize === productInfo.priceData.pagination.pageSize &&
      option.productCodes[0] === productInfo.priceData.results[0].code
    ) {
      yield put({
        type: UPDATE_PRODUCT_DETAIL_PRICE,
        data: productInfo.priceData,
      });
      console.log(productInfo.priceData);
      if (option.cb) {
        option.cb(null, productInfo.priceData);
        return;
      }
    }
  }
  try {
    let _data = yield service.searchProductInfo(option.data);
    _data.pagination.currentPage = option.currentPage;
    _data.pagination.pageSize = option.pageSize;
    yield put({ type: UPDATE_PRODUCT_DETAIL_PRICE, data: _data.priceData });
    if (option.cb) {
      option.cb(null, _data.priceData);
      return;
    }
  } catch (err) { }
}

function* retrieveProductDetailPublishList(option) {
  let productInfo = select(state => state.productInfo);

  if (
    productInfo &&
    productInfo.publishData &&
    productInfo.publishData.results
  ) {
    if (
      option.currentPage === productInfo.publishData.pagination.currentPage &&
      option.pageSize === productInfo.publishData.pagination.pageSize &&
      option.productCodes[0] === productInfo.publishData.results[0].code
    ) {
      yield put({
        type: PRODUCT_INFO_SEARCH_PRODUCT_PUBLISH,
        data: productInfo.priceData,
      });
      if (option.cb) {
        option.cb(null);
        return;
      }
    }
  }

  let data = yield service.retrieveProductDetailPublishList(option.data);
  yield put({ type: PRODUCT_INFO_SEARCH_PRODUCT_PUBLISH, data });
  if (option.cb) {
    option.cb(null);
    return;
  }
}

function* getProductStockList(option) {
  try {
    let data = yield service.getProductStockList(option.data);
    yield put({ type: SAMPLE_RANDOM, data });
    if (option.cb) {
      option.cb(null);
      return;
    }
  } catch (err) {
    if (option.cb) {
      option.cb(null);
      return;
    }
  }
}

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
      const payload = yield delayAction(getRandom);
      yield put({ type: SAMPLE_RANDOM, payload });
    },
    *increase(action, res) {
      const num = yield select(selectNum);
      const change = yield delayAction(increase);
      yield put({ type: SAMPLE_INCREASE, payload: num + change });
      res && res('haha');
    },
    *decrease() {
      const num = yield select(selectNum);
      const change = yield delayAction(decrease);

      yield put({ type: SAMPLE_DECREASE, payload: num + change });
    },
    *calculate() {
      // call other saga synchronisely
      yield call(this.increase, { type: 'sample/increase' });
      // call other sagas async with promise returned
      const _promise = yield put({ type: 'sample/decrease' });
    },
  },

  topSaga: {
    *checkIncrease() {
      while (true) {
        const action = yield take("sample/increase");
        console.log(`got action ${action}`);
      }
    },
  },
  reducer: (state = initialState, action) => {
    switch (action.type) {
      case SAMPLE_RANDOM:
        return state.set('random', action.payload);

      case SAMPLE_INCREASE:
        console.log('increase value to ' + action.payload);
        return state.set('num', action.payload);

      case SAMPLE_DECREASE:
        console.log('decrease value to ' + action.payload);
        return state.set('num', action.payload);
      default:
        return state;
    }
  },
};
