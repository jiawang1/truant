/** @license MIT License (c) copyright 2013 original authors */
/**
 * poly common functions
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/lib/_base',['require','exports','module'],function (require, exports) {

	var toString;

	toString = ({}).toString;

	exports.isFunction = function (o) {
		return typeof o == 'function';
	};

	exports.isString = function (o) {
		return toString.call(o) == '[object String]';
	};

	exports.isArray = function (o) {
		return toString.call(o) == '[object Array]';
	};

	exports.toString = function (o) {
		return toString.apply(o);
	};

	exports.createCaster = function (caster, name) {
		return function cast (o) {
			if (o == null) throw new TypeError(name + ' method called on null or undefined');
			return caster(o);
		}
	};

	exports.isElement = function(o){
		return typeof HTMLElement == 'undefined'
			? 'tagName' in o && 'nodeName' in o
			: o instanceof HTMLELEMENT;
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { factory(require, exports); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * Object polyfill / shims
 *
 * @author Brian Cavalier
 * @author John Hann
 */
/**
 * The goal of these shims is to emulate a JavaScript 1.8.5+ environments as
 * much as possible.  While it's not feasible to fully shim Object,
 * we can try to maximize code compatibility with older js engines.
 *
 * Note: these shims cannot fix `for (var p in obj) {}`. Instead, use this:
 *     Object.keys(obj).forEach(function (p) {}); // shimmed Array
 *
 * Also, these shims can't prevent writing to object properties.
 *
 * If you want your code to fail loudly if a shim can't mimic ES5 closely
 * then set the AMD loader config option `failIfShimmed`.  Possible values
 * for `failIfShimmed` include:
 *
 * true: fail on every shimmed Object function
 * false: fail never
 * function: fail for shims whose name returns true from function (name) {}
 *
 * By default, no shims fail.
 *
 * The following functions are safely shimmed:
 * create (unless the second parameter is specified since that calls defineProperties)
 * keys
 * getOwnPropertyNames
 * getPrototypeOf
 * isExtensible
 *
 * In order to play nicely with several third-party libs (including Promises/A
 * implementations), the following functions don't fail by default even though
 * they can't be correctly shimmed:
 * freeze
 * seal
 * isFrozen
 * isSealed
 *
 * The poly/strict module will set failIfShimmed to fail for some shims.
 * See the documentation for more information.
 *
 * IE missing enum properties fixes copied from kangax:
 * https://github.com/kangax/protolicious/blob/master/experimental/object.for_in.js
 *
 * TODO: fix Object#propertyIsEnumerable for IE's non-enumerable props to match Object.keys()
 */
