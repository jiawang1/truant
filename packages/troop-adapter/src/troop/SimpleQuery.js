import 'isomorphic-fetch';
import querystring, { parse, stringify } from 'querystring';
import { parse2AST, ASTRewrite2Query } from './queryParser';
import { isObject, isArray } from './utils';

const __serialize = (node, oCache) => {
  let id;
  let value;
  const deserializeCache = oCache;
  let result = node;

  if ('id' in node) {
    id = node.id;
    if (Object.prototype.hasOwnProperty.call(deserializeCache, id)) {
      result = deserializeCache[id];
      if (node.collapsed) {
        return result; // Bypass collapsed object that already exists in cache.
      }
    } else {
      deserializeCache[id] = node; // Reuse ref to node (avoids object creation)
    }
  }

  if (isArray(node)) {
    for (let i = 0, iMax = node.length; i < iMax; i++) {
      value = node[i];
      result[i] = isObject(value) || (isArray(value) && value.length !== 0) ? __serialize(value, deserializeCache) : value;
    }
  } else if (isObject(node)) {
    Object.keys(node).forEach(key => {
      if (key === 'id' || (key === 'collapsed' && !result.collapsed)) {
        return;
      }
      value = node[key];
      result[key] = isObject(value) || (isArray(value) && value.length !== 0) ? __serialize(value, deserializeCache) : value;
    });
  }
  return result;
};

export const serialize = jsonNode => {
  if (!jsonNode) return jsonNode;
  let oCache = {};
  if (isObject(jsonNode) || (isArray(jsonNode) && jsonNode.length !== 0)) {
    __serialize(jsonNode, oCache);
  } else {
    oCache = jsonNode;
  }
  return oCache;
};

const __prepareHTTPOption = normalizeQuery =>
  Object.assign(
    {},
    {
      method: 'post',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    {
      body: normalizeQuery.length > 0 ? 'q=' + encodeURIComponent(normalizeQuery.join('|')) : ''
    }
  );

export const __prepareContextURL = (url, troopContext) => {
  if (!troopContext) return url;
  const [_url, queryStr] = url.split('?');
  const queryParam = queryStr ? querystring.parse(queryStr) : {};
  const { c: extraContext = '', ...otherParam } = queryParam;
  const contextValues = troopContext.values;
  const contextParams = Object.keys(contextValues).reduce(
    (params, key) =>
      Object.assign(params, {
        [key]: contextValues[key].value
      }),
    {}
  );
  const queryObject = { ...otherParam, c: querystring.stringify({ ...querystring.parse(extraContext), ...contextParams }, '|') };
  return `${_url}?${querystring.stringify(queryObject)}`;
};

export const troopQuery = (url, jointQuery, troopContext) => {
  const ids = [];
  const normalizeQuery = jointQuery.split('|').map((query, queryIndex) => {
    const ast = parse2AST(query);
    if (ast.length > 0) {
      // Store raw ID list used to figure out final response
      ids[queryIndex] = ast[0].raw;
    }
    return ASTRewrite2Query(ast);
  });
  const fetchOptions = __prepareHTTPOption(normalizeQuery);
  const __url = __prepareContextURL(url, troopContext);

  return fetch(__url, fetchOptions)
    .then(response => response.json())
    .then(json => {
      const serialObject = serialize(json);
      return ids.map(id => serialObject[id]);
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
};
