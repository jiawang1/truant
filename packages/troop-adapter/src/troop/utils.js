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
['String', 'Object', 'Number', 'Undefined', 'Function', 'Array', 'Null'].forEach(_type => {
  oType[`is${_type}`] = __isType(_type);
});

export default oType;
