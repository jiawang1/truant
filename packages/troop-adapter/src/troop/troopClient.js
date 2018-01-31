import 'isomorphic-fetch';
import invariant from 'invariant';
import { QueryService, Cache } from '@school/troopjs-query';
import { troopQuery } from './SimpleQuery';

const mimeType = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  text: 'text/plain',
  all: '*/*'
};

const method = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  DELETE: 'DELETE'
};

/**
 * return type for target obj, possible value are:
 * null         => Null
 * undefined    => Undefined
 * Object       => Object
 * number       => Number
 * array        => Array
 * string       => String
 *
 * @param {*} obj
 */
export const getType = obj => Object.prototype.toString.call(obj).replace(/.*\s(.*)]$/, '$1');

const serialize = payload => {
  return Object.keys(payload).reduce((pre, current) => {
    if (
      getType(payload[current]) === 'String' ||
      getType(payload[current]) === 'Number' ||
      getType(payload[current]) === 'Boolean'
    ) {
      return (
        pre + (pre.length > 0 ? '&' : '') + current + '=' + encodeURIComponent(payload[current])
      );
    } else if (getType(payload[current]) === 'Array') {
      return (
        pre +
        (pre.length > 0 ? '&' : '') +
        current +
        '=' +
        encodeURIComponent(payload[current].join(','))
      );
    } else if (getType(payload[current]) === 'Undefined' || getType(payload[current]) === 'Null') {
      return pre;
    } else if (getType(payload[current]) === 'Date') {
      return pre + (pre.length > 0 ? '&' : '') + current + '=' + payload[current].getTime();
    } else {
      throw new Error(`payload type ${getType(payload[current])} for query is not supported`);
    }
  }, '');
};

const __fetch = _method => async (url, option, payload) => {
  invariant(url !== undefined, 'URL must be supplied');
  invariant(option !== undefined, 'HTTP request options must be supplied, ');
  let __url = url;
  let ops = Object.assign(
    {},
    {
      credentials: 'same-origin'
    },
    option,
    { method: _method }
  );

  if (typeof payload !== 'undefined') {
    ops.body = payload;
  }
  try {
    return await fetch(__url, ops);
  } catch (err) {
    console.error(err.stack || err);
    throw err;
  }
};

const get = __fetch(method.get);
const post = __fetch(method.post);
const put = __fetch(method.put);
const DELETE = __fetch(method.DELETE);

/**
 * @param  {} url : requested URL
 * @param  {} body : request body for post
 * @param  {} option : http request options, { headers:{},.... }
 */
const postForm = async (url, body, option = {}) => {
  invariant(url !== undefined, 'URL must be supplied');
  invariant(body !== undefined, 'HTTP request payload mest be supplied');
  const _body = typeof body === 'string' ? body : serialize(body);
  let _option = option;
  if (_option.headers) {
    _option.headers['Content-Type'] = mimeType.form;
    _option.headers['Accept'] = mimeType.all;
  } else {
    _option.headers = {
      'Content-Type': mimeType.form,
      Accept: mimeType.all
    };
  }
  let response = await post(url, _option, _body);
  return response.text();
};

const query = async (url, query) => {
  return troopQuery(url, query);
};

export const troopClient = {
  get,
  post,
  put,
  DELETE,
  query,
  postForm
};
