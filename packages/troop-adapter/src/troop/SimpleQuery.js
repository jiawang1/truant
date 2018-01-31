import 'isomorphic-fetch';
import { parse2AST, ASTRewrite2Query } from './queryParser';

const __serialize = (node, constructor, oCache) => {
  /*jshint validthis:true, forin:false, curly:false, -W086*/
  let result;
  let id;
  let i;
  let iMax;
  let _constructor = constructor;
  // let generation;
  // let generations = me[GENERATIONS];
  let value;
  let deserializeIndex = oCache;

  // First add node to cache (or get the already cached instance)
  cache: {
    // Can't cache if there is no 'id'
    if (!('id' in node)) {
      result = node; // Reuse ref to node (avoids object creation)
      break cache;
    }
    // Get 'id'
    id = node.id;

    // In cache, get it!
    if (id in deserializeIndex) {
      result = deserializeIndex[id];

      // Bypass collapsed object that already exists in cache.
      if (node.collapsed) {
        return result;
      }
      break cache;
    }

    // Not in cache, add it!
    result = deserializeIndex[id] = node; // Reuse ref to node (avoids object creation)
  }

  // Check that this is an ARRAY
  if (_constructor === Array) {
    // Index all values
    for (i = 0, iMax = node.length; i < iMax; i++) {
      // Keep value
      value = node[i];

      // Get _constructor of value (safely, falling back to UNDEFINED)
      _constructor = value === null || value === undefined ? undefined : value.constructor;

      // Do magic comparison to see if we recursively put this in the cache, or plain put
      result[i] =
        _constructor === Object || (_constructor === Array && value.length !== 0)
          ? __serialize.call(null, value, _constructor, deserializeIndex)
          : value;
    }
  } else if (_constructor === Object) {
    // Index all properties
    Object.keys(node).forEach(key => {
      if (key === 'id' || (key === 'collapsed' && !result.collapsed)) {
        return;
      }
      // Keep value
      value = node[key];
      // Get _constructor of value (safely, falling back to UNDEFINED)
      _constructor = value === null || value === undefined ? undefined : value.constructor;
      result[key] =
        _constructor === Object || (_constructor === Array && value.length !== 0)
          ? __serialize.call(null, value, _constructor, deserializeIndex)
          : value;
    });
  }
  return result;
};

export const serialize = (node, oCache) => {
  if (!node) return node;
  return node.constructor === Object || (node.constructor === Array && node.length !== 0)
    ? __serialize(node, node.constructor, oCache)
    : node;
};

export const troopQuery2 = (url, ...queries) => {
  return new Promise((resolve, reject) => {
    const ids = [];

    const normalizeQuery = queries
      .reduce((list, query) => [...list, ...query.split('|')], [])
      .map((query, queryIndex) => {
        // Get AST
        const ast = parse2AST(query);
        // If we have an ID
        if (ast.length > 0) {
          // Store raw ID
          ids[queryIndex] = ast[0].raw;
        }
        return ASTRewrite2Query(ast);
      });

    const request = () => {
      const fetchOptions = Object.assign(
        {},
        {
          method: 'post',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        },
        {
          body: 'q=' + encodeURIComponent(normalizeQuery.join('|'))
        }
      );
      return fetch(url, fetchOptions);
    };

    const done = data => {
      // Add all new data to cache
      let oCache = {};
      data.json().then(json => {
        serialize(json, oCache);
        resolve(normalizeQuery.map((query, inx) => (ids[inx] ? oCache[ids[inx]] : query)));
      });
    };

    const fail = e => {
      //TODO
      reject(queries);
    };
    // Request and handle response
    request().then(done, fail);
  });
};

export const troopQuery = (url, ...queries) => {
  const ids = [];
  const normalizeQuery = queries
    .reduce((list, query) => [...list, ...query.split('|')], [])
    .map((query, queryIndex) => {
      const ast = parse2AST(query);
      if (ast.length > 0) {
        // Store raw ID list
        ids[queryIndex] = ast[0].raw;
      }
      return ASTRewrite2Query(ast);
    });

  const fetchOptions = Object.assign(
    {},
    {
      method: 'post',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    {
      body: 'q=' + encodeURIComponent(normalizeQuery.join('|'))
    }
  );

  return fetch(url, fetchOptions)
    .then(response => response.json())
    .then(json => {
      let oCache = {};
      serialize(json, oCache);
      return normalizeQuery.map((query, inx) => (ids[inx] ? oCache[ids[inx]] : query));
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
};
