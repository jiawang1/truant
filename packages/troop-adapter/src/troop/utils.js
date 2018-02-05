const __isType = type => oTarget => Object.prototype.toString.call(oTarget).replace(/^.*\s(.*)]$/, '$1') === type;

/**
 * export functions:
 *  isString
 *  isObject
 *  isNumber
 *  isUndefined
 *  isFunction
 *  isArray
 *  isNull
 */
const oType = {};
['String', 'Object', 'Number', 'Undefined', 'Function', 'Array', 'Null', 'Boolean'].forEach(_type => {
  oType[`is${_type}`] = __isType(_type);
});

const stringifyPrimitive = v => {
  if (oType.isString(v)) {
    return v;
  } else if (oType.isBoolean(v)) {
    return v ? 'true' : 'false';
  } else if (oType.isNumber(v)) {
    return isFinite(v) ? v : '';
  } else {
    return '';
  }
};

oType.encode = (obj, sep, eq) => {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (oType.isObject(obj)) {
    return Object.keys(obj)
      .map(function(k) {
        let ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
        if (oType.isArray(obj[k])) {
          return obj[k]
            .map(function(v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            })
            .join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      })
      .join(sep);
  }

  return encodeURIComponent(stringifyPrimitive(obj));
};

oType.decode = (str, sep = '&', eq = '=', options) => {
  let obj = {};

  if (!oType.isString(str) || str.length === 0) {
    return obj;
  }

  const regexp = /\+/g;
  str = str.split(sep);

  const maxKeys = options && oType.isNumber(options.maxKeys) ? options.maxKeys : 1000;

  let len = str.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (let i = 0; i < len; ++i) {
    let x = str[i].replace(regexp, '%20'),
      idx = x.indexOf(eq),
      kstr,
      vstr,
      k,
      v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!obj.hasOwnProperty(k)) {
      obj[k] = v;
    } else if (oType.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

export default oType;
