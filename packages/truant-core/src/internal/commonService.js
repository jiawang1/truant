import { getType } from './utils';
import 'isomorphic-fetch';

var rootContext = null;

(() => {
  if (window && window.document) {
    rootContext = document.getElementById("context-root").getAttribute('value');
  }
})();
/*
 *  generate absolute URL for backend service
 */
const correctURL = (ops) => {
  if (rootContext) {
    if (ops.url.charAt(0) === '.') {
      ops.url = ops.url.slice(1);
    } else if (ops.url.charAt(0) !== '/') {
      ops.url = '/' + ops.url;
    }
    ops.url = rootContext + ops.url;
  }

  if (ops.param) {
    var sParam = Object.keys(ops.param).reduce((pre, current) => {
      if (getType(ops.param[current]) === 'String' || getType(ops.param[current]) === 'Number') {
        return pre + (pre.length > 0 ? "&" : '') + current + '=' + encodeURIComponent(ops.param[current]);
      } else if (getType(ops.param[current]) === 'Array') {
        return pre + (pre.length > 0 ? "&" : '') + current + '=' + encodeURIComponent(ops.param[current].join(','));
      } else if (getType(ops.param[current]) === 'Undefined' || getType(ops.param[current]) === 'Null') {
        return pre;
      } else if (getType(ops.param[current]) === 'Date') {
        return pre + (pre.length > 0 ? "&" : '') + current + '=' + ops.param[current].getTime();
      } else {
        throw new Error(`param type ${getType(ops.param[current])} for query is not supported`);
      }
    }, '');

    if (sParam && sParam.length > 0) {
      ops.url = ops.url + "?" + sParam;
    }
  }
};

/**
 * Rejects a promise after `ms` number of milliseconds, if it is still pending
 */
// const timeout = (promise, ms) => {
//   return new Promise((resolve, reject) => {
//     const timer = setTimeout(() => reject(new Error('timeout')), ms);
//     promise.then(response => {
//       clearTimeout(timer);
//       resolve(response);
//     })
//       .catch(reject);
//   });
// };


const correctOption =  (option, method) => (
  {
    ...option,
    headers: {
      ...option.headers,
    },
    method: method
  }
);

/**
 * @param  {} option : request options.  { url: '', headers:{}, body:{}, param:{} ... }
 */
const __fetch = (_method) => async (option) => {
  let ops =  correctOption(option, _method);
  correctURL(ops);
  let response = await fetch(ops.url, ops);
  if (response.status >= 400) {
    var error = new Error(`response status : ${response.status}, Error is ${response.statusText}`);
    error.response = response;
    throw error;
  }
  return response;
};
/*
 *	 handle http GET request
 */
export const get = __fetch('GET');
/*
 *	 handle http POST request
 */
export const post = __fetch('POST');
/*
 *	handle http GET request in JSON format
 */
export const getJson = async (url, option = {}) => {
  let _option = { url, ...option };
  if (_option.headers) {
    _option.headers['Accept'] = 'application/json';
  } else {
    _option.headers = {
      'Accept': 'application/json',
    };
  }
  let response = await get(_option);
  return response.json();
};

/**
 * @param  {} url : requested URL
 * @param  {} body : request body for post
 * @param  {} option : http request options, { headers:{},.... }
 */
export const postJson = async (url, body, option = {}) => {
  let _option = { ...option, url, body: typeof body === 'string' ? body : JSON.stringify(body) };
  if (_option.headers) {
    _option.headers['Accept'] = 'application/json';
    _option.headers['Content-Type'] = 'application/json';
  } else {
    _option.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
  let response = await post(option);
  return response.json();
};


