
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
export const getType = obj =>
  Object.prototype.toString.call(obj).replace(/.*\s(.*)]$/, '$1');
