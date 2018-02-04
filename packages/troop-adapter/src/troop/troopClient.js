import 'isomorphic-fetch';
import querystring from 'querystring';
import invariant from 'invariant';
import { troopQuery } from './simpleQuery';

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
  const _body = typeof body === 'string' ? body : querystring.stringify(body);
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

const query = (url, query, troopContext) => {
  return troopQuery(url, query, troopContext);
};

export const troopClient = {
  get,
  post,
  put,
  DELETE,
  query,
  postForm
};
