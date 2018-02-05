(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],4:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":2,"./encode":3}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":6,"punycode":1,"querystring":4}],6:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],7:[function(require,module,exports){
/**
 * @file Atom processing (fill details from payload)
 * @author krad.io <iam@krad.io>
 * @version 0.0.2
 */


/**
 * var parseFTYP - Parses a 'ftyp atom'
 *
 * @param  {Atom} atom          An 'ftyp' Atom
 * @param  {Uint8Array} payload Uint8 array of atom data starting AFTER the 4 byte atom name
 */
var parseFTYP = function(atom, payload) {
  var view            = new DataView(payload.buffer, 4, 4)
  var majorBrandBytes = payload.slice(0, 4)
  atom.majorBrand     = String.fromCharCode.apply(null, majorBrandBytes)
  atom.minorVersion   = view.getUint32(0)

  atom.compatibleBrands = []

  var i = 8
  while (i < payload.length) {
    var brandSlice = payload.slice(i, i+4)
    var brandName  = String.fromCharCode.apply(null, brandSlice)
    atom.compatibleBrands.push(brandName)
    i += 4
  }

}

var parseMVHD = function(atom, payload) {
  // console.log('parseMVHD')
}

var parseTKHD = function(atom, payload) {
  // console.log('parseTKHD')
}

var parseMDHD = function(atom, payload) {
  // console.log('parseMDHD')
}

var parseHDLR = function(atom, payload) {
  // console.log('parseHDLR')
}

var parseVMHD = function(atom, payload) {
  // console.log('parseVMHD')
}

var parseDREF = function(atom, payload) {
  // console.log('parseDREF')
}

var parseDINF = function(atom, payload) {
  // console.log('parseDINF')
}

var parseSTCO = function(atom, payload) {
  // console.log('parseSTCO')
}

var parseSTSZ = function(atom, payload) {
  // console.log('parseSTSZ')
}

var parseSTSC = function(atom, payload) {
  // console.log('parseSTSC')
}

var parseSTTS = function(atom, payload) {
  // console.log('parseSTTS')
}

var parsePASP = function(atom, payload) {
  // console.log('parsePASP')
}

var parseCOLR = function(atom, payload) {
  // console.log('parseCOLR')
}


/**
 * var parseAVCC - Parses an 'avcC' type atom
 *
 * @param  {Atom} atom          An 'avcC' type atom
 * @param  {Uint8Array} payload Uint8 array of atom data starting AFTER the 4 byte atom name
 */
var parseAVCC = function(atom, payload) {
  var view                  = new DataView(payload.buffer, 0, 4)
  atom.version              = view.getUint8(0)
  atom.profile              = view.getUint8(1)
  atom.profileCompatibility = view.getUint8(2)
  atom.levelIndication      = view.getUint8(3)
}

var parseAVC1 = function(atom, payload) {
  var view    = new DataView(payload.buffer, 24, 4)
  atom.width  = view.getUint16(0)
  atom.height = view.getUint16(2)
}

var parseSTSD = function(atom, payload) {
  // console.log('parseSTSD')
}

var parseSTBL = function(atom, payload) {
  // console.log('parseSTBL')
}

var parseMINF = function(atom, payload) {
  // console.log('parseMINF')
}

var parseMDIA = function(atom, payload) {
  // console.log('parseMDIA')
}

var parseTRAK = function(atom, payload) {
  // console.log('parseTRAK')
}

var parseMOOV = function(atom, payload) {
  // console.log('parseMOOV')
}

var parseTREX = function(atom, payload) {
  // console.log('parseTREX')
}

var parseMVEX = function(atom, payload) {
  // console.log('parseMVEX')
}

var parseMFHD = function(atom, payload) {
  // console.log('parseMFHD')
}

var parseTFHD = function(atom, payload) {
  // console.log('parseTFHD')
}

var parseTFDT = function(atom, payload) {
  // console.log('parseTFDT')
}

var parseTRUN = function(atom, payload) {
  // console.log('parseTRUN')
}

var parseTRAF = function(atom, payload) {
  // console.log('parseTRAF')
}

var parseMOOF = function(atom, payload) {
  // console.log('parseMOOF')
}

var parseMDAT = function(atom, payload) {
  // console.log('parseMDAT')
}

var parseSMHD = function(atom, payload) {
  // console.log('parseSMHD')
}

var parseMP4A = function(atom, payload) {
  // console.log('parseMP4A')
}


/**
 * AudioSpecificConfig - AudioSpecificConfig holds specifics about the audio decoder config
 *
 * @param  {Uint8Array} payload Payload of the 0x05 packet in the ESDS
 * @return {AudioSpecificConfig} description
 */
function AudioSpecificConfig(payload) {
  this.type          = payload[0] >> 3
  this.frequency     = payload[0] << 1
  this.channelConfig = null
}

/**
 * var parseESDS - Parses an 'esds' type atom
 *
 * @param  {Atom} atom          An 'esds' type atom
 * @param  {Uint8Array} payload Uint8 array of atom data starting AFTER the 4 byte atom name
 */
var parseESDS = function(atom, payload) {

  /// It's an elementary stream.  Chunk it up.
  var chunks = []
  var currentChunk
  for (var i = 4; i < payload.length; i++) {
    if (payload[i+1] == 0x80) {
      if (payload[i+2] == 0x80) {
        if (payload[i+3] == 0x80) {
          if (currentChunk) { chunks.push(currentChunk) }
          currentChunk = []
        }
      }
    }
    currentChunk.push(payload[i])
  }

  // Decoder Config is signaled with 0x04
  var decoderConfig = chunks
  .map(function(e) { if (e[0] == 0x04) { return e }})
  .filter(function(e){ if (e) { return e }})[0].slice(4)

  atom.objectProfileIndication = decoderConfig[1]

  // Audio Specific Config is signaled with 0x05
  decoderConfig = chunks
  .map(function(e) { if (e[0] == 0x05) { return e }})
  .filter(function(e){ if (e) { return e }})[0].slice(4)

  var audioSpecificConfigBytes  = decoderConfig.slice(1, 1+decoderConfig[0])
  atom.audioSpecificConfig      = new AudioSpecificConfig(audioSpecificConfigBytes)
}


module.exports = {
  ftyp: parseFTYP,
  mvhd: parseMVHD,
  tkhd: parseTKHD,
  mdhd: parseMDHD,
  hdlr: parseHDLR,
  vmhd: parseVMHD,
  dref: parseDREF,
  dinf: parseDINF,
  stco: parseSTCO,
  stsz: parseSTSZ,
  stsc: parseSTSC,
  stts: parseSTTS,
  pasp: parsePASP,
  colr: parseCOLR,
  avcC: parseAVCC,
  avc1: parseAVC1,
  stsd: parseSTSD,
  stbl: parseSTBL,
  minf: parseMINF,
  mdia: parseMDIA,
  trak: parseTRAK,
  moov: parseMOOV,
  trex: parseTREX,
  mvex: parseMVEX,
  mfhd: parseMFHD,
  tfhd: parseTFHD,
  tfdt: parseTFDT,
  trun: parseTRUN,
  traf: parseTRAF,
  moof: parseMOOF,
  mdat: parseMDAT,
  smhd: parseSMHD,
  mp4a: parseMP4A,
  esds: parseESDS,

}

},{}],8:[function(require,module,exports){
/**
*  @file Atom parsing
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
**/
var atomProcessor = require('./atom_processor')

/**
 *
 */
var ATOMS = {
  "ftyp": atomProcessor.ftyp,
  "mvhd": atomProcessor.mvhd,
  "tkhd": atomProcessor.tkhd,
  "mdhd": atomProcessor.mdhd,
  "hdlr": atomProcessor.hdlr,
  "vmhd": atomProcessor.vmhd,
  "dref": atomProcessor.dref,
  "dinf": atomProcessor.ding,
  "stco": atomProcessor.stco,
  "stsz": atomProcessor.stsz,
  "stsc": atomProcessor.stsc,
  "stts": atomProcessor.stts,
  "pasp": atomProcessor.pasp,
  "colr": atomProcessor.colr,
  "avcC": atomProcessor.avcC,
  "avc1": atomProcessor.avc1,
  "stsd": atomProcessor.stsd,
  "stbl": atomProcessor.stbl,
  "minf": atomProcessor.minf,
  "mdia": atomProcessor.mdia,
  "trak": atomProcessor.trak,
  "moov": atomProcessor.moov,
  "trex": atomProcessor.trex,
  "mvex": atomProcessor.mvex,
  "mfhd": atomProcessor.mfhd,
  "tfhd": atomProcessor.tfhd,
  "tfdt": atomProcessor.tfdt,
  "trun": atomProcessor.trun,
  "traf": atomProcessor.traf,
  "moof": atomProcessor.moof,
  "mdat": atomProcessor.mdat,
  "smhd": atomProcessor.smhd,
  "mp4a": atomProcessor.mp4a,
  "esds": atomProcessor.esds,
}



/**
 * Array.prototype.flatMap - flatMap over arrays
 *
 * @param  {Function} lambda Map function
 * @return {Array}        Mapped array flattened with undefined/null removed
 */
Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat
  .apply([], this.map(lambda))
  .filter(function(x){
    if (x) { return x }
  })
}


/**
 * Atom - An atom represents a section of data in a mpeg file
 *
 * @param  {String} name          Name of the atom (4 characters)
 * @param  {Integer} location     Location of the beginning of the atom (where size starts)
 * @param  {Integer} size         Size of the atom reported from the 32bit size integer
 * @param  {Uint8Array} payload   The actual atom data (starting after the atom name)
 * @return {Atom}                 Atom struct with appropriate fields
 */
function Atom(name, location, size, payload) {
  this.name     = name
  this.location = location
  this.size     = size
  if (ATOMS[name]) { ATOMS[name](this, payload) }
}


/**
 * Atom.prototype.insert - Insert a child atom into a parent atom
 *
 * @param  {Atom} child An atom which is a descendant of a media atom
 */
Atom.prototype.insert = function(child) {
  if (!this.children) { this.children = [] }
  this.children.push(child)
}


/**
 * AtomTree - A structure describing the atoms within an mpeg file
 *
 * @return {AtomTree}  An AtomTree object with appropriate data filled
 */
function AtomTree() {
  this.root = []
  this.length = function() { return this.root.length }
  this.config = null
}


/**
 * AtomTree.prototype.insert - Insert an atom into the atom tree at it's appropriate location
 *
 * @param  {Atom} atom An Atom object
 */
AtomTree.prototype.insert = function(atom) {
  var root = this.root

  var children = root
  .flatMap(function(e) { return explode(e) })
  .filter(function(e) { if (isChild(atom, e)) { return e } })

  if (children.length == 0) {
    root.push(atom)
  } else {
    var lastChild = children[children.length-1]
    lastChild.insert(atom)
  }

}


/**
 * AtomTree.prototype.findAtoms - Finds atoms by name
 *
 * @param  {String} atomName The name of all the atoms you want to find
 * @return {Array<Atom>}     An array of atoms with the name searched for
 */
AtomTree.prototype.findAtoms = function(atomName) {
  return this.root.flatMap(function(e) { return explode(e) })
  .filter(function(e) { if (e.name == atomName) { return e } })
}


/**
 * explode - Used to recursively unwrap an Atom's children into a flat array
 *
 * @param  {Atom} atom An Atom object with children
 * @return {Array<Atom>} A 1 dimensional array including an atom and all of it's children (and there children and so forth)
 */
function explode(atom) {
  if (atom.children) {
    var exploded = atom.children.flatMap(function(x){ return explode(x) })
    return [atom].concat(exploded)
  } else {
    return [atom]
  }
}


/**
 * isChild - Simple check if an atom is a descendant (direct and otherwise) of a parent atom
 *
 * @param  {Atom} subject The Atom that may be a child
 * @param  {Atom} suspect The Atom that may be the parent
 * @return {Boolean} A bool.  true if the subject falls within the range of the parent
 */
function isChild(subject, suspect) {
  if (subject.location < (suspect.location + suspect.size)) {
    return true
  }
  return false
}


/**
 * isObject - Simple check if something is an object
 *
 * @param  {Value} o A value that may or may not be an object
 * @return {Boolean}   A bool.  true if o is an Object
 */
function isObject(o) {
  return o instanceof Object && o.constructor === Object;
}

/**
 * isAtom - Simple check if a value is an Atom object
 *
 * @param  {Object} a An object that may or may not be an Atom
 * @return {Boolean} true if a is an Atom
 */
function isAtom(a) {
  return a instanceof Atom && a.constructor === Atom;
}



/**
 * parseCodecs - Parses an AtomTree for codec information from any audio and/or video tracks
 * Video:
 *  We only support avc1 atoms at this time.  This respects proper profile, level parsing.
 *
 * Audio:
 *  I've only tested this with AAC streams.
 *  I pieced together ESDS generation from old specs and reverse engineering.
 *  Requirements in the HLS spec are fairly slim as of this writing so this *should* cover
 *  most use cases (AAC-LC, HE-AAC, *maybe* mp3?)
 *  I know for a fact this will work with morsel (github.com/krad/morsel)
 *
 * @param  {AtomTree} tree A tree representing the parsed contents of an mpeg file
 * @return {Array<String>} An array of codec strings (RFC6381)
 */
function parseCodecs(tree) {
  var result

  var videoScan = tree.findAtoms('avc1')
  if (videoScan && videoScan.length > 0) {
    var avc1 = videoScan[0]

    if (avc1.children && avc1.children.length > 0) {
      var profileScan = avc1.children.filter(function(e) { if (e.name == 'avcC') { return e } })
      if (profileScan && profileScan.length > 0) {
        var avcC = profileScan[0]
        if (avcC) {
          if (!result) { result = [] }

          var params = [avcC.profile,
                        avcC.profileCompatibility,
                        avcC.levelIndication].map(function(i) {
                          return ('0' + i.toString(16).toUpperCase()).slice(-2)
                        }).join('');

          var codec = "avc1." + params
          result.push(codec)
        }
      }
    }
  }

  var audioScan = tree.findAtoms('mp4a')
  if (audioScan && audioScan.length > 0) {
    var mp4a = audioScan[0]

    if (mp4a.children && mp4a.children.length > 0) {
      var audioConfScan = mp4a.children.filter(function(e) { if (e.name == 'esds') { return e } })
      if (audioConfScan && audioConfScan.length > 0) {
        var esds = audioConfScan[0]
        if (esds && esds.audioSpecificConfig) {
          if (!result)  { result = [] }
          var params = [esds.objectProfileIndication, esds.audioSpecificConfig.type].map(function(e){ return e.toString(16) }).join('.')
          var codec  = 'mp4a.' + params
          result.push(codec)
        }
      }
    }
  }

  return result
}

function createCodecsString(codecs) {
  return 'video/mp4; codecs="' + codecs.join(',') + '"'
}

/**
 * parseAtoms - Method to parse an mpeg file
 *
 * @param  {Uint8Array} arraybuffer An Uint8array that represents the contents of an mpeg file
 * @return {AtomTree}               An AtomTree
 */
module.exports = function parseAtoms(arraybuffer) {
  var cursor = 0;
  var tree = new AtomTree()
  while (cursor <= arraybuffer.length) {

    var atomIdent = arraybuffer.slice(cursor, cursor+4)
    var atomName  = String.fromCharCode.apply(null, atomIdent)

    if (Object.keys(ATOMS).includes(atomName)) {
      var sizeBytes = arraybuffer.buffer.slice(cursor-4, cursor)
      var view      = new DataView(sizeBytes)
      var atomSize  = view.getUint32(0)

      var payload = arraybuffer.slice(cursor+4, (cursor+atomSize)-4)
      var atom    = new Atom(atomName, cursor-4, atomSize, payload)
      tree.insert(atom)

      cursor += 4
      continue
    }

    cursor += 1
  }

  tree.codecs = parseCodecs(tree)
  if (tree.codecs) {
    tree.codecsString = createCodecsString(tree.codecs)
  }

  return tree
}

},{"./atom_processor":7}],9:[function(require,module,exports){
/**
 * @file bofh - Bastard Operator from Hell.  Async HLS fetcher thing.
 * @author krad.io <iam@krad.io>
 * @version 0.0.2
 */

 function BOFH(constructor) {
   if (constructor) { this.requestConstructor = constructor }
   else { this.requestConstructor = XMLHttpRequest }
 }

 BOFH.prototype.get = function(url, callback) {
   var client = new this.requestConstructor
   client.open('get', url)
   client.responseType = 'arraybuffer'

   client.onload = function() {
     callback(client.response)
   }

   client.onerror = function(e) {
     callback(null, e)
   }

   client.send()
 }

 module.exports = {
   BOFH: BOFH
 }

},{}],10:[function(require,module,exports){
/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
 */
var playlist  = require('./playlist')
var atomPaser = require('./atoms')
var bofh      = require('./bofh')

function Plainview(playerID) {
  if (playerID) { setupPlayer(this, playerID) }
  this._bofh = new bofh.BOFH()
}

function setupPlayer(plainview, playerID) {
  var player = document.getElementById(playerID)
  if (player) {
    plainview.player = player
    if (player.childNodes) {
      for (var i = 0; i < player.childNodes.length; i++) {
        var childNode = plainview.player.childNodes[i]
        if (childNode.type && childNode.src) {
          if (childNode.type == 'application/x-mpegURL' || childNode.type == 'vnd.apple.mpegURL') {
            plainview.playlistURL = childNode.src
          }
        }
      }
    }
  }
}

function createSourceBuffer(plainview, payload, segment, cb) {
  if (window.MediaSource) {
    if (segment.codecsString) {
      if (MediaSource.isTypeSupported(segment.codecsString)) {
        var ms = new MediaSource()
        if (plainview.player) {
          var codecs = segment.codecsString
          ms.addEventListener('sourceopen', function(e){
            _ = ms.addSourceBuffer(codecs)
            ms.sourceBuffers[0].appendBuffer(payload);
            plainview.mediaSource = ms
            cb(null)
          })
          plainview.player.src = window.URL.createObjectURL(ms)
          return
        }
      } else { cb('Media format not supported' + segment.codecsString) }
    } else { cb('Segment has no media codecs defined') }
  } else { cb('MediaSource not present') }
}


/**
 * fetchAndParsePlaylist - Fetches a m3u8 playlist from a url and parses it
 *
 * @param  {BOFH} client Client used to make the GET request through
 * @param  {String} url  URL of the media segment
 * @param  {Function} cb Callback used on complete.  Contains a parsedPlaylist and/or err
 */

function fetchAndParsePlaylist(client, url, cb) {
  client.get(url, function(res, err){
    if (!err) {
      var decoder         = new TextDecoder();
      var playlistStr     = decoder.decode(res)

      var srcURL
      if (url.endsWith('m3u8')) {
        var urlComps    = url.split('/')
        var compsStrips = urlComps.slice(2, urlComps.length-1)
        var hostAndPath = compsStrips.join('/')
        srcURL          = urlComps[0] + '//' + hostAndPath
      }

      var parsedPlaylist  = playlist(playlistStr, srcURL)
      if (parsedPlaylist.info) {
        cb(parsedPlaylist, null)
        return
      }
    }
    cb(null, err)
  })
}

/**
 * fetchAndParseSegment - Fetches a media segment from a URL and runs it through the atom parser
 *
 * @param  {BOFH} client Client used to make the GET request through
 * @param  {String} url  URL of the media segment
 * @param  {Function} cb Callback used on complete.  Contains Uint8Array, parsed atom, error
 */
function fetchAndParseSegment(client, url, cb) {
  client.get(url, function(res, err){
    if (!err) {
      var uint8buffer = new Uint8Array(res)
      var tree        = atomPaser(uint8buffer)
      cb(uint8buffer, tree, null)
      return
    }
    cb(null, null, err)
  })
}


Plainview.prototype.setup = function(cb) {
  var pv = this
  if (this.playlistURL) {
    fetchAndParsePlaylist(this._bofh, this.playlistURL, function(playlist, err){
      if (playlist) {
        pv.parsedPlaylist = playlist
        cb()
        return
      }

      cb(err)
    })
  }
}


/**
 * Plainview.prototype.configureMedia - Configures the player using media info form actual a/v stream
 * Does this by fetching the first init segment from a parsed playlist, parsing it's atoms, and
 * then creating a MediaSource and SourceBuffer based on it's codecs information.
 *
 * Appends the init segment to the source buffer on success and is ready for the actual data segments
 *
 * @param  {Function} cb Callback that gets executed when configureMedia is complete
 */
Plainview.prototype.configureMedia = function(cb) {
  var pv = this
  if (pv.parsedPlaylist) {
    if (pv.parsedPlaylist.segments) {
      var segments = pv.parsedPlaylist.segments.filter(function(s) { if(s.isIndex) { return s }})
      if (segments.length > 0) {
        var segment = segments[0]
        fetchAndParseSegment(pv._bofh, segment.url, function(payload, tree, err){
          if (err) {
            cb(err)
            return
          }

          createSourceBuffer(pv, payload, tree, function(err){
            pv.currentSegmentIndex = segments.indexOf(segment)
            cb(err)
          })
          return
        })
        return
      } else { cb('Initialization Segment not present') }
    } else { cb('Playlist has no segments') }
  } else { cb('Playlist not present') }
}

// TODO: Replace with iterator once we prove this works
function nextSegment(pv) {
  if (pv.parsedPlaylist) {
    if (pv.parsedPlaylist.segments) {
      if (typeof pv.currentSegmentIndex == 'number') {
        var nextIndex = pv.currentSegmentIndex + 1
        if (pv.parsedPlaylist.segments.length >= nextIndex) {
          return [nextIndex, pv.parsedPlaylist.segments[nextIndex]]
        }
      }
    }
  }

  return null
}

function startPlaying(pv, cb) {
  var ms = pv.mediaSource
  if (ms) {

    var next = nextSegment(pv)
    if (next) {
      var nextIdx = next[0]
      var segment = next[1]
      fetchAndParseSegment(pv._bofh, segment.url, function(payload, atom, err) {
        if (err) { cb(err); return }
        pv.currentSegmentIndex = nextIdx
        cb(null)
      })
    }

    pv.player.play()

  } else { cb('MediaSource not present') }
}

Plainview.prototype.play = function(cb) {
  if (this.mediaSource) {
    startPlaying(this, function(e){ cb(e) })
  } else {

    var pv = this
    pv.setup(function(err) {
      if (err) {
        cb(err)
        return
      }

      pv.configureMedia(function(err){
        if (err) {
          cb(err)
          return
        }

        startPlaying(pv, function(e){
          cb(e)
        })
        return
      })
    })
  }
}

exports.Plainview = Plainview
module.exports = {Plainview: Plainview}

},{"./atoms":8,"./bofh":9,"./playlist":11}],11:[function(require,module,exports){
const url = require('url');

var INFO_MATCH_PATTERNS = {
  targetDuration: new RegExp(/#EXT-X-TARGETDURATION:(\d+)/),
  version: new RegExp(/#EXT-X-VERSION:(\d+)/),
  mediaSequenceNumber: new RegExp(/#EXT-X-MEDIA_SEQUENCE:(\d+)/),
  type: new RegExp(/#EXT-X-PLAYLIST-TYPE:(\w+)/),
}

var SEGMENT_MATCH_PATTERNS = {
  index: new RegExp(/#EXT-X-MAP:URI="(.+)"/),
  segment: new RegExp(/^(\w+\.mp4)/),
  duration: new RegExp(/#EXTINF:(.+)/),
}

var getInfoFrom = function(lines) {
  var result
  for (var i = 0; i < lines.length; i++) {
    for (var property in INFO_MATCH_PATTERNS) {
      if (INFO_MATCH_PATTERNS.hasOwnProperty(property)) {
        var pattern = INFO_MATCH_PATTERNS[property]
        var matches = pattern.exec(lines[i])
        if (matches) {
          if (matches[1]) {
            if (!result) { result = {} }
            var intValue = parseInt(matches[1])
            if (isNaN(intValue)) {
              result[property] = matches[1]
            } else {
              result[property] = intValue
            }
          }
        }
      }
    }
  }
  return result
}

var setInfoFor = function(result, lines) {
  var info = getInfoFrom(lines)
  if (info) { result['info'] = info }
}

var getSegmentsFrom = function(lines, srcURL) {
  var result
  var lastDuration = ""
  for (var i = 0; i < lines.length; i++) {
    for (var property in SEGMENT_MATCH_PATTERNS) {
      if (SEGMENT_MATCH_PATTERNS.hasOwnProperty(property)) {
        var pattern = SEGMENT_MATCH_PATTERNS[property]
        var matches = pattern.exec(lines[i])
        if (matches) {

          if (matches[1]) {
            if (!result) { result = [] }

            /// If a srcURL is present we should prefix the segment urls with it
            var segmentURL
            if (srcURL) {
              if (!srcURL.endsWith('/')) {
                srcURL = srcURL += '/'
              }
              var fullPath = url.resolve(srcURL, matches[1])
              segmentURL   = fullPath
            }
            else { segmentURL = matches[1] }

            /// If it's a index/map segment
            if (property == 'index') {
              result.push({url: segmentURL, isIndex: true})
            }

            /// If it's a media segment
            if (property == 'segment') {
              var segment = {url: segmentURL, isIndex: false}
              if (lastDuration) {
                var parsedDuration = parseFloat(lastDuration)
                if (!parsedDuration.isNaN) { segment['duration'] = parsedDuration }
              }
              result.push(segment)
            }

            /// If this is a duration line, save it for the next loop
            if (property == 'duration') {
              lastDuration = matches[1]
            }
          }
        }
      }
    }
  }
  return result
}

var setSegmentsFor = function(result, lines, srcURL) {
  var segments = getSegmentsFrom(lines, srcURL)
  if (segments) { result['segments'] = segments }
}

module.exports = function parseM3U8(text, srcURL) {
  if (!text) throw Error('Missing playlist text')
  var result = {}

  var lines = text.split("\n")
  setInfoFor(result, lines)
  setSegmentsFor(result, lines, srcURL)

  return result
}

},{"url":5}]},{},[10]);