(function (define) {
define('poly/object',['require','./lib/_base'],function (require) {


	var base = require('./lib/_base');

	var refObj,
		refProto,
		has__proto__,
		hasNonEnumerableProps,
		getPrototypeOf,
		keys,
		featureMap,
		shims,
		secrets,
		protoSecretProp,
		hasOwnProp = 'hasOwnProperty',
		doc = typeof document != 'undefined' && document,
		testEl = doc && doc.createElement('p'),
		undef;

	refObj = Object;
	refProto = refObj.prototype;

	has__proto__ = typeof {}.__proto__ == 'object';

	hasNonEnumerableProps = (function () {
		for (var p in { valueOf: 1 }) return false;
		return true;
	}());

	// TODO: this still doesn't work for IE6-8 since object.constructor && object.constructor.prototype are clobbered/replaced when using `new` on a constructor that has a prototype. srsly.
	// devs will have to do the following if they want this to work in IE6-8:
	// Ctor.prototype.constructor = Ctor
	getPrototypeOf = has__proto__
		? function (object) { assertIsObject(object); return object.__proto__; }
		: function (object) {
			assertIsObject(object);
			// return null according to the investigation result at:
			// https://github.com/cujojs/poly/pull/21
			if (object == refProto) {
				return null;
			}
			return protoSecretProp && object[protoSecretProp](secrets)
				? object[protoSecretProp](secrets.proto)
				: object.constructor ? object.constructor.prototype : refProto;
		};

	keys = !hasNonEnumerableProps
		? _keys
		: (function (masked) {
			return function (object) {
				var result = _keys(object), i = 0, m;
				while (m = masked[i++]) {
					if (hasProp(object, m)) result.push(m);
				}
				return result;
			}
		}([ 'constructor', hasOwnProp, 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf' ]));

	featureMap = {
		'object-create': 'create',
		'object-freeze': 'freeze',
		'object-isfrozen': 'isFrozen',
		'object-seal': 'seal',
		'object-issealed': 'isSealed',
		'object-getprototypeof': 'getPrototypeOf',
		'object-keys': 'keys',
		'object-getownpropertynames': 'getOwnPropertyNames',
		'object-isextensible': 'isExtensible',
		'object-preventextensions': 'preventExtensions',
		'object-defineproperty-obj': function () {
			return hasDefineProperty({});
		},
		'object-defineproperty-dom': function () {
			return doc && hasDefineProperty(testEl);
		},
		'object-defineproperties-obj': function () {
			return hasDefineProperties({});
		},
		'object-defineproperties-dom': function () {
			return doc && hasDefineProperties(testEl);
		},
		'object-getownpropertydescriptor-obj': function () {
			return hasGetOwnPropertyDescriptor({});
		},
		'object-getownpropertydescriptor-dom': function () {
			return doc && hasGetOwnPropertyDescriptor(testEl);
		}
	};

	shims = {};

	secrets = {
		proto: {}
	};

	protoSecretProp = !has('object-getprototypeof') && !has__proto__ && hasNonEnumerableProps && hasOwnProp;

	// we might create an owned property to hold the secrets, but make it look
	// like it's not an owned property.  (affects getOwnPropertyNames, too)
	if (protoSecretProp) (function (_hop) {
		refProto[hasOwnProp] = function (name) {
			if (name == protoSecretProp) return false;
			return _hop.call(this, name);
		};
	}(refProto[hasOwnProp]));

	if (!has('object-create')) {
		Object.create = shims.create = create;
	}

	if (!has('object-freeze')) {
		Object.freeze = shims.freeze = noop;
	}

	if (!has('object-isfrozen')) {
		Object.isFrozen = shims.isFrozen = nope;
	}

	if (!has('object-seal')) {
		Object.seal = shims.seal = noop;
	}

	if (!has('object-issealed')) {
		Object.isSealed = shims.isSealed = nope;
	}

	if (!has('object-getprototypeof')) {
		Object.getPrototypeOf = shims.getPrototypeOf = getPrototypeOf;
	}

	if (!has('object-keys')) {
		Object.keys = keys;
	}

	if (!has('object-getownpropertynames')) {
		Object.getOwnPropertyNames = shims.getOwnPropertyNames
			= getOwnPropertyNames;
	}

	if (!has('object-defineproperties-obj')) {
		// check if dom has it (IE8)
		Object.defineProperties = shims.defineProperties
			= has('object-defineproperties-dom')
				? useNativeForDom(Object.defineProperties, defineProperties)
				: defineProperties;
	}

	if (!has('object-defineproperty-obj')) {
		// check if dom has it (IE8)
		Object.defineProperty = shims.defineProperty
			= has('object-defineproperty-dom')
				? useNativeForDom(Object.defineProperty, defineProperty)
				: defineProperty;
	}

	if (!has('object-isextensible')) {
		Object.isExtensible = shims.isExtensible = isExtensible;
	}

	if (!has('object-preventextensions')) {
		Object.preventExtensions = shims.preventExtensions = preventExtensions;
	}

	if (!has('object-getownpropertydescriptor-obj')) {
		// check if dom has it (IE8)
		Object.getOwnPropertyDescriptor = shims.getOwnPropertyDescriptor
			= has('object-getownpropertydescriptor-dom')
				? useNativeForDom(Object.getOwnPropertyDescriptor, getOwnPropertyDescriptor)
				: getOwnPropertyDescriptor;
	}

	function hasDefineProperty (object) {
		if (('defineProperty' in Object)) {
			try {
				// test it
				Object.defineProperty(object, 'sentinel1', { value: 1 })
				return 'sentinel1' in object;
			}
			catch (ex) { /* squelch */ }
		}
	}

	// Note: MSDN docs say that IE8 has this function, but tests show
	// that it does not! JMH
	function hasDefineProperties (object) {
		if (('defineProperties' in Object)) {
			try {
				// test it
				Object.defineProperties(object, { 'sentinel2': { value: 1 } })
				return 'sentinel2' in object;
			}
			catch (ex) { /* squelch */ }
		}
	}

	function hasGetOwnPropertyDescriptor (object) {
		if (('getOwnPropertyDescriptor' in Object)) {
			object['sentinel3'] = true;
			try {
				return (Object.getOwnPropertyDescriptor(object, 'sentinel3').value);
			}
			catch (ex) { /* squelch */ }
		}
	}

	function PolyBase () {}

	// for better compression
	function hasProp (object, name) {
		return object.hasOwnProperty(name);
	}

	function _keys (object) {
		var result = [];
		for (var p in object) {
			if (hasProp(object, p)) {
				result.push(p);
			}
		}
		return result;
	}

	function create (proto, props) {
		var obj;

		if (typeof proto != 'object') throw new TypeError('prototype is not of type Object or Null.');

		PolyBase.prototype = proto;
		obj = new PolyBase();
		PolyBase.prototype = null;

		// provide a mechanism for retrieving the prototype in IE 6-8
		if (protoSecretProp) {
			var orig = obj[protoSecretProp];
			obj[protoSecretProp] = function (name) {
				if (name == secrets) return true; // yes, we're using secrets
				if (name == secrets.proto) return proto;
				return orig.call(this, name);
			};
		}

		if (arguments.length > 1) {
			// defineProperties could throw depending on `failIfShimmed`
			Object.defineProperties(obj, props);
		}

		return obj;
	}

	function defineProperties (object, descriptors) {
		var names, name;
		names = keys(descriptors);
		while ((name = names.pop())) {
			Object.defineProperty(object, name, descriptors[name]);
		}
		return object;
	}

	function defineProperty (object, name, descriptor) {
		object[name] = descriptor && descriptor.value;
		return object;
	}

	function getOwnPropertyDescriptor (object, name) {
		return hasProp(object, name)
			? {
				value: object[name],
				enumerable: true,
				configurable: true,
				writable: true
			}
			: undef;
	}

	function getOwnPropertyNames (object) {
		return keys(object);
	}

	function isExtensible (object) {
		var prop = '_poly_';
		try {
			// create unique property name
			while (prop in object) prop += '_';
			// try to set it
			object[prop] = 1;
			return hasProp(object, prop);
		}
		catch (ex) { return false; }
		finally {
			try { delete object[prop]; } catch (ex) { /* squelch */ }
		}
	}

	function preventExtensions (object) {
		return object;
	}

	function useNativeForDom (orig, shim) {
		return function (obj) {
			if (base.isElement(obj)) return orig.apply(this, arguments);
			else return shim.apply(this, arguments);
		};
	}

	function failIfShimmed (failTest) {
		var shouldThrow;

		if (typeof failTest == 'function') {
			shouldThrow = failTest;
		}
		else {
			// assume truthy/falsey
			shouldThrow = function () { return failTest; };
		}

		// create throwers for some features
		for (var feature in shims) {
			Object[feature] = shouldThrow(feature)
				? createFlameThrower(feature)
				: shims[feature];
		}
	}

	function assertIsObject (o) {
		if (typeof o != 'object') {
			throw new TypeError('Object.getPrototypeOf called on non-object');
		}
	}

	function createFlameThrower (feature) {
		return function () {
			throw new Error('poly/object: ' + feature + ' is not safely supported.');
		}
	}

	function has (feature) {
		var ret;
		var prop = featureMap[feature];

		if (base.isFunction(prop)) {
			// cache return value, ensure boolean
			ret = featureMap[feature] = !!prop(refObj);
		}
		else if (base.isString(prop)) {
			ret = featureMap[feature] = prop in refObj;
		}
		else {
			// return cached evaluate result
			ret = prop;
		}

		return ret;
	}

	function noop (it) { return it; }

	function nope (it) { return false; }

	return {
		failIfShimmed: failIfShimmed
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * String polyfill / shims
 *
 * @author Brian Cavalier
 * @author John Hann
 *
 * Adds str.trim(), str.trimRight(), and str.trimLeft()
 *
 * Note: we don't bother trimming all possible ES5 white-space characters.
 * If you truly need strict ES5 whitespace compliance in all browsers,
 * create your own trim function.
 * from http://perfectionkills.com/whitespace-deviations/
 * '\x09-\x0D\x20\xA0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000\u2028\u2029'
 */
(function (define) {
define('poly/string',['require','./lib/_base'],function (require) {


	var base = require('./lib/_base');

	var proto = String.prototype,
		featureMap,
		has,
		toString;

	featureMap = {
		'string-trim': 'trim',
		'string-trimleft': 'trimLeft',
		'string-trimright': 'trimRight'
	};

	function checkFeature (feature) {
		var prop = featureMap[feature];
		return base.isFunction(proto[prop]);
	}

	function neg () { return false; }

	has = checkFeature;

	// compressibility helper
	function remove (str, rx) {
		return str.replace(rx, '');
	}

	toString = base.createCaster(String, 'String');

	var trimRightRx, trimLeftRx;

	trimRightRx = /\s+$/;
	trimLeftRx = /^\s+/;

	function checkShims () {
		if (!has('string-trim')) {
			proto.trim = function trim () {
				return remove(remove(toString(this), trimLeftRx), trimRightRx);
			};
		}

		if (!has('string-trimleft')) {
			proto.trimLeft = function trimLeft () {
				return remove(toString(this), trimLeftRx);
			};
		}

		if (!has('string-trimright')) {
			proto.trimRight = function trimRight () {
				return remove(toString(this), trimRightRx);
			};
		}

	}

	checkShims();

	return {
		setWhitespaceChars: function (wsc) {
			trimRightRx = new RegExp(wsc + '$');
			trimLeftRx = new RegExp('^' + wsc);
			// fail all has() checks and check shims again
			has = neg;
			checkShims();
		}
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * poly/date
 *
 * @author Brian Cavalier
 * @author John Hann
 *
 * ES5-ish Date shims for older browsers.
*/
(function (origDate, define) {
define('poly/date',['require','./lib/_base'],function (require) {

	var base = require('./lib/_base');

	var origProto,
		origParse,
		featureMap,
		maxDate,
		invalidDate,
		isoCompat,
		isoParseRx,
		ownProp,
		undef;

	origProto = origDate.prototype;
	origParse = origDate.parse;

	ownProp = Object.prototype.hasOwnProperty;

	maxDate = 8.64e15;
	invalidDate = NaN;
	// borrowed this from https://github.com/kriskowal/es5-shim
	isoCompat = function () { return origDate.parse('+275760-09-13T00:00:00.000Z') == maxDate; };
	// can't even have spaces in iso date strings
	// in Chrome and FF, the colon in the timezone is optional, but IE, Opera, and Safari need it
	isoParseRx = /^([+\-]\d{6}|\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:.(\d{1,3}))?)?(?:Z|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

	featureMap = {
		'date-now': 'now',
		'date-tojson': 'toJSON',
		'date-toisostring': 'toISOString'
	};

	function has (feature) {
		var prop = featureMap[feature];
		return prop in origDate || prop in origProto;
	}

	if (!has('date-now')) {
		origDate.now = function () { return +(new Date); };
	}

	function isInvalidDate (date) {
		return !isFinite(date);
	}

	function fix2 (number) {
		// ensures number is formatted to at least two digits
		return (number < 10 ? '0' : '') + number;
	}

	function isoParse (str) {
		// parses simplified iso8601 dates, such as
		// yyyy-mm-ddThh:mm:ssZ
		// +yyyyyy-mm-ddThh:mm:ss-06:30
		var result;

		// prepare for the worst
		result = invalidDate;

		// fast parse
		str.replace(isoParseRx, function (a, y, m, d, h, n, s, ms, tzs, tzh, tzm) {
			var adjust = 0;

			// Date.UTC handles years between 0 and 100 as 2-digit years, but
			// that's not what we want with iso dates. If we move forward
			// 400 years -- a full cycle in the Gregorian calendar -- then
			// subtract the 400 years (as milliseconds) afterwards, we can avoid
			// this problem. (learned of this trick from kriskowal/es5-shim.)
			if (y >= 0 && y < 100) {
				y = +y + 400; // convert to number
				adjust = -126227808e5; // 400 years
			}

			result = Date.UTC(y, (m || 1) - 1, d || 1, h || 0, n || 0, s || 0, ms || 0) + adjust;

			tzh = +(tzs + tzh); // convert to signed number
			tzm = +(tzs + tzm); // convert to signed number

			if (tzh || tzm) {
				result -= (tzh + tzm / 60) * 36e5;
				// check if time zone is out of bounds
				if (tzh > 23 || tzh < -23 || tzm > 59) result = invalidDate;
				// check if time zone pushed us over maximum date value
				if (result > maxDate) result = invalidDate;
			}

			return ''; // reduces memory used
		});

		return result;
	}

	if (!has('date-toisostring')) {

		origProto.toISOString = function toIsoString () {
			if (isInvalidDate(this)) {
				throw new RangeError("toISOString called on invalid value");
			}
			return [
				this.getUTCFullYear(), '-',
				fix2(this.getUTCMonth() + 1), '-',
				fix2(this.getUTCDate()), 'T',
				fix2(this.getUTCHours()), ':',
				fix2(this.getUTCMinutes()), ':',
				fix2(this.getUTCSeconds()), '.',
				(this.getUTCMilliseconds()/1000).toFixed(3).slice(2), 'Z'
			].join('');
		};

	}

	if (!has('date-tojson')) {

		origProto.toJSON = function toJSON (key) {
			// key arg is ignored by Date objects, but since this function
			// is generic, other Date-like objects could use the key arg.
			// spec says to throw a TypeError if toISOString is not callable
			// but that's what happens anyways, so no need for extra code.
			return this.toISOString();
		};
	}

	function checkIsoCompat () {
		// fix Date constructor

		var newDate = (function () {
			// Replacement Date constructor
			return function Date (y, m, d, h, mn, s, ms) {
				var len, result;

				// Date called as function, not constructor
				if (!(this instanceof newDate)) return origDate.apply(this, arguments);

				len = arguments.length;

				if (len === 0) {
					result = new origDate();
				}
				else if (len === 1) {
					result = new origDate(base.isString(y) ? newDate.parse(y) : y);
				}
				else {
					result = new origDate(y, m, d == undef ? 1 : d, h || 0, mn || 0, s || 0, ms || 0);
				}

				result.constructor = newDate;

				return result;
			};
		}());

		if (!isoCompat()) {

			newDate.now = origDate.now;
			newDate.UTC = origDate.UTC;
			newDate.prototype = origProto;
			newDate.prototype.constructor = newDate;

			newDate.parse = function parse (str) {
				var result;

				// check for iso date
				result = isoParse('' + str);

				if (isInvalidDate(result)) {
					// try original parse()
					result = origParse(str);
				}

				return result;
			};

			// Unfortunate. See cujojs/poly#11
			// Copy any owned props that may have been previously added to
			// the Date constructor by 3rd party libs.
			copyPropsSafely(newDate, origDate);

			Date = newDate;
		}
		else if (Date != origDate) {
			Date = origDate;
		}

	}

	function copyPropsSafely(dst, src) {
		for (var p in src) {
			if (ownProp.call(src, p) && !ownProp.call(dst, p)) {
				dst[p] = src[p];
			}
		}
	}

	checkIsoCompat();

	return {
		setIsoCompatTest: function (testFunc) {
			isoCompat = testFunc;
			checkIsoCompat();
		}
	};

});
}(
	Date,
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * poly common array functions
 *
 * @author Jared Cacurak
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/lib/_array',['require','./_base'],function (require) {

	var base = require('./_base');

	var toObject = base.createCaster(Object, 'Array'),
		isFunction = base.isFunction,
		undef;

	return {
		returnValue: returnValue,
		iterate: iterate,
		toArrayLike: toArrayLike
	};

	function toArrayLike (o) {
		return (base.toString(o) == '[object String]')
			? o.split('')
			: toObject(o);
	}

	function returnValue (val) {
		return val;
	}

	function iterate (arr, lambda, continueFunc, context, start, inc) {

		var alo, len, i, end;

		alo = toArrayLike(arr);
		len = alo.length >>> 0;

		if (start === undef) start = 0;
		if (!inc) inc = 1;
		end = inc < 0 ? -1 : len;

		if (!isFunction(lambda)) {
			throw new TypeError(lambda + ' is not a function');
		}
		if (start == end) {
			return false;
		}
		if ((start <= end) ^ (inc > 0)) {
			throw new TypeError('Invalid length or starting index');
		}

		for (i = start; i != end; i = i + inc) {
			if (i in alo) {
				if (!continueFunc(lambda.call(context, alo[i], i, alo), i, alo[i])) {
					return false;
				}
			}
		}

		return true;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * Array -- a stand-alone module for using Javascript 1.6 array features
 * in lame-o browsers that don't support Javascript 1.6
 *
 * @author Jared Cacurak
 * @author Brian Cavalier
 * @author John Hann
 */
/*
	define(['poly!poly/array'], function () {
		var items = [1, 2, 3];
		items.forEach(function (item) {
			console.log(item);
		};
	});

	All of the wrapper API methods are shimmed and are reasonably close to
	the ES5 specification, but may vary slightly in unforeseen edge cases:

	var array = [1, 2, 3];

	array.forEach(lambda [, context]);
	array.every(lambda [, context]);
	array.some(lambda [, context]);
	array.filter(lambda [, context]);
	array.map(lambda [, context]);
	array.indexOf(item [, fromIndex]);
	array.lastIndexOf(item [, fromIndex]);
	array.reduce(reduceFunc [, initialValue]);
	array.reduceRight(reduceFunc [, initialValue]);
	Array.isArray(object)

 */
(function (define) {
define('poly/array',['require','./lib/_base','./lib/_array'],function (require) {


	var base = require('./lib/_base');
	var array = require('./lib/_array');

	var proto = Array.prototype,
		featureMap,
		_reduce,
		_find;

	featureMap = {
		'array-foreach': 'forEach',
		'array-every': 'every',
		'array-some': 'some',
		'array-map': 'map',
		'array-filter': 'filter',
		'array-reduce': 'reduce',
		'array-reduceright': 'reduceRight',
		'array-indexof': 'indexOf',
		'array-lastindexof': 'lastIndexOf'
	};

	function has (feature) {
		var prop = featureMap[feature];
		return base.isFunction(proto[prop]);
	}

	function returnTruthy () {
		return 1;
	}

	/***** iterators *****/

	if (!has('array-foreach')) {
		proto.forEach = function forEach (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			array.iterate(this, lambda, returnTruthy, arguments[+1]);
		};
	}

	if (!has('array-every')) {
		proto.every = function every (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			return array.iterate(this, lambda, array.returnValue, arguments[+1]);
		};
	}

	if (!has('array-some')) {
		proto.some = function some (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			return array.iterate(this, lambda, function (val) { return !val; }, arguments[+1]);
		};
	}

	/***** mutators *****/

	if(!has('array-map')) {
		proto.map = function map (lambda) {
			var arr, result;

			arr = this;
			result = new Array(arr.length);

			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			array.iterate(arr, lambda, function (val, i) { result[i] = val; return 1; }, arguments[+1]);

			return result;
		};
	}

	if (!has('array-filter')) {
		proto.filter = function filter (lambda) {
			var arr, result;

			arr = this;
			result = [];

			array.iterate(arr, lambda, function (val, i, orig) {
				// use a copy of the original value in case
				// the lambda function changed it
				if (val) {
					result.push(orig);
				}
				return 1;
			}, arguments[1]);

			return result;
		};
	}

	/***** reducers *****/

	if (!has('array-reduce') || !has('array-reduceright')) {

		_reduce = function _reduce (reduceFunc, inc, initialValue, hasInitialValue) {
			var reduced, startPos, initialValuePos;

			startPos = initialValuePos = inc > 0 ? -1 : array.toArrayLike(this).length >>> 0;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if (!hasInitialValue) {
				array.iterate(this, array.returnValue, function (val, i) {
					reduced = val;
					initialValuePos = i;
				}, null, startPos + inc, inc);
				if (initialValuePos == startPos) {
					// no intial value and no items in array!
					throw new TypeError();
				}
			}
			else {
				// If initialValue provided, use it
				reduced = initialValue;
			}

			// Do the actual reduce
			array.iterate(this, function (item, i, arr) {
				reduced = reduceFunc(reduced, item, i, arr);
			}, returnTruthy, null, initialValuePos + inc, inc);

			// we have a reduced value!
			return reduced;
		};

		if (!has('array-reduce')) {
			proto.reduce = function reduce (reduceFunc /*, initialValue */) {
				return _reduce.call(this, reduceFunc, 1, arguments[+1], arguments.length > 1);
			};
		}

		if (!has('array-reduceright')) {
			proto.reduceRight = function reduceRight (reduceFunc /*, initialValue */) {
				return _reduce.call(this, reduceFunc, -1, arguments[+1], arguments.length > 1);
			};
		}
	}

	/***** finders *****/

	if (!has('array-indexof') || !has('array-lastindexof')) {

		_find = function _find (arr, item, from, forward) {
			var len = array.toArrayLike(arr).length >>> 0, foundAt = -1;

			// convert to number, or default to start or end positions
			from = isNaN(from) ? (forward ? 0 : len - 1) : Number(from);
			// negative means it's an offset from the end position
			if (from < 0) {
				from = len + from - 1;
			}

			array.iterate(arr, array.returnValue, function (val, i) {
				if (val === item) {
					foundAt = i;
				}
				return foundAt == -1;
			}, null, from, forward ? 1 : -1);

			return foundAt;
		};

		if (!has('array-indexof')) {
			proto.indexOf = function indexOf (item) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return _find(this, item, arguments[+1], true);
			};
		}

		if (!has('array-lastindexof')) {
			proto.lastIndexOf = function lastIndexOf (item) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return _find(this, item, arguments[+1], false);
			};
		}
	}

	if (!Array.isArray) {
		Array.isArray = base.isArray;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * Function polyfill / shims
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/function',['require','./lib/_base'],function (require) {


	var base = require('./lib/_base');

	var bind,
		slice = [].slice,
		proto = Function.prototype,
		featureMap;

	featureMap = {
		'function-bind': 'bind'
	};

	function has (feature) {
		var prop = featureMap[feature];
		return base.isFunction(proto[prop]);
	}

	// check for missing features
	if (!has('function-bind')) {
		// adapted from Mozilla Developer Network example at
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		bind = function bind (obj) {
			var args = slice.call(arguments, 1),
				self = this,
				nop = function () {},
				bound = function () {
				  return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
				};
			nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
			bound.prototype = new nop();
			return bound;
		};
		proto.bind = bind;
	}

	return {};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/*! JSON v3.2.4 | http://bestiejs.github.com/json3 | Copyright 2012, Kit Cambridge | http://kit.mit-license.org */
;(function () {
  // Convenience aliases.
  var getClass = {}.toString, isProperty, forEach, undef;

  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd, JSON3 = !isLoader && typeof exports == "object" && exports;

  if (JSON3 || isLoader) {
    if (typeof JSON == "object" && JSON) {
      // Delegate to the native `stringify` and `parse` implementations in
      // asynchronous module loaders and CommonJS environments.
      if (isLoader) {
        JSON3 = JSON;
      } else {
        JSON3.stringify = JSON.stringify;
        JSON3.parse = JSON.parse;
      }
    } else if (isLoader) {
      JSON3 = this.JSON = {};
    }
  } else {
    // Export for web browsers and JavaScript engines.
    JSON3 = this.JSON || (this.JSON = {});
  }

  // Local variables.
  var Escapes, toPaddedString, quote, serialize;
  var fromCharCode, Unescapes, abort, lex, get, walk, update, Index, Source;

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var isExtended = new Date(-3509827334573292), floor, Months, getDay;

  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() == 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // Internal: Determines whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  function has(name) {
    var stringifySupported, parseSupported, value, serialized = '{"A":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}', all = name == "json";
    if (all || name == "json-stringify" || name == "json-parse") {
      // Test `JSON.stringify`.
      if (name == "json-stringify" || all) {
        if ((stringifySupported = typeof JSON3.stringify == "function" && isExtended)) {
          // A test function object with a custom `toJSON` method.
          (value = function () {
            return 1;
          }).toJSON = value;
          try {
            stringifySupported =
              // Firefox 3.1b1 and b2 serialize string, number, and boolean
              // primitives as object literals.
              JSON3.stringify(0) === "0" &&
              // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
              // literals.
              JSON3.stringify(new Number()) === "0" &&
              JSON3.stringify(new String()) == '""' &&
              // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
              // does not define a canonical JSON representation (this applies to
              // objects with `toJSON` properties as well, *unless* they are nested
              // within an object or array).
              JSON3.stringify(getClass) === undef &&
              // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
              // FF 3.1b3 pass this test.
              JSON3.stringify(undef) === undef &&
              // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
              // respectively, if the value is omitted entirely.
              JSON3.stringify() === undef &&
              // FF 3.1b1, 2 throw an error if the given value is not a number,
              // string, array, object, Boolean, or `null` literal. This applies to
              // objects with custom `toJSON` methods as well, unless they are nested
              // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
              // methods entirely.
              JSON3.stringify(value) === "1" &&
              JSON3.stringify([value]) == "[1]" &&
              // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
              // `"[null]"`.
              JSON3.stringify([undef]) == "[null]" &&
              // YUI 3.0.0b1 fails to serialize `null` literals.
              JSON3.stringify(null) == "null" &&
              // FF 3.1b1, 2 halts serialization if an array contains a function:
              // `[1, true, getClass, 1]` serializes as "[1,true,],". These versions
              // of Firefox also allow trailing commas in JSON objects and arrays.
              // FF 3.1b3 elides non-JSON values from objects and arrays, unless they
              // define custom `toJSON` methods.
              JSON3.stringify([undef, getClass, null]) == "[null,null,null]" &&
              // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
              // where character escape codes are expected (e.g., `\b` => `\u0008`).
              JSON3.stringify({ "A": [value, true, false, null, "\0\b\n\f\r\t"] }) == serialized &&
              // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
              JSON3.stringify(null, value) === "1" &&
              JSON3.stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
              // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
              // serialize extended years.
              JSON3.stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
              // The milliseconds are optional in ES 5, but required in 5.1.
              JSON3.stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
              // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
              // four-digit years instead of six-digit years. Credits: @Yaffle.
              JSON3.stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
              // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
              // values less than 1000. Credits: @Yaffle.
              JSON3.stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
          } catch (exception) {
            stringifySupported = false;
          }
        }
        if (!all) {
          return stringifySupported;
        }
      }
      // Test `JSON.parse`.
      if (name == "json-parse" || all) {
        if (typeof JSON3.parse == "function") {
          try {
            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
            // Conforming implementations should also coerce the initial argument to
            // a string prior to parsing.
            if (JSON3.parse("0") === 0 && !JSON3.parse(false)) {
              // Simple parsing test.
              value = JSON3.parse(serialized);
              if ((parseSupported = value.A.length == 5 && value.A[0] == 1)) {
                try {
                  // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                  parseSupported = !JSON3.parse('"\t"');
                } catch (exception) {}
                if (parseSupported) {
                  try {
                    // FF 4.0 and 4.0.1 allow leading `+` signs, and leading and
                    // trailing decimal points. FF 4.0, 4.0.1, and IE 9-10 also
                    // allow certain octal literals.
                    parseSupported = JSON3.parse("01") != 1;
                  } catch (exception) {}
                }
              }
            }
          } catch (exception) {
            parseSupported = false;
          }
        }
        if (!all) {
          return parseSupported;
        }
      }
      return stringifySupported && parseSupported;
    }
  }

  if (!has("json")) {
    // Define additional utility methods if the `Date` methods are buggy.
    if (!isExtended) {
      floor = Math.floor;
      // A mapping between the months of the year and the number of days between
      // January 1st and the first of the respective month.
      Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      // Internal: Calculates the number of days between the Unix epoch and the
      // first day of the given month.
      getDay = function (year, month) {
        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
      };
    }
    
    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if (!(isProperty = {}.hasOwnProperty)) {
      isProperty = function (property) {
        var members = {}, constructor;
        if ((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString": 1
        }, members).toString != getClass) {
          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = function (property) {
            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__, result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          };
        } else {
          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = function (property) {
            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          };
        }
        members = null;
        return isProperty.call(this, property);
      };
    }

    // Internal: Normalizes the `for...in` iteration algorithm across
    // environments. Each enumerated key is yielded to a `callback` function.
    forEach = function (object, callback) {
      var size = 0, Properties, members, property, forEach;

      // Tests for bugs in the current environment's `for...in` algorithm. The
      // `valueOf` property inherits the non-enumerable flag from
      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
      (Properties = function () {
        this.valueOf = 0;
      }).prototype.valueOf = 0;

      // Iterate over a new instance of the `Properties` class.
      members = new Properties();
      for (property in members) {
        // Ignore all properties inherited from `Object.prototype`.
        if (isProperty.call(members, property)) {
          size++;
        }
      }
      Properties = members = null;

      // Normalize the iteration algorithm.
      if (!size) {
        // A list of non-enumerable properties inherited from `Object.prototype`.
        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
        // properties.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == "[object Function]", property, length;
          for (property in object) {
            // Gecko <= 1.0 enumerates the `prototype` property of functions under
            // certain conditions; IE does not.
            if (!(isFunction && property == "prototype") && isProperty.call(object, property)) {
              callback(property);
            }
          }
          // Manually invoke the callback for each non-enumerable property.
          for (length = members.length; property = members[--length]; isProperty.call(object, property) && callback(property));
        };
      } else if (size == 2) {
        // Safari <= 2.0.4 enumerates shadowed properties twice.
        forEach = function (object, callback) {
          // Create a set of iterated properties.
          var members = {}, isFunction = getClass.call(object) == "[object Function]", property;
          for (property in object) {
            // Store each property name to prevent double enumeration. The
            // `prototype` property of functions is not enumerated due to cross-
            // environment inconsistencies.
            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
              callback(property);
            }
          }
        };
      } else {
        // No bugs detected; use the standard `for...in` algorithm.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == "[object Function]", property, isConstructor;
          for (property in object) {
            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
              callback(property);
            }
          }
          // Manually invoke the callback for the `constructor` property due to
          // cross-environment inconsistencies.
          if (isConstructor || isProperty.call(object, (property = "constructor"))) {
            callback(property);
          }
        };
      }
      return forEach(object, callback);
    };

    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if (!has("json-stringify")) {
      // Internal: A map of control characters and their escaped equivalents.
      Escapes = {
        "\\": "\\\\",
        '"': '\\"',
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t"
      };

      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.
      toPaddedString = function (width, value) {
        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return ("000000" + (value || 0)).slice(-width);
      };

      // Internal: Double-quotes a string `value`, replacing all ASCII control
      // characters (characters with code unit values between 0 and 31) with
      // their escaped equivalents. This is an implementation of the
      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
      quote = function (value) {
        var result = '"', index = 0, symbol;
        for (; symbol = value.charAt(index); index++) {
          // Escape the reverse solidus, double quote, backspace, form feed, line
          // feed, carriage return, and tab characters.
          result += '\\"\b\f\n\r\t'.indexOf(symbol) > -1 ? Escapes[symbol] :
            // If the character is a control character, append its Unicode escape
            // sequence; otherwise, append the character as-is.
            (Escapes[symbol] = symbol < " " ? "\\u00" + toPaddedString(2, symbol.charCodeAt(0).toString(16)) : symbol);
        }
        return result + '"';
      };

      // Internal: Recursively serializes an object. Implements the
      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
      serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
        var value = object[property], className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, any, result;
        if (typeof value == "object" && value) {
          className = getClass.call(value);
          if (className == "[object Date]" && !isProperty.call(value, "toJSON")) {
            if (value > -1 / 0 && value < 1 / 0) {
              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              if (getDay) {
                // Manually compute the year, month, date, hours, minutes,
                // seconds, and milliseconds if the `getUTC*` methods are
                // buggy. Adapted from @Yaffle's `date-shim` project.
                date = floor(value / 864e5);
                for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                date = 1 + date - getDay(year, month);
                // The `time` value specifies the time within the day (see ES
                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                // to compute `A modulo B`, as the `%` operator does not
                // correspond to the `modulo` operation for negative numbers.
                time = (value % 864e5 + 864e5) % 864e5;
                // The hours, minutes, seconds, and milliseconds are obtained by
                // decomposing the time within the day. See section 15.9.1.10.
                hours = floor(time / 36e5) % 24;
                minutes = floor(time / 6e4) % 60;
                seconds = floor(time / 1e3) % 60;
                milliseconds = time % 1e3;
              } else {
                year = value.getUTCFullYear();
                month = value.getUTCMonth();
                date = value.getUTCDate();
                hours = value.getUTCHours();
                minutes = value.getUTCMinutes();
                seconds = value.getUTCSeconds();
                milliseconds = value.getUTCMilliseconds();
              }
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                // Months, dates, hours, minutes, and seconds should have two
                // digits; milliseconds should have three.
                "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                // Milliseconds are optional in ES 5.0, but required in 5.1.
                "." + toPaddedString(3, milliseconds) + "Z";
            } else {
              value = null;
            }
          } else if (typeof value.toJSON == "function" && ((className != "[object Number]" && className != "[object String]" && className != "[object Array]") || isProperty.call(value, "toJSON"))) {
            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
            // ignores all `toJSON` methods on these objects unless they are
            // defined directly on an instance.
            value = value.toJSON(property);
          }
        }
        if (callback) {
          // If a replacement function was provided, call it to obtain the value
          // for serialization.
          value = callback.call(object, property, value);
        }
        if (value === null) {
          return "null";
        }
        className = getClass.call(value);
        if (className == "[object Boolean]") {
          // Booleans are represented literally.
          return "" + value;
        } else if (className == "[object Number]") {
          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
          // `"null"`.
          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
        } else if (className == "[object String]") {
          // Strings are double-quoted and escaped.
          return quote(value);
        }
        // Recursively serialize objects and arrays.
        if (typeof value == "object") {
          // Check for cyclic structures. This is a linear search; performance
          // is inversely proportional to the number of unique nested objects.
          for (length = stack.length; length--;) {
            if (stack[length] === value) {
              // Cyclic structures cannot be serialized by `JSON.stringify`.
              throw TypeError();
            }
          }
          // Add the object to the stack of traversed objects.
          stack.push(value);
          results = [];
          // Save the current indentation level and indent one additional level.
          prefix = indentation;
          indentation += whitespace;
          if (className == "[object Array]") {
            // Recursively serialize array elements.
            for (index = 0, length = value.length; index < length; any || (any = true), index++) {
              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
              results.push(element === undef ? "null" : element);
            }
            result = any ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
          } else {
            // Recursively serialize object members. Members are selected from
            // either a user-specified list of property names, or the object
            // itself.
            forEach(properties || value, function (property) {
              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
              if (element !== undef) {
                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                // is not the empty string, let `member` {quote(property) + ":"}
                // be the concatenation of `member` and the `space` character."
                // The "`space` character" refers to the literal space
                // character, not the `space` {width} argument provided to
                // `JSON.stringify`.
                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
              }
              any || (any = true);
            });
            result = any ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
          }
          // Remove the object from the traversed object stack.
          stack.pop();
          return result;
        }
      };

      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
      JSON3.stringify = function (source, filter, width) {
        var whitespace, callback, properties, index, length, value;
        if (typeof filter == "function" || typeof filter == "object" && filter) {
          if (getClass.call(filter) == "[object Function]") {
            callback = filter;
          } else if (getClass.call(filter) == "[object Array]") {
            // Convert the property names array into a makeshift set.
            properties = {};
            for (index = 0, length = filter.length; index < length; value = filter[index++], ((getClass.call(value) == "[object String]" || getClass.call(value) == "[object Number]") && (properties[value] = 1)));
          }
        }
        if (width) {
          if (getClass.call(width) == "[object Number]") {
            // Convert the `width` to an integer and create a string containing
            // `width` number of space characters.
            if ((width -= width % 1) > 0) {
              for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
            }
          } else if (getClass.call(width) == "[object String]") {
            whitespace = width.length <= 10 ? width : width.slice(0, 10);
          }
        }
        // Opera <= 7.54u2 discards the values associated with empty string keys
        // (`""`) only if they are used directly within an object member list
        // (e.g., `!("" in { "": 1})`).
        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
      };
    }

    // Public: Parses a JSON source string.
    if (!has("json-parse")) {
      fromCharCode = String.fromCharCode;
      // Internal: A map of escaped control characters and their unescaped
      // equivalents.
      Unescapes = {
        "\\": "\\",
        '"': '"',
        "/": "/",
        "b": "\b",
        "t": "\t",
        "n": "\n",
        "f": "\f",
        "r": "\r"
      };

      // Internal: Resets the parser state and throws a `SyntaxError`.
      abort = function() {
        Index = Source = null;
        throw SyntaxError();
      };

      // Internal: Returns the next token, or `"$"` if the parser has reached
      // the end of the source string. A token may be a string, number, `null`
      // literal, or Boolean literal.
      lex = function () {
        var source = Source, length = source.length, symbol, value, begin, position, sign;
        while (Index < length) {
          symbol = source.charAt(Index);
          if ("\t\r\n ".indexOf(symbol) > -1) {
            // Skip whitespace tokens, including tabs, carriage returns, line
            // feeds, and space characters.
            Index++;
          } else if ("{}[]:,".indexOf(symbol) > -1) {
            // Parse a punctuator token at the current position.
            Index++;
            return symbol;
          } else if (symbol == '"') {
            // Advance to the next character and parse a JSON string at the
            // current position. String tokens are prefixed with the sentinel
            // `@` character to distinguish them from punctuators.
            for (value = "@", Index++; Index < length;) {
              symbol = source.charAt(Index);
              if (symbol < " ") {
                // Unescaped ASCII control characters are not permitted.
                abort();
              } else if (symbol == "\\") {
                // Parse escaped JSON control characters, `"`, `\`, `/`, and
                // Unicode escape sequences.
                symbol = source.charAt(++Index);
                if ('\\"/btnfr'.indexOf(symbol) > -1) {
                  // Revive escaped control characters.
                  value += Unescapes[symbol];
                  Index++;
                } else if (symbol == "u") {
                  // Advance to the first character of the escape sequence.
                  begin = ++Index;
                  // Validate the Unicode escape sequence.
                  for (position = Index + 4; Index < position; Index++) {
                    symbol = source.charAt(Index);
                    // A valid sequence comprises four hexdigits that form a
                    // single hexadecimal value.
                    if (!(symbol >= "0" && symbol <= "9" || symbol >= "a" && symbol <= "f" || symbol >= "A" && symbol <= "F")) {
                      // Invalid Unicode escape sequence.
                      abort();
                    }
                  }
                  // Revive the escaped character.
                  value += fromCharCode("0x" + source.slice(begin, Index));
                } else {
                  // Invalid escape sequence.
                  abort();
                }
              } else {
                if (symbol == '"') {
                  // An unescaped double-quote character marks the end of the
                  // string.
                  break;
                }
                // Append the original character as-is.
                value += symbol;
                Index++;
              }
            }
            if (source.charAt(Index) == '"') {
              Index++;
              // Return the revived string.
              return value;
            }
            // Unterminated string.
            abort();
          } else {
            // Parse numbers and literals.
            begin = Index;
            // Advance the scanner's position past the sign, if one is
            // specified.
            if (symbol == "-") {
              sign = true;
              symbol = source.charAt(++Index);
            }
            // Parse an integer or floating-point value.
            if (symbol >= "0" && symbol <= "9") {
              // Leading zeroes are interpreted as octal literals.
              if (symbol == "0" && (symbol = source.charAt(Index + 1), symbol >= "0" && symbol <= "9")) {
                // Illegal octal literal.
                abort();
              }
              sign = false;
              // Parse the integer component.
              for (; Index < length && (symbol = source.charAt(Index), symbol >= "0" && symbol <= "9"); Index++);
              // Floats cannot contain a leading decimal point; however, this
              // case is already accounted for by the parser.
              if (source.charAt(Index) == ".") {
                position = ++Index;
                // Parse the decimal component.
                for (; position < length && (symbol = source.charAt(position), symbol >= "0" && symbol <= "9"); position++);
                if (position == Index) {
                  // Illegal trailing decimal.
                  abort();
                }
                Index = position;
              }
              // Parse exponents.
              symbol = source.charAt(Index);
              if (symbol == "e" || symbol == "E") {
                // Skip past the sign following the exponent, if one is
                // specified.
                symbol = source.charAt(++Index);
                if (symbol == "+" || symbol == "-") {
                  Index++;
                }
                // Parse the exponential component.
                for (position = Index; position < length && (symbol = source.charAt(position), symbol >= "0" && symbol <= "9"); position++);
                if (position == Index) {
                  // Illegal empty exponent.
                  abort();
                }
                Index = position;
              }
              // Coerce the parsed value to a JavaScript number.
              return +source.slice(begin, Index);
            }
            // A negative sign may only precede numbers.
            if (sign) {
              abort();
            }
            // `true`, `false`, and `null` literals.
            if (source.slice(Index, Index + 4) == "true") {
              Index += 4;
              return true;
            } else if (source.slice(Index, Index + 5) == "false") {
              Index += 5;
              return false;
            } else if (source.slice(Index, Index + 4) == "null") {
              Index += 4;
              return null;
            }
            // Unrecognized token.
            abort();
          }
        }
        // Return the sentinel `$` character if the parser has reached the end
        // of the source string.
        return "$";
      };

      // Internal: Parses a JSON `value` token.
      get = function (value) {
        var results, any, key;
        if (value == "$") {
          // Unexpected end of input.
          abort();
        }
        if (typeof value == "string") {
          if (value.charAt(0) == "@") {
            // Remove the sentinel `@` character.
            return value.slice(1);
          }
          // Parse object and array literals.
          if (value == "[") {
            // Parses a JSON array, returning a new JavaScript array.
            results = [];
            for (;; any || (any = true)) {
              value = lex();
              // A closing square bracket marks the end of the array literal.
              if (value == "]") {
                break;
              }
              // If the array literal contains elements, the current token
              // should be a comma separating the previous element from the
              // next.
              if (any) {
                if (value == ",") {
                  value = lex();
                  if (value == "]") {
                    // Unexpected trailing `,` in array literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each array element.
                  abort();
                }
              }
              // Elisions and leading commas are not permitted.
              if (value == ",") {
                abort();
              }
              results.push(get(value));
            }
            return results;
          } else if (value == "{") {
            // Parses a JSON object, returning a new JavaScript object.
            results = {};
            for (;; any || (any = true)) {
              value = lex();
              // A closing curly brace marks the end of the object literal.
              if (value == "}") {
                break;
              }
              // If the object literal contains members, the current token
              // should be a comma separator.
              if (any) {
                if (value == ",") {
                  value = lex();
                  if (value == "}") {
                    // Unexpected trailing `,` in object literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each object member.
                  abort();
                }
              }
              // Leading commas are not permitted, object property names must be
              // double-quoted strings, and a `:` must separate each property
              // name and value.
              if (value == "," || typeof value != "string" || value.charAt(0) != "@" || lex() != ":") {
                abort();
              }
              results[value.slice(1)] = get(lex());
            }
            return results;
          }
          // Unexpected token encountered.
          abort();
        }
        return value;
      };

      // Internal: Updates a traversed object member.
      update = function(source, property, callback) {
        var element = walk(source, property, callback);
        if (element === undef) {
          delete source[property];
        } else {
          source[property] = element;
        }
      };

      // Internal: Recursively traverses a parsed JSON object, invoking the
      // `callback` function for each value. This is an implementation of the
      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
      walk = function (source, property, callback) {
        var value = source[property], length;
        if (typeof value == "object" && value) {
          if (getClass.call(value) == "[object Array]") {
            for (length = value.length; length--;) {
              update(value, length, callback);
            }
          } else {
            // `forEach` can't be used to traverse an array in Opera <= 8.54,
            // as `Object#hasOwnProperty` returns `false` for array indices
            // (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            forEach(value, function (property) {
              update(value, property, callback);
            });
          }
        }
        return callback.call(source, property, value);
      };

      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
      JSON3.parse = function (source, callback) {
        var result, value;
        Index = 0;
        Source = source;
        result = get(lex());
        // If a JSON string contains multiple tokens, it is invalid.
        if (lex() != "$") {
          abort();
        }
        // Reset the parser state.
        Index = Source = null;
        return callback && getClass.call(callback) == "[object Function]" ? walk((value = {}, value[""] = result, value), "", callback) : result;
      };
    }
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define('poly/support/json3',[],function () {
      return JSON3;
    });
  }
}).call(this);
/** @license MIT License (c) copyright 2013 original authors */
/**
 * JSON polyfill / shim
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/json',['require','./support/json3'],function (require) {

	return require('./support/json3');
});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * XHR polyfill / shims
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (global, define) {
define('poly/xhr',['require'],function (require) {


	var progIds;

	// find XHR implementation
	if (typeof XMLHttpRequest == 'undefined') {
		// create xhr impl that will fail if called.
		assignCtor(function () { throw new Error("poly/xhr: XMLHttpRequest not available"); });
		// keep trying progIds until we find the correct one,
		progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
		while (progIds.length && tryProgId(progIds.shift())) {}
	}

	function assignCtor (ctor) {
		// assign global.XMLHttpRequest function
		global.XMLHttpRequest = ctor;
	}

	function tryProgId (progId) {
		try {
			new ActiveXObject(progId);
			assignCtor(function () { return new ActiveXObject(progId); });
			return true;
		}
		catch (ex) {}
	}

});
}(
	typeof global != 'undefined' && global || this.global || this,
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * setImmediate polyfill / shim
 *
 * @author Jared Cacurak
 * @author Brian Cavalier
 * @author John Hann
 *
 * Based on NobleJS's setImmediate. (https://github.com/NobleJS/setImmediate)
 */
(function (global, define) {
define('poly/setImmediate',['require','./lib/_base'],function (require) {


	var base = require('./lib/_base');

	var testCache,
		tasks;

	testCache = {};
	tasks = (function () {
		var nextHandle,
			tasksByHandle,
			currentlyRunningATask;

		nextHandle = 1; // Spec says greater than zero
		tasksByHandle = {};
		currentlyRunningATask = false;

		function Task (handler, args) {
			this.handler = handler;
			this.args = Array.prototype.slice.call(args);
		}

		Task.prototype.run = function () {
			// See steps in section 5 of the spec.
			if (base.isFunction(this.handler)) {
				// Choice of `thisArg` is not in the setImmediate spec; `undefined` is in the setTimeout spec though:
				// http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html
				this.handler.apply(undefined, this.args);
			}
			else {
				var scriptSource = '' + this.handler;
				eval(scriptSource);
			}
		};

		return {
			addFromSetImmediateArguments: function (args) {
				var handler,
					argsToHandle,
					task,
					thisHandle;

				handler = args[0];
				argsToHandle = Array.prototype.slice.call(args, 1);
				task = new Task(handler, argsToHandle);

				thisHandle = nextHandle++;
				tasksByHandle[thisHandle] = task;
				return thisHandle;
			},
			runIfPresent: function (handle) {
				// From the spec: "Wait until any invocations of this algorithm started before this one have completed."
				// So if we're currently running a task, we'll need to delay this invocation.
				if (!currentlyRunningATask) {
					var task = tasksByHandle[handle];
					if (task) {
						currentlyRunningATask = true;
						try {
							task.run();
						} finally {
							delete tasksByHandle[handle];
							currentlyRunningATask = false;
						}
					}
				} else {
					// Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
					// "too much recursion" error.
					global.setTimeout(function () {
						tasks.runIfPresent(handle);
					}, 0);
				}
			},
			remove: function (handle) {
				delete tasksByHandle[handle];
			}
		};
	}());

	function has (name) {
		if (base.isFunction(testCache[name])) {
			testCache[name] = testCache[name](global);
		}
		return testCache[name];
	}

	function add (name, test, now) {
		testCache[name] = now ? test(global, d, el) : test;
	}

	function aliasMicrosoftImplementation (attachTo) {
		attachTo.setImmediate = global.msSetImmediate;
		attachTo.clearImmediate = global.msClearImmediate;
	}

	function installPostMessageImplementation (attachTo) {
		// Installs an event handler on `global` for the `message` event: see
		// * https://developer.mozilla.org/en/DOM/window.postMessage
		// * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

		var MESSAGE_PREFIX = 'cujojs/poly.setImmediate' + Math.random();

		function isStringAndStartsWith (string, putativeStart) {
			return typeof string === 'string' && string.substring(0, putativeStart.length) === putativeStart;
		}

		function onGlobalMessage (event) {
			// This will catch all incoming messages (even from other windows!), so we need to try reasonably hard to
			// avoid letting anyone else trick us into firing off. We test the origin is still this window, and that a
			// (randomly generated) unpredictable identifying prefix is present.
			if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
				var handle = event.data.substring(MESSAGE_PREFIX.length);
				tasks.runIfPresent(handle);
			}
		}
		global.addEventListener('message', onGlobalMessage, false);

		attachTo.setImmediate = function () {
			var handle = tasks.addFromSetImmediateArguments(arguments);

			// Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
			// invoking our onGlobalMessage listener above.
			global.postMessage(MESSAGE_PREFIX + handle, '*');
			return handle;
		};
	}

	function installReadyStateChangeImplementation(attachTo) {
		attachTo.setImmediate = function () {
			var handle = tasks.addFromSetImmediateArguments(arguments);

			// Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
			// into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
			var scriptEl = global.document.createElement('script');
			scriptEl.onreadystatechange = function () {
				tasks.runIfPresent(handle);

				scriptEl.onreadystatechange = null;
				scriptEl.parentNode.removeChild(scriptEl);
				scriptEl = null;
			};
			global.document.documentElement.appendChild(scriptEl);
			return handle;
		};
	}

	function installSetTimeoutImplementation(attachTo) {
		attachTo.setImmediate = function () {
			var handle = tasks.addFromSetImmediateArguments(arguments);

			global.setTimeout(function () {
				tasks.runIfPresent(handle);
			}, 0);
			return handle;
		};
	}

	add('setimmediate', function (g) {
		return base.isFunction(g.setImmediate);
	});

	add('ms-setimmediate', function (g) {
		return base.isFunction(g.msSetImmediate);
	});

	add('post-message', function (g) {
		// Note: this is only for the async postMessage, not the buggy sync
		// version in IE8
		var postMessageIsAsynchronous,
			oldOnMessage;

		postMessageIsAsynchronous = true;
		oldOnMessage = g.onmessage;

		if (!g.postMessage) {
			return false;
		}

		g.onmessage = function () {
			postMessageIsAsynchronous = false;
		};
		g.postMessage('', '*');
		g.onmessage = oldOnMessage;
		return postMessageIsAsynchronous;
	});

	add('script-onreadystatechange', function (g) {
		return 'document' in g && 'onreadystatechange' in g.document.createElement('script');
	});

	if (!has('setimmediate')) {
		if (has('ms-setimmediate')) {
			aliasMicrosoftImplementation(global);
		}
		else {
			if (has('post-message')) {
				installPostMessageImplementation(global);
			}
			else if (has('script-onreadystatechange')) {
				installReadyStateChangeImplementation(global);
			}
			else {
				 installSetTimeoutImplementation(global);
			}
			global.clearImmediate = tasks.remove;
		}
	}
});
}(
	this.global || this,
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * Array -- a stand-alone module for using ES6 array features.
 *
 * @author Jared Cacurak
 * @author Brian Cavalier
 * @author John Hann
 *
 * Huge thanks to Rick Waldron:
 * https://gist.github.com/rwldrn/5079436
 * https://gist.github.com/rwldrn/5079427
 * https://gist.github.com/rwldrn/1074126
 */
(function (define) {
define('poly/array-es6',['require','./lib/_base','./lib/_array'],function (require) {


	var base = require('./lib/_base');
	var array = require('./lib/_array');

	var ctor = Array,
		proto = ctor.prototype,
		slice = proto.slice,
		protoFeatureMap,
		ctorFeatureMap,
		_findIndex;

	protoFeatureMap = {
		'array-find': 'find',
		'array-findIndex': 'findIndex'
	};

	ctorFeatureMap = {
		'array-from': 'from',
		'array-of': 'of'
	};

	function has (feature) {
		var prop = protoFeatureMap[feature];
		if (prop) {
			return base.isFunction(proto[prop]);
		}
		prop = ctorFeatureMap[feature];
		return base.isFunction(ctor[prop]);
	}

	if (!has('array-from')) {
		Array.from = function (thing) {
			var ctor, k, o;
			// sniff if we're being applied to some other constructor
			ctor = base.isFunction(this) ? this : Array;
			if (Array === ctor) return slice.call(thing);
			k = thing.length;
			o = new ctor(k);
			o.length = k;
			while (--k >= 0) o[k] = thing[k];
			return o;
		};
	}

	if (!has('array-of')) {
		Array.of = function () { return slice.call(arguments); };
	}

	if (!has('array-findIndex') || !has('array-find')) {
		_findIndex = function findIndexImpl (lambda /*, thisArg */) {

			var foundAt = -1;

			array.iterate(this, function (val, i, arr) {
				if (lambda.call(this, val, i, arr)) {
					foundAt = i;
				}
				return foundAt == -1;
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			}, array.returnValue, arguments[+1]);
			return foundAt;
		};

		if (!has('array-findIndex')) {
			proto.findIndex = function findIndex (lambda) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return _findIndex.call(this, lambda, arguments[+1]);
			};
		}

		if (!has('array-find')) {
			proto.find = function find (lambda) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return this[_findIndex.call(this, lambda, arguments[+1])];
			}
		}
	}
});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * polyfill / shim plugin for AMD loaders
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/all',['require','./object','./string','./date','./array','./function','./json','./xhr','./setImmediate','./array-es6'],function (require) {

	var object = require('./object');
	var string = require('./string');
	var date = require('./date');
	require('./array');
	require('./function');
	require('./json');
	require('./xhr');
	require('./setImmediate');
	require('./array-es6');

	return {
		failIfShimmed: object.failIfShimmed,
		setWhitespaceChars: string.setWhitespaceChars,
		setIsoCompatTest: date.setIsoCompatTest
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * stricter ES5 polyfills / shims for AMD loaders
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/es5-strict',['require','./object','./string','./date','./array','./function','./json','./xhr'],function (require) {

	var object = require('./object');
	var string = require('./string');
	var date = require('./date');
	require('./array');
	require('./function');
	require('./json');
	require('./xhr');

	var failTestRx;

	failTestRx = /^define|^prevent|descriptor$/i;

	function regexpShouldThrow (feature) {
		return failTestRx.test(feature);
	}

	// set unshimmable Object methods to be somewhat strict:
	object.failIfShimmed(regexpShouldThrow);
	// set strict whitespace
	string.setWhitespaceChars('\\s');

	return {
		failIfShimmed: object.failIfShimmed,
		setWhitespaceChars: string.setWhitespaceChars,
		setIsoCompatTest: date.setIsoCompatTest
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * ES5 polyfills / shims for AMD loaders
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/es5',['require','./object','./string','./date','./array','./function','./json','./xhr'],function (require) {

	var object = require('./object');
	var string = require('./string');
	var date = require('./date');
	require('./array');
	require('./function');
	require('./json');
	require('./xhr');

	return {
		failIfShimmed: object.failIfShimmed,
		setWhitespaceChars: string.setWhitespaceChars,
		setIsoCompatTest: date.setIsoCompatTest
	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * polyfill / shim for AMD loaders
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function (define) {
define('poly/poly',['require','./all'],function (require) {


	var all = require('./all');

	var poly = {};

	// copy all
	for (var p in all) poly[p] = all[p];

	return poly;

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

/** @license MIT License (c) copyright 2013 original authors */
/**
 * poly/strict
 *
 * @author Brian Cavalier
 * @author John Hann
 *
 * @deprecated Please use poly/es5-strict
 */
(function (define) {
define('poly/strict',['require','./es5-strict'],function (require) {


	return require('./es5-strict');

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

define(['poly/poly'],function(localPoly){return localPoly;});