
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


export const getDisplayName = WrappedComponent => {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};


const COLOR = [
  { key: 'yellow', color: '\x1b[33m' },
  { key: 'blue', color: '\x1b[34m' },
  { key: 'magenta', color: '\x1b[35m' },
  { key: 'cyan', color: '\x1b[36m' },
  { key: 'white', color: '\x1b[37m' },
  { key: 'green', color: '\x1b[32m' },
  { key: 'red', color: '\x1b[31m' }
];

function log(...text) { console.log(...text, '\x1b[0m'); }

export const logger = COLOR.reduce((obj, color) => ({
  ...obj,
  [color.key]: (...text) => { log.call(obj, color.color, ...text); }
}), {});
