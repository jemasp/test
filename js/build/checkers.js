/*
 ---
 MooTools: the javascript framework

 web build:
 - http://mootools.net/core/76bf47062d6c1983d66ce47ad66aa0e0

 packager build:
 - packager build Core/Core Core/Array Core/String Core/Number Core/Function Core/Object Core/Event Core/Browser Core/Class Core/Class.Extras Core/Slick.Parser Core/Slick.Finder Core/Element Core/Element.Style Core/Element.Event Core/Element.Delegation Core/Element.Dimensions Core/Fx Core/Fx.CSS Core/Fx.Tween Core/Fx.Morph Core/Fx.Transitions Core/Request Core/Request.HTML Core/Request.JSON Core/Cookie Core/JSON Core/DOMReady Core/Swiff

 ...
 */

/*
 ---

 name: Core

 description: The heart of MooTools.

 license: MIT-style license.

 copyright: Copyright (c) 2006-2012 [Valerio Proietti](http://mad4milk.net/).

 authors: The MooTools production team (http://mootools.net/developers/)

 inspiration:
 - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
 - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

 provides: [Core, MooTools, Type, typeOf, instanceOf, Native]

 ...
 */

(function () {

    this.MooTools = {
        version: '1.4.5',
        build: '74e34796f5f76640cdb98853004650aea1499d69'
    };

// typeOf, instanceOf

    var typeOf = this.typeOf = function (item) {
        if (item == null) return 'null';
        if (item.$family != null) return item.$family();

        if (item.nodeName) {
            if (item.nodeType == 1) return 'element';
            if (item.nodeType == 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
        } else if (typeof item.length == 'number') {
            if (item.callee) return 'arguments';
            if ('item' in item) return 'collection';
        }

        return typeof item;
    };

    var instanceOf = this.instanceOf = function (item, object) {
        if (item == null) return false;
        var constructor = item.$constructor || item.constructor;
        while (constructor) {
            if (constructor === object) return true;
            constructor = constructor.parent;
        }
        /*<ltIE8>*/
        if (!item.hasOwnProperty) return false;
        /*</ltIE8>*/
        return item instanceof object;
    };

// Function overloading

    var Function = this.Function;

    var enumerables = true;
    for (var i in {toString: 1}) enumerables = null;
    if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

    Function.prototype.overloadSetter = function (usePlural) {
        var self = this;
        return function (a, b) {
            if (a == null) return this;
            if (usePlural || typeof a != 'string') {
                for (var k in a) self.call(this, k, a[k]);
                if (enumerables) for (var i = enumerables.length; i--;) {
                    k = enumerables[i];
                    if (a.hasOwnProperty(k)) self.call(this, k, a[k]);
                }
            } else {
                self.call(this, a, b);
            }
            return this;
        };
    };

    Function.prototype.overloadGetter = function (usePlural) {
        var self = this;
        return function (a) {
            var args, result;
            if (typeof a != 'string') args = a;
            else if (arguments.length > 1) args = arguments;
            else if (usePlural) args = [a];
            if (args) {
                result = {};
                for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
            } else {
                result = self.call(this, a);
            }
            return result;
        };
    };

    Function.prototype.extend = function (key, value) {
        this[key] = value;
    }.overloadSetter();

    Function.prototype.implement = function (key, value) {
        this.prototype[key] = value;
    }.overloadSetter();

// From

    var slice = Array.prototype.slice;

    Function.from = function (item) {
        return (typeOf(item) == 'function') ? item : function () {
            return item;
        };
    };

    Array.from = function (item) {
        if (item == null) return [];
        return (Type.isEnumerable(item) && typeof item != 'string') ? (typeOf(item) == 'array') ? item : slice.call(item) : [item];
    };

    Number.from = function (item) {
        var number = parseFloat(item);
        return isFinite(number) ? number : null;
    };

    String.from = function (item) {
        return item + '';
    };

// hide, protect

    Function.implement({

        hide: function () {
            this.$hidden = true;
            return this;
        },

        protect: function () {
            this.$protected = true;
            return this;
        }

    });

// Type

    var Type = this.Type = function (name, object) {
        if (name) {
            var lower = name.toLowerCase();
            var typeCheck = function (item) {
                return (typeOf(item) == lower);
            };

            Type['is' + name] = typeCheck;
            if (object != null) {
                object.prototype.$family = (function () {
                    return lower;
                }).hide();

            }
        }

        if (object == null) return null;

        object.extend(this);
        object.$constructor = Type;
        object.prototype.$constructor = object;

        return object;
    };

    var toString = Object.prototype.toString;

    Type.isEnumerable = function (item) {
        return (item != null && typeof item.length == 'number' && toString.call(item) != '[object Function]' );
    };

    var hooks = {};

    var hooksOf = function (object) {
        var type = typeOf(object.prototype);
        return hooks[type] || (hooks[type] = []);
    };

    var implement = function (name, method) {
        if (method && method.$hidden) return;

        var hooks = hooksOf(this);

        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            if (typeOf(hook) == 'type') implement.call(hook, name, method);
            else hook.call(this, name, method);
        }

        var previous = this.prototype[name];
        if (previous == null || !previous.$protected) this.prototype[name] = method;

        if (this[name] == null && typeOf(method) == 'function') extend.call(this, name, function (item) {
            return method.apply(item, slice.call(arguments, 1));
        });
    };

    var extend = function (name, method) {
        if (method && method.$hidden) return;
        var previous = this[name];
        if (previous == null || !previous.$protected) this[name] = method;
    };

    Type.implement({

        implement: implement.overloadSetter(),

        extend: extend.overloadSetter(),

        alias: function (name, existing) {
            implement.call(this, name, this.prototype[existing]);
        }.overloadSetter(),

        mirror: function (hook) {
            hooksOf(this).push(hook);
            return this;
        }

    });

    new Type('Type', Type);

// Default Types

    var force = function (name, object, methods) {
        var isType = (object != Object),
            prototype = object.prototype;

        if (isType) object = new Type(name, object);

        for (var i = 0, l = methods.length; i < l; i++) {
            var key = methods[i],
                generic = object[key],
                proto = prototype[key];

            if (generic) generic.protect();
            if (isType && proto) object.implement(key, proto.protect());
        }

        if (isType) {
            var methodsEnumerable = prototype.propertyIsEnumerable(methods[0]);
            object.forEachMethod = function (fn) {
                if (!methodsEnumerable) for (var i = 0, l = methods.length; i < l; i++) {
                    fn.call(prototype, prototype[methods[i]], methods[i]);
                }
                for (var key in prototype) fn.call(prototype, prototype[key], key)
            };
        }

        return force;
    };

    force('String', String, [
        'charAt', 'charCodeAt', 'concat', 'indexOf', 'lastIndexOf', 'match', 'quote', 'replace', 'search',
        'slice', 'split', 'substr', 'substring', 'trim', 'toLowerCase', 'toUpperCase'
    ])('Array', Array, [
        'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice',
        'indexOf', 'lastIndexOf', 'filter', 'forEach', 'every', 'map', 'some', 'reduce', 'reduceRight'
    ])('Number', Number, [
        'toExponential', 'toFixed', 'toLocaleString', 'toPrecision'
    ])('Function', Function, [
        'apply', 'call', 'bind'
    ])('RegExp', RegExp, [
        'exec', 'test'
    ])('Object', Object, [
        'create', 'defineProperty', 'defineProperties', 'keys',
        'getPrototypeOf', 'getOwnPropertyDescriptor', 'getOwnPropertyNames',
        'preventExtensions', 'isExtensible', 'seal', 'isSealed', 'freeze', 'isFrozen'
    ])('Date', Date, ['now']);

    Object.extend = extend.overloadSetter();

    Date.extend('now', function () {
        return +(new Date);
    });

    new Type('Boolean', Boolean);

// fixes NaN returning as Number

    Number.prototype.$family = function () {
        return isFinite(this) ? 'number' : 'null';
    }.hide();

// Number.random

    Number.extend('random', function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    });

// forEach, each

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    Object.extend('forEach', function (object, fn, bind) {
        for (var key in object) {
            if (hasOwnProperty.call(object, key)) fn.call(bind, object[key], key, object);
        }
    });

    Object.each = Object.forEach;

    Array.implement({

        forEach: function (fn, bind) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this) fn.call(bind, this[i], i, this);
            }
        },

        each: function (fn, bind) {
            Array.forEach(this, fn, bind);
            return this;
        }

    });

// Array & Object cloning, Object merging and appending

    var cloneOf = function (item) {
        switch (typeOf(item)) {
            case 'array':
                return item.clone();
            case 'object':
                return Object.clone(item);
            default:
                return item;
        }
    };

    Array.implement('clone', function () {
        var i = this.length, clone = new Array(i);
        while (i--) clone[i] = cloneOf(this[i]);
        return clone;
    });

    var mergeOne = function (source, key, current) {
        switch (typeOf(current)) {
            case 'object':
                if (typeOf(source[key]) == 'object') Object.merge(source[key], current);
                else source[key] = Object.clone(current);
                break;
            case 'array':
                source[key] = current.clone();
                break;
            default:
                source[key] = current;
        }
        return source;
    };

    Object.extend({

        merge: function (source, k, v) {
            if (typeOf(k) == 'string') return mergeOne(source, k, v);
            for (var i = 1, l = arguments.length; i < l; i++) {
                var object = arguments[i];
                for (var key in object) mergeOne(source, key, object[key]);
            }
            return source;
        },

        clone: function (object) {
            var clone = {};
            for (var key in object) clone[key] = cloneOf(object[key]);
            return clone;
        },

        append: function (original) {
            for (var i = 1, l = arguments.length; i < l; i++) {
                var extended = arguments[i] || {};
                for (var key in extended) original[key] = extended[key];
            }
            return original;
        }

    });

// Object-less types

    ['Object', 'WhiteSpace', 'TextNode', 'Collection', 'Arguments'].each(function (name) {
        new Type(name);
    });

// Unique ID

    var UID = Date.now();

    String.extend('uniqueID', function () {
        return (UID++).toString(36);
    });


})();


/*
 ---

 name: Array

 description: Contains Array Prototypes like each, contains, and erase.

 license: MIT-style license.

 requires: Type

 provides: Array

 ...
 */

Array.implement({

    /*<!ES5>*/
    every: function (fn, bind) {
        for (var i = 0, l = this.length >>> 0; i < l; i++) {
            if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
        }
        return true;
    },

    filter: function (fn, bind) {
        var results = [];
        for (var value, i = 0, l = this.length >>> 0; i < l; i++) if (i in this) {
            value = this[i];
            if (fn.call(bind, value, i, this)) results.push(value);
        }
        return results;
    },

    indexOf: function (item, from) {
        var length = this.length >>> 0;
        for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
            if (this[i] === item) return i;
        }
        return -1;
    },

    map: function (fn, bind) {
        var length = this.length >>> 0, results = Array(length);
        for (var i = 0; i < length; i++) {
            if (i in this) results[i] = fn.call(bind, this[i], i, this);
        }
        return results;
    },

    some: function (fn, bind) {
        for (var i = 0, l = this.length >>> 0; i < l; i++) {
            if ((i in this) && fn.call(bind, this[i], i, this)) return true;
        }
        return false;
    },
    /*</!ES5>*/

    clean: function () {
        return this.filter(function (item) {
            return item != null;
        });
    },

    invoke: function (methodName) {
        var args = Array.slice(arguments, 1);
        return this.map(function (item) {
            return item[methodName].apply(item, args);
        });
    },

    associate: function (keys) {
        var obj = {}, length = Math.min(this.length, keys.length);
        for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
        return obj;
    },

    link: function (object) {
        var result = {};
        for (var i = 0, l = this.length; i < l; i++) {
            for (var key in object) {
                if (object[key](this[i])) {
                    result[key] = this[i];
                    delete object[key];
                    break;
                }
            }
        }
        return result;
    },

    contains: function (item, from) {
        return this.indexOf(item, from) != -1;
    },

    append: function (array) {
        this.push.apply(this, array);
        return this;
    },

    getLast: function () {
        return (this.length) ? this[this.length - 1] : null;
    },

    getRandom: function () {
        return (this.length) ? this[Number.random(0, this.length - 1)] : null;
    },

    include: function (item) {
        if (!this.contains(item)) this.push(item);
        return this;
    },

    combine: function (array) {
        for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
        return this;
    },

    erase: function (item) {
        for (var i = this.length; i--;) {
            if (this[i] === item) this.splice(i, 1);
        }
        return this;
    },

    empty: function () {
        this.length = 0;
        return this;
    },

    flatten: function () {
        var array = [];
        for (var i = 0, l = this.length; i < l; i++) {
            var type = typeOf(this[i]);
            if (type == 'null') continue;
            array = array.concat((type == 'array' || type == 'collection' || type == 'arguments' || instanceOf(this[i], Array)) ? Array.flatten(this[i]) : this[i]);
        }
        return array;
    },

    pick: function () {
        for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] != null) return this[i];
        }
        return null;
    },

    hexToRgb: function (array) {
        if (this.length != 3) return null;
        var rgb = this.map(function (value) {
            if (value.length == 1) value += value;
            return value.toInt(16);
        });
        return (array) ? rgb : 'rgb(' + rgb + ')';
    },

    rgbToHex: function (array) {
        if (this.length < 3) return null;
        if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
        var hex = [];
        for (var i = 0; i < 3; i++) {
            var bit = (this[i] - 0).toString(16);
            hex.push((bit.length == 1) ? '0' + bit : bit);
        }
        return (array) ? hex : '#' + hex.join('');
    }

});


/*
 ---

 name: String

 description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

 license: MIT-style license.

 requires: Type

 provides: String

 ...
 */

String.implement({

    test: function (regex, params) {
        return ((typeOf(regex) == 'regexp') ? regex : new RegExp('' + regex, params)).test(this);
    },

    contains: function (string, separator) {
        return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : String(this).indexOf(string) > -1;
    },

    trim: function () {
        return String(this).replace(/^\s+|\s+$/g, '');
    },

    clean: function () {
        return String(this).replace(/\s+/g, ' ').trim();
    },

    camelCase: function () {
        return String(this).replace(/-\D/g, function (match) {
            return match.charAt(1).toUpperCase();
        });
    },

    hyphenate: function () {
        return String(this).replace(/[A-Z]/g, function (match) {
            return ('-' + match.charAt(0).toLowerCase());
        });
    },

    capitalize: function () {
        return String(this).replace(/\b[a-z]/g, function (match) {
            return match.toUpperCase();
        });
    },

    escapeRegExp: function () {
        return String(this).replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
    },

    toInt: function (base) {
        return parseInt(this, base || 10);
    },

    toFloat: function () {
        return parseFloat(this);
    },

    hexToRgb: function (array) {
        var hex = String(this).match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
        return (hex) ? hex.slice(1).hexToRgb(array) : null;
    },

    rgbToHex: function (array) {
        var rgb = String(this).match(/\d{1,3}/g);
        return (rgb) ? rgb.rgbToHex(array) : null;
    },

    substitute: function (object, regexp) {
        return String(this).replace(regexp || (/\\?\{([^{}]+)\}/g), function (match, name) {
            if (match.charAt(0) == '\\') return match.slice(1);
            return (object[name] != null) ? object[name] : '';
        });
    }

});


/*
 ---

 name: Number

 description: Contains Number Prototypes like limit, round, times, and ceil.

 license: MIT-style license.

 requires: Type

 provides: Number

 ...
 */

Number.implement({

    limit: function (min, max) {
        return Math.min(max, Math.max(min, this));
    },

    round: function (precision) {
        precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
        return Math.round(this * precision) / precision;
    },

    times: function (fn, bind) {
        for (var i = 0; i < this; i++) fn.call(bind, i, this);
    },

    toFloat: function () {
        return parseFloat(this);
    },

    toInt: function (base) {
        return parseInt(this, base || 10);
    }

});

Number.alias('each', 'times');

(function (math) {
    var methods = {};
    math.each(function (name) {
        if (!Number[name]) methods[name] = function () {
            return Math[name].apply(null, [this].concat(Array.from(arguments)));
        };
    });
    Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);


/*
 ---

 name: Function

 description: Contains Function Prototypes like create, bind, pass, and delay.

 license: MIT-style license.

 requires: Type

 provides: Function

 ...
 */

Function.extend({

    attempt: function () {
        for (var i = 0, l = arguments.length; i < l; i++) {
            try {
                return arguments[i]();
            } catch (e) {
            }
        }
        return null;
    }

});

Function.implement({

    attempt: function (args, bind) {
        try {
            return this.apply(bind, Array.from(args));
        } catch (e) {
        }

        return null;
    },

    /*<!ES5-bind>*/
    bind: function (that) {
        var self = this,
            args = arguments.length > 1 ? Array.slice(arguments, 1) : null,
            F = function () {
            };

        var bound = function () {
            var context = that, length = arguments.length;
            if (this instanceof bound) {
                F.prototype = self.prototype;
                context = new F;
            }
            var result = (!args && !length)
                ? self.call(context)
                : self.apply(context, args && length ? args.concat(Array.slice(arguments)) : args || arguments);
            return context == that ? result : context;
        };
        return bound;
    },
    /*</!ES5-bind>*/

    pass: function (args, bind) {
        var self = this;
        if (args != null) args = Array.from(args);
        return function () {
            return self.apply(bind, args || arguments);
        };
    },

    delay: function (delay, bind, args) {
        return setTimeout(this.pass((args == null ? [] : args), bind), delay);
    },

    periodical: function (periodical, bind, args) {
        return setInterval(this.pass((args == null ? [] : args), bind), periodical);
    }

});


/*
 ---

 name: Object

 description: Object generic methods

 license: MIT-style license.

 requires: Type

 provides: [Object, Hash]

 ...
 */

(function () {

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    Object.extend({

        subset: function (object, keys) {
            var results = {};
            for (var i = 0, l = keys.length; i < l; i++) {
                var k = keys[i];
                if (k in object) results[k] = object[k];
            }
            return results;
        },

        map: function (object, fn, bind) {
            var results = {};
            for (var key in object) {
                if (hasOwnProperty.call(object, key)) results[key] = fn.call(bind, object[key], key, object);
            }
            return results;
        },

        filter: function (object, fn, bind) {
            var results = {};
            for (var key in object) {
                var value = object[key];
                if (hasOwnProperty.call(object, key) && fn.call(bind, value, key, object)) results[key] = value;
            }
            return results;
        },

        every: function (object, fn, bind) {
            for (var key in object) {
                if (hasOwnProperty.call(object, key) && !fn.call(bind, object[key], key)) return false;
            }
            return true;
        },

        some: function (object, fn, bind) {
            for (var key in object) {
                if (hasOwnProperty.call(object, key) && fn.call(bind, object[key], key)) return true;
            }
            return false;
        },

        keys: function (object) {
            var keys = [];
            for (var key in object) {
                if (hasOwnProperty.call(object, key)) keys.push(key);
            }
            return keys;
        },

        values: function (object) {
            var values = [];
            for (var key in object) {
                if (hasOwnProperty.call(object, key)) values.push(object[key]);
            }
            return values;
        },

        getLength: function (object) {
            return Object.keys(object).length;
        },

        keyOf: function (object, value) {
            for (var key in object) {
                if (hasOwnProperty.call(object, key) && object[key] === value) return key;
            }
            return null;
        },

        contains: function (object, value) {
            return Object.keyOf(object, value) != null;
        },

        toQueryString: function (object, base) {
            var queryString = [];

            Object.each(object, function (value, key) {
                if (base) key = base + '[' + key + ']';
                var result;
                switch (typeOf(value)) {
                    case 'object':
                        result = Object.toQueryString(value, key);
                        break;
                    case 'array':
                        var qs = {};
                        value.each(function (val, i) {
                            qs[i] = val;
                        });
                        result = Object.toQueryString(qs, key);
                        break;
                    default:
                        result = key + '=' + encodeURIComponent(value);
                }
                if (value != null) queryString.push(result);
            });

            return queryString.join('&');
        }

    });

})();


/*
 ---

 name: Browser

 description: The Browser Object. Contains Browser initialization, Window and Document, and the Browser Hash.

 license: MIT-style license.

 requires: [Array, Function, Number, String]

 provides: [Browser, Window, Document]

 ...
 */

(function () {

    var document = this.document;
    var window = document.window = this;

    var ua = navigator.userAgent.toLowerCase(),
        platform = navigator.platform.toLowerCase(),
        UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0],
        mode = UA[1] == 'ie' && document.documentMode;

    var Browser = this.Browser = {

        extend: Function.prototype.extend,

        name: (UA[1] == 'version') ? UA[3] : UA[1],

        version: mode || parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]),

        Platform: {
            name: ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0]
        },

        Features: {
            xpath: !!(document.evaluate),
            air: !!(window.runtime),
            query: !!(document.querySelector),
            json: !!(window.JSON)
        },

        Plugins: {}

    };

    Browser[Browser.name] = true;
    Browser[Browser.name + parseInt(Browser.version, 10)] = true;
    Browser.Platform[Browser.Platform.name] = true;

// Request

    Browser.Request = (function () {

        var XMLHTTP = function () {
            return new XMLHttpRequest();
        };

        var MSXML2 = function () {
            return new ActiveXObject('MSXML2.XMLHTTP');
        };

        var MSXML = function () {
            return new ActiveXObject('Microsoft.XMLHTTP');
        };

        return Function.attempt(function () {
            XMLHTTP();
            return XMLHTTP;
        }, function () {
            MSXML2();
            return MSXML2;
        }, function () {
            MSXML();
            return MSXML;
        });

    })();

    Browser.Features.xhr = !!(Browser.Request);

// Flash detection

    var version = (Function.attempt(function () {
        return navigator.plugins['Shockwave Flash'].description;
    }, function () {
        return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
    }) || '0 r0').match(/\d+/g);

    Browser.Plugins.Flash = {
        version: Number(version[0] || '0.' + version[1]) || 0,
        build: Number(version[2]) || 0
    };

// String scripts

    Browser.exec = function (text) {
        if (!text) return text;
        if (window.execScript) {
            window.execScript(text);
        } else {
            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.text = text;
            document.head.appendChild(script);
            document.head.removeChild(script);
        }
        return text;
    };

    String.implement('stripScripts', function (exec) {
        var scripts = '';
        var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function (all, code) {
            scripts += code + '\n';
            return '';
        });
        if (exec === true) Browser.exec(scripts);
        else if (typeOf(exec) == 'function') exec(scripts, text);
        return text;
    });

// Window, Document

    Browser.extend({
        Document: this.Document,
        Window: this.Window,
        Element: this.Element,
        Event: this.Event
    });

    this.Window = this.$constructor = new Type('Window', function () {
    });

    this.$family = Function.from('window').hide();

    Window.mirror(function (name, method) {
        window[name] = method;
    });

    this.Document = document.$constructor = new Type('Document', function () {
    });

    document.$family = Function.from('document').hide();

    Document.mirror(function (name, method) {
        document[name] = method;
    });

    document.html = document.documentElement;
    if (!document.head) document.head = document.getElementsByTagName('head')[0];

    if (document.execCommand) try {
        document.execCommand("BackgroundImageCache", false, true);
    } catch (e) {
    }

    /*<ltIE9>*/
    if (this.attachEvent && !this.addEventListener) {
        var unloadEvent = function () {
            this.detachEvent('onunload', unloadEvent);
            document.head = document.html = document.window = null;
        };
        this.attachEvent('onunload', unloadEvent);
    }

// IE fails on collections and <select>.options (refers to <select>)
    var arrayFrom = Array.from;
    try {
        arrayFrom(document.html.childNodes);
    } catch (e) {
        Array.from = function (item) {
            if (typeof item != 'string' && Type.isEnumerable(item) && typeOf(item) != 'array') {
                var i = item.length, array = new Array(i);
                while (i--) array[i] = item[i];
                return array;
            }
            return arrayFrom(item);
        };

        var prototype = Array.prototype,
            slice = prototype.slice;
        ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice'].each(function (name) {
            var method = prototype[name];
            Array[name] = function (item) {
                return method.apply(Array.from(item), slice.call(arguments, 1));
            };
        });
    }
    /*</ltIE9>*/


})();


/*
 ---

 name: Event

 description: Contains the Event Type, to make the event object cross-browser.

 license: MIT-style license.

 requires: [Window, Document, Array, Function, String, Object]

 provides: Event

 ...
 */

(function () {

    var _keys = {};

    var DOMEvent = this.DOMEvent = new Type('DOMEvent', function (event, win) {
        if (!win) win = window;
        event = event || win.event;
        if (event.$extended) return event;
        this.event = event;
        this.$extended = true;
        this.shift = event.shiftKey;
        this.control = event.ctrlKey;
        this.alt = event.altKey;
        this.meta = event.metaKey;
        var type = this.type = event.type;
        var target = event.target || event.srcElement;
        while (target && target.nodeType == 3) target = target.parentNode;
        this.target = document.id(target);

        if (type.indexOf('key') == 0) {
            var code = this.code = (event.which || event.keyCode);
            this.key = _keys[code];
            if (type == 'keydown') {
                if (code > 111 && code < 124) this.key = 'f' + (code - 111);
                else if (code > 95 && code < 106) this.key = code - 96;
            }
            if (this.key == null) this.key = String.fromCharCode(code).toLowerCase();
        } else if (type == 'click' || type == 'dblclick' || type == 'contextmenu' || type == 'DOMMouseScroll' || type.indexOf('mouse') == 0) {
            var doc = win.document;
            doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
            this.page = {
                x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
                y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
            };
            this.client = {
                x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
                y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
            };
            if (type == 'DOMMouseScroll' || type == 'mousewheel')
                this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;

            this.rightClick = (event.which == 3 || event.button == 2);
            if (type == 'mouseover' || type == 'mouseout') {
                var related = event.relatedTarget || event[(type == 'mouseover' ? 'from' : 'to') + 'Element'];
                while (related && related.nodeType == 3) related = related.parentNode;
                this.relatedTarget = document.id(related);
            }
        } else if (type.indexOf('touch') == 0 || type.indexOf('gesture') == 0) {
            this.rotation = event.rotation;
            this.scale = event.scale;
            this.targetTouches = event.targetTouches;
            this.changedTouches = event.changedTouches;
            var touches = this.touches = event.touches;
            if (touches && touches[0]) {
                var touch = touches[0];
                this.page = {x: touch.pageX, y: touch.pageY};
                this.client = {x: touch.clientX, y: touch.clientY};
            }
        }

        if (!this.client) this.client = {};
        if (!this.page) this.page = {};
    });

    DOMEvent.implement({

        stop: function () {
            return this.preventDefault().stopPropagation();
        },

        stopPropagation: function () {
            if (this.event.stopPropagation) this.event.stopPropagation();
            else this.event.cancelBubble = true;
            return this;
        },

        preventDefault: function () {
            if (this.event.preventDefault) this.event.preventDefault();
            else this.event.returnValue = false;
            return this;
        }

    });

    DOMEvent.defineKey = function (code, key) {
        _keys[code] = key;
        return this;
    };

    DOMEvent.defineKeys = DOMEvent.defineKey.overloadSetter(true);

    DOMEvent.defineKeys({
        '38': 'up', '40': 'down', '37': 'left', '39': 'right',
        '27': 'esc', '32': 'space', '8': 'backspace', '9': 'tab',
        '46': 'delete', '13': 'enter'
    });

})();


/*
 ---

 name: Class

 description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

 license: MIT-style license.

 requires: [Array, String, Function, Number]

 provides: Class

 ...
 */

(function () {

    var Class = this.Class = new Type('Class', function (params) {
        if (instanceOf(params, Function)) params = {initialize: params};

        var newClass = function () {
            reset(this);
            if (newClass.$prototyping) return this;
            this.$caller = null;
            var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
            this.$caller = this.caller = null;
            return value;
        }.extend(this).implement(params);

        newClass.$constructor = Class;
        newClass.prototype.$constructor = newClass;
        newClass.prototype.parent = parent;

        return newClass;
    });

    var parent = function () {
        if (!this.$caller) throw new Error('The method "parent" cannot be called.');
        var name = this.$caller.$name,
            parent = this.$caller.$owner.parent,
            previous = (parent) ? parent.prototype[name] : null;
        if (!previous) throw new Error('The method "' + name + '" has no parent.');
        return previous.apply(this, arguments);
    };

    var reset = function (object) {
        for (var key in object) {
            var value = object[key];
            switch (typeOf(value)) {
                case 'object':
                    var F = function () {
                    };
                    F.prototype = value;
                    object[key] = reset(new F);
                    break;
                case 'array':
                    object[key] = value.clone();
                    break;
            }
        }
        return object;
    };

    var wrap = function (self, key, method) {
        if (method.$origin) method = method.$origin;
        var wrapper = function () {
            if (method.$protected && this.$caller == null) throw new Error('The method "' + key + '" cannot be called.');
            var caller = this.caller, current = this.$caller;
            this.caller = current;
            this.$caller = wrapper;
            var result = method.apply(this, arguments);
            this.$caller = current;
            this.caller = caller;
            return result;
        }.extend({$owner: self, $origin: method, $name: key});
        return wrapper;
    };

    var implement = function (key, value, retain) {
        if (Class.Mutators.hasOwnProperty(key)) {
            value = Class.Mutators[key].call(this, value);
            if (value == null) return this;
        }

        if (typeOf(value) == 'function') {
            if (value.$hidden) return this;
            this.prototype[key] = (retain) ? value : wrap(this, key, value);
        } else {
            Object.merge(this.prototype, key, value);
        }

        return this;
    };

    var getInstance = function (klass) {
        klass.$prototyping = true;
        var proto = new klass;
        delete klass.$prototyping;
        return proto;
    };

    Class.implement('implement', implement.overloadSetter());

    Class.Mutators = {

        Extends: function (parent) {
            this.parent = parent;
            this.prototype = getInstance(parent);
        },

        Implements: function (items) {
            Array.from(items).each(function (item) {
                var instance = new item;
                for (var key in instance) implement.call(this, key, instance[key], true);
            }, this);
        }
    };

})();


/*
 ---

 name: Class.Extras

 description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

 license: MIT-style license.

 requires: Class

 provides: [Class.Extras, Chain, Events, Options]

 ...
 */

(function () {

    this.Chain = new Class({

        $chain: [],

        chain: function () {
            this.$chain.append(Array.flatten(arguments));
            return this;
        },

        callChain: function () {
            return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
        },

        clearChain: function () {
            this.$chain.empty();
            return this;
        }

    });

    var removeOn = function (string) {
        return string.replace(/^on([A-Z])/, function (full, first) {
            return first.toLowerCase();
        });
    };

    this.Events = new Class({

        $events: {},

        addEvent: function (type, fn, internal) {
            type = removeOn(type);


            this.$events[type] = (this.$events[type] || []).include(fn);
            if (internal) fn.internal = true;
            return this;
        },

        addEvents: function (events) {
            for (var type in events) this.addEvent(type, events[type]);
            return this;
        },

        fireEvent: function (type, args, delay) {
            type = removeOn(type);
            var events = this.$events[type];
            if (!events) return this;
            args = Array.from(args);
            events.each(function (fn) {
                if (delay) fn.delay(delay, this, args);
                else fn.apply(this, args);
            }, this);
            return this;
        },

        removeEvent: function (type, fn) {
            type = removeOn(type);
            var events = this.$events[type];
            if (events && !fn.internal) {
                var index = events.indexOf(fn);
                if (index != -1) delete events[index];
            }
            return this;
        },

        removeEvents: function (events) {
            var type;
            if (typeOf(events) == 'object') {
                for (type in events) this.removeEvent(type, events[type]);
                return this;
            }
            if (events) events = removeOn(events);
            for (type in this.$events) {
                if (events && events != type) continue;
                var fns = this.$events[type];
                for (var i = fns.length; i--;) if (i in fns) {
                    this.removeEvent(type, fns[i]);
                }
            }
            return this;
        }

    });

    this.Options = new Class({

        setOptions: function () {
            var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments));
            if (this.addEvent) for (var option in options) {
                if (typeOf(options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
                this.addEvent(option, options[option]);
                delete options[option];
            }
            return this;
        }

    });

})();


/*
 ---
 name: Slick.Parser
 description: Standalone CSS3 Selector parser
 provides: Slick.Parser
 ...
 */

;
(function () {

    var parsed,
        separatorIndex,
        combinatorIndex,
        reversed,
        cache = {},
        reverseCache = {},
        reUnescape = /\\/g;

    var parse = function (expression, isReversed) {
        if (expression == null) return null;
        if (expression.Slick === true) return expression;
        expression = ('' + expression).replace(/^\s+|\s+$/g, '');
        reversed = !!isReversed;
        var currentCache = (reversed) ? reverseCache : cache;
        if (currentCache[expression]) return currentCache[expression];
        parsed = {
            Slick: true,
            expressions: [],
            raw: expression,
            reverse: function () {
                return parse(this.raw, true);
            }
        };
        separatorIndex = -1;
        while (expression != (expression = expression.replace(regexp, parser)));
        parsed.length = parsed.expressions.length;
        return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
    };

    var reverseCombinator = function (combinator) {
        if (combinator === '!') return ' ';
        else if (combinator === ' ') return '!';
        else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
        else return '!' + combinator;
    };

    var reverse = function (expression) {
        var expressions = expression.expressions;
        for (var i = 0; i < expressions.length; i++) {
            var exp = expressions[i];
            var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

            for (var j = 0; j < exp.length; j++) {
                var cexp = exp[j];
                if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
                cexp.combinator = cexp.reverseCombinator;
                delete cexp.reverseCombinator;
            }

            exp.reverse().push(last);
        }
        return expression;
    };

    var escapeRegExp = function (string) {// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
        return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function (match) {
            return '\\' + match;
        });
    };

    var regexp = new RegExp(
        /*
         #!/usr/bin/env ruby
         puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
         __END__
         "(?x)^(?:\
         \\s* ( , ) \\s*               # Separator          \n\
         | \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
         |      ( \\s+ )                 # CombinatorChildren \n\
         |      ( <unicode>+ | \\* )     # Tag                \n\
         | \\#  ( <unicode>+       )     # ID                 \n\
         | \\.  ( <unicode>+       )     # ClassName          \n\
         |                               # Attribute          \n\
         \\[  \
         \\s* (<unicode1>+)  (?:  \
         \\s* ([*^$!~|]?=)  (?:  \
         \\s* (?:\
         ([\"']?)(.*?)\\9 \
         )\
         )  \
         )?  \\s*  \
         \\](?!\\]) \n\
         |   :+ ( <unicode>+ )(?:\
         \\( (?:\
         (?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
         ) \\)\
         )?\
         )"
         */
        "^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
            .replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
            .replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
            .replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
    );

    function parser(rawMatch,
                    separator,
                    combinator,
                    combinatorChildren,
                    tagName,
                    id,
                    className,
                    attributeKey,
                    attributeOperator,
                    attributeQuote,
                    attributeValue,
                    pseudoMarker,
                    pseudoClass,
                    pseudoQuote,
                    pseudoClassQuotedValue,
                    pseudoClassValue) {
        if (separator || separatorIndex === -1) {
            parsed.expressions[++separatorIndex] = [];
            combinatorIndex = -1;
            if (separator) return '';
        }

        if (combinator || combinatorChildren || combinatorIndex === -1) {
            combinator = combinator || ' ';
            var currentSeparator = parsed.expressions[separatorIndex];
            if (reversed && currentSeparator[combinatorIndex])
                currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
            currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
        }

        var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

        if (tagName) {
            currentParsed.tag = tagName.replace(reUnescape, '');

        } else if (id) {
            currentParsed.id = id.replace(reUnescape, '');

        } else if (className) {
            className = className.replace(reUnescape, '');

            if (!currentParsed.classList) currentParsed.classList = [];
            if (!currentParsed.classes) currentParsed.classes = [];
            currentParsed.classList.push(className);
            currentParsed.classes.push({
                value: className,
                regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
            });

        } else if (pseudoClass) {
            pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
            pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

            if (!currentParsed.pseudos) currentParsed.pseudos = [];
            currentParsed.pseudos.push({
                key: pseudoClass.replace(reUnescape, ''),
                value: pseudoClassValue,
                type: pseudoMarker.length == 1 ? 'class' : 'element'
            });

        } else if (attributeKey) {
            attributeKey = attributeKey.replace(reUnescape, '');
            attributeValue = (attributeValue || '').replace(reUnescape, '');

            var test, regexp;

            switch (attributeOperator) {
                case '^=' :
                    regexp = new RegExp('^' + escapeRegExp(attributeValue));
                    break;
                case '$=' :
                    regexp = new RegExp(escapeRegExp(attributeValue) + '$');
                    break;
                case '~=' :
                    regexp = new RegExp('(^|\\s)' + escapeRegExp(attributeValue) + '(\\s|$)');
                    break;
                case '|=' :
                    regexp = new RegExp('^' + escapeRegExp(attributeValue) + '(-|$)');
                    break;
                case  '=' :
                    test = function (value) {
                        return attributeValue == value;
                    };
                    break;
                case '*=' :
                    test = function (value) {
                        return value && value.indexOf(attributeValue) > -1;
                    };
                    break;
                case '!=' :
                    test = function (value) {
                        return attributeValue != value;
                    };
                    break;
                default   :
                    test = function (value) {
                        return !!value;
                    };
            }

            if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function () {
                return false;
            };

            if (!test) test = function (value) {
                return value && regexp.test(value);
            };

            if (!currentParsed.attributes) currentParsed.attributes = [];
            currentParsed.attributes.push({
                key: attributeKey,
                operator: attributeOperator,
                value: attributeValue,
                test: test
            });

        }

        return '';
    };

// Slick NS

    var Slick = (this.Slick || {});

    Slick.parse = function (expression) {
        return parse(expression);
    };

    Slick.escapeRegExp = escapeRegExp;

    if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);


/*
 ---
 name: Slick.Finder
 description: The new, superfast css selector engine.
 provides: Slick.Finder
 requires: Slick.Parser
 ...
 */

;
(function () {

    var local = {},
        featuresCache = {},
        toString = Object.prototype.toString;

// Feature / Bug detection

    local.isNativeCode = function (fn) {
        return (/\{\s*\[native code\]\s*\}/).test('' + fn);
    };

    local.isXML = function (document) {
        return (!!document.xmlVersion) || (!!document.xml) || (toString.call(document) == '[object XMLDocument]') ||
            (document.nodeType == 9 && document.documentElement.nodeName != 'HTML');
    };

    local.setDocument = function (document) {

        // convert elements / window arguments to document. if document cannot be extrapolated, the function returns.
        var nodeType = document.nodeType;
        if (nodeType == 9); // document
        else if (nodeType) document = document.ownerDocument; // node
        else if (document.navigator) document = document.document; // window
        else return;

        // check if it's the old document

        if (this.document === document) return;
        this.document = document;

        // check if we have done feature detection on this document before

        var root = document.documentElement,
            rootUid = this.getUIDXML(root),
            features = featuresCache[rootUid],
            feature;

        if (features) {
            for (feature in features) {
                this[feature] = features[feature];
            }
            return;
        }

        features = featuresCache[rootUid] = {};

        features.root = root;
        features.isXMLDocument = this.isXML(document);

        features.brokenStarGEBTN
            = features.starSelectsClosedQSA
            = features.idGetsName
            = features.brokenMixedCaseQSA
            = features.brokenGEBCN
            = features.brokenCheckedQSA
            = features.brokenEmptyAttributeQSA
            = features.isHTMLDocument
            = features.nativeMatchesSelector
            = false;

        var starSelectsClosed, starSelectsComments,
            brokenSecondClassNameGEBCN, cachedGetElementsByClassName,
            brokenFormAttributeGetter;

        var selected, id = 'slick_uniqueid';
        var testNode = document.createElement('div');

        var testRoot = document.body || document.getElementsByTagName('body')[0] || root;
        testRoot.appendChild(testNode);

        // on non-HTML documents innerHTML and getElementsById doesnt work properly
        try {
            testNode.innerHTML = '<a id="' + id + '"></a>';
            features.isHTMLDocument = !!document.getElementById(id);
        } catch (e) {
        }
        ;

        if (features.isHTMLDocument) {

            testNode.style.display = 'none';

            // IE returns comment nodes for getElementsByTagName('*') for some documents
            testNode.appendChild(document.createComment(''));
            starSelectsComments = (testNode.getElementsByTagName('*').length > 1);

            // IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
            try {
                testNode.innerHTML = 'foo</foo>';
                selected = testNode.getElementsByTagName('*');
                starSelectsClosed = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
            } catch (e) {
            }
            ;

            features.brokenStarGEBTN = starSelectsComments || starSelectsClosed;

            // IE returns elements with the name instead of just id for getElementsById for some documents
            try {
                testNode.innerHTML = '<a name="' + id + '"></a><b id="' + id + '"></b>';
                features.idGetsName = document.getElementById(id) === testNode.firstChild;
            } catch (e) {
            }
            ;

            if (testNode.getElementsByClassName) {

                // Safari 3.2 getElementsByClassName caches results
                try {
                    testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
                    testNode.getElementsByClassName('b').length;
                    testNode.firstChild.className = 'b';
                    cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
                } catch (e) {
                }
                ;

                // Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
                try {
                    testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
                    brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
                } catch (e) {
                }
                ;

                features.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
            }

            if (testNode.querySelectorAll) {
                // IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
                try {
                    testNode.innerHTML = 'foo</foo>';
                    selected = testNode.querySelectorAll('*');
                    features.starSelectsClosedQSA = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
                } catch (e) {
                }
                ;

                // Safari 3.2 querySelectorAll doesnt work with mixedcase on quirksmode
                try {
                    testNode.innerHTML = '<a class="MiX"></a>';
                    features.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiX').length;
                } catch (e) {
                }
                ;

                // Webkit and Opera dont return selected options on querySelectorAll
                try {
                    testNode.innerHTML = '<select><option selected="selected">a</option></select>';
                    features.brokenCheckedQSA = (testNode.querySelectorAll(':checked').length == 0);
                } catch (e) {
                }
                ;

                // IE returns incorrect results for attr[*^$]="" selectors on querySelectorAll
                try {
                    testNode.innerHTML = '<a class=""></a>';
                    features.brokenEmptyAttributeQSA = (testNode.querySelectorAll('[class*=""]').length != 0);
                } catch (e) {
                }
                ;

            }

            // IE6-7, if a form has an input of id x, form.getAttribute(x) returns a reference to the input
            try {
                testNode.innerHTML = '<form action="s"><input id="action"/></form>';
                brokenFormAttributeGetter = (testNode.firstChild.getAttribute('action') != 's');
            } catch (e) {
            }
            ;

            // native matchesSelector function

            features.nativeMatchesSelector = root.matchesSelector || /*root.msMatchesSelector ||*/ root.mozMatchesSelector || root.webkitMatchesSelector;
            if (features.nativeMatchesSelector) try {
                // if matchesSelector trows errors on incorrect sintaxes we can use it
                features.nativeMatchesSelector.call(root, ':slick');
                features.nativeMatchesSelector = null;
            } catch (e) {
            }
            ;

        }

        try {
            root.slick_expando = 1;
            delete root.slick_expando;
            features.getUID = this.getUIDHTML;
        } catch (e) {
            features.getUID = this.getUIDXML;
        }

        testRoot.removeChild(testNode);
        testNode = selected = testRoot = null;

        // getAttribute

        features.getAttribute = (features.isHTMLDocument && brokenFormAttributeGetter) ? function (node, name) {
            var method = this.attributeGetters[name];
            if (method) return method.call(node);
            var attributeNode = node.getAttributeNode(name);
            return (attributeNode) ? attributeNode.nodeValue : null;
        } : function (node, name) {
            var method = this.attributeGetters[name];
            return (method) ? method.call(node) : node.getAttribute(name);
        };

        // hasAttribute

        features.hasAttribute = (root && this.isNativeCode(root.hasAttribute)) ? function (node, attribute) {
            return node.hasAttribute(attribute);
        } : function (node, attribute) {
            node = node.getAttributeNode(attribute);
            return !!(node && (node.specified || node.nodeValue));
        };

        // contains
        // FIXME: Add specs: local.contains should be different for xml and html documents?
        var nativeRootContains = root && this.isNativeCode(root.contains),
            nativeDocumentContains = document && this.isNativeCode(document.contains);

        features.contains = (nativeRootContains && nativeDocumentContains) ? function (context, node) {
            return context.contains(node);
        } : (nativeRootContains && !nativeDocumentContains) ? function (context, node) {
            // IE8 does not have .contains on document.
            return context === node || ((context === document) ? document.documentElement : context).contains(node);
        } : (root && root.compareDocumentPosition) ? function (context, node) {
            return context === node || !!(context.compareDocumentPosition(node) & 16);
        } : function (context, node) {
            if (node) do {
                if (node === context) return true;
            } while ((node = node.parentNode));
            return false;
        };

        // document order sorting
        // credits to Sizzle (http://sizzlejs.com/)

        features.documentSorter = (root.compareDocumentPosition) ? function (a, b) {
            if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
            return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
        } : ('sourceIndex' in root) ? function (a, b) {
            if (!a.sourceIndex || !b.sourceIndex) return 0;
            return a.sourceIndex - b.sourceIndex;
        } : (document.createRange) ? function (a, b) {
            if (!a.ownerDocument || !b.ownerDocument) return 0;
            var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
            aRange.setStart(a, 0);
            aRange.setEnd(a, 0);
            bRange.setStart(b, 0);
            bRange.setEnd(b, 0);
            return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
        } : null;

        root = null;

        for (feature in features) {
            this[feature] = features[feature];
        }
    };

// Main Method

    var reSimpleSelector = /^([#.]?)((?:[\w-]+|\*))$/,
        reEmptyAttribute = /\[.+[*$^]=(?:""|'')?\]/,
        qsaFailExpCache = {};

    local.search = function (context, expression, append, first) {

        var found = this.found = (first) ? null : (append || []);

        if (!context) return found;
        else if (context.navigator) context = context.document; // Convert the node from a window to a document
        else if (!context.nodeType) return found;

        // setup

        var parsed, i,
            uniques = this.uniques = {},
            hasOthers = !!(append && append.length),
            contextIsDocument = (context.nodeType == 9);

        if (this.document !== (contextIsDocument ? context : context.ownerDocument)) this.setDocument(context);

        // avoid duplicating items already in the append array
        if (hasOthers) for (i = found.length; i--;) uniques[this.getUID(found[i])] = true;

        // expression checks

        if (typeof expression == 'string') { // expression is a string

            /*<simple-selectors-override>*/
            var simpleSelector = expression.match(reSimpleSelector);
            simpleSelectors: if (simpleSelector) {

                var symbol = simpleSelector[1],
                    name = simpleSelector[2],
                    node, nodes;

                if (!symbol) {

                    if (name == '*' && this.brokenStarGEBTN) break simpleSelectors;
                    nodes = context.getElementsByTagName(name);
                    if (first) return nodes[0] || null;
                    for (i = 0; node = nodes[i++];) {
                        if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
                    }

                } else if (symbol == '#') {

                    if (!this.isHTMLDocument || !contextIsDocument) break simpleSelectors;
                    node = context.getElementById(name);
                    if (!node) return found;
                    if (this.idGetsName && node.getAttributeNode('id').nodeValue != name) break simpleSelectors;
                    if (first) return node || null;
                    if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);

                } else if (symbol == '.') {

                    if (!this.isHTMLDocument || ((!context.getElementsByClassName || this.brokenGEBCN) && context.querySelectorAll)) break simpleSelectors;
                    if (context.getElementsByClassName && !this.brokenGEBCN) {
                        nodes = context.getElementsByClassName(name);
                        if (first) return nodes[0] || null;
                        for (i = 0; node = nodes[i++];) {
                            if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
                        }
                    } else {
                        var matchClass = new RegExp('(^|\\s)' + Slick.escapeRegExp(name) + '(\\s|$)');
                        nodes = context.getElementsByTagName('*');
                        for (i = 0; node = nodes[i++];) {
                            className = node.className;
                            if (!(className && matchClass.test(className))) continue;
                            if (first) return node;
                            if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
                        }
                    }

                }

                if (hasOthers) this.sort(found);
                return (first) ? null : found;

            }
            /*</simple-selectors-override>*/

            /*<query-selector-override>*/
            querySelector: if (context.querySelectorAll) {

                if (!this.isHTMLDocument
                    || qsaFailExpCache[expression]
                        //TODO: only skip when expression is actually mixed case
                    || this.brokenMixedCaseQSA
                    || (this.brokenCheckedQSA && expression.indexOf(':checked') > -1)
                    || (this.brokenEmptyAttributeQSA && reEmptyAttribute.test(expression))
                    || (!contextIsDocument //Abort when !contextIsDocument and...
                        //  there are multiple expressions in the selector
                        //  since we currently only fix non-document rooted QSA for single expression selectors
                    && expression.indexOf(',') > -1
                    )
                    || Slick.disableQSA
                ) break querySelector;

                var _expression = expression, _context = context;
                if (!contextIsDocument) {
                    // non-document rooted QSA
                    // credits to Andrew Dupont
                    var currentId = _context.getAttribute('id'), slickid = 'slickid__';
                    _context.setAttribute('id', slickid);
                    _expression = '#' + slickid + ' ' + _expression;
                    context = _context.parentNode;
                }

                try {
                    if (first) return context.querySelector(_expression) || null;
                    else nodes = context.querySelectorAll(_expression);
                } catch (e) {
                    qsaFailExpCache[expression] = 1;
                    break querySelector;
                } finally {
                    if (!contextIsDocument) {
                        if (currentId) _context.setAttribute('id', currentId);
                        else _context.removeAttribute('id');
                        context = _context;
                    }
                }

                if (this.starSelectsClosedQSA) for (i = 0; node = nodes[i++];) {
                    if (node.nodeName > '@' && !(hasOthers && uniques[this.getUID(node)])) found.push(node);
                } else for (i = 0; node = nodes[i++];) {
                    if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
                }

                if (hasOthers) this.sort(found);
                return found;

            }
            /*</query-selector-override>*/

            parsed = this.Slick.parse(expression);
            if (!parsed.length) return found;
        } else if (expression == null) { // there is no expression
            return found;
        } else if (expression.Slick) { // expression is a parsed Slick object
            parsed = expression;
        } else if (this.contains(context.documentElement || context, expression)) { // expression is a node
            (found) ? found.push(expression) : found = expression;
            return found;
        } else { // other junk
            return found;
        }

        /*<pseudo-selectors>*/
        /*<nth-pseudo-selectors>*/

        // cache elements for the nth selectors

        this.posNTH = {};
        this.posNTHLast = {};
        this.posNTHType = {};
        this.posNTHTypeLast = {};

        /*</nth-pseudo-selectors>*/
        /*</pseudo-selectors>*/

        // if append is null and there is only a single selector with one expression use pushArray, else use pushUID
        this.push = (!hasOthers && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) ? this.pushArray : this.pushUID;

        if (found == null) found = [];

        // default engine

        var j, m, n;
        var combinator, tag, id, classList, classes, attributes, pseudos;
        var currentItems, currentExpression, currentBit, lastBit, expressions = parsed.expressions;

        search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++) {

            combinator = 'combinator:' + currentBit.combinator;
            if (!this[combinator]) continue search;

            tag = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
            id = currentBit.id;
            classList = currentBit.classList;
            classes = currentBit.classes;
            attributes = currentBit.attributes;
            pseudos = currentBit.pseudos;
            lastBit = (j === (currentExpression.length - 1));

            this.bitUniques = {};

            if (lastBit) {
                this.uniques = uniques;
                this.found = found;
            } else {
                this.uniques = {};
                this.found = [];
            }

            if (j === 0) {
                this[combinator](context, tag, id, classes, attributes, pseudos, classList);
                if (first && lastBit && found.length) break search;
            } else {
                if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++) {
                    this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
                    if (found.length) break search;
                } else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
            }

            currentItems = this.found;
        }

        // should sort if there are nodes in append and if you pass multiple expressions.
        if (hasOthers || (parsed.expressions.length > 1)) this.sort(found);

        return (first) ? (found[0] || null) : found;
    };

// Utils

    local.uidx = 1;
    local.uidk = 'slick-uniqueid';

    local.getUIDXML = function (node) {
        var uid = node.getAttribute(this.uidk);
        if (!uid) {
            uid = this.uidx++;
            node.setAttribute(this.uidk, uid);
        }
        return uid;
    };

    local.getUIDHTML = function (node) {
        return node.uniqueNumber || (node.uniqueNumber = this.uidx++);
    };

// sort based on the setDocument documentSorter method.

    local.sort = function (results) {
        if (!this.documentSorter) return results;
        results.sort(this.documentSorter);
        return results;
    };

    /*<pseudo-selectors>*/
    /*<nth-pseudo-selectors>*/

    local.cacheNTH = {};

    local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

    local.parseNTHArgument = function (argument) {
        var parsed = argument.match(this.matchNTH);
        if (!parsed) return false;
        var special = parsed[2] || false;
        var a = parsed[1] || 1;
        if (a == '-') a = -1;
        var b = +parsed[3] || 0;
        parsed =
            (special == 'n') ? {a: a, b: b} :
                (special == 'odd') ? {a: 2, b: 1} :
                    (special == 'even') ? {a: 2, b: 0} : {a: 0, b: a};

        return (this.cacheNTH[argument] = parsed);
    };

    local.createNTHPseudo = function (child, sibling, positions, ofType) {
        return function (node, argument) {
            var uid = this.getUID(node);
            if (!this[positions][uid]) {
                var parent = node.parentNode;
                if (!parent) return false;
                var el = parent[child], count = 1;
                if (ofType) {
                    var nodeName = node.nodeName;
                    do {
                        if (el.nodeName != nodeName) continue;
                        this[positions][this.getUID(el)] = count++;
                    } while ((el = el[sibling]));
                } else {
                    do {
                        if (el.nodeType != 1) continue;
                        this[positions][this.getUID(el)] = count++;
                    } while ((el = el[sibling]));
                }
            }
            argument = argument || 'n';
            var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
            if (!parsed) return false;
            var a = parsed.a, b = parsed.b, pos = this[positions][uid];
            if (a == 0) return b == pos;
            if (a > 0) {
                if (pos < b) return false;
            } else {
                if (b < pos) return false;
            }
            return ((pos - b) % a) == 0;
        };
    };

    /*</nth-pseudo-selectors>*/
    /*</pseudo-selectors>*/

    local.pushArray = function (node, tag, id, classes, attributes, pseudos) {
        if (this.matchSelector(node, tag, id, classes, attributes, pseudos)) this.found.push(node);
    };

    local.pushUID = function (node, tag, id, classes, attributes, pseudos) {
        var uid = this.getUID(node);
        if (!this.uniques[uid] && this.matchSelector(node, tag, id, classes, attributes, pseudos)) {
            this.uniques[uid] = true;
            this.found.push(node);
        }
    };

    local.matchNode = function (node, selector) {
        if (this.isHTMLDocument && this.nativeMatchesSelector) {
            try {
                return this.nativeMatchesSelector.call(node, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
            } catch (matchError) {
            }
        }

        var parsed = this.Slick.parse(selector);
        if (!parsed) return true;

        // simple (single) selectors
        var expressions = parsed.expressions, simpleExpCounter = 0, i;
        for (i = 0; (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];
                if (this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.classes, exp.attributes, exp.pseudos)) return true;
                simpleExpCounter++;
            }
        }

        if (simpleExpCounter == parsed.length) return false;

        var nodes = this.search(this.document, parsed), item;
        for (i = 0; item = nodes[i++];) {
            if (item === node) return true;
        }
        return false;
    };

    local.matchPseudo = function (node, name, argument) {
        var pseudoName = 'pseudo:' + name;
        if (this[pseudoName]) return this[pseudoName](node, argument);
        var attribute = this.getAttribute(node, name);
        return (argument) ? argument == attribute : !!attribute;
    };

    local.matchSelector = function (node, tag, id, classes, attributes, pseudos) {
        if (tag) {
            var nodeName = (this.isXMLDocument) ? node.nodeName : node.nodeName.toUpperCase();
            if (tag == '*') {
                if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
            } else {
                if (nodeName != tag) return false;
            }
        }

        if (id && node.getAttribute('id') != id) return false;

        var i, part, cls;
        if (classes) for (i = classes.length; i--;) {
            cls = this.getAttribute(node, 'class');
            if (!(cls && classes[i].regexp.test(cls))) return false;
        }
        if (attributes) for (i = attributes.length; i--;) {
            part = attributes[i];
            if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
        }
        if (pseudos) for (i = pseudos.length; i--;) {
            part = pseudos[i];
            if (!this.matchPseudo(node, part.key, part.value)) return false;
        }
        return true;
    };

    var combinators = {

        ' ': function (node, tag, id, classes, attributes, pseudos, classList) { // all child nodes, any level

            var i, item, children;

            if (this.isHTMLDocument) {
                getById: if (id) {
                    item = this.document.getElementById(id);
                    if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)) {
                        // all[id] returns all the elements with that name or id inside node
                        // if theres just one it will return the element, else it will be a collection
                        children = node.all[id];
                        if (!children) return;
                        if (!children[0]) children = [children];
                        for (i = 0; item = children[i++];) {
                            var idNode = item.getAttributeNode('id');
                            if (idNode && idNode.nodeValue == id) {
                                this.push(item, tag, null, classes, attributes, pseudos);
                                break;
                            }
                        }
                        return;
                    }
                    if (!item) {
                        // if the context is in the dom we return, else we will try GEBTN, breaking the getById label
                        if (this.contains(this.root, node)) return;
                        else break getById;
                    } else if (this.document !== node && !this.contains(node, item)) return;
                    this.push(item, tag, null, classes, attributes, pseudos);
                    return;
                }
                getByClass: if (classes && node.getElementsByClassName && !this.brokenGEBCN) {
                    children = node.getElementsByClassName(classList.join(' '));
                    if (!(children && children.length)) break getByClass;
                    for (i = 0; item = children[i++];) this.push(item, tag, id, null, attributes, pseudos);
                    return;
                }
            }
            getByTag: {
                children = node.getElementsByTagName(tag);
                if (!(children && children.length)) break getByTag;
                if (!this.brokenStarGEBTN) tag = null;
                for (i = 0; item = children[i++];) this.push(item, tag, id, classes, attributes, pseudos);
            }
        },

        '>': function (node, tag, id, classes, attributes, pseudos) { // direct children
            if ((node = node.firstChild)) do {
                if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
            } while ((node = node.nextSibling));
        },

        '+': function (node, tag, id, classes, attributes, pseudos) { // next sibling
            while ((node = node.nextSibling)) if (node.nodeType == 1) {
                this.push(node, tag, id, classes, attributes, pseudos);
                break;
            }
        },

        '^': function (node, tag, id, classes, attributes, pseudos) { // first child
            node = node.firstChild;
            if (node) {
                if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
                else this['combinator:+'](node, tag, id, classes, attributes, pseudos);
            }
        },

        '~': function (node, tag, id, classes, attributes, pseudos) { // next siblings
            while ((node = node.nextSibling)) {
                if (node.nodeType != 1) continue;
                var uid = this.getUID(node);
                if (this.bitUniques[uid]) break;
                this.bitUniques[uid] = true;
                this.push(node, tag, id, classes, attributes, pseudos);
            }
        },

        '++': function (node, tag, id, classes, attributes, pseudos) { // next sibling and previous sibling
            this['combinator:+'](node, tag, id, classes, attributes, pseudos);
            this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
        },

        '~~': function (node, tag, id, classes, attributes, pseudos) { // next siblings and previous siblings
            this['combinator:~'](node, tag, id, classes, attributes, pseudos);
            this['combinator:!~'](node, tag, id, classes, attributes, pseudos);
        },

        '!': function (node, tag, id, classes, attributes, pseudos) { // all parent nodes up to document
            while ((node = node.parentNode)) if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
        },

        '!>': function (node, tag, id, classes, attributes, pseudos) { // direct parent (one level)
            node = node.parentNode;
            if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
        },

        '!+': function (node, tag, id, classes, attributes, pseudos) { // previous sibling
            while ((node = node.previousSibling)) if (node.nodeType == 1) {
                this.push(node, tag, id, classes, attributes, pseudos);
                break;
            }
        },

        '!^': function (node, tag, id, classes, attributes, pseudos) { // last child
            node = node.lastChild;
            if (node) {
                if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
                else this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
            }
        },

        '!~': function (node, tag, id, classes, attributes, pseudos) { // previous siblings
            while ((node = node.previousSibling)) {
                if (node.nodeType != 1) continue;
                var uid = this.getUID(node);
                if (this.bitUniques[uid]) break;
                this.bitUniques[uid] = true;
                this.push(node, tag, id, classes, attributes, pseudos);
            }
        }

    };

    for (var c in combinators) local['combinator:' + c] = combinators[c];

    var pseudos = {

        /*<pseudo-selectors>*/

        'empty': function (node) {
            var child = node.firstChild;
            return !(child && child.nodeType == 1) && !(node.innerText || node.textContent || '').length;
        },

        'not': function (node, expression) {
            return !this.matchNode(node, expression);
        },

        'contains': function (node, text) {
            return (node.innerText || node.textContent || '').indexOf(text) > -1;
        },

        'first-child': function (node) {
            while ((node = node.previousSibling)) if (node.nodeType == 1) return false;
            return true;
        },

        'last-child': function (node) {
            while ((node = node.nextSibling)) if (node.nodeType == 1) return false;
            return true;
        },

        'only-child': function (node) {
            var prev = node;
            while ((prev = prev.previousSibling)) if (prev.nodeType == 1) return false;
            var next = node;
            while ((next = next.nextSibling)) if (next.nodeType == 1) return false;
            return true;
        },

        /*<nth-pseudo-selectors>*/

        'nth-child': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTH'),

        'nth-last-child': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHLast'),

        'nth-of-type': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTHType', true),

        'nth-last-of-type': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHTypeLast', true),

        'index': function (node, index) {
            return this['pseudo:nth-child'](node, '' + (index + 1));
        },

        'even': function (node) {
            return this['pseudo:nth-child'](node, '2n');
        },

        'odd': function (node) {
            return this['pseudo:nth-child'](node, '2n+1');
        },

        /*</nth-pseudo-selectors>*/

        /*<of-type-pseudo-selectors>*/

        'first-of-type': function (node) {
            var nodeName = node.nodeName;
            while ((node = node.previousSibling)) if (node.nodeName == nodeName) return false;
            return true;
        },

        'last-of-type': function (node) {
            var nodeName = node.nodeName;
            while ((node = node.nextSibling)) if (node.nodeName == nodeName) return false;
            return true;
        },

        'only-of-type': function (node) {
            var prev = node, nodeName = node.nodeName;
            while ((prev = prev.previousSibling)) if (prev.nodeName == nodeName) return false;
            var next = node;
            while ((next = next.nextSibling)) if (next.nodeName == nodeName) return false;
            return true;
        },

        /*</of-type-pseudo-selectors>*/

        // custom pseudos

        'enabled': function (node) {
            return !node.disabled;
        },

        'disabled': function (node) {
            return node.disabled;
        },

        'checked': function (node) {
            return node.checked || node.selected;
        },

        'focus': function (node) {
            return this.isHTMLDocument && this.document.activeElement === node && (node.href || node.type || this.hasAttribute(node, 'tabindex'));
        },

        'root': function (node) {
            return (node === this.root);
        },

        'selected': function (node) {
            return node.selected;
        }

        /*</pseudo-selectors>*/
    };

    for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

    var attributeGetters = local.attributeGetters = {

        'for': function () {
            return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
        },

        'href': function () {
            return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
        },

        'style': function () {
            return (this.style) ? this.style.cssText : this.getAttribute('style');
        },

        'tabindex': function () {
            var attributeNode = this.getAttributeNode('tabindex');
            return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
        },

        'type': function () {
            return this.getAttribute('type');
        },

        'maxlength': function () {
            var attributeNode = this.getAttributeNode('maxLength');
            return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
        }

    };

    attributeGetters.MAXLENGTH = attributeGetters.maxLength = attributeGetters.maxlength;

// Slick

    var Slick = local.Slick = (this.Slick || {});

    Slick.version = '1.1.7';

// Slick finder

    Slick.search = function (context, expression, append) {
        return local.search(context, expression, append);
    };

    Slick.find = function (context, expression) {
        return local.search(context, expression, null, true);
    };

// Slick containment checker

    Slick.contains = function (container, node) {
        local.setDocument(container);
        return local.contains(container, node);
    };

// Slick attribute getter

    Slick.getAttribute = function (node, name) {
        local.setDocument(node);
        return local.getAttribute(node, name);
    };

    Slick.hasAttribute = function (node, name) {
        local.setDocument(node);
        return local.hasAttribute(node, name);
    };

// Slick matcher

    Slick.match = function (node, selector) {
        if (!(node && selector)) return false;
        if (!selector || selector === node) return true;
        local.setDocument(node);
        return local.matchNode(node, selector);
    };

// Slick attribute accessor

    Slick.defineAttributeGetter = function (name, fn) {
        local.attributeGetters[name] = fn;
        return this;
    };

    Slick.lookupAttributeGetter = function (name) {
        return local.attributeGetters[name];
    };

// Slick pseudo accessor

    Slick.definePseudo = function (name, fn) {
        local['pseudo:' + name] = function (node, argument) {
            return fn.call(node, argument);
        };
        return this;
    };

    Slick.lookupPseudo = function (name) {
        var pseudo = local['pseudo:' + name];
        if (pseudo) return function (argument) {
            return pseudo.call(this, argument);
        };
        return null;
    };

// Slick overrides accessor

    Slick.override = function (regexp, fn) {
        local.override(regexp, fn);
        return this;
    };

    Slick.isXML = local.isXML;

    Slick.uidOf = function (node) {
        return local.getUIDHTML(node);
    };

    if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);


/*
 ---

 name: Element

 description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

 license: MIT-style license.

 requires: [Window, Document, Array, String, Function, Object, Number, Slick.Parser, Slick.Finder]

 provides: [Element, Elements, $, $$, Iframe, Selectors]

 ...
 */

var Element = function (tag, props) {
    var konstructor = Element.Constructors[tag];
    if (konstructor) return konstructor(props);
    if (typeof tag != 'string') return document.id(tag).set(props);

    if (!props) props = {};

    if (!(/^[\w-]+$/).test(tag)) {
        var parsed = Slick.parse(tag).expressions[0][0];
        tag = (parsed.tag == '*') ? 'div' : parsed.tag;
        if (parsed.id && props.id == null) props.id = parsed.id;

        var attributes = parsed.attributes;
        if (attributes) for (var attr, i = 0, l = attributes.length; i < l; i++) {
            attr = attributes[i];
            if (props[attr.key] != null) continue;

            if (attr.value != null && attr.operator == '=') props[attr.key] = attr.value;
            else if (!attr.value && !attr.operator) props[attr.key] = true;
        }

        if (parsed.classList && props['class'] == null) props['class'] = parsed.classList.join(' ');
    }

    return document.newElement(tag, props);
};


if (Browser.Element) {
    Element.prototype = Browser.Element.prototype;
    // IE8 and IE9 require the wrapping.
    Element.prototype._fireEvent = (function (fireEvent) {
        return function (type, event) {
            return fireEvent.call(this, type, event);
        };
    })(Element.prototype.fireEvent);
}

new Type('Element', Element).mirror(function (name) {
    if (Array.prototype[name]) return;

    var obj = {};
    obj[name] = function () {
        var results = [], args = arguments, elements = true;
        for (var i = 0, l = this.length; i < l; i++) {
            var element = this[i], result = results[i] = element[name].apply(element, args);
            elements = (elements && typeOf(result) == 'element');
        }
        return (elements) ? new Elements(results) : results;
    };

    Elements.implement(obj);
});

if (!Browser.Element) {
    Element.parent = Object;

    Element.Prototype = {
        '$constructor': Element,
        '$family': Function.from('element').hide()
    };

    Element.mirror(function (name, method) {
        Element.Prototype[name] = method;
    });
}

Element.Constructors = {};


var IFrame = new Type('IFrame', function () {
    var params = Array.link(arguments, {
        properties: Type.isObject,
        iframe: function (obj) {
            return (obj != null);
        }
    });

    var props = params.properties || {}, iframe;
    if (params.iframe) iframe = document.id(params.iframe);
    var onload = props.onload || function () {
        };
    delete props.onload;
    props.id = props.name = [props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + String.uniqueID()].pick();
    iframe = new Element(iframe || 'iframe', props);

    var onLoad = function () {
        onload.call(iframe.contentWindow);
    };

    if (window.frames[props.id]) onLoad();
    else iframe.addListener('load', onLoad);
    return iframe;
});

var Elements = this.Elements = function (nodes) {
    if (nodes && nodes.length) {
        var uniques = {}, node;
        for (var i = 0; node = nodes[i++];) {
            var uid = Slick.uidOf(node);
            if (!uniques[uid]) {
                uniques[uid] = true;
                this.push(node);
            }
        }
    }
};

Elements.prototype = {length: 0};
Elements.parent = Array;

new Type('Elements', Elements).implement({

    filter: function (filter, bind) {
        if (!filter) return this;
        return new Elements(Array.filter(this, (typeOf(filter) == 'string') ? function (item) {
            return item.match(filter);
        } : filter, bind));
    }.protect(),

    push: function () {
        var length = this.length;
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = document.id(arguments[i]);
            if (item) this[length++] = item;
        }
        return (this.length = length);
    }.protect(),

    unshift: function () {
        var items = [];
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = document.id(arguments[i]);
            if (item) items.push(item);
        }
        return Array.prototype.unshift.apply(this, items);
    }.protect(),

    concat: function () {
        var newElements = new Elements(this);
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = arguments[i];
            if (Type.isEnumerable(item)) newElements.append(item);
            else newElements.push(item);
        }
        return newElements;
    }.protect(),

    append: function (collection) {
        for (var i = 0, l = collection.length; i < l; i++) this.push(collection[i]);
        return this;
    }.protect(),

    empty: function () {
        while (this.length) delete this[--this.length];
        return this;
    }.protect()

});


(function () {

// FF, IE
    var splice = Array.prototype.splice, object = {'0': 0, '1': 1, length: 2};

    splice.call(object, 1, 1);
    if (object[1] == 1) Elements.implement('splice', function () {
        var length = this.length;
        var result = splice.apply(this, arguments);
        while (length >= this.length) delete this[length--];
        return result;
    }.protect());

    Array.forEachMethod(function (method, name) {
        Elements.implement(name, method);
    });

    Array.mirror(Elements);

    /*<ltIE8>*/
    var createElementAcceptsHTML;
    try {
        createElementAcceptsHTML = (document.createElement('<input name=x>').name == 'x');
    } catch (e) {
    }

    var escapeQuotes = function (html) {
        return ('' + html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    };
    /*</ltIE8>*/

    Document.implement({

        newElement: function (tag, props) {
            if (props && props.checked != null) props.defaultChecked = props.checked;
            /*<ltIE8>*/// Fix for readonly name and type properties in IE < 8
            if (createElementAcceptsHTML && props) {
                tag = '<' + tag;
                if (props.name) tag += ' name="' + escapeQuotes(props.name) + '"';
                if (props.type) tag += ' type="' + escapeQuotes(props.type) + '"';
                tag += '>';
                delete props.name;
                delete props.type;
            }
            /*</ltIE8>*/
            return this.id(this.createElement(tag)).set(props);
        }

    });

})();

(function () {

    Slick.uidOf(window);
    Slick.uidOf(document);

    Document.implement({

        newTextNode: function (text) {
            return this.createTextNode(text);
        },

        getDocument: function () {
            return this;
        },

        getWindow: function () {
            return this.window;
        },

        id: (function () {

            var types = {

                string: function (id, nocash, doc) {
                    id = Slick.find(doc, '#' + id.replace(/(\W)/g, '\\$1'));
                    return (id) ? types.element(id, nocash) : null;
                },

                element: function (el, nocash) {
                    Slick.uidOf(el);
                    if (!nocash && !el.$family && !(/^(?:object|embed)$/i).test(el.tagName)) {
                        var fireEvent = el.fireEvent;
                        // wrapping needed in IE7, or else crash
                        el._fireEvent = function (type, event) {
                            return fireEvent(type, event);
                        };
                        Object.append(el, Element.Prototype);
                    }
                    return el;
                },

                object: function (obj, nocash, doc) {
                    if (obj.toElement) return types.element(obj.toElement(doc), nocash);
                    return null;
                }

            };

            types.textnode = types.whitespace = types.window = types.document = function (zero) {
                return zero;
            };

            return function (el, nocash, doc) {
                if (el && el.$family && el.uniqueNumber) return el;
                var type = typeOf(el);
                return (types[type]) ? types[type](el, nocash, doc || document) : null;
            };

        })()

    });

    if (window.$ == null) Window.implement('$', function (el, nc) {
        return document.id(el, nc, this.document);
    });

    Window.implement({

        getDocument: function () {
            return this.document;
        },

        getWindow: function () {
            return this;
        }

    });

    [Document, Element].invoke('implement', {

        getElements: function (expression) {
            return Slick.search(this, expression, new Elements);
        },

        getElement: function (expression) {
            return document.id(Slick.find(this, expression));
        }

    });

    var contains = {
        contains: function (element) {
            return Slick.contains(this, element);
        }
    };

    if (!document.contains) Document.implement(contains);
    if (!document.createElement('div').contains) Element.implement(contains);


// tree walking

    var injectCombinator = function (expression, combinator) {
        if (!expression) return combinator;

        expression = Object.clone(Slick.parse(expression));

        var expressions = expression.expressions;
        for (var i = expressions.length; i--;)
            expressions[i][0].combinator = combinator;

        return expression;
    };

    Object.forEach({
        getNext: '~',
        getPrevious: '!~',
        getParent: '!'
    }, function (combinator, method) {
        Element.implement(method, function (expression) {
            return this.getElement(injectCombinator(expression, combinator));
        });
    });

    Object.forEach({
        getAllNext: '~',
        getAllPrevious: '!~',
        getSiblings: '~~',
        getChildren: '>',
        getParents: '!'
    }, function (combinator, method) {
        Element.implement(method, function (expression) {
            return this.getElements(injectCombinator(expression, combinator));
        });
    });

    Element.implement({

        getFirst: function (expression) {
            return document.id(Slick.search(this, injectCombinator(expression, '>'))[0]);
        },

        getLast: function (expression) {
            return document.id(Slick.search(this, injectCombinator(expression, '>')).getLast());
        },

        getWindow: function () {
            return this.ownerDocument.window;
        },

        getDocument: function () {
            return this.ownerDocument;
        },

        getElementById: function (id) {
            return document.id(Slick.find(this, '#' + ('' + id).replace(/(\W)/g, '\\$1')));
        },

        match: function (expression) {
            return !expression || Slick.match(this, expression);
        }

    });


    if (window.$$ == null) Window.implement('$$', function (selector) {
        if (arguments.length == 1) {
            if (typeof selector == 'string') return Slick.search(this.document, selector, new Elements);
            else if (Type.isEnumerable(selector)) return new Elements(selector);
        }
        return new Elements(arguments);
    });

// Inserters

    var inserters = {

        before: function (context, element) {
            var parent = element.parentNode;
            if (parent) parent.insertBefore(context, element);
        },

        after: function (context, element) {
            var parent = element.parentNode;
            if (parent) parent.insertBefore(context, element.nextSibling);
        },

        bottom: function (context, element) {
            element.appendChild(context);
        },

        top: function (context, element) {
            element.insertBefore(context, element.firstChild);
        }

    };

    inserters.inside = inserters.bottom;


// getProperty / setProperty

    var propertyGetters = {}, propertySetters = {};

// properties

    var properties = {};
    Array.forEach([
        'type', 'value', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan',
        'frameBorder', 'rowSpan', 'tabIndex', 'useMap'
    ], function (property) {
        properties[property.toLowerCase()] = property;
    });

    properties.html = 'innerHTML';
    properties.text = (document.createElement('div').textContent == null) ? 'innerText' : 'textContent';

    Object.forEach(properties, function (real, key) {
        propertySetters[key] = function (node, value) {
            node[real] = value;
        };
        propertyGetters[key] = function (node) {
            return node[real];
        };
    });

// Booleans

    var bools = [
        'compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked',
        'disabled', 'readOnly', 'multiple', 'selected', 'noresize',
        'defer', 'defaultChecked', 'autofocus', 'controls', 'autoplay',
        'loop'
    ];

    var booleans = {};
    Array.forEach(bools, function (bool) {
        var lower = bool.toLowerCase();
        booleans[lower] = bool;
        propertySetters[lower] = function (node, value) {
            node[bool] = !!value;
        };
        propertyGetters[lower] = function (node) {
            return !!node[bool];
        };
    });

// Special cases

    Object.append(propertySetters, {

        'class': function (node, value) {
            ('className' in node) ? node.className = (value || '') : node.setAttribute('class', value);
        },

        'for': function (node, value) {
            ('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
        },

        'style': function (node, value) {
            (node.style) ? node.style.cssText = value : node.setAttribute('style', value);
        },

        'value': function (node, value) {
            node.value = (value != null) ? value : '';
        }

    });

    propertyGetters['class'] = function (node) {
        return ('className' in node) ? node.className || null : node.getAttribute('class');
    };

    /* <webkit> */
    var el = document.createElement('button');
// IE sets type as readonly and throws
    try {
        el.type = 'button';
    } catch (e) {
    }
    if (el.type != 'button') propertySetters.type = function (node, value) {
        node.setAttribute('type', value);
    };
    el = null;
    /* </webkit> */

    /*<IE>*/
    var input = document.createElement('input');
    input.value = 't';
    input.type = 'submit';
    if (input.value != 't') propertySetters.type = function (node, type) {
        var value = node.value;
        node.type = type;
        node.value = value;
    };
    input = null;
    /*</IE>*/

    /* getProperty, setProperty */

    /* <ltIE9> */
    var pollutesGetAttribute = (function (div) {
        div.random = 'attribute';
        return (div.getAttribute('random') == 'attribute');
    })(document.createElement('div'));

    /* <ltIE9> */

    Element.implement({

        setProperty: function (name, value) {
            var setter = propertySetters[name.toLowerCase()];
            if (setter) {
                setter(this, value);
            } else {
                /* <ltIE9> */
                if (pollutesGetAttribute) var attributeWhiteList = this.retrieve('$attributeWhiteList', {});
                /* </ltIE9> */

                if (value == null) {
                    this.removeAttribute(name);
                    /* <ltIE9> */
                    if (pollutesGetAttribute) delete attributeWhiteList[name];
                    /* </ltIE9> */
                } else {
                    this.setAttribute(name, '' + value);
                    /* <ltIE9> */
                    if (pollutesGetAttribute) attributeWhiteList[name] = true;
                    /* </ltIE9> */
                }
            }
            return this;
        },

        setProperties: function (attributes) {
            for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
            return this;
        },

        getProperty: function (name) {
            var getter = propertyGetters[name.toLowerCase()];
            if (getter) return getter(this);
            /* <ltIE9> */
            if (pollutesGetAttribute) {
                var attr = this.getAttributeNode(name), attributeWhiteList = this.retrieve('$attributeWhiteList', {});
                if (!attr) return null;
                if (attr.expando && !attributeWhiteList[name]) {
                    var outer = this.outerHTML;
                    // segment by the opening tag and find mention of attribute name
                    if (outer.substr(0, outer.search(/\/?['"]?>(?![^<]*<['"])/)).indexOf(name) < 0) return null;
                    attributeWhiteList[name] = true;
                }
            }
            /* </ltIE9> */
            var result = Slick.getAttribute(this, name);
            return (!result && !Slick.hasAttribute(this, name)) ? null : result;
        },

        getProperties: function () {
            var args = Array.from(arguments);
            return args.map(this.getProperty, this).associate(args);
        },

        removeProperty: function (name) {
            return this.setProperty(name, null);
        },

        removeProperties: function () {
            Array.each(arguments, this.removeProperty, this);
            return this;
        },

        set: function (prop, value) {
            var property = Element.Properties[prop];
            (property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
        }.overloadSetter(),

        get: function (prop) {
            var property = Element.Properties[prop];
            return (property && property.get) ? property.get.apply(this) : this.getProperty(prop);
        }.overloadGetter(),

        erase: function (prop) {
            var property = Element.Properties[prop];
            (property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
            return this;
        },

        hasClass: function (className) {
            return this.className.clean().contains(className, ' ');
        },

        addClass: function (className) {
            if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
            return this;
        },

        removeClass: function (className) {
            this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
            return this;
        },

        toggleClass: function (className, force) {
            if (force == null) force = !this.hasClass(className);
            return (force) ? this.addClass(className) : this.removeClass(className);
        },

        adopt: function () {
            var parent = this, fragment, elements = Array.flatten(arguments), length = elements.length;
            if (length > 1) parent = fragment = document.createDocumentFragment();

            for (var i = 0; i < length; i++) {
                var element = document.id(elements[i], true);
                if (element) parent.appendChild(element);
            }

            if (fragment) this.appendChild(fragment);

            return this;
        },

        appendText: function (text, where) {
            return this.grab(this.getDocument().newTextNode(text), where);
        },

        grab: function (el, where) {
            inserters[where || 'bottom'](document.id(el, true), this);
            return this;
        },

        inject: function (el, where) {
            inserters[where || 'bottom'](this, document.id(el, true));
            return this;
        },

        replaces: function (el) {
            el = document.id(el, true);
            el.parentNode.replaceChild(this, el);
            return this;
        },

        wraps: function (el, where) {
            el = document.id(el, true);
            return this.replaces(el).grab(el, where);
        },

        getSelected: function () {
            this.selectedIndex; // Safari 3.2.1
            return new Elements(Array.from(this.options).filter(function (option) {
                return option.selected;
            }));
        },

        toQueryString: function () {
            var queryString = [];
            this.getElements('input, select, textarea').each(function (el) {
                var type = el.type;
                if (!el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

                var value = (el.get('tag') == 'select') ? el.getSelected().map(function (opt) {
                    // IE
                    return document.id(opt).get('value');
                }) : ((type == 'radio' || type == 'checkbox') && !el.checked) ? null : el.get('value');

                Array.from(value).each(function (val) {
                    if (typeof val != 'undefined') queryString.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
                });
            });
            return queryString.join('&');
        }

    });

    var collected = {}, storage = {};

    var get = function (uid) {
        return (storage[uid] || (storage[uid] = {}));
    };

    var clean = function (item) {
        var uid = item.uniqueNumber;
        if (item.removeEvents) item.removeEvents();
        if (item.clearAttributes) item.clearAttributes();
        if (uid != null) {
            delete collected[uid];
            delete storage[uid];
        }
        return item;
    };

    var formProps = {input: 'checked', option: 'selected', textarea: 'value'};

    Element.implement({

        destroy: function () {
            var children = clean(this).getElementsByTagName('*');
            Array.each(children, clean);
            Element.dispose(this);
            return null;
        },

        empty: function () {
            Array.from(this.childNodes).each(Element.dispose);
            return this;
        },

        dispose: function () {
            return (this.parentNode) ? this.parentNode.removeChild(this) : this;
        },

        clone: function (contents, keepid) {
            contents = contents !== false;
            var clone = this.cloneNode(contents), ce = [clone], te = [this], i;

            if (contents) {
                ce.append(Array.from(clone.getElementsByTagName('*')));
                te.append(Array.from(this.getElementsByTagName('*')));
            }

            for (i = ce.length; i--;) {
                var node = ce[i], element = te[i];
                if (!keepid) node.removeAttribute('id');
                /*<ltIE9>*/
                if (node.clearAttributes) {
                    node.clearAttributes();
                    node.mergeAttributes(element);
                    node.removeAttribute('uniqueNumber');
                    if (node.options) {
                        var no = node.options, eo = element.options;
                        for (var j = no.length; j--;) no[j].selected = eo[j].selected;
                    }
                }
                /*</ltIE9>*/
                var prop = formProps[element.tagName.toLowerCase()];
                if (prop && element[prop]) node[prop] = element[prop];
            }

            /*<ltIE9>*/
            if (Browser.ie) {
                var co = clone.getElementsByTagName('object'), to = this.getElementsByTagName('object');
                for (i = co.length; i--;) co[i].outerHTML = to[i].outerHTML;
            }
            /*</ltIE9>*/
            return document.id(clone);
        }

    });

    [Element, Window, Document].invoke('implement', {

        addListener: function (type, fn) {
            if (type == 'unload') {
                var old = fn, self = this;
                fn = function () {
                    self.removeListener('unload', fn);
                    old();
                };
            } else {
                collected[Slick.uidOf(this)] = this;
            }
            if (this.addEventListener) this.addEventListener(type, fn, !!arguments[2]);
            else this.attachEvent('on' + type, fn);
            return this;
        },

        removeListener: function (type, fn) {
            if (this.removeEventListener) this.removeEventListener(type, fn, !!arguments[2]);
            else this.detachEvent('on' + type, fn);
            return this;
        },

        retrieve: function (property, dflt) {
            var storage = get(Slick.uidOf(this)), prop = storage[property];
            if (dflt != null && prop == null) prop = storage[property] = dflt;
            return prop != null ? prop : null;
        },

        store: function (property, value) {
            var storage = get(Slick.uidOf(this));
            storage[property] = value;
            return this;
        },

        eliminate: function (property) {
            var storage = get(Slick.uidOf(this));
            delete storage[property];
            return this;
        }

    });

    /*<ltIE9>*/
    if (window.attachEvent && !window.addEventListener) window.addListener('unload', function () {
        Object.each(collected, clean);
        if (window.CollectGarbage) CollectGarbage();
    });
    /*</ltIE9>*/

    Element.Properties = {};


    Element.Properties.style = {

        set: function (style) {
            this.style.cssText = style;
        },

        get: function () {
            return this.style.cssText;
        },

        erase: function () {
            this.style.cssText = '';
        }

    };

    Element.Properties.tag = {

        get: function () {
            return this.tagName.toLowerCase();
        }

    };

    Element.Properties.html = {

        set: function (html) {
            if (html == null) html = '';
            else if (typeOf(html) == 'array') html = html.join('');
            this.innerHTML = html;
        },

        erase: function () {
            this.innerHTML = '';
        }

    };

    /*<ltIE9>*/
// technique by jdbarlett - http://jdbartlett.com/innershiv/
    var div = document.createElement('div');
    div.innerHTML = '<nav></nav>';
    var supportsHTML5Elements = (div.childNodes.length == 1);
    if (!supportsHTML5Elements) {
        var tags = 'abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video'.split(' '),
            fragment = document.createDocumentFragment(), l = tags.length;
        while (l--) fragment.createElement(tags[l]);
    }
    div = null;
    /*</ltIE9>*/

    /*<IE>*/
    var supportsTableInnerHTML = Function.attempt(function () {
        var table = document.createElement('table');
        table.innerHTML = '<tr><td></td></tr>';
        return true;
    });

    /*<ltFF4>*/
    var tr = document.createElement('tr'), html = '<td></td>';
    tr.innerHTML = html;
    var supportsTRInnerHTML = (tr.innerHTML == html);
    tr = null;
    /*</ltFF4>*/

    if (!supportsTableInnerHTML || !supportsTRInnerHTML || !supportsHTML5Elements) {

        Element.Properties.html.set = (function (set) {

            var translations = {
                table: [1, '<table>', '</table>'],
                select: [1, '<select>', '</select>'],
                tbody: [2, '<table><tbody>', '</tbody></table>'],
                tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
            };

            translations.thead = translations.tfoot = translations.tbody;

            return function (html) {
                var wrap = translations[this.get('tag')];
                if (!wrap && !supportsHTML5Elements) wrap = [0, '', ''];
                if (!wrap) return set.call(this, html);

                var level = wrap[0], wrapper = document.createElement('div'), target = wrapper;
                if (!supportsHTML5Elements) fragment.appendChild(wrapper);
                wrapper.innerHTML = [wrap[1], html, wrap[2]].flatten().join('');
                while (level--) target = target.firstChild;
                this.empty().adopt(target.childNodes);
                if (!supportsHTML5Elements) fragment.removeChild(wrapper);
                wrapper = null;
            };

        })(Element.Properties.html.set);
    }
    /*</IE>*/

    /*<ltIE9>*/
    var testForm = document.createElement('form');
    testForm.innerHTML = '<select><option>s</option></select>';

    if (testForm.firstChild.value != 's') Element.Properties.value = {

        set: function (value) {
            var tag = this.get('tag');
            if (tag != 'select') return this.setProperty('value', value);
            var options = this.getElements('option');
            for (var i = 0; i < options.length; i++) {
                var option = options[i],
                    attr = option.getAttributeNode('value'),
                    optionValue = (attr && attr.specified) ? option.value : option.get('text');
                if (optionValue == value) return option.selected = true;
            }
        },

        get: function () {
            var option = this, tag = option.get('tag');

            if (tag != 'select' && tag != 'option') return this.getProperty('value');

            if (tag == 'select' && !(option = option.getSelected()[0])) return '';

            var attr = option.getAttributeNode('value');
            return (attr && attr.specified) ? option.value : option.get('text');
        }

    };
    testForm = null;
    /*</ltIE9>*/

    /*<IE>*/
    if (document.createElement('div').getAttributeNode('id')) Element.Properties.id = {
        set: function (id) {
            this.id = this.getAttributeNode('id').value = id;
        },
        get: function () {
            return this.id || null;
        },
        erase: function () {
            this.id = this.getAttributeNode('id').value = '';
        }
    };
    /*</IE>*/

})();


/*
 ---

 name: Element.Style

 description: Contains methods for interacting with the styles of Elements in a fashionable way.

 license: MIT-style license.

 requires: Element

 provides: Element.Style

 ...
 */

(function () {

    var html = document.html;

//<ltIE9>
// Check for oldIE, which does not remove styles when they're set to null
    var el = document.createElement('div');
    el.style.color = 'red';
    el.style.color = null;
    var doesNotRemoveStyles = el.style.color == 'red';
    el = null;
//</ltIE9>

    Element.Properties.styles = {
        set: function (styles) {
            this.setStyles(styles);
        }
    };

    var hasOpacity = (html.style.opacity != null),
        hasFilter = (html.style.filter != null),
        reAlpha = /alpha\(opacity=([\d.]+)\)/i;

    var setVisibility = function (element, opacity) {
        element.store('$opacity', opacity);
        element.style.visibility = opacity > 0 || opacity == null ? 'visible' : 'hidden';
    };

    var setOpacity = (hasOpacity ? function (element, opacity) {
        element.style.opacity = opacity;
    } : (hasFilter ? function (element, opacity) {
        var style = element.style;
        if (!element.currentStyle || !element.currentStyle.hasLayout) style.zoom = 1;
        if (opacity == null || opacity == 1) opacity = '';
        else opacity = 'alpha(opacity=' + (opacity * 100).limit(0, 100).round() + ')';
        var filter = style.filter || element.getComputedStyle('filter') || '';
        style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacity) : filter + opacity;
        if (!style.filter) style.removeAttribute('filter');
    } : setVisibility));

    var getOpacity = (hasOpacity ? function (element) {
        var opacity = element.style.opacity || element.getComputedStyle('opacity');
        return (opacity == '') ? 1 : opacity.toFloat();
    } : (hasFilter ? function (element) {
        var filter = (element.style.filter || element.getComputedStyle('filter')),
            opacity;
        if (filter) opacity = filter.match(reAlpha);
        return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
    } : function (element) {
        var opacity = element.retrieve('$opacity');
        if (opacity == null) opacity = (element.style.visibility == 'hidden' ? 0 : 1);
        return opacity;
    }));

    var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat';

    Element.implement({

        getComputedStyle: function (property) {
            if (this.currentStyle) return this.currentStyle[property.camelCase()];
            var defaultView = Element.getDocument(this).defaultView,
                computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
            return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : property.hyphenate()) : null;
        },

        setStyle: function (property, value) {
            if (property == 'opacity') {
                if (value != null) value = parseFloat(value);
                setOpacity(this, value);
                return this;
            }
            property = (property == 'float' ? floatName : property).camelCase();
            if (typeOf(value) != 'string') {
                var map = (Element.Styles[property] || '@').split(' ');
                value = Array.from(value).map(function (val, i) {
                    if (!map[i]) return '';
                    return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
                }).join(' ');
            } else if (value == String(Number(value))) {
                value = Math.round(value);
            }
            this.style[property] = value;
            //<ltIE9>
            if ((value == '' || value == null) && doesNotRemoveStyles && this.style.removeAttribute) {
                this.style.removeAttribute(property);
            }
            //</ltIE9>
            return this;
        },

        getStyle: function (property) {
            if (property == 'opacity') return getOpacity(this);
            property = (property == 'float' ? floatName : property).camelCase();
            var result = this.style[property];
            if (!result || property == 'zIndex') {
                result = [];
                for (var style in Element.ShortStyles) {
                    if (property != style) continue;
                    for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
                    return result.join(' ');
                }
                result = this.getComputedStyle(property);
            }
            if (result) {
                result = String(result);
                var color = result.match(/rgba?\([\d\s,]+\)/);
                if (color) result = result.replace(color[0], color[0].rgbToHex());
            }
            if (Browser.ie && isNaN(parseFloat(result))) {
                if ((/^(height|width)$/).test(property)) {
                    var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
                    values.each(function (value) {
                        size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
                    }, this);
                    return this['offset' + property.capitalize()] - size + 'px';
                }
                if (Browser.opera && String(result).indexOf('px') != -1) return result;
                if ((/^border(.+)Width|margin|padding/).test(property)) return '0px';
            }
            return result;
        },

        setStyles: function (styles) {
            for (var style in styles) this.setStyle(style, styles[style]);
            return this;
        },

        getStyles: function () {
            var result = {};
            Array.flatten(arguments).each(function (key) {
                result[key] = this.getStyle(key);
            }, this);
            return result;
        }

    });

    Element.Styles = {
        left: '@px',
        top: '@px',
        bottom: '@px',
        right: '@px',
        width: '@px',
        height: '@px',
        maxWidth: '@px',
        maxHeight: '@px',
        minWidth: '@px',
        minHeight: '@px',
        backgroundColor: 'rgb(@, @, @)',
        backgroundPosition: '@px @px',
        color: 'rgb(@, @, @)',
        fontSize: '@px',
        letterSpacing: '@px',
        lineHeight: '@px',
        clip: 'rect(@px @px @px @px)',
        margin: '@px @px @px @px',
        padding: '@px @px @px @px',
        border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
        borderWidth: '@px @px @px @px',
        borderStyle: '@ @ @ @',
        borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
        zIndex: '@',
        'zoom': '@',
        fontWeight: '@',
        textIndent: '@px',
        opacity: '@'
    };


    Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

    ['Top', 'Right', 'Bottom', 'Left'].each(function (direction) {
        var Short = Element.ShortStyles;
        var All = Element.Styles;
        ['margin', 'padding'].each(function (style) {
            var sd = style + direction;
            Short[style][sd] = All[sd] = '@px';
        });
        var bd = 'border' + direction;
        Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
        var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
        Short[bd] = {};
        Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
        Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
        Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
    });

})();


/*
 ---

 name: Element.Event

 description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events, if necessary.

 license: MIT-style license.

 requires: [Element, Event]

 provides: Element.Event

 ...
 */

(function () {

    Element.Properties.events = {
        set: function (events) {
            this.addEvents(events);
        }
    };

    [Element, Window, Document].invoke('implement', {

        addEvent: function (type, fn) {
            var events = this.retrieve('events', {});
            if (!events[type]) events[type] = {keys: [], values: []};
            if (events[type].keys.contains(fn)) return this;
            events[type].keys.push(fn);
            var realType = type,
                custom = Element.Events[type],
                condition = fn,
                self = this;
            if (custom) {
                if (custom.onAdd) custom.onAdd.call(this, fn, type);
                if (custom.condition) {
                    condition = function (event) {
                        if (custom.condition.call(this, event, type)) return fn.call(this, event);
                        return true;
                    };
                }
                if (custom.base) realType = Function.from(custom.base).call(this, type);
            }
            var defn = function () {
                return fn.call(self);
            };
            var nativeEvent = Element.NativeEvents[realType];
            if (nativeEvent) {
                if (nativeEvent == 2) {
                    defn = function (event) {
                        event = new DOMEvent(event, self.getWindow());
                        if (condition.call(self, event) === false) event.stop();
                    };
                }
                this.addListener(realType, defn, arguments[2]);
            }
            events[type].values.push(defn);
            return this;
        },

        removeEvent: function (type, fn) {
            var events = this.retrieve('events');
            if (!events || !events[type]) return this;
            var list = events[type];
            var index = list.keys.indexOf(fn);
            if (index == -1) return this;
            var value = list.values[index];
            delete list.keys[index];
            delete list.values[index];
            var custom = Element.Events[type];
            if (custom) {
                if (custom.onRemove) custom.onRemove.call(this, fn, type);
                if (custom.base) type = Function.from(custom.base).call(this, type);
            }
            return (Element.NativeEvents[type]) ? this.removeListener(type, value, arguments[2]) : this;
        },

        addEvents: function (events) {
            for (var event in events) this.addEvent(event, events[event]);
            return this;
        },

        removeEvents: function (events) {
            var type;
            if (typeOf(events) == 'object') {
                for (type in events) this.removeEvent(type, events[type]);
                return this;
            }
            var attached = this.retrieve('events');
            if (!attached) return this;
            if (!events) {
                for (type in attached) this.removeEvents(type);
                this.eliminate('events');
            } else if (attached[events]) {
                attached[events].keys.each(function (fn) {
                    this.removeEvent(events, fn);
                }, this);
                delete attached[events];
            }
            return this;
        },

        fireEvent: function (type, args, delay) {
            var events = this.retrieve('events');
            if (!events || !events[type]) return this;
            args = Array.from(args);

            events[type].keys.each(function (fn) {
                if (delay) fn.delay(delay, this, args);
                else fn.apply(this, args);
            }, this);
            return this;
        },

        cloneEvents: function (from, type) {
            from = document.id(from);
            var events = from.retrieve('events');
            if (!events) return this;
            if (!type) {
                for (var eventType in events) this.cloneEvents(from, eventType);
            } else if (events[type]) {
                events[type].keys.each(function (fn) {
                    this.addEvent(type, fn);
                }, this);
            }
            return this;
        }

    });

    Element.NativeEvents = {
        click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
        mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
        mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
        keydown: 2, keypress: 2, keyup: 2, //keyboard
        orientationchange: 2, // mobile
        touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
        gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
        focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, paste: 2, input: 2, //form elements
        load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
        error: 1, abort: 1, scroll: 1 //misc
    };

    Element.Events = {
        mousewheel: {
            base: (Browser.firefox) ? 'DOMMouseScroll' : 'mousewheel'
        }
    };

    if ('onmouseenter' in document.documentElement) {
        Element.NativeEvents.mouseenter = Element.NativeEvents.mouseleave = 2;
    } else {
        var check = function (event) {
            var related = event.relatedTarget;
            if (related == null) return true;
            if (!related) return false;
            return (related != this && related.prefix != 'xul' && typeOf(this) != 'document' && !this.contains(related));
        };

        Element.Events.mouseenter = {
            base: 'mouseover',
            condition: check
        };

        Element.Events.mouseleave = {
            base: 'mouseout',
            condition: check
        };
    }

    /*<ltIE9>*/
    if (!window.addEventListener) {
        Element.NativeEvents.propertychange = 2;
        Element.Events.change = {
            base: function () {
                var type = this.type;
                return (this.get('tag') == 'input' && (type == 'radio' || type == 'checkbox')) ? 'propertychange' : 'change'
            },
            condition: function (event) {
                return this.type != 'radio' || (event.event.propertyName == 'checked' && this.checked);
            }
        }
    }
    /*</ltIE9>*/


})();


/*
 ---

 name: Element.Delegation

 description: Extends the Element native object to include the delegate method for more efficient event management.

 license: MIT-style license.

 requires: [Element.Event]

 provides: [Element.Delegation]

 ...
 */

(function () {

    var eventListenerSupport = !!window.addEventListener;

    Element.NativeEvents.focusin = Element.NativeEvents.focusout = 2;

    var bubbleUp = function (self, match, fn, event, target) {
        while (target && target != self) {
            if (match(target, event)) return fn.call(target, event, target);
            target = document.id(target.parentNode);
        }
    };

    var map = {
        mouseenter: {
            base: 'mouseover'
        },
        mouseleave: {
            base: 'mouseout'
        },
        focus: {
            base: 'focus' + (eventListenerSupport ? '' : 'in'),
            capture: true
        },
        blur: {
            base: eventListenerSupport ? 'blur' : 'focusout',
            capture: true
        }
    };

    /*<ltIE9>*/
    var _key = '$delegation:';
    var formObserver = function (type) {

        return {

            base: 'focusin',

            remove: function (self, uid) {
                var list = self.retrieve(_key + type + 'listeners', {})[uid];
                if (list && list.forms) for (var i = list.forms.length; i--;) {
                    list.forms[i].removeEvent(type, list.fns[i]);
                }
            },

            listen: function (self, match, fn, event, target, uid) {
                var form = (target.get('tag') == 'form') ? target : event.target.getParent('form');
                if (!form) return;

                var listeners = self.retrieve(_key + type + 'listeners', {}),
                    listener = listeners[uid] || {forms: [], fns: []},
                    forms = listener.forms, fns = listener.fns;

                if (forms.indexOf(form) != -1) return;
                forms.push(form);

                var _fn = function (event) {
                    bubbleUp(self, match, fn, event, target);
                };
                form.addEvent(type, _fn);
                fns.push(_fn);

                listeners[uid] = listener;
                self.store(_key + type + 'listeners', listeners);
            }
        };
    };

    var inputObserver = function (type) {
        return {
            base: 'focusin',
            listen: function (self, match, fn, event, target) {
                var events = {
                    blur: function () {
                        this.removeEvents(events);
                    }
                };
                events[type] = function (event) {
                    bubbleUp(self, match, fn, event, target);
                };
                event.target.addEvents(events);
            }
        };
    };

    if (!eventListenerSupport) Object.append(map, {
        submit: formObserver('submit'),
        reset: formObserver('reset'),
        change: inputObserver('change'),
        select: inputObserver('select')
    });
    /*</ltIE9>*/

    var proto = Element.prototype,
        addEvent = proto.addEvent,
        removeEvent = proto.removeEvent;

    var relay = function (old, method) {
        return function (type, fn, useCapture) {
            if (type.indexOf(':relay') == -1) return old.call(this, type, fn, useCapture);
            var parsed = Slick.parse(type).expressions[0][0];
            if (parsed.pseudos[0].key != 'relay') return old.call(this, type, fn, useCapture);
            var newType = parsed.tag;
            parsed.pseudos.slice(1).each(function (pseudo) {
                newType += ':' + pseudo.key + (pseudo.value ? '(' + pseudo.value + ')' : '');
            });
            old.call(this, type, fn);
            return method.call(this, newType, parsed.pseudos[0].value, fn);
        };
    };

    var delegation = {

        addEvent: function (type, match, fn) {
            var storage = this.retrieve('$delegates', {}), stored = storage[type];
            if (stored) for (var _uid in stored) {
                if (stored[_uid].fn == fn && stored[_uid].match == match) return this;
            }

            var _type = type, _match = match, _fn = fn, _map = map[type] || {};
            type = _map.base || _type;

            match = function (target) {
                return Slick.match(target, _match);
            };

            var elementEvent = Element.Events[_type];
            if (elementEvent && elementEvent.condition) {
                var __match = match, condition = elementEvent.condition;
                match = function (target, event) {
                    return __match(target, event) && condition.call(target, event, type);
                };
            }

            var self = this, uid = String.uniqueID();
            var delegator = _map.listen ? function (event, target) {
                if (!target && event && event.target) target = event.target;
                if (target) _map.listen(self, match, fn, event, target, uid);
            } : function (event, target) {
                if (!target && event && event.target) target = event.target;
                if (target) bubbleUp(self, match, fn, event, target);
            };

            if (!stored) stored = {};
            stored[uid] = {
                match: _match,
                fn: _fn,
                delegator: delegator
            };
            storage[_type] = stored;
            return addEvent.call(this, type, delegator, _map.capture);
        },

        removeEvent: function (type, match, fn, _uid) {
            var storage = this.retrieve('$delegates', {}), stored = storage[type];
            if (!stored) return this;

            if (_uid) {
                var _type = type, delegator = stored[_uid].delegator, _map = map[type] || {};
                type = _map.base || _type;
                if (_map.remove) _map.remove(this, _uid);
                delete stored[_uid];
                storage[_type] = stored;
                return removeEvent.call(this, type, delegator);
            }

            var __uid, s;
            if (fn) for (__uid in stored) {
                s = stored[__uid];
                if (s.match == match && s.fn == fn) return delegation.removeEvent.call(this, type, match, fn, __uid);
            } else for (__uid in stored) {
                s = stored[__uid];
                if (s.match == match) delegation.removeEvent.call(this, type, match, s.fn, __uid);
            }
            return this;
        }

    };

    [Element, Window, Document].invoke('implement', {
        addEvent: relay(addEvent, delegation.addEvent),
        removeEvent: relay(removeEvent, delegation.removeEvent)
    });

})();


/*
 ---

 name: Element.Dimensions

 description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

 license: MIT-style license.

 credits:
 - Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
 - Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

 requires: [Element, Element.Style]

 provides: [Element.Dimensions]

 ...
 */

(function () {

    var element = document.createElement('div'),
        child = document.createElement('div');
    element.style.height = '0';
    element.appendChild(child);
    var brokenOffsetParent = (child.offsetParent === element);
    element = child = null;

    var isOffset = function (el) {
        return styleString(el, 'position') != 'static' || isBody(el);
    };

    var isOffsetStatic = function (el) {
        return isOffset(el) || (/^(?:table|td|th)$/i).test(el.tagName);
    };

    Element.implement({

        scrollTo: function (x, y) {
            if (isBody(this)) {
                this.getWindow().scrollTo(x, y);
            } else {
                this.scrollLeft = x;
                this.scrollTop = y;
            }
            return this;
        },

        getSize: function () {
            if (isBody(this)) return this.getWindow().getSize();
            return {x: this.offsetWidth, y: this.offsetHeight};
        },

        getScrollSize: function () {
            if (isBody(this)) return this.getWindow().getScrollSize();
            return {x: this.scrollWidth, y: this.scrollHeight};
        },

        getScroll: function () {
            if (isBody(this)) return this.getWindow().getScroll();
            return {x: this.scrollLeft, y: this.scrollTop};
        },

        getScrolls: function () {
            var element = this.parentNode, position = {x: 0, y: 0};
            while (element && !isBody(element)) {
                position.x += element.scrollLeft;
                position.y += element.scrollTop;
                element = element.parentNode;
            }
            return position;
        },

        getOffsetParent: brokenOffsetParent ? function () {
            var element = this;
            if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

            var isOffsetCheck = (styleString(element, 'position') == 'static') ? isOffsetStatic : isOffset;
            while ((element = element.parentNode)) {
                if (isOffsetCheck(element)) return element;
            }
            return null;
        } : function () {
            var element = this;
            if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

            try {
                return element.offsetParent;
            } catch (e) {
            }
            return null;
        },

        getOffsets: function () {
            if (this.getBoundingClientRect && !Browser.Platform.ios) {
                var bound = this.getBoundingClientRect(),
                    html = document.id(this.getDocument().documentElement),
                    htmlScroll = html.getScroll(),
                    elemScrolls = this.getScrolls(),
                    isFixed = (styleString(this, 'position') == 'fixed');

                return {
                    x: bound.left.toInt() + elemScrolls.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
                    y: bound.top.toInt() + elemScrolls.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
                };
            }

            var element = this, position = {x: 0, y: 0};
            if (isBody(this)) return position;

            while (element && !isBody(element)) {
                position.x += element.offsetLeft;
                position.y += element.offsetTop;

                if (Browser.firefox) {
                    if (!borderBox(element)) {
                        position.x += leftBorder(element);
                        position.y += topBorder(element);
                    }
                    var parent = element.parentNode;
                    if (parent && styleString(parent, 'overflow') != 'visible') {
                        position.x += leftBorder(parent);
                        position.y += topBorder(parent);
                    }
                } else if (element != this && Browser.safari) {
                    position.x += leftBorder(element);
                    position.y += topBorder(element);
                }

                element = element.offsetParent;
            }
            if (Browser.firefox && !borderBox(this)) {
                position.x -= leftBorder(this);
                position.y -= topBorder(this);
            }
            return position;
        },

        getPosition: function (relative) {
            var offset = this.getOffsets(),
                scroll = this.getScrolls();
            var position = {
                x: offset.x - scroll.x,
                y: offset.y - scroll.y
            };

            if (relative && (relative = document.id(relative))) {
                var relativePosition = relative.getPosition();
                return {
                    x: position.x - relativePosition.x - leftBorder(relative),
                    y: position.y - relativePosition.y - topBorder(relative)
                };
            }
            return position;
        },

        getCoordinates: function (element) {
            if (isBody(this)) return this.getWindow().getCoordinates();
            var position = this.getPosition(element),
                size = this.getSize();
            var obj = {
                left: position.x,
                top: position.y,
                width: size.x,
                height: size.y
            };
            obj.right = obj.left + obj.width;
            obj.bottom = obj.top + obj.height;
            return obj;
        },

        computePosition: function (obj) {
            return {
                left: obj.x - styleNumber(this, 'margin-left'),
                top: obj.y - styleNumber(this, 'margin-top')
            };
        },

        setPosition: function (obj) {
            return this.setStyles(this.computePosition(obj));
        }

    });


    [Document, Window].invoke('implement', {

        getSize: function () {
            var doc = getCompatElement(this);
            return {x: doc.clientWidth, y: doc.clientHeight};
        },

        getScroll: function () {
            var win = this.getWindow(), doc = getCompatElement(this);
            return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
        },

        getScrollSize: function () {
            var doc = getCompatElement(this),
                min = this.getSize(),
                body = this.getDocument().body;

            return {
                x: Math.max(doc.scrollWidth, body.scrollWidth, min.x),
                y: Math.max(doc.scrollHeight, body.scrollHeight, min.y)
            };
        },

        getPosition: function () {
            return {x: 0, y: 0};
        },

        getCoordinates: function () {
            var size = this.getSize();
            return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
        }

    });

// private methods

    var styleString = Element.getComputedStyle;

    function styleNumber(element, style) {
        return styleString(element, style).toInt() || 0;
    }

    function borderBox(element) {
        return styleString(element, '-moz-box-sizing') == 'border-box';
    }

    function topBorder(element) {
        return styleNumber(element, 'border-top-width');
    }

    function leftBorder(element) {
        return styleNumber(element, 'border-left-width');
    }

    function isBody(element) {
        return (/^(?:body|html)$/i).test(element.tagName);
    }

    function getCompatElement(element) {
        var doc = element.getDocument();
        return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
    }

})();

//aliases
Element.alias({position: 'setPosition'}); //compatability

[Window, Document, Element].invoke('implement', {

    getHeight: function () {
        return this.getSize().y;
    },

    getWidth: function () {
        return this.getSize().x;
    },

    getScrollTop: function () {
        return this.getScroll().y;
    },

    getScrollLeft: function () {
        return this.getScroll().x;
    },

    getScrollHeight: function () {
        return this.getScrollSize().y;
    },

    getScrollWidth: function () {
        return this.getScrollSize().x;
    },

    getTop: function () {
        return this.getPosition().y;
    },

    getLeft: function () {
        return this.getPosition().x;
    }

});


/*
 ---

 name: Fx

 description: Contains the basic animation logic to be extended by all other Fx Classes.

 license: MIT-style license.

 requires: [Chain, Events, Options]

 provides: Fx

 ...
 */

(function () {

    var Fx = this.Fx = new Class({

        Implements: [Chain, Events, Options],

        options: {
            /*
             onStart: nil,
             onCancel: nil,
             onComplete: nil,
             */
            fps: 60,
            unit: false,
            duration: 500,
            frames: null,
            frameSkip: true,
            link: 'ignore'
        },

        initialize: function (options) {
            this.subject = this.subject || this;
            this.setOptions(options);
        },

        getTransition: function () {
            return function (p) {
                return -(Math.cos(Math.PI * p) - 1) / 2;
            };
        },

        step: function (now) {
            if (this.options.frameSkip) {
                var diff = (this.time != null) ? (now - this.time) : 0, frames = diff / this.frameInterval;
                this.time = now;
                this.frame += frames;
            } else {
                this.frame++;
            }

            if (this.frame < this.frames) {
                var delta = this.transition(this.frame / this.frames);
                this.set(this.compute(this.from, this.to, delta));
            } else {
                this.frame = this.frames;
                this.set(this.compute(this.from, this.to, 1));
                this.stop();
            }
        },

        set: function (now) {
            return now;
        },

        compute: function (from, to, delta) {
            return Fx.compute(from, to, delta);
        },

        check: function () {
            if (!this.isRunning()) return true;
            switch (this.options.link) {
                case 'cancel':
                    this.cancel();
                    return true;
                case 'chain':
                    this.chain(this.caller.pass(arguments, this));
                    return false;
            }
            return false;
        },

        start: function (from, to) {
            if (!this.check(from, to)) return this;
            this.from = from;
            this.to = to;
            this.frame = (this.options.frameSkip) ? 0 : -1;
            this.time = null;
            this.transition = this.getTransition();
            var frames = this.options.frames, fps = this.options.fps, duration = this.options.duration;
            this.duration = Fx.Durations[duration] || duration.toInt();
            this.frameInterval = 1000 / fps;
            this.frames = frames || Math.round(this.duration / this.frameInterval);
            this.fireEvent('start', this.subject);
            pushInstance.call(this, fps);
            return this;
        },

        stop: function () {
            if (this.isRunning()) {
                this.time = null;
                pullInstance.call(this, this.options.fps);
                if (this.frames == this.frame) {
                    this.fireEvent('complete', this.subject);
                    if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
                } else {
                    this.fireEvent('stop', this.subject);
                }
            }
            return this;
        },

        cancel: function () {
            if (this.isRunning()) {
                this.time = null;
                pullInstance.call(this, this.options.fps);
                this.frame = this.frames;
                this.fireEvent('cancel', this.subject).clearChain();
            }
            return this;
        },

        pause: function () {
            if (this.isRunning()) {
                this.time = null;
                pullInstance.call(this, this.options.fps);
            }
            return this;
        },

        resume: function () {
            if ((this.frame < this.frames) && !this.isRunning()) pushInstance.call(this, this.options.fps);
            return this;
        },

        isRunning: function () {
            var list = instances[this.options.fps];
            return list && list.contains(this);
        }

    });

    Fx.compute = function (from, to, delta) {
        return (to - from) * delta + from;
    };

    Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};

// global timers

    var instances = {}, timers = {};

    var loop = function () {
        var now = Date.now();
        for (var i = this.length; i--;) {
            var instance = this[i];
            if (instance) instance.step(now);
        }
    };

    var pushInstance = function (fps) {
        var list = instances[fps] || (instances[fps] = []);
        list.push(this);
        if (!timers[fps]) timers[fps] = loop.periodical(Math.round(1000 / fps), list);
    };

    var pullInstance = function (fps) {
        var list = instances[fps];
        if (list) {
            list.erase(this);
            if (!list.length && timers[fps]) {
                delete instances[fps];
                timers[fps] = clearInterval(timers[fps]);
            }
        }
    };

})();


/*
 ---

 name: Fx.CSS

 description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

 license: MIT-style license.

 requires: [Fx, Element.Style]

 provides: Fx.CSS

 ...
 */

Fx.CSS = new Class({

    Extends: Fx,

    //prepares the base from/to object

    prepare: function (element, property, values) {
        values = Array.from(values);
        var from = values[0], to = values[1];
        if (to == null) {
            to = from;
            from = element.getStyle(property);
            var unit = this.options.unit;
            // adapted from: https://github.com/ryanmorr/fx/blob/master/fx.js#L299
            if (unit && from.slice(-unit.length) != unit && parseFloat(from) != 0) {
                element.setStyle(property, to + unit);
                var value = element.getComputedStyle(property);
                // IE and Opera support pixelLeft or pixelWidth
                if (!(/px$/.test(value))) {
                    value = element.style[('pixel-' + property).camelCase()];
                    if (value == null) {
                        // adapted from Dean Edwards' http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
                        var left = element.style.left;
                        element.style.left = to + unit;
                        value = element.style.pixelLeft;
                        element.style.left = left;
                    }
                }
                from = (to || 1) / (parseFloat(value) || 1) * (parseFloat(from) || 0);
                element.setStyle(property, from + unit);
            }
        }
        return {from: this.parse(from), to: this.parse(to)};
    },

    //parses a value into an array

    parse: function (value) {
        value = Function.from(value)();
        value = (typeof value == 'string') ? value.split(' ') : Array.from(value);
        return value.map(function (val) {
            val = String(val);
            var found = false;
            Object.each(Fx.CSS.Parsers, function (parser, key) {
                if (found) return;
                var parsed = parser.parse(val);
                if (parsed || parsed === 0) found = {value: parsed, parser: parser};
            });
            found = found || {value: val, parser: Fx.CSS.Parsers.String};
            return found;
        });
    },

    //computes by a from and to prepared objects, using their parsers.

    compute: function (from, to, delta) {
        var computed = [];
        (Math.min(from.length, to.length)).times(function (i) {
            computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
        });
        computed.$family = Function.from('fx:css:value');
        return computed;
    },

    //serves the value as settable

    serve: function (value, unit) {
        if (typeOf(value) != 'fx:css:value') value = this.parse(value);
        var returned = [];
        value.each(function (bit) {
            returned = returned.concat(bit.parser.serve(bit.value, unit));
        });
        return returned;
    },

    //renders the change to an element

    render: function (element, property, value, unit) {
        element.setStyle(property, this.serve(value, unit));
    },

    //searches inside the page css to find the values for a selector

    search: function (selector) {
        if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
        var to = {}, selectorTest = new RegExp('^' + selector.escapeRegExp() + '$');
        Array.each(document.styleSheets, function (sheet, j) {
            var href = sheet.href;
            if (href && href.contains('://') && !href.contains(document.domain)) return;
            var rules = sheet.rules || sheet.cssRules;
            Array.each(rules, function (rule, i) {
                if (!rule.style) return;
                var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function (m) {
                    return m.toLowerCase();
                }) : null;
                if (!selectorText || !selectorTest.test(selectorText)) return;
                Object.each(Element.Styles, function (value, style) {
                    if (!rule.style[style] || Element.ShortStyles[style]) return;
                    value = String(rule.style[style]);
                    to[style] = ((/^rgb/).test(value)) ? value.rgbToHex() : value;
                });
            });
        });
        return Fx.CSS.Cache[selector] = to;
    }

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = {

    Color: {
        parse: function (value) {
            if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
            return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
        },
        compute: function (from, to, delta) {
            return from.map(function (value, i) {
                return Math.round(Fx.compute(from[i], to[i], delta));
            });
        },
        serve: function (value) {
            return value.map(Number);
        }
    },

    Number: {
        parse: parseFloat,
        compute: Fx.compute,
        serve: function (value, unit) {
            return (unit) ? value + unit : value;
        }
    },

    String: {
        parse: Function.from(false),
        compute: function (zero, one) {
            return one;
        },
        serve: function (zero) {
            return zero;
        }
    }

};


/*
 ---

 name: Fx.Tween

 description: Formerly Fx.Style, effect to transition any CSS property for an element.

 license: MIT-style license.

 requires: Fx.CSS

 provides: [Fx.Tween, Element.fade, Element.highlight]

 ...
 */

Fx.Tween = new Class({

    Extends: Fx.CSS,

    initialize: function (element, options) {
        this.element = this.subject = document.id(element);
        this.parent(options);
    },

    set: function (property, now) {
        if (arguments.length == 1) {
            now = property;
            property = this.property || this.options.property;
        }
        this.render(this.element, property, now, this.options.unit);
        return this;
    },

    start: function (property, from, to) {
        if (!this.check(property, from, to)) return this;
        var args = Array.flatten(arguments);
        this.property = this.options.property || args.shift();
        var parsed = this.prepare(this.element, this.property, args);
        return this.parent(parsed.from, parsed.to);
    }

});

Element.Properties.tween = {

    set: function (options) {
        this.get('tween').cancel().setOptions(options);
        return this;
    },

    get: function () {
        var tween = this.retrieve('tween');
        if (!tween) {
            tween = new Fx.Tween(this, {link: 'cancel'});
            this.store('tween', tween);
        }
        return tween;
    }

};

Element.implement({

    tween: function (property, from, to) {
        this.get('tween').start(property, from, to);
        return this;
    },

    fade: function (how) {
        var fade = this.get('tween'), method, args = ['opacity'].append(arguments), toggle;
        if (args[1] == null) args[1] = 'toggle';
        switch (args[1]) {
            case 'in':
                method = 'start';
                args[1] = 1;
                break;
            case 'out':
                method = 'start';
                args[1] = 0;
                break;
            case 'show':
                method = 'set';
                args[1] = 1;
                break;
            case 'hide':
                method = 'set';
                args[1] = 0;
                break;
            case 'toggle':
                var flag = this.retrieve('fade:flag', this.getStyle('opacity') == 1);
                method = 'start';
                args[1] = flag ? 0 : 1;
                this.store('fade:flag', !flag);
                toggle = true;
                break;
            default:
                method = 'start';
        }
        if (!toggle) this.eliminate('fade:flag');
        fade[method].apply(fade, args);
        var to = args[args.length - 1];
        if (method == 'set' || to != 0) this.setStyle('visibility', to == 0 ? 'hidden' : 'visible');
        else fade.chain(function () {
            this.element.setStyle('visibility', 'hidden');
            this.callChain();
        });
        return this;
    },

    highlight: function (start, end) {
        if (!end) {
            end = this.retrieve('highlight:original', this.getStyle('background-color'));
            end = (end == 'transparent') ? '#fff' : end;
        }
        var tween = this.get('tween');
        tween.start('background-color', start || '#ffff88', end).chain(function () {
            this.setStyle('background-color', this.retrieve('highlight:original'));
            tween.callChain();
        }.bind(this));
        return this;
    }

});


/*
 ---

 name: Fx.Morph

 description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

 license: MIT-style license.

 requires: Fx.CSS

 provides: Fx.Morph

 ...
 */

Fx.Morph = new Class({

    Extends: Fx.CSS,

    initialize: function (element, options) {
        this.element = this.subject = document.id(element);
        this.parent(options);
    },

    set: function (now) {
        if (typeof now == 'string') now = this.search(now);
        for (var p in now) this.render(this.element, p, now[p], this.options.unit);
        return this;
    },

    compute: function (from, to, delta) {
        var now = {};
        for (var p in from) now[p] = this.parent(from[p], to[p], delta);
        return now;
    },

    start: function (properties) {
        if (!this.check(properties)) return this;
        if (typeof properties == 'string') properties = this.search(properties);
        var from = {}, to = {};
        for (var p in properties) {
            var parsed = this.prepare(this.element, p, properties[p]);
            from[p] = parsed.from;
            to[p] = parsed.to;
        }
        return this.parent(from, to);
    }

});

Element.Properties.morph = {

    set: function (options) {
        this.get('morph').cancel().setOptions(options);
        return this;
    },

    get: function () {
        var morph = this.retrieve('morph');
        if (!morph) {
            morph = new Fx.Morph(this, {link: 'cancel'});
            this.store('morph', morph);
        }
        return morph;
    }

};

Element.implement({

    morph: function (props) {
        this.get('morph').start(props);
        return this;
    }

});


/*
 ---

 name: Fx.Transitions

 description: Contains a set of advanced transitions to be used with any of the Fx Classes.

 license: MIT-style license.

 credits:
 - Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

 requires: Fx

 provides: Fx.Transitions

 ...
 */

Fx.implement({

    getTransition: function () {
        var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
        if (typeof trans == 'string') {
            var data = trans.split(':');
            trans = Fx.Transitions;
            trans = trans[data[0]] || trans[data[0].capitalize()];
            if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
        }
        return trans;
    }

});

Fx.Transition = function (transition, params) {
    params = Array.from(params);
    var easeIn = function (pos) {
        return transition(pos, params);
    };
    return Object.append(easeIn, {
        easeIn: easeIn,
        easeOut: function (pos) {
            return 1 - transition(1 - pos, params);
        },
        easeInOut: function (pos) {
            return (pos <= 0.5 ? transition(2 * pos, params) : (2 - transition(2 * (1 - pos), params))) / 2;
        }
    });
};

Fx.Transitions = {

    linear: function (zero) {
        return zero;
    }

};


Fx.Transitions.extend = function (transitions) {
    for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

    Pow: function (p, x) {
        return Math.pow(p, x && x[0] || 6);
    },

    Expo: function (p) {
        return Math.pow(2, 8 * (p - 1));
    },

    Circ: function (p) {
        return 1 - Math.sin(Math.acos(p));
    },

    Sine: function (p) {
        return 1 - Math.cos(p * Math.PI / 2);
    },

    Back: function (p, x) {
        x = x && x[0] || 1.618;
        return Math.pow(p, 2) * ((x + 1) * p - x);
    },

    Bounce: function (p) {
        var value;
        for (var a = 0, b = 1; 1; a += b, b /= 2) {
            if (p >= (7 - 4 * a) / 11) {
                value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
                break;
            }
        }
        return value;
    },

    Elastic: function (p, x) {
        return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x && x[0] || 1) / 3);
    }

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function (transition, i) {
    Fx.Transitions[transition] = new Fx.Transition(function (p) {
        return Math.pow(p, i + 2);
    });
});


/*
 ---

 name: Request

 description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

 license: MIT-style license.

 requires: [Object, Element, Chain, Events, Options, Browser]

 provides: Request

 ...
 */

(function () {

    var empty = function () {
        },
        progressSupport = ('onprogress' in new Browser.Request);

    var Request = this.Request = new Class({

        Implements: [Chain, Events, Options],

        options: {
            /*
             onRequest: function(){},
             onLoadstart: function(event, xhr){},
             onProgress: function(event, xhr){},
             onComplete: function(){},
             onCancel: function(){},
             onSuccess: function(responseText, responseXML){},
             onFailure: function(xhr){},
             onException: function(headerName, value){},
             onTimeout: function(){},
             user: '',
             password: '',*/
            url: '',
            data: '',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
            },
            async: true,
            format: false,
            method: 'post',
            link: 'ignore',
            isSuccess: null,
            emulation: true,
            urlEncoded: true,
            encoding: 'utf-8',
            evalScripts: false,
            evalResponse: false,
            timeout: 0,
            noCache: false
        },

        initialize: function (options) {
            this.xhr = new Browser.Request();
            this.setOptions(options);
            this.headers = this.options.headers;
        },

        onStateChange: function () {
            var xhr = this.xhr;
            if (xhr.readyState != 4 || !this.running) return;
            this.running = false;
            this.status = 0;
            Function.attempt(function () {
                var status = xhr.status;
                this.status = (status == 1223) ? 204 : status;
            }.bind(this));
            xhr.onreadystatechange = empty;
            if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
            clearTimeout(this.timer);

            this.response = {text: this.xhr.responseText || '', xml: this.xhr.responseXML};
            if (this.options.isSuccess.call(this, this.status))
                this.success(this.response.text, this.response.xml);
            else
                this.failure();
        },

        isSuccess: function () {
            var status = this.status;
            return (status >= 200 && status < 300);
        },

        isRunning: function () {
            return !!this.running;
        },

        processScripts: function (text) {
            if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return Browser.exec(text);
            return text.stripScripts(this.options.evalScripts);
        },

        success: function (text, xml) {
            this.onSuccess(this.processScripts(text), xml);
        },

        onSuccess: function () {
            this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
        },

        failure: function () {
            this.onFailure();
        },

        onFailure: function () {
            this.fireEvent('complete').fireEvent('failure', this.xhr);
        },

        loadstart: function (event) {
            this.fireEvent('loadstart', [event, this.xhr]);
        },

        progress: function (event) {
            this.fireEvent('progress', [event, this.xhr]);
        },

        timeout: function () {
            this.fireEvent('timeout', this.xhr);
        },

        setHeader: function (name, value) {
            this.headers[name] = value;
            return this;
        },

        getHeader: function (name) {
            return Function.attempt(function () {
                return this.xhr.getResponseHeader(name);
            }.bind(this));
        },

        check: function () {
            if (!this.running) return true;
            switch (this.options.link) {
                case 'cancel':
                    this.cancel();
                    return true;
                case 'chain':
                    this.chain(this.caller.pass(arguments, this));
                    return false;
            }
            return false;
        },

        send: function (options) {
            if (!this.check(options)) return this;

            this.options.isSuccess = this.options.isSuccess || this.isSuccess;
            this.running = true;

            var type = typeOf(options);
            if (type == 'string' || type == 'element') options = {data: options};

            var old = this.options;
            options = Object.append({data: old.data, url: old.url, method: old.method}, options);
            var data = options.data, url = String(options.url), method = options.method.toLowerCase();

            switch (typeOf(data)) {
                case 'element':
                    data = document.id(data).toQueryString();
                    break;
                case 'object':
                case 'hash':
                    data = Object.toQueryString(data);
            }

            if (this.options.format) {
                var format = 'format=' + this.options.format;
                data = (data) ? format + '&' + data : format;
            }

            if (this.options.emulation && !['get', 'post'].contains(method)) {
                var _method = '_method=' + method;
                data = (data) ? _method + '&' + data : _method;
                method = 'post';
            }

            if (this.options.urlEncoded && ['post', 'put'].contains(method)) {
                var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
                this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
            }

            if (!url) url = document.location.pathname;

            var trimPosition = url.lastIndexOf('/');
            if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

            if (this.options.noCache)
                url += (url.contains('?') ? '&' : '?') + String.uniqueID();

            if (data && method == 'get') {
                url += (url.contains('?') ? '&' : '?') + data;
                data = null;
            }

            var xhr = this.xhr;
            if (progressSupport) {
                xhr.onloadstart = this.loadstart.bind(this);
                xhr.onprogress = this.progress.bind(this);
            }

            xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
            if (this.options.user && 'withCredentials' in xhr) xhr.withCredentials = true;

            xhr.onreadystatechange = this.onStateChange.bind(this);

            Object.each(this.headers, function (value, key) {
                try {
                    xhr.setRequestHeader(key, value);
                } catch (e) {
                    this.fireEvent('exception', [key, value]);
                }
            }, this);

            this.fireEvent('request');
            xhr.send(data);
            if (!this.options.async) this.onStateChange();
            else if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
            return this;
        },

        cancel: function () {
            if (!this.running) return this;
            this.running = false;
            var xhr = this.xhr;
            xhr.abort();
            clearTimeout(this.timer);
            xhr.onreadystatechange = empty;
            if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
            this.xhr = new Browser.Request();
            this.fireEvent('cancel');
            return this;
        }

    });

    var methods = {};
    ['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function (method) {
        methods[method] = function (data) {
            var object = {
                method: method
            };
            if (data != null) object.data = data;
            return this.send(object);
        };
    });

    Request.implement(methods);

    Element.Properties.send = {

        set: function (options) {
            var send = this.get('send').cancel();
            send.setOptions(options);
            return this;
        },

        get: function () {
            var send = this.retrieve('send');
            if (!send) {
                send = new Request({
                    data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
                });
                this.store('send', send);
            }
            return send;
        }

    };

    Element.implement({

        send: function (url) {
            var sender = this.get('send');
            sender.send({data: this, url: url || sender.options.url});
            return this;
        }

    });

})();


/*
 ---

 name: Request.HTML

 description: Extends the basic Request Class with additional methods for interacting with HTML responses.

 license: MIT-style license.

 requires: [Element, Request]

 provides: Request.HTML

 ...
 */

Request.HTML = new Class({

    Extends: Request,

    options: {
        update: false,
        append: false,
        evalScripts: true,
        filter: false,
        headers: {
            Accept: 'text/html, application/xml, text/xml, */*'
        }
    },

    success: function (text) {
        var options = this.options, response = this.response;

        response.html = text.stripScripts(function (script) {
            response.javascript = script;
        });

        var match = response.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (match) response.html = match[1];
        var temp = new Element('div').set('html', response.html);

        response.tree = temp.childNodes;
        response.elements = temp.getElements(options.filter || '*');

        if (options.filter) response.tree = response.elements;
        if (options.update) {
            var update = document.id(options.update).empty();
            if (options.filter) update.adopt(response.elements);
            else update.set('html', response.html);
        } else if (options.append) {
            var append = document.id(options.append);
            if (options.filter) response.elements.reverse().inject(append);
            else append.adopt(temp.getChildren());
        }
        if (options.evalScripts) Browser.exec(response.javascript);

        this.onSuccess(response.tree, response.elements, response.html, response.javascript);
    }

});

Element.Properties.load = {

    set: function (options) {
        var load = this.get('load').cancel();
        load.setOptions(options);
        return this;
    },

    get: function () {
        var load = this.retrieve('load');
        if (!load) {
            load = new Request.HTML({data: this, link: 'cancel', update: this, method: 'get'});
            this.store('load', load);
        }
        return load;
    }

};

Element.implement({

    load: function () {
        this.get('load').send(Array.link(arguments, {data: Type.isObject, url: Type.isString}));
        return this;
    }

});


/*
 ---

 name: JSON

 description: JSON encoder and decoder.

 license: MIT-style license.

 SeeAlso: <http://www.json.org/>

 requires: [Array, String, Number, Function]

 provides: JSON

 ...
 */

if (typeof JSON == 'undefined') this.JSON = {};


(function () {

    var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\'};

    var escape = function (chr) {
        return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
    };

    JSON.validate = function (string) {
        string = string.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, '');

        return (/^[\],:{}\s]*$/).test(string);
    };

    JSON.encode = JSON.stringify ? function (obj) {
        return JSON.stringify(obj);
    } : function (obj) {
        if (obj && obj.toJSON) obj = obj.toJSON();

        switch (typeOf(obj)) {
            case 'string':
                return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
            case 'array':
                return '[' + obj.map(JSON.encode).clean() + ']';
            case 'object':
            case 'hash':
                var string = [];
                Object.each(obj, function (value, key) {
                    var json = JSON.encode(value);
                    if (json) string.push(JSON.encode(key) + ':' + json);
                });
                return '{' + string + '}';
            case 'number':
            case 'boolean':
                return '' + obj;
            case 'null':
                return 'null';
        }

        return null;
    };

    JSON.decode = function (string, secure) {
        if (!string || typeOf(string) != 'string') return null;

        if (secure || JSON.secure) {
            if (JSON.parse) return JSON.parse(string);
            if (!JSON.validate(string)) throw new Error('JSON could not decode the input; security is enabled and the value is not secure.');
        }

        return eval('(' + string + ')');
    };

})();


/*
 ---

 name: Request.JSON

 description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

 license: MIT-style license.

 requires: [Request, JSON]

 provides: Request.JSON

 ...
 */

Request.JSON = new Class({

    Extends: Request,

    options: {
        /*onError: function(text, error){},*/
        secure: true
    },

    initialize: function (options) {
        this.parent(options);
        Object.append(this.headers, {
            'Accept': 'application/json',
            'X-Request': 'JSON'
        });
    },

    success: function (text) {
        var json;
        try {
            json = this.response.json = JSON.decode(text, this.options.secure);
        } catch (error) {
            this.fireEvent('error', [text, error]);
            return;
        }
        if (json == null) this.onFailure();
        else this.onSuccess(json, text);
    }

});


/*
 ---

 name: Cookie

 description: Class for creating, reading, and deleting browser Cookies.

 license: MIT-style license.

 credits:
 - Based on the functions by Peter-Paul Koch (http://quirksmode.org).

 requires: [Options, Browser]

 provides: Cookie

 ...
 */

var Cookie = new Class({

    Implements: Options,

    options: {
        path: '/',
        domain: false,
        duration: false,
        secure: false,
        document: document,
        encode: true
    },

    initialize: function (key, options) {
        this.key = key;
        this.setOptions(options);
    },

    write: function (value) {
        if (this.options.encode) value = encodeURIComponent(value);
        if (this.options.domain) value += '; domain=' + this.options.domain;
        if (this.options.path) value += '; path=' + this.options.path;
        if (this.options.duration) {
            var date = new Date();
            date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
            value += '; expires=' + date.toGMTString();
        }
        if (this.options.secure) value += '; secure';
        this.options.document.cookie = this.key + '=' + value;
        return this;
    },

    read: function () {
        var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
        return (value) ? decodeURIComponent(value[1]) : null;
    },

    dispose: function () {
        new Cookie(this.key, Object.merge({}, this.options, {duration: -1})).write('');
        return this;
    }

});

Cookie.write = function (key, value, options) {
    return new Cookie(key, options).write(value);
};

Cookie.read = function (key) {
    return new Cookie(key).read();
};

Cookie.dispose = function (key, options) {
    return new Cookie(key, options).dispose();
};


/*
 ---

 name: DOMReady

 description: Contains the custom event domready.

 license: MIT-style license.

 requires: [Browser, Element, Element.Event]

 provides: [DOMReady, DomReady]

 ...
 */

(function (window, document) {

    var ready,
        loaded,
        checks = [],
        shouldPoll,
        timer,
        testElement = document.createElement('div');

    var domready = function () {
        clearTimeout(timer);
        if (ready) return;
        Browser.loaded = ready = true;
        document.removeListener('DOMContentLoaded', domready).removeListener('readystatechange', check);

        document.fireEvent('domready');
        window.fireEvent('domready');
    };

    var check = function () {
        for (var i = checks.length; i--;) if (checks[i]()) {
            domready();
            return true;
        }
        return false;
    };

    var poll = function () {
        clearTimeout(timer);
        if (!check()) timer = setTimeout(poll, 10);
    };

    document.addListener('DOMContentLoaded', domready);

    /*<ltIE8>*/
// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
// testElement.doScroll() throws when the DOM is not ready, only in the top window
    var doScrollWorks = function () {
        try {
            testElement.doScroll();
            return true;
        } catch (e) {
        }
        return false;
    };
// If doScroll works already, it can't be used to determine domready
//   e.g. in an iframe
    if (testElement.doScroll && !doScrollWorks()) {
        checks.push(doScrollWorks);
        shouldPoll = true;
    }
    /*</ltIE8>*/

    if (document.readyState) checks.push(function () {
        var state = document.readyState;
        return (state == 'loaded' || state == 'complete');
    });

    if ('onreadystatechange' in document) document.addListener('readystatechange', check);
    else shouldPoll = true;

    if (shouldPoll) poll();

    Element.Events.domready = {
        onAdd: function (fn) {
            if (ready) fn.call(this);
        }
    };

// Make sure that domready fires before load
    Element.Events.load = {
        base: 'load',
        onAdd: function (fn) {
            if (loaded && this == window) fn.call(this);
        },
        condition: function () {
            if (this == window) {
                domready();
                delete Element.Events.load;
            }
            return true;
        }
    };

// This is based on the custom load event
    window.addEvent('load', function () {
        loaded = true;
    });

})(window, document);


/*
 ---

 name: Swiff

 description: Wrapper for embedding SWF movies. Supports External Interface Communication.

 license: MIT-style license.

 credits:
 - Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.

 requires: [Options, Object, Element]

 provides: Swiff

 ...
 */

(function () {

    var Swiff = this.Swiff = new Class({

        Implements: Options,

        options: {
            id: null,
            height: 1,
            width: 1,
            container: null,
            properties: {},
            params: {
                quality: 'high',
                allowScriptAccess: 'always',
                wMode: 'window',
                swLiveConnect: true
            },
            callBacks: {},
            vars: {}
        },

        toElement: function () {
            return this.object;
        },

        initialize: function (path, options) {
            this.instance = 'Swiff_' + String.uniqueID();

            this.setOptions(options);
            options = this.options;
            var id = this.id = options.id || this.instance;
            var container = document.id(options.container);

            Swiff.CallBacks[this.instance] = {};

            var params = options.params, vars = options.vars, callBacks = options.callBacks;
            var properties = Object.append({height: options.height, width: options.width}, options.properties);

            var self = this;

            for (var callBack in callBacks) {
                Swiff.CallBacks[this.instance][callBack] = (function (option) {
                    return function () {
                        return option.apply(self.object, arguments);
                    };
                })(callBacks[callBack]);
                vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
            }

            params.flashVars = Object.toQueryString(vars);
            if (Browser.ie) {
                properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
                params.movie = path;
            } else {
                properties.type = 'application/x-shockwave-flash';
            }
            properties.data = path;

            var build = '<object id="' + id + '"';
            for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
            build += '>';
            for (var param in params) {
                if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
            }
            build += '</object>';
            this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
        },

        replaces: function (element) {
            element = document.id(element, true);
            element.parentNode.replaceChild(this.toElement(), element);
            return this;
        },

        inject: function (element) {
            document.id(element, true).appendChild(this.toElement());
            return this;
        },

        remote: function () {
            return Swiff.remote.apply(Swiff, [this.toElement()].append(arguments));
        }

    });

    Swiff.CallBacks = {};

    Swiff.remote = function (obj, fn) {
        var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
        return eval(rs);
    };

})();


// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/065f2f092ece4e3b32bb5214464cf926 
// Or build this file again with packager using: packager build More/More More/Events.Pseudos More/Class.Refactor More/Class.Binds More/Class.Occlude More/Chain.Wait More/Array.Extras More/Date More/Date.Extras More/Number.Format More/Object.Extras More/String.Extras More/String.QueryString More/URI More/URI.Relative More/Hash More/Hash.Extras More/Element.Forms More/Elements.From More/Element.Event.Pseudos More/Element.Event.Pseudos.Keys More/Element.Measure More/Element.Pin More/Element.Position More/Element.Shortcuts More/Form.Request More/Form.Request.Append More/Form.Validator More/Form.Validator.Inline More/Form.Validator.Extras More/OverText More/Fx.Elements More/Fx.Accordion More/Fx.Move More/Fx.Reveal More/Fx.Scroll More/Fx.Slide More/Fx.SmoothScroll More/Fx.Sort More/Drag More/Drag.Move More/Slider More/Sortables More/Request.JSONP More/Request.Queue More/Request.Periodical More/Assets More/Color More/Group More/Hash.Cookie More/IframeShim More/Table More/HtmlTable More/HtmlTable.Zebra More/HtmlTable.Sort More/HtmlTable.Select More/Keyboard More/Keyboard.Extras More/Mask More/Scroller More/Tips More/Spinner More/Locale More/Locale.Set.From More/Locale.en-US.Date More/Locale.en-US.Form.Validator More/Locale.en-US.Number More/Locale.ar.Date More/Locale.ar.Form.Validator More/Locale.ca-CA.Date More/Locale.ca-CA.Form.Validator More/Locale.cs-CZ.Date More/Locale.cs-CZ.Form.Validator More/Locale.da-DK.Date More/Locale.da-DK.Form.Validator More/Locale.de-CH.Date More/Locale.de-CH.Form.Validator More/Locale.de-DE.Date More/Locale.de-DE.Form.Validator More/Locale.de-DE.Number More/Locale.en-GB.Date More/Locale.es-AR.Date More/Locale.es-AR.Form.Validator More/Locale.es-ES.Date More/Locale.es-ES.Form.Validator More/Locale.et-EE.Date More/Locale.et-EE.Form.Validator More/Locale.EU.Number More/Locale.fa.Date More/Locale.fa.Form.Validator More/Locale.fi-FI.Date More/Locale.fi-FI.Form.Validator More/Locale.fi-FI.Number More/Locale.fr-FR.Date More/Locale.fr-FR.Form.Validator More/Locale.fr-FR.Number More/Locale.he-IL.Date More/Locale.he-IL.Form.Validator More/Locale.he-IL.Number More/Locale.hu-HU.Date More/Locale.hu-HU.Form.Validator More/Locale.it-IT.Date More/Locale.it-IT.Form.Validator More/Locale.ja-JP.Date More/Locale.ja-JP.Form.Validator More/Locale.ja-JP.Number More/Locale.nl-NL.Date More/Locale.nl-NL.Form.Validator More/Locale.nl-NL.Number More/Locale.no-NO.Date More/Locale.no-NO.Form.Validator More/Locale.pl-PL.Date More/Locale.pl-PL.Form.Validator More/Locale.pt-BR.Date More/Locale.pt-BR.Form.Validator More/Locale.pt-PT.Date More/Locale.pt-PT.Form.Validator More/Locale.ru-RU-unicode.Date More/Locale.ru-RU-unicode.Form.Validator More/Locale.si-SI.Date More/Locale.si-SI.Form.Validator More/Locale.sv-SE.Date More/Locale.sv-SE.Form.Validator More/Locale.uk-UA.Date More/Locale.uk-UA.Form.Validator More/Locale.zh-CH.Date More/Locale.zh-CH.Form.Validator
/*
 ---
 copyrights:
 - [MooTools](http://mootools.net)

 licenses:
 - [MIT License](http://mootools.net/license.txt)
 ...
 */
MooTools.More = {version: "1.4.0.1", build: "a4244edf2aa97ac8a196fc96082dd35af1abab87"};
(function () {
    Events.Pseudos = function (h, e, f) {
        var d = "_monitorEvents:";
        var c = function (i) {
            return {
                store: i.store ? function (j, k) {
                    i.store(d + j, k);
                } : function (j, k) {
                    (i._monitorEvents || (i._monitorEvents = {}))[j] = k;
                }, retrieve: i.retrieve ? function (j, k) {
                    return i.retrieve(d + j, k);
                } : function (j, k) {
                    if (!i._monitorEvents) {
                        return k;
                    }
                    return i._monitorEvents[j] || k;
                }
            };
        };
        var g = function (k) {
            if (k.indexOf(":") == -1 || !h) {
                return null;
            }
            var j = Slick.parse(k).expressions[0][0], p = j.pseudos, i = p.length, o = [];
            while (i--) {
                var n = p[i].key, m = h[n];
                if (m != null) {
                    o.push({event: j.tag, value: p[i].value, pseudo: n, original: k, listener: m});
                }
            }
            return o.length ? o : null;
        };
        return {
            addEvent: function (m, p, j) {
                var n = g(m);
                if (!n) {
                    return e.call(this, m, p, j);
                }
                var k = c(this), r = k.retrieve(m, []), i = n[0].event, l = Array.slice(arguments, 2), o = p, q = this;
                n.each(function (s) {
                    var t = s.listener, u = o;
                    if (t == false) {
                        i += ":" + s.pseudo + "(" + s.value + ")";
                    } else {
                        o = function () {
                            t.call(q, s, u, arguments, o);
                        };
                    }
                });
                r.include({type: i, event: p, monitor: o});
                k.store(m, r);
                if (m != i) {
                    e.apply(this, [m, p].concat(l));
                }
                return e.apply(this, [i, o].concat(l));
            }, removeEvent: function (m, l) {
                var k = g(m);
                if (!k) {
                    return f.call(this, m, l);
                }
                var n = c(this), j = n.retrieve(m);
                if (!j) {
                    return this;
                }
                var i = Array.slice(arguments, 2);
                f.apply(this, [m, l].concat(i));
                j.each(function (o, p) {
                    if (!l || o.event == l) {
                        f.apply(this, [o.type, o.monitor].concat(i));
                    }
                    delete j[p];
                }, this);
                n.store(m, j);
                return this;
            }
        };
    };
    var b = {
        once: function (e, f, d, c) {
            f.apply(this, d);
            this.removeEvent(e.event, c).removeEvent(e.original, f);
        }, throttle: function (d, e, c) {
            if (!e._throttled) {
                e.apply(this, c);
                e._throttled = setTimeout(function () {
                    e._throttled = false;
                }, d.value || 250);
            }
        }, pause: function (d, e, c) {
            clearTimeout(e._pause);
            e._pause = e.delay(d.value || 250, this, c);
        }
    };
    Events.definePseudo = function (c, d) {
        b[c] = d;
        return this;
    };
    Events.lookupPseudo = function (c) {
        return b[c];
    };
    var a = Events.prototype;
    Events.implement(Events.Pseudos(b, a.addEvent, a.removeEvent));
    ["Request", "Fx"].each(function (c) {
        if (this[c]) {
            this[c].implement(Events.prototype);
        }
    });
})();
Class.refactor = function (b, a) {
    Object.each(a, function (e, d) {
        var c = b.prototype[d];
        c = (c && c.$origin) || c || function () {
        };
        b.implement(d, (typeof e == "function") ? function () {
            var f = this.previous;
            this.previous = c;
            var g = e.apply(this, arguments);
            this.previous = f;
            return g;
        } : e);
    });
    return b;
};
Class.Mutators.Binds = function (a) {
    if (!this.prototype.initialize) {
        this.implement("initialize", function () {
        });
    }
    return Array.from(a).concat(this.prototype.Binds || []);
};
Class.Mutators.initialize = function (a) {
    return function () {
        Array.from(this.Binds).each(function (b) {
            var c = this[b];
            if (c) {
                this[b] = c.bind(this);
            }
        }, this);
        return a.apply(this, arguments);
    };
};
Class.Occlude = new Class({
    occlude: function (c, b) {
        b = document.id(b || this.element);
        var a = b.retrieve(c || this.property);
        if (a && !this.occluded) {
            return (this.occluded = a);
        }
        this.occluded = false;
        b.store(c || this.property, this);
        return this.occluded;
    }
});
(function () {
    var a = {
        wait: function (b) {
            return this.chain(function () {
                this.callChain.delay(b == null ? 500 : b, this);
                return this;
            }.bind(this));
        }
    };
    Chain.implement(a);
    if (this.Fx) {
        Fx.implement(a);
    }
    if (this.Element && Element.implement && this.Fx) {
        Element.implement({
            chains: function (b) {
                Array.from(b || ["tween", "morph", "reveal"]).each(function (c) {
                    c = this.get(c);
                    if (!c) {
                        return;
                    }
                    c.setOptions({link: "chain"});
                }, this);
                return this;
            }, pauseFx: function (c, b) {
                this.chains(b).get(b || "tween").wait(c);
                return this;
            }
        });
    }
})();
(function (a) {
    Array.implement({
        min: function () {
            return Math.min.apply(null, this);
        }, max: function () {
            return Math.max.apply(null, this);
        }, average: function () {
            return this.length ? this.sum() / this.length : 0;
        }, sum: function () {
            var b = 0, c = this.length;
            if (c) {
                while (c--) {
                    b += this[c];
                }
            }
            return b;
        }, unique: function () {
            return [].combine(this);
        }, shuffle: function () {
            for (var c = this.length; c && --c;) {
                var b = this[c], d = Math.floor(Math.random() * (c + 1));
                this[c] = this[d];
                this[d] = b;
            }
            return this;
        }, reduce: function (d, e) {
            for (var c = 0, b = this.length; c < b; c++) {
                if (c in this) {
                    e = e === a ? this[c] : d.call(null, e, this[c], c, this);
                }
            }
            return e;
        }, reduceRight: function (c, d) {
            var b = this.length;
            while (b--) {
                if (b in this) {
                    d = d === a ? this[b] : c.call(null, d, this[b], b, this);
                }
            }
            return d;
        }
    });
})();
(function () {
    var b = function (c) {
        return c != null;
    };
    var a = Object.prototype.hasOwnProperty;
    Object.extend({
        getFromPath: function (e, f) {
            if (typeof f == "string") {
                f = f.split(".");
            }
            for (var d = 0, c = f.length; d < c; d++) {
                if (a.call(e, f[d])) {
                    e = e[f[d]];
                } else {
                    return null;
                }
            }
            return e;
        }, cleanValues: function (c, e) {
            e = e || b;
            for (var d in c) {
                if (!e(c[d])) {
                    delete c[d];
                }
            }
            return c;
        }, erase: function (c, d) {
            if (a.call(c, d)) {
                delete c[d];
            }
            return c;
        }, run: function (d) {
            var c = Array.slice(arguments, 1);
            for (var e in d) {
                if (d[e].apply) {
                    d[e].apply(d, c);
                }
            }
            return d;
        }
    });
})();
(function () {
    var b = null, a = {}, d = {};
    var c = function (f) {
        if (instanceOf(f, e.Set)) {
            return f;
        } else {
            return a[f];
        }
    };
    var e = this.Locale = {
        define: function (f, j, h, i) {
            var g;
            if (instanceOf(f, e.Set)) {
                g = f.name;
                if (g) {
                    a[g] = f;
                }
            } else {
                g = f;
                if (!a[g]) {
                    a[g] = new e.Set(g);
                }
                f = a[g];
            }
            if (j) {
                f.define(j, h, i);
            }
            if (!b) {
                b = f;
            }
            return f;
        }, use: function (f) {
            f = c(f);
            if (f) {
                b = f;
                this.fireEvent("change", f);
            }
            return this;
        }, getCurrent: function () {
            return b;
        }, get: function (g, f) {
            return (b) ? b.get(g, f) : "";
        }, inherit: function (f, g, h) {
            f = c(f);
            if (f) {
                f.inherit(g, h);
            }
            return this;
        }, list: function () {
            return Object.keys(a);
        }
    };
    Object.append(e, new Events);
    e.Set = new Class({
        sets: {}, inherits: {locales: [], sets: {}}, initialize: function (f) {
            this.name = f || "";
        }, define: function (i, g, h) {
            var f = this.sets[i];
            if (!f) {
                f = {};
            }
            if (g) {
                if (typeOf(g) == "object") {
                    f = Object.merge(f, g);
                } else {
                    f[g] = h;
                }
            }
            this.sets[i] = f;
            return this;
        }, get: function (r, j, q) {
            var p = Object.getFromPath(this.sets, r);
            if (p != null) {
                var m = typeOf(p);
                if (m == "function") {
                    p = p.apply(null, Array.from(j));
                } else {
                    if (m == "object") {
                        p = Object.clone(p);
                    }
                }
                return p;
            }
            var h = r.indexOf("."), o = h < 0 ? r : r.substr(0, h), k = (this.inherits.sets[o] || []).combine(this.inherits.locales).include("en-US");
            if (!q) {
                q = [];
            }
            for (var g = 0, f = k.length; g < f; g++) {
                if (q.contains(k[g])) {
                    continue;
                }
                q.include(k[g]);
                var n = a[k[g]];
                if (!n) {
                    continue;
                }
                p = n.get(r, j, q);
                if (p != null) {
                    return p;
                }
            }
            return "";
        }, inherit: function (g, h) {
            g = Array.from(g);
            if (h && !this.inherits.sets[h]) {
                this.inherits.sets[h] = [];
            }
            var f = g.length;
            while (f--) {
                (h ? this.inherits.sets[h] : this.inherits.locales).unshift(g[f]);
            }
            return this;
        }
    });
})();
Locale.define("en-US", "Date", {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    months_abbr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    days_abbr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dateOrder: ["month", "date", "year"],
    shortDate: "%m/%d/%Y",
    shortTime: "%I:%M%p",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 0,
    ordinal: function (a) {
        return (a > 3 && a < 21) ? "th" : ["th", "st", "nd", "rd", "th"][Math.min(a % 10, 4)];
    },
    lessThanMinuteAgo: "less than a minute ago",
    minuteAgo: "about a minute ago",
    minutesAgo: "{delta} minutes ago",
    hourAgo: "about an hour ago",
    hoursAgo: "about {delta} hours ago",
    dayAgo: "1 day ago",
    daysAgo: "{delta} days ago",
    weekAgo: "1 week ago",
    weeksAgo: "{delta} weeks ago",
    monthAgo: "1 month ago",
    monthsAgo: "{delta} months ago",
    yearAgo: "1 year ago",
    yearsAgo: "{delta} years ago",
    lessThanMinuteUntil: "less than a minute from now",
    minuteUntil: "about a minute from now",
    minutesUntil: "{delta} minutes from now",
    hourUntil: "about an hour from now",
    hoursUntil: "about {delta} hours from now",
    dayUntil: "1 day from now",
    daysUntil: "{delta} days from now",
    weekUntil: "1 week from now",
    weeksUntil: "{delta} weeks from now",
    monthUntil: "1 month from now",
    monthsUntil: "{delta} months from now",
    yearUntil: "1 year from now",
    yearsUntil: "{delta} years from now"
});
(function () {
    var a = this.Date;
    var f = a.Methods = {
        ms: "Milliseconds",
        year: "FullYear",
        min: "Minutes",
        mo: "Month",
        sec: "Seconds",
        hr: "Hours"
    };
    ["Date", "Day", "FullYear", "Hours", "Milliseconds", "Minutes", "Month", "Seconds", "Time", "TimezoneOffset", "Week", "Timezone", "GMTOffset", "DayOfYear", "LastMonth", "LastDayOfMonth", "UTCDate", "UTCDay", "UTCFullYear", "AMPM", "Ordinal", "UTCHours", "UTCMilliseconds", "UTCMinutes", "UTCMonth", "UTCSeconds", "UTCMilliseconds"].each(function (s) {
        a.Methods[s.toLowerCase()] = s;
    });
    var p = function (u, t, s) {
        if (t == 1) {
            return u;
        }
        return u < Math.pow(10, t - 1) ? (s || "0") + p(u, t - 1, s) : u;
    };
    a.implement({
        set: function (u, s) {
            u = u.toLowerCase();
            var t = f[u] && "set" + f[u];
            if (t && this[t]) {
                this[t](s);
            }
            return this;
        }.overloadSetter(), get: function (t) {
            t = t.toLowerCase();
            var s = f[t] && "get" + f[t];
            if (s && this[s]) {
                return this[s]();
            }
            return null;
        }.overloadGetter(), clone: function () {
            return new a(this.get("time"));
        }, increment: function (s, u) {
            s = s || "day";
            u = u != null ? u : 1;
            switch (s) {
                case"year":
                    return this.increment("month", u * 12);
                case"month":
                    var t = this.get("date");
                    this.set("date", 1).set("mo", this.get("mo") + u);
                    return this.set("date", t.min(this.get("lastdayofmonth")));
                case"week":
                    return this.increment("day", u * 7);
                case"day":
                    return this.set("date", this.get("date") + u);
            }
            if (!a.units[s]) {
                throw new Error(s + " is not a supported interval");
            }
            return this.set("time", this.get("time") + u * a.units[s]());
        }, decrement: function (s, t) {
            return this.increment(s, -1 * (t != null ? t : 1));
        }, isLeapYear: function () {
            return a.isLeapYear(this.get("year"));
        }, clearTime: function () {
            return this.set({hr: 0, min: 0, sec: 0, ms: 0});
        }, diff: function (t, s) {
            if (typeOf(t) == "string") {
                t = a.parse(t);
            }
            return ((t - this) / a.units[s || "day"](3, 3)).round();
        }, getLastDayOfMonth: function () {
            return a.daysInMonth(this.get("mo"), this.get("year"));
        }, getDayOfYear: function () {
            return (a.UTC(this.get("year"), this.get("mo"), this.get("date") + 1) - a.UTC(this.get("year"), 0, 1)) / a.units.day();
        }, setDay: function (t, s) {
            if (s == null) {
                s = a.getMsg("firstDayOfWeek");
                if (s === "") {
                    s = 1;
                }
            }
            t = (7 + a.parseDay(t, true) - s) % 7;
            var u = (7 + this.get("day") - s) % 7;
            return this.increment("day", t - u);
        }, getWeek: function (v) {
            if (v == null) {
                v = a.getMsg("firstDayOfWeek");
                if (v === "") {
                    v = 1;
                }
            }
            var x = this, u = (7 + x.get("day") - v) % 7, t = 0, w;
            if (v == 1) {
                var y = x.get("month"), s = x.get("date") - u;
                if (y == 11 && s > 28) {
                    return 1;
                }
                if (y == 0 && s < -2) {
                    x = new a(x).decrement("day", u);
                    u = 0;
                }
                w = new a(x.get("year"), 0, 1).get("day") || 7;
                if (w > 4) {
                    t = -7;
                }
            } else {
                w = new a(x.get("year"), 0, 1).get("day");
            }
            t += x.get("dayofyear");
            t += 6 - u;
            t += (7 + w - v) % 7;
            return (t / 7);
        }, getOrdinal: function (s) {
            return a.getMsg("ordinal", s || this.get("date"));
        }, getTimezone: function () {
            return this.toString().replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, "$1").replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, "$1$2$3");
        }, getGMTOffset: function () {
            var s = this.get("timezoneOffset");
            return ((s > 0) ? "-" : "+") + p((s.abs() / 60).floor(), 2) + p(s % 60, 2);
        }, setAMPM: function (s) {
            s = s.toUpperCase();
            var t = this.get("hr");
            if (t > 11 && s == "AM") {
                return this.decrement("hour", 12);
            } else {
                if (t < 12 && s == "PM") {
                    return this.increment("hour", 12);
                }
            }
            return this;
        }, getAMPM: function () {
            return (this.get("hr") < 12) ? "AM" : "PM";
        }, parse: function (s) {
            this.set("time", a.parse(s));
            return this;
        }, isValid: function (s) {
            if (!s) {
                s = this;
            }
            return typeOf(s) == "date" && !isNaN(s.valueOf());
        }, format: function (s) {
            if (!this.isValid()) {
                return "invalid date";
            }
            if (!s) {
                s = "%x %X";
            }
            if (typeof s == "string") {
                s = g[s.toLowerCase()] || s;
            }
            if (typeof s == "function") {
                return s(this);
            }
            var t = this;
            return s.replace(/%([a-z%])/gi, function (v, u) {
                switch (u) {
                    case"a":
                        return a.getMsg("days_abbr")[t.get("day")];
                    case"A":
                        return a.getMsg("days")[t.get("day")];
                    case"b":
                        return a.getMsg("months_abbr")[t.get("month")];
                    case"B":
                        return a.getMsg("months")[t.get("month")];
                    case"c":
                        return t.format("%a %b %d %H:%M:%S %Y");
                    case"d":
                        return p(t.get("date"), 2);
                    case"e":
                        return p(t.get("date"), 2, " ");
                    case"H":
                        return p(t.get("hr"), 2);
                    case"I":
                        return p((t.get("hr") % 12) || 12, 2);
                    case"j":
                        return p(t.get("dayofyear"), 3);
                    case"k":
                        return p(t.get("hr"), 2, " ");
                    case"l":
                        return p((t.get("hr") % 12) || 12, 2, " ");
                    case"L":
                        return p(t.get("ms"), 3);
                    case"m":
                        return p((t.get("mo") + 1), 2);
                    case"M":
                        return p(t.get("min"), 2);
                    case"o":
                        return t.get("ordinal");
                    case"p":
                        return a.getMsg(t.get("ampm"));
                    case"s":
                        return Math.round(t / 1000);
                    case"S":
                        return p(t.get("seconds"), 2);
                    case"T":
                        return t.format("%H:%M:%S");
                    case"U":
                        return p(t.get("week"), 2);
                    case"w":
                        return t.get("day");
                    case"x":
                        return t.format(a.getMsg("shortDate"));
                    case"X":
                        return t.format(a.getMsg("shortTime"));
                    case"y":
                        return t.get("year").toString().substr(2);
                    case"Y":
                        return t.get("year");
                    case"z":
                        return t.get("GMTOffset");
                    case"Z":
                        return t.get("Timezone");
                }
                return u;
            });
        }, toISOString: function () {
            return this.format("iso8601");
        }
    }).alias({toJSON: "toISOString", compare: "diff", strftime: "format"});
    var k = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], h = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var g = {
        db: "%Y-%m-%d %H:%M:%S",
        compact: "%Y%m%dT%H%M%S",
        "short": "%d %b %H:%M",
        "long": "%B %d, %Y %H:%M",
        rfc822: function (s) {
            return k[s.get("day")] + s.format(", %d ") + h[s.get("month")] + s.format(" %Y %H:%M:%S %Z");
        },
        rfc2822: function (s) {
            return k[s.get("day")] + s.format(", %d ") + h[s.get("month")] + s.format(" %Y %H:%M:%S %z");
        },
        iso8601: function (s) {
            return (s.getUTCFullYear() + "-" + p(s.getUTCMonth() + 1, 2) + "-" + p(s.getUTCDate(), 2) + "T" + p(s.getUTCHours(), 2) + ":" + p(s.getUTCMinutes(), 2) + ":" + p(s.getUTCSeconds(), 2) + "." + p(s.getUTCMilliseconds(), 3) + "Z");
        }
    };
    var c = [], n = a.parse;
    var r = function (v, x, u) {
        var t = -1, w = a.getMsg(v + "s");
        switch (typeOf(x)) {
            case"object":
                t = w[x.get(v)];
                break;
            case"number":
                t = w[x];
                if (!t) {
                    throw new Error("Invalid " + v + " index: " + x);
                }
                break;
            case"string":
                var s = w.filter(function (y) {
                    return this.test(y);
                }, new RegExp("^" + x, "i"));
                if (!s.length) {
                    throw new Error("Invalid " + v + " string");
                }
                if (s.length > 1) {
                    throw new Error("Ambiguous " + v);
                }
                t = s[0];
        }
        return (u) ? w.indexOf(t) : t;
    };
    var i = 1900, o = 70;
    a.extend({
        getMsg: function (t, s) {
            return Locale.get("Date." + t, s);
        }, units: {
            ms: Function.from(1),
            second: Function.from(1000),
            minute: Function.from(60000),
            hour: Function.from(3600000),
            day: Function.from(86400000),
            week: Function.from(608400000),
            month: function (t, s) {
                var u = new a;
                return a.daysInMonth(t != null ? t : u.get("mo"), s != null ? s : u.get("year")) * 86400000;
            },
            year: function (s) {
                s = s || new a().get("year");
                return a.isLeapYear(s) ? 31622400000 : 31536000000;
            }
        }, daysInMonth: function (t, s) {
            return [31, a.isLeapYear(s) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][t];
        }, isLeapYear: function (s) {
            return ((s % 4 === 0) && (s % 100 !== 0)) || (s % 400 === 0);
        }, parse: function (v) {
            var u = typeOf(v);
            if (u == "number") {
                return new a(v);
            }
            if (u != "string") {
                return v;
            }
            v = v.clean();
            if (!v.length) {
                return null;
            }
            var s;
            c.some(function (w) {
                var t = w.re.exec(v);
                return (t) ? (s = w.handler(t)) : false;
            });
            if (!(s && s.isValid())) {
                s = new a(n(v));
                if (!(s && s.isValid())) {
                    s = new a(v.toInt());
                }
            }
            return s;
        }, parseDay: function (s, t) {
            return r("day", s, t);
        }, parseMonth: function (t, s) {
            return r("month", t, s);
        }, parseUTC: function (t) {
            var s = new a(t);
            var u = a.UTC(s.get("year"), s.get("mo"), s.get("date"), s.get("hr"), s.get("min"), s.get("sec"), s.get("ms"));
            return new a(u);
        }, orderIndex: function (s) {
            return a.getMsg("dateOrder").indexOf(s) + 1;
        }, defineFormat: function (s, t) {
            g[s] = t;
            return this;
        }, defineParser: function (s) {
            c.push((s.re && s.handler) ? s : l(s));
            return this;
        }, defineParsers: function () {
            Array.flatten(arguments).each(a.defineParser);
            return this;
        }, define2DigitYearStart: function (s) {
            o = s % 100;
            i = s - o;
            return this;
        }
    }).extend({defineFormats: a.defineFormat.overloadSetter()});
    var d = function (s) {
        return new RegExp("(?:" + a.getMsg(s).map(function (t) {
            return t.substr(0, 3);
        }).join("|") + ")[a-z]*");
    };
    var m = function (s) {
        switch (s) {
            case"T":
                return "%H:%M:%S";
            case"x":
                return ((a.orderIndex("month") == 1) ? "%m[-./]%d" : "%d[-./]%m") + "([-./]%y)?";
            case"X":
                return "%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%z?";
        }
        return null;
    };
    var j = {
        d: /[0-2]?[0-9]|3[01]/,
        H: /[01]?[0-9]|2[0-3]/,
        I: /0?[1-9]|1[0-2]/,
        M: /[0-5]?\d/,
        s: /\d+/,
        o: /[a-z]*/,
        p: /[ap]\.?m\.?/,
        y: /\d{2}|\d{4}/,
        Y: /\d{4}/,
        z: /Z|[+-]\d{2}(?::?\d{2})?/
    };
    j.m = j.I;
    j.S = j.M;
    var e;
    var b = function (s) {
        e = s;
        j.a = j.A = d("days");
        j.b = j.B = d("months");
        c.each(function (u, t) {
            if (u.format) {
                c[t] = l(u.format);
            }
        });
    };
    var l = function (u) {
        if (!e) {
            return {format: u};
        }
        var s = [];
        var t = (u.source || u).replace(/%([a-z])/gi, function (w, v) {
            return m(v) || w;
        }).replace(/\((?!\?)/g, "(?:").replace(/ (?!\?|\*)/g, ",? ").replace(/%([a-z%])/gi, function (w, v) {
            var x = j[v];
            if (!x) {
                return v;
            }
            s.push(v);
            return "(" + x.source + ")";
        }).replace(/\[a-z\]/gi, "[a-z\\u00c0-\\uffff;&]");
        return {
            format: u, re: new RegExp("^" + t + "$", "i"), handler: function (y) {
                y = y.slice(1).associate(s);
                var v = new a().clearTime(), x = y.y || y.Y;
                if (x != null) {
                    q.call(v, "y", x);
                }
                if ("d" in y) {
                    q.call(v, "d", 1);
                }
                if ("m" in y || y.b || y.B) {
                    q.call(v, "m", 1);
                }
                for (var w in y) {
                    q.call(v, w, y[w]);
                }
                return v;
            }
        };
    };
    var q = function (s, t) {
        if (!t) {
            return this;
        }
        switch (s) {
            case"a":
            case"A":
                return this.set("day", a.parseDay(t, true));
            case"b":
            case"B":
                return this.set("mo", a.parseMonth(t, true));
            case"d":
                return this.set("date", t);
            case"H":
            case"I":
                return this.set("hr", t);
            case"m":
                return this.set("mo", t - 1);
            case"M":
                return this.set("min", t);
            case"p":
                return this.set("ampm", t.replace(/\./g, ""));
            case"S":
                return this.set("sec", t);
            case"s":
                return this.set("ms", ("0." + t) * 1000);
            case"w":
                return this.set("day", t);
            case"Y":
                return this.set("year", t);
            case"y":
                t = +t;
                if (t < 100) {
                    t += i + (t < o ? 100 : 0);
                }
                return this.set("year", t);
            case"z":
                if (t == "Z") {
                    t = "+00";
                }
                var u = t.match(/([+-])(\d{2}):?(\d{2})?/);
                u = (u[1] + "1") * (u[2] * 60 + (+u[3] || 0)) + this.getTimezoneOffset();
                return this.set("time", this - u * 60000);
        }
        return this;
    };
    a.defineParsers("%Y([-./]%m([-./]%d((T| )%X)?)?)?", "%Y%m%d(T%H(%M%S?)?)?", "%x( %X)?", "%d%o( %b( %Y)?)?( %X)?", "%b( %d%o)?( %Y)?( %X)?", "%Y %b( %d%o( %X)?)?", "%o %b %d %X %z %Y", "%T", "%H:%M( ?%p)?");
    Locale.addEvent("change", function (s) {
        if (Locale.get("Date")) {
            b(s);
        }
    }).fireEvent("change", Locale.getCurrent());
})();
Date.implement({
    timeDiffInWords: function (a) {
        return Date.distanceOfTimeInWords(this, a || new Date);
    }, timeDiff: function (f, c) {
        if (f == null) {
            f = new Date;
        }
        var h = ((f - this) / 1000).floor().abs();
        var e = [], a = [60, 60, 24, 365, 0], d = ["s", "m", "h", "d", "y"], g, b;
        for (var i = 0;
             i < a.length; i++) {
            if (i && !h) {
                break;
            }
            g = h;
            if ((b = a[i])) {
                g = (h % b);
                h = (h / b).floor();
            }
            e.unshift(g + (d[i] || ""));
        }
        return e.join(c || ":");
    }
}).extend({
    distanceOfTimeInWords: function (b, a) {
        return Date.getTimePhrase(((a - b) / 1000).toInt());
    }, getTimePhrase: function (f) {
        var d = (f < 0) ? "Until" : "Ago";
        if (f < 0) {
            f *= -1;
        }
        var b = {minute: 60, hour: 60, day: 24, week: 7, month: 52 / 12, year: 12, eon: Infinity};
        var e = "lessThanMinute";
        for (var c in b) {
            var a = b[c];
            if (f < 1.5 * a) {
                if (f > 0.75 * a) {
                    e = c;
                }
                break;
            }
            f /= a;
            e = c + "s";
        }
        f = f.round();
        return Date.getMsg(e + d, f).substitute({delta: f});
    }
}).defineParsers({
    re: /^(?:tod|tom|yes)/i, handler: function (a) {
        var b = new Date().clearTime();
        switch (a[0]) {
            case"tom":
                return b.increment();
            case"yes":
                return b.decrement();
            default:
                return b;
        }
    }
}, {
    re: /^(next|last) ([a-z]+)$/i, handler: function (e) {
        var f = new Date().clearTime();
        var b = f.getDay();
        var c = Date.parseDay(e[2], true);
        var a = c - b;
        if (c <= b) {
            a += 7;
        }
        if (e[1] == "last") {
            a -= 7;
        }
        return f.set("date", f.getDate() + a);
    }
}).alias("timeAgoInWords", "timeDiffInWords");
Locale.define("en-US", "Number", {decimal: ".", group: ",", currency: {prefix: "$ "}});
Number.implement({
    format: function (q) {
        var n = this;
        q = q ? Object.clone(q) : {};
        var a = function (i) {
            if (q[i] != null) {
                return q[i];
            }
            return Locale.get("Number." + i);
        };
        var f = n < 0, h = a("decimal"), k = a("precision"), o = a("group"), c = a("decimals");
        if (f) {
            var e = a("negative") || {};
            if (e.prefix == null && e.suffix == null) {
                e.prefix = "-";
            }
            ["prefix", "suffix"].each(function (i) {
                if (e[i]) {
                    q[i] = a(i) + e[i];
                }
            });
            n = -n;
        }
        var l = a("prefix"), p = a("suffix");
        if (c !== "" && c >= 0 && c <= 20) {
            n = n.toFixed(c);
        }
        if (k >= 1 && k <= 21) {
            n = (+n).toPrecision(k);
        }
        n += "";
        var m;
        if (a("scientific") === false && n.indexOf("e") > -1) {
            var j = n.split("e"), b = +j[1];
            n = j[0].replace(".", "");
            if (b < 0) {
                b = -b - 1;
                m = j[0].indexOf(".");
                if (m > -1) {
                    b -= m - 1;
                }
                while (b--) {
                    n = "0" + n;
                }
                n = "0." + n;
            } else {
                m = j[0].lastIndexOf(".");
                if (m > -1) {
                    b -= j[0].length - m - 1;
                }
                while (b--) {
                    n += "0";
                }
            }
        }
        if (h != ".") {
            n = n.replace(".", h);
        }
        if (o) {
            m = n.lastIndexOf(h);
            m = (m > -1) ? m : n.length;
            var d = n.substring(m), g = m;
            while (g--) {
                if ((m - g - 1) % 3 == 0 && g != (m - 1)) {
                    d = o + d;
                }
                d = n.charAt(g) + d;
            }
            n = d;
        }
        if (l) {
            n = l + n;
        }
        if (p) {
            n += p;
        }
        return n;
    }, formatCurrency: function (b) {
        var a = Locale.get("Number.currency") || {};
        if (a.scientific == null) {
            a.scientific = false;
        }
        a.decimals = b != null ? b : (a.decimals == null ? 2 : a.decimals);
        return this.format(a);
    }, formatPercentage: function (b) {
        var a = Locale.get("Number.percentage") || {};
        if (a.suffix == null) {
            a.suffix = "%";
        }
        a.decimals = b != null ? b : (a.decimals == null ? 2 : a.decimals);
        return this.format(a);
    }
});
(function () {
    var c = {
        a: /[àáâãäåăą]/g,
        A: /[ÀÁÂÃÄÅĂĄ]/g,
        c: /[ćčç]/g,
        C: /[ĆČÇ]/g,
        d: /[ďđ]/g,
        D: /[ĎÐ]/g,
        e: /[èéêëěę]/g,
        E: /[ÈÉÊËĚĘ]/g,
        g: /[ğ]/g,
        G: /[Ğ]/g,
        i: /[ìíîï]/g,
        I: /[ÌÍÎÏ]/g,
        l: /[ĺľł]/g,
        L: /[ĹĽŁ]/g,
        n: /[ñňń]/g,
        N: /[ÑŇŃ]/g,
        o: /[òóôõöøő]/g,
        O: /[ÒÓÔÕÖØ]/g,
        r: /[řŕ]/g,
        R: /[ŘŔ]/g,
        s: /[ššş]/g,
        S: /[ŠŞŚ]/g,
        t: /[ťţ]/g,
        T: /[ŤŢ]/g,
        ue: /[ü]/g,
        UE: /[Ü]/g,
        u: /[ùúûůµ]/g,
        U: /[ÙÚÛŮ]/g,
        y: /[ÿý]/g,
        Y: /[ŸÝ]/g,
        z: /[žźż]/g,
        Z: /[ŽŹŻ]/g,
        th: /[þ]/g,
        TH: /[Þ]/g,
        dh: /[ð]/g,
        DH: /[Ð]/g,
        ss: /[ß]/g,
        oe: /[œ]/g,
        OE: /[Œ]/g,
        ae: /[æ]/g,
        AE: /[Æ]/g
    }, b = {
        " ": /[\xa0\u2002\u2003\u2009]/g,
        "*": /[\xb7]/g,
        "'": /[\u2018\u2019]/g,
        '"': /[\u201c\u201d]/g,
        "...": /[\u2026]/g,
        "-": /[\u2013]/g,
        "&raquo;": /[\uFFFD]/g
    };
    var a = function (f, h) {
        var e = f, g;
        for (g in h) {
            e = e.replace(h[g], g);
        }
        return e;
    };
    var d = function (e, g) {
        e = e || "";
        var h = g ? "<" + e + "(?!\\w)[^>]*>([\\s\\S]*?)</" + e + "(?!\\w)>" : "</?" + e + "([^>]+)?>", f = new RegExp(h, "gi");
        return f;
    };
    String.implement({
        standardize: function () {
            return a(this, c);
        }, repeat: function (e) {
            return new Array(e + 1).join(this);
        }, pad: function (e, h, g) {
            if (this.length >= e) {
                return this;
            }
            var f = (h == null ? " " : "" + h).repeat(e - this.length).substr(0, e - this.length);
            if (!g || g == "right") {
                return this + f;
            }
            if (g == "left") {
                return f + this;
            }
            return f.substr(0, (f.length / 2).floor()) + this + f.substr(0, (f.length / 2).ceil());
        }, getTags: function (e, f) {
            return this.match(d(e, f)) || [];
        }, stripTags: function (e, f) {
            return this.replace(d(e, f), "");
        }, tidy: function () {
            return a(this, b);
        }, truncate: function (e, f, i) {
            var h = this;
            if (f == null && arguments.length == 1) {
                f = "…";
            }
            if (h.length > e) {
                h = h.substring(0, e);
                if (i) {
                    var g = h.lastIndexOf(i);
                    if (g != -1) {
                        h = h.substr(0, g);
                    }
                }
                if (f) {
                    h += f;
                }
            }
            return h;
        }
    });
})();
String.implement({
    parseQueryString: function (d, a) {
        if (d == null) {
            d = true;
        }
        if (a == null) {
            a = true;
        }
        var c = this.split(/[&;]/), b = {};
        if (!c.length) {
            return b;
        }
        c.each(function (i) {
            var e = i.indexOf("=") + 1, g = e ? i.substr(e) : "", f = e ? i.substr(0, e - 1).match(/([^\]\[]+|(\B)(?=\]))/g) : [i], h = b;
            if (!f) {
                return;
            }
            if (a) {
                g = decodeURIComponent(g);
            }
            f.each(function (k, j) {
                if (d) {
                    k = decodeURIComponent(k);
                }
                var l = h[k];
                if (j < f.length - 1) {
                    h = h[k] = l || {};
                } else {
                    if (typeOf(l) == "array") {
                        l.push(g);
                    } else {
                        h[k] = l != null ? [l, g] : g;
                    }
                }
            });
        });
        return b;
    }, cleanQueryString: function (a) {
        return this.split("&").filter(function (e) {
            var b = e.indexOf("="), c = b < 0 ? "" : e.substr(0, b), d = e.substr(b + 1);
            return a ? a.call(null, c, d) : (d || d === 0);
        }).join("&");
    }
});
(function () {
    var b = function () {
        return this.get("value");
    };
    var a = this.URI = new Class({
        Implements: Options,
        options: {},
        regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
        parts: ["scheme", "user", "password", "host", "port", "directory", "file", "query", "fragment"],
        schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},
        initialize: function (d, c) {
            this.setOptions(c);
            var e = this.options.base || a.base;
            if (!d) {
                d = e;
            }
            if (d && d.parsed) {
                this.parsed = Object.clone(d.parsed);
            } else {
                this.set("value", d.href || d.toString(), e ? new a(e) : false);
            }
        },
        parse: function (e, d) {
            var c = e.match(this.regex);
            if (!c) {
                return false;
            }
            c.shift();
            return this.merge(c.associate(this.parts), d);
        },
        merge: function (d, c) {
            if ((!d || !d.scheme) && (!c || !c.scheme)) {
                return false;
            }
            if (c) {
                this.parts.every(function (e) {
                    if (d[e]) {
                        return false;
                    }
                    d[e] = c[e] || "";
                    return true;
                });
            }
            d.port = d.port || this.schemes[d.scheme.toLowerCase()];
            d.directory = d.directory ? this.parseDirectory(d.directory, c ? c.directory : "") : "/";
            return d;
        },
        parseDirectory: function (d, e) {
            d = (d.substr(0, 1) == "/" ? "" : (e || "/")) + d;
            if (!d.test(a.regs.directoryDot)) {
                return d;
            }
            var c = [];
            d.replace(a.regs.endSlash, "").split("/").each(function (f) {
                if (f == ".." && c.length > 0) {
                    c.pop();
                } else {
                    if (f != ".") {
                        c.push(f);
                    }
                }
            });
            return c.join("/") + "/";
        },
        combine: function (c) {
            return c.value || c.scheme + "://" + (c.user ? c.user + (c.password ? ":" + c.password : "") + "@" : "") + (c.host || "") + (c.port && c.port != this.schemes[c.scheme] ? ":" + c.port : "") + (c.directory || "/") + (c.file || "") + (c.query ? "?" + c.query : "") + (c.fragment ? "#" + c.fragment : "");
        },
        set: function (d, f, e) {
            if (d == "value") {
                var c = f.match(a.regs.scheme);
                if (c) {
                    c = c[1];
                }
                if (c && this.schemes[c.toLowerCase()] == null) {
                    this.parsed = {scheme: c, value: f};
                } else {
                    this.parsed = this.parse(f, (e || this).parsed) || (c ? {scheme: c, value: f} : {value: f});
                }
            } else {
                if (d == "data") {
                    this.setData(f);
                } else {
                    this.parsed[d] = f;
                }
            }
            return this;
        },
        get: function (c, d) {
            switch (c) {
                case"value":
                    return this.combine(this.parsed, d ? d.parsed : false);
                case"data":
                    return this.getData();
            }
            return this.parsed[c] || "";
        },
        go: function () {
            document.location.href = this.toString();
        },
        toURI: function () {
            return this;
        },
        getData: function (e, d) {
            var c = this.get(d || "query");
            if (!(c || c === 0)) {
                return e ? null : {};
            }
            var f = c.parseQueryString();
            return e ? f[e] : f;
        },
        setData: function (c, f, d) {
            if (typeof c == "string") {
                var e = this.getData();
                e[arguments[0]] = arguments[1];
                c = e;
            } else {
                if (f) {
                    c = Object.merge(this.getData(), c);
                }
            }
            return this.set(d || "query", Object.toQueryString(c));
        },
        clearData: function (c) {
            return this.set(c || "query", "");
        },
        toString: b,
        valueOf: b
    });
    a.regs = {endSlash: /\/$/, scheme: /^(\w+):/, directoryDot: /\.\/|\.$/};
    a.base = new a(Array.from(document.getElements("base[href]", true)).getLast(), {base: document.location});
    String.implement({
        toURI: function (c) {
            return new a(this, c);
        }
    });
})();
URI = Class.refactor(URI, {
    combine: function (f, e) {
        if (!e || f.scheme != e.scheme || f.host != e.host || f.port != e.port) {
            return this.previous.apply(this, arguments);
        }
        var a = f.file + (f.query ? "?" + f.query : "") + (f.fragment ? "#" + f.fragment : "");
        if (!e.directory) {
            return (f.directory || (f.file ? "" : "./")) + a;
        }
        var d = e.directory.split("/"), c = f.directory.split("/"), g = "", h;
        var b = 0;
        for (h = 0; h < d.length && h < c.length && d[h] == c[h]; h++) {
        }
        for (b = 0; b < d.length - h - 1; b++) {
            g += "../";
        }
        for (b = h; b < c.length - 1; b++) {
            g += c[b] + "/";
        }
        return (g || (f.file ? "" : "./")) + a;
    }, toAbsolute: function (a) {
        a = new URI(a);
        if (a) {
            a.set("directory", "").set("file", "");
        }
        return this.toRelative(a);
    }, toRelative: function (a) {
        return this.get("value", new URI(a));
    }
});
(function () {
    if (this.Hash) {
        return;
    }
    var a = this.Hash = new Type("Hash", function (b) {
        if (typeOf(b) == "hash") {
            b = Object.clone(b.getClean());
        }
        for (var c in b) {
            this[c] = b[c];
        }
        return this;
    });
    this.$H = function (b) {
        return new a(b);
    };
    a.implement({
        forEach: function (b, c) {
            Object.forEach(this, b, c);
        }, getClean: function () {
            var c = {};
            for (var b in this) {
                if (this.hasOwnProperty(b)) {
                    c[b] = this[b];
                }
            }
            return c;
        }, getLength: function () {
            var c = 0;
            for (var b in this) {
                if (this.hasOwnProperty(b)) {
                    c++;
                }
            }
            return c;
        }
    });
    a.alias("each", "forEach");
    a.implement({
        has: Object.prototype.hasOwnProperty, keyOf: function (b) {
            return Object.keyOf(this, b);
        }, hasValue: function (b) {
            return Object.contains(this, b);
        }, extend: function (b) {
            a.each(b || {}, function (d, c) {
                a.set(this, c, d);
            }, this);
            return this;
        }, combine: function (b) {
            a.each(b || {}, function (d, c) {
                a.include(this, c, d);
            }, this);
            return this;
        }, erase: function (b) {
            if (this.hasOwnProperty(b)) {
                delete this[b];
            }
            return this;
        }, get: function (b) {
            return (this.hasOwnProperty(b)) ? this[b] : null;
        }, set: function (b, c) {
            if (!this[b] || this.hasOwnProperty(b)) {
                this[b] = c;
            }
            return this;
        }, empty: function () {
            a.each(this, function (c, b) {
                delete this[b];
            }, this);
            return this;
        }, include: function (b, c) {
            if (this[b] == undefined) {
                this[b] = c;
            }
            return this;
        }, map: function (b, c) {
            return new a(Object.map(this, b, c));
        }, filter: function (b, c) {
            return new a(Object.filter(this, b, c));
        }, every: function (b, c) {
            return Object.every(this, b, c);
        }, some: function (b, c) {
            return Object.some(this, b, c);
        }, getKeys: function () {
            return Object.keys(this);
        }, getValues: function () {
            return Object.values(this);
        }, toQueryString: function (b) {
            return Object.toQueryString(this, b);
        }
    });
    a.alias({indexOf: "keyOf", contains: "hasValue"});
})();
Hash.implement({
    getFromPath: function (a) {
        return Object.getFromPath(this, a);
    }, cleanValues: function (a) {
        return new Hash(Object.cleanValues(this, a));
    }, run: function () {
        Object.run(arguments);
    }
});
Element.implement({
    tidy: function () {
        this.set("value", this.get("value").tidy());
    }, getTextInRange: function (b, a) {
        return this.get("value").substring(b, a);
    }, getSelectedText: function () {
        if (this.setSelectionRange) {
            return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
        }
        return document.selection.createRange().text;
    }, getSelectedRange: function () {
        if (this.selectionStart != null) {
            return {start: this.selectionStart, end: this.selectionEnd};
        }
        var e = {start: 0, end: 0};
        var a = this.getDocument().selection.createRange();
        if (!a || a.parentElement() != this) {
            return e;
        }
        var c = a.duplicate();
        if (this.type == "text") {
            e.start = 0 - c.moveStart("character", -100000);
            e.end = e.start + a.text.length;
        } else {
            var b = this.get("value");
            var d = b.length;
            c.moveToElementText(this);
            c.setEndPoint("StartToEnd", a);
            if (c.text.length) {
                d -= b.match(/[\n\r]*$/)[0].length;
            }
            e.end = d - c.text.length;
            c.setEndPoint("StartToStart", a);
            e.start = d - c.text.length;
        }
        return e;
    }, getSelectionStart: function () {
        return this.getSelectedRange().start;
    }, getSelectionEnd: function () {
        return this.getSelectedRange().end;
    }, setCaretPosition: function (a) {
        if (a == "end") {
            a = this.get("value").length;
        }
        this.selectRange(a, a);
        return this;
    }, getCaretPosition: function () {
        return this.getSelectedRange().start;
    }, selectRange: function (e, a) {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(e, a);
        } else {
            var c = this.get("value");
            var d = c.substr(e, a - e).replace(/\r/g, "").length;
            e = c.substr(0, e).replace(/\r/g, "").length;
            var b = this.createTextRange();
            b.collapse(true);
            b.moveEnd("character", e + d);
            b.moveStart("character", e);
            b.select();
        }
        return this;
    }, insertAtCursor: function (b, a) {
        var d = this.getSelectedRange();
        var c = this.get("value");
        this.set("value", c.substring(0, d.start) + b + c.substring(d.end, c.length));
        if (a !== false) {
            this.selectRange(d.start, d.start + b.length);
        } else {
            this.setCaretPosition(d.start + b.length);
        }
        return this;
    }, insertAroundCursor: function (b, a) {
        b = Object.append({before: "", defaultMiddle: "", after: ""}, b);
        var c = this.getSelectedText() || b.defaultMiddle;
        var g = this.getSelectedRange();
        var f = this.get("value");
        if (g.start == g.end) {
            this.set("value", f.substring(0, g.start) + b.before + c + b.after + f.substring(g.end, f.length));
            this.selectRange(g.start + b.before.length, g.end + b.before.length + c.length);
        } else {
            var d = f.substring(g.start, g.end);
            this.set("value", f.substring(0, g.start) + b.before + d + b.after + f.substring(g.end, f.length));
            var e = g.start + b.before.length;
            if (a !== false) {
                this.selectRange(e, e + d.length);
            } else {
                this.setCaretPosition(e + f.length);
            }
        }
        return this;
    }
});
Elements.from = function (e, d) {
    if (d || d == null) {
        e = e.stripScripts();
    }
    var b, c = e.match(/^\s*<(t[dhr]|tbody|tfoot|thead)/i);
    if (c) {
        b = new Element("table");
        var a = c[1].toLowerCase();
        if (["td", "th", "tr"].contains(a)) {
            b = new Element("tbody").inject(b);
            if (a != "tr") {
                b = new Element("tr").inject(b);
            }
        }
    }
    return (b || new Element("div")).set("html", e).getChildren();
};
(function () {
    var d = {relay: false}, c = ["once", "throttle", "pause"], b = c.length;
    while (b--) {
        d[c[b]] = Events.lookupPseudo(c[b]);
    }
    DOMEvent.definePseudo = function (e, f) {
        d[e] = f;
        return this;
    };
    var a = Element.prototype;
    [Element, Window, Document].invoke("implement", Events.Pseudos(d, a.addEvent, a.removeEvent));
})();
(function () {
    var a = "$moo:keys-pressed", b = "$moo:keys-keyup";
    DOMEvent.definePseudo("keys", function (d, e, c) {
        var g = c[0], f = [], h = this.retrieve(a, []);
        f.append(d.value.replace("++", function () {
            f.push("+");
            return "";
        }).split("+"));
        h.include(g.key);
        if (f.every(function (j) {
                return h.contains(j);
            })) {
            e.apply(this, c);
        }
        this.store(a, h);
        if (!this.retrieve(b)) {
            var i = function (j) {
                (function () {
                    h = this.retrieve(a, []).erase(j.key);
                    this.store(a, h);
                }).delay(0, this);
            };
            this.store(b, i).addEvent("keyup", i);
        }
    });
    DOMEvent.defineKeys({
        "16": "shift",
        "17": "control",
        "18": "alt",
        "20": "capslock",
        "33": "pageup",
        "34": "pagedown",
        "35": "end",
        "36": "home",
        "144": "numlock",
        "145": "scrolllock",
        "186": ";",
        "187": "=",
        "188": ",",
        "190": ".",
        "191": "/",
        "192": "`",
        "219": "[",
        "220": "\\",
        "221": "]",
        "222": "'",
        "107": "+"
    }).defineKey(Browser.firefox ? 109 : 189, "-");
})();
(function () {
    var b = function (e, d) {
        var f = [];
        Object.each(d, function (g) {
            Object.each(g, function (h) {
                e.each(function (i) {
                    f.push(i + "-" + h + (i == "border" ? "-width" : ""));
                });
            });
        });
        return f;
    };
    var c = function (f, e) {
        var d = 0;
        Object.each(e, function (h, g) {
            if (g.test(f)) {
                d = d + h.toInt();
            }
        });
        return d;
    };
    var a = function (d) {
        return !!(!d || d.offsetHeight || d.offsetWidth);
    };
    Element.implement({
        measure: function (h) {
            if (a(this)) {
                return h.call(this);
            }
            var g = this.getParent(), e = [];
            while (!a(g) && g != document.body) {
                e.push(g.expose());
                g = g.getParent();
            }
            var f = this.expose(), d = h.call(this);
            f();
            e.each(function (i) {
                i();
            });
            return d;
        }, expose: function () {
            if (this.getStyle("display") != "none") {
                return function () {
                };
            }
            var d = this.style.cssText;
            this.setStyles({display: "block", position: "absolute", visibility: "hidden"});
            return function () {
                this.style.cssText = d;
            }.bind(this);
        }, getDimensions: function (d) {
            d = Object.merge({computeSize: false}, d);
            var i = {x: 0, y: 0};
            var h = function (j, e) {
                return (e.computeSize) ? j.getComputedSize(e) : j.getSize();
            };
            var f = this.getParent("body");
            if (f && this.getStyle("display") == "none") {
                i = this.measure(function () {
                    return h(this, d);
                });
            } else {
                if (f) {
                    try {
                        i = h(this, d);
                    } catch (g) {
                    }
                }
            }
            return Object.append(i, (i.x || i.x === 0) ? {width: i.x, height: i.y} : {x: i.width, y: i.height});
        }, getComputedSize: function (d) {
            d = Object.merge({
                styles: ["padding", "border"],
                planes: {height: ["top", "bottom"], width: ["left", "right"]},
                mode: "both"
            }, d);
            var g = {}, e = {width: 0, height: 0}, f;
            if (d.mode == "vertical") {
                delete e.width;
                delete d.planes.width;
            } else {
                if (d.mode == "horizontal") {
                    delete e.height;
                    delete d.planes.height;
                }
            }
            b(d.styles, d.planes).each(function (h) {
                g[h] = this.getStyle(h).toInt();
            }, this);
            Object.each(d.planes, function (i, h) {
                var k = h.capitalize(), j = this.getStyle(h);
                if (j == "auto" && !f) {
                    f = this.getDimensions();
                }
                j = g[h] = (j == "auto") ? f[h] : j.toInt();
                e["total" + k] = j;
                i.each(function (m) {
                    var l = c(m, g);
                    e["computed" + m.capitalize()] = l;
                    e["total" + k] += l;
                });
            }, this);
            return Object.append(e, g);
        }
    });
})();
(function () {
    var a = false, b = false;
    var c = function () {
        var d = new Element("div").setStyles({position: "fixed", top: 0, right: 0}).inject(document.body);
        a = (d.offsetTop === 0);
        d.dispose();
        b = true;
    };
    Element.implement({
        pin: function (h, f) {
            if (!b) {
                c();
            }
            if (this.getStyle("display") == "none") {
                return this;
            }
            var j, k = window.getScroll(), l, e;
            if (h !== false) {
                j = this.getPosition(a ? document.body : this.getOffsetParent());
                if (!this.retrieve("pin:_pinned")) {
                    var g = {top: j.y - k.y, left: j.x - k.x};
                    if (a && !f) {
                        this.setStyle("position", "fixed").setStyles(g);
                    } else {
                        l = this.getOffsetParent();
                        var i = this.getPosition(l), m = this.getStyles("left", "top");
                        if (l && m.left == "auto" || m.top == "auto") {
                            this.setPosition(i);
                        }
                        if (this.getStyle("position") == "static") {
                            this.setStyle("position", "absolute");
                        }
                        i = {x: m.left.toInt() - k.x, y: m.top.toInt() - k.y};
                        e = function () {
                            if (!this.retrieve("pin:_pinned")) {
                                return;
                            }
                            var n = window.getScroll();
                            this.setStyles({left: i.x + n.x, top: i.y + n.y});
                        }.bind(this);
                        this.store("pin:_scrollFixer", e);
                        window.addEvent("scroll", e);
                    }
                    this.store("pin:_pinned", true);
                }
            } else {
                if (!this.retrieve("pin:_pinned")) {
                    return this;
                }
                l = this.getParent();
                var d = (l.getComputedStyle("position") != "static" ? l : l.getOffsetParent());
                j = this.getPosition(d);
                this.store("pin:_pinned", false);
                e = this.retrieve("pin:_scrollFixer");
                if (!e) {
                    this.setStyles({position: "absolute", top: j.y + k.y, left: j.x + k.x});
                } else {
                    this.store("pin:_scrollFixer", null);
                    window.removeEvent("scroll", e);
                }
                this.removeClass("isPinned");
            }
            return this;
        }, unpin: function () {
            return this.pin(false);
        }, togglePin: function () {
            return this.pin(!this.retrieve("pin:_pinned"));
        }
    });
})();
(function (b) {
    var a = Element.Position = {
        options: {relativeTo: document.body, position: {x: "center", y: "center"}, offset: {x: 0, y: 0}},
        getOptions: function (d, c) {
            c = Object.merge({}, a.options, c);
            a.setPositionOption(c);
            a.setEdgeOption(c);
            a.setOffsetOption(d, c);
            a.setDimensionsOption(d, c);
            return c;
        },
        setPositionOption: function (c) {
            c.position = a.getCoordinateFromValue(c.position);
        },
        setEdgeOption: function (d) {
            var c = a.getCoordinateFromValue(d.edge);
            d.edge = c ? c : (d.position.x == "center" && d.position.y == "center") ? {
                x: "center",
                y: "center"
            } : {x: "left", y: "top"};
        },
        setOffsetOption: function (f, d) {
            var c = {x: 0, y: 0}, g = f.measure(function () {
                return document.id(this.getOffsetParent());
            }), e = g.getScroll();
            if (!g || g == f.getDocument().body) {
                return;
            }
            c = g.measure(function () {
                var i = this.getPosition();
                if (this.getStyle("position") == "fixed") {
                    var h = window.getScroll();
                    i.x += h.x;
                    i.y += h.y;
                }
                return i;
            });
            d.offset = {
                parentPositioned: g != document.id(d.relativeTo),
                x: d.offset.x - c.x + e.x,
                y: d.offset.y - c.y + e.y
            };
        },
        setDimensionsOption: function (d, c) {
            c.dimensions = d.getDimensions({computeSize: true, styles: ["padding", "border", "margin"]});
        },
        getPosition: function (e, d) {
            var c = {};
            d = a.getOptions(e, d);
            var f = document.id(d.relativeTo) || document.body;
            a.setPositionCoordinates(d, c, f);
            if (d.edge) {
                a.toEdge(c, d);
            }
            var g = d.offset;
            c.left = ((c.x >= 0 || g.parentPositioned || d.allowNegative) ? c.x : 0).toInt();
            c.top = ((c.y >= 0 || g.parentPositioned || d.allowNegative) ? c.y : 0).toInt();
            a.toMinMax(c, d);
            if (d.relFixedPosition || f.getStyle("position") == "fixed") {
                a.toRelFixedPosition(f, c);
            }
            if (d.ignoreScroll) {
                a.toIgnoreScroll(f, c);
            }
            if (d.ignoreMargins) {
                a.toIgnoreMargins(c, d);
            }
            c.left = Math.ceil(c.left);
            c.top = Math.ceil(c.top);
            delete c.x;
            delete c.y;
            return c;
        },
        setPositionCoordinates: function (k, g, d) {
            var f = k.offset.y, h = k.offset.x, e = (d == document.body) ? window.getScroll() : d.getPosition(), j = e.y, c = e.x, i = window.getSize();
            switch (k.position.x) {
                case"left":
                    g.x = c + h;
                    break;
                case"right":
                    g.x = c + h + d.offsetWidth;
                    break;
                default:
                    g.x = c + ((d == document.body ? i.x : d.offsetWidth) / 2) + h;
                    break;
            }
            switch (k.position.y) {
                case"top":
                    g.y = j + f;
                    break;
                case"bottom":
                    g.y = j + f + d.offsetHeight;
                    break;
                default:
                    g.y = j + ((d == document.body ? i.y : d.offsetHeight) / 2) + f;
                    break;
            }
        },
        toMinMax: function (c, d) {
            var f = {left: "x", top: "y"}, e;
            ["minimum", "maximum"].each(function (g) {
                ["left", "top"].each(function (h) {
                    e = d[g] ? d[g][f[h]] : null;
                    if (e != null && ((g == "minimum") ? c[h] < e : c[h] > e)) {
                        c[h] = e;
                    }
                });
            });
        },
        toRelFixedPosition: function (e, c) {
            var d = window.getScroll();
            c.top += d.y;
            c.left += d.x;
        },
        toIgnoreScroll: function (e, d) {
            var c = e.getScroll();
            d.top -= c.y;
            d.left -= c.x;
        },
        toIgnoreMargins: function (c, d) {
            c.left += d.edge.x == "right" ? d.dimensions["margin-right"] : (d.edge.x != "center" ? -d.dimensions["margin-left"] : -d.dimensions["margin-left"] + ((d.dimensions["margin-right"] + d.dimensions["margin-left"]) / 2));
            c.top += d.edge.y == "bottom" ? d.dimensions["margin-bottom"] : (d.edge.y != "center" ? -d.dimensions["margin-top"] : -d.dimensions["margin-top"] + ((d.dimensions["margin-bottom"] + d.dimensions["margin-top"]) / 2));
        },
        toEdge: function (c, d) {
            var e = {}, g = d.dimensions, f = d.edge;
            switch (f.x) {
                case"left":
                    e.x = 0;
                    break;
                case"right":
                    e.x = -g.x - g.computedRight - g.computedLeft;
                    break;
                default:
                    e.x = -(Math.round(g.totalWidth / 2));
                    break;
            }
            switch (f.y) {
                case"top":
                    e.y = 0;
                    break;
                case"bottom":
                    e.y = -g.y - g.computedTop - g.computedBottom;
                    break;
                default:
                    e.y = -(Math.round(g.totalHeight / 2));
                    break;
            }
            c.x += e.x;
            c.y += e.y;
        },
        getCoordinateFromValue: function (c) {
            if (typeOf(c) != "string") {
                return c;
            }
            c = c.toLowerCase();
            return {
                x: c.test("left") ? "left" : (c.test("right") ? "right" : "center"),
                y: c.test(/upper|top/) ? "top" : (c.test("bottom") ? "bottom" : "center")
            };
        }
    };
    Element.implement({
        position: function (d) {
            if (d && (d.x != null || d.y != null)) {
                return (b ? b.apply(this, arguments) : this);
            }
            var c = this.setStyle("position", "absolute").calculatePosition(d);
            return (d && d.returnPos) ? c : this.setStyles(c);
        }, calculatePosition: function (c) {
            return a.getPosition(this, c);
        }
    });
})(Element.prototype.position);
Element.implement({
    isDisplayed: function () {
        return this.getStyle("display") != "none";
    }, isVisible: function () {
        var a = this.offsetWidth, b = this.offsetHeight;
        return (a == 0 && b == 0) ? false : (a > 0 && b > 0) ? true : this.style.display != "none";
    }, toggle: function () {
        return this[this.isDisplayed() ? "hide" : "show"]();
    }, hide: function () {
        var b;
        try {
            b = this.getStyle("display");
        } catch (a) {
        }
        if (b == "none") {
            return this;
        }
        return this.store("element:_originalDisplay", b || "").setStyle("display", "none");
    }, show: function (a) {
        if (!a && this.isDisplayed()) {
            return this;
        }
        a = a || this.retrieve("element:_originalDisplay") || "block";
        return this.setStyle("display", (a == "none") ? "block" : a);
    }, swapClass: function (a, b) {
        return this.removeClass(a).addClass(b);
    }
});
Document.implement({
    clearSelection: function () {
        if (window.getSelection) {
            var a = window.getSelection();
            if (a && a.removeAllRanges) {
                a.removeAllRanges();
            }
        } else {
            if (document.selection && document.selection.empty) {
                try {
                    document.selection.empty();
                } catch (b) {
                }
            }
        }
    }
});
var IframeShim = new Class({
    Implements: [Options, Events, Class.Occlude],
    options: {
        className: "iframeShim",
        src: 'javascript:false;document.write("");',
        display: false,
        zIndex: null,
        margin: 0,
        offset: {x: 0, y: 0},
        browsers: (Browser.ie6 || (Browser.firefox && Browser.version < 3 && Browser.Platform.mac))
    },
    property: "IframeShim",
    initialize: function (b, a) {
        this.element = document.id(b);
        if (this.occlude()) {
            return this.occluded;
        }
        this.setOptions(a);
        this.makeShim();
        return this;
    },
    makeShim: function () {
        if (this.options.browsers) {
            var c = this.element.getStyle("zIndex").toInt();
            if (!c) {
                c = 1;
                var b = this.element.getStyle("position");
                if (b == "static" || !b) {
                    this.element.setStyle("position", "relative");
                }
                this.element.setStyle("zIndex", c);
            }
            c = ((this.options.zIndex != null || this.options.zIndex === 0) && c > this.options.zIndex) ? this.options.zIndex : c - 1;
            if (c < 0) {
                c = 1;
            }
            this.shim = new Element("iframe", {
                src: this.options.src,
                scrolling: "no",
                frameborder: 0,
                styles: {
                    zIndex: c,
                    position: "absolute",
                    border: "none",
                    filter: "progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)"
                },
                "class": this.options.className
            }).store("IframeShim", this);
            var a = (function () {
                this.shim.inject(this.element, "after");
                this[this.options.display ? "show" : "hide"]();
                this.fireEvent("inject");
            }).bind(this);
            if (!IframeShim.ready) {
                window.addEvent("load", a);
            } else {
                a();
            }
        } else {
            this.position = this.hide = this.show = this.dispose = Function.from(this);
        }
    },
    position: function () {
        if (!IframeShim.ready || !this.shim) {
            return this;
        }
        var a = this.element.measure(function () {
            return this.getSize();
        });
        if (this.options.margin != undefined) {
            a.x = a.x - (this.options.margin * 2);
            a.y = a.y - (this.options.margin * 2);
            this.options.offset.x += this.options.margin;
            this.options.offset.y += this.options.margin;
        }
        this.shim.set({width: a.x, height: a.y}).position({relativeTo: this.element, offset: this.options.offset});
        return this;
    },
    hide: function () {
        if (this.shim) {
            this.shim.setStyle("display", "none");
        }
        return this;
    },
    show: function () {
        if (this.shim) {
            this.shim.setStyle("display", "block");
        }
        return this.position();
    },
    dispose: function () {
        if (this.shim) {
            this.shim.dispose();
        }
        return this;
    },
    destroy: function () {
        if (this.shim) {
            this.shim.destroy();
        }
        return this;
    }
});
window.addEvent("load", function () {
    IframeShim.ready = true;
});
var Mask = new Class({
    Implements: [Options, Events],
    Binds: ["position"],
    options: {style: {}, "class": "mask", maskMargins: false, useIframeShim: true, iframeShimOptions: {}},
    initialize: function (b, a) {
        this.target = document.id(b) || document.id(document.body);
        this.target.store("mask", this);
        this.setOptions(a);
        this.render();
        this.inject();
    },
    render: function () {
        this.element = new Element("div", {
            "class": this.options["class"],
            id: this.options.id || "mask-" + String.uniqueID(),
            styles: Object.merge({}, this.options.style, {display: "none"}),
            events: {
                click: function (a) {
                    this.fireEvent("click", a);
                    if (this.options.hideOnClick) {
                        this.hide();
                    }
                }.bind(this)
            }
        });
        this.hidden = true;
    },
    toElement: function () {
        return this.element;
    },
    inject: function (b, a) {
        a = a || (this.options.inject ? this.options.inject.where : "") || this.target == document.body ? "inside" : "after";
        b = b || (this.options.inject && this.options.inject.target) || this.target;
        this.element.inject(b, a);
        if (this.options.useIframeShim) {
            this.shim = new IframeShim(this.element, this.options.iframeShimOptions);
            this.addEvents({
                show: this.shim.show.bind(this.shim),
                hide: this.shim.hide.bind(this.shim),
                destroy: this.shim.destroy.bind(this.shim)
            });
        }
    },
    position: function () {
        this.resize(this.options.width, this.options.height);
        this.element.position({
            relativeTo: this.target,
            position: "topLeft",
            ignoreMargins: !this.options.maskMargins,
            ignoreScroll: this.target == document.body
        });
        return this;
    },
    resize: function (a, e) {
        var b = {styles: ["padding", "border"]};
        if (this.options.maskMargins) {
            b.styles.push("margin");
        }
        var d = this.target.getComputedSize(b);
        if (this.target == document.body) {
            this.element.setStyles({width: 0, height: 0});
            var c = window.getScrollSize();
            if (d.totalHeight < c.y) {
                d.totalHeight = c.y;
            }
            if (d.totalWidth < c.x) {
                d.totalWidth = c.x;
            }
        }
        this.element.setStyles({
            width: Array.pick([a, d.totalWidth, d.x]),
            height: Array.pick([e, d.totalHeight, d.y])
        });
        return this;
    },
    show: function () {
        if (!this.hidden) {
            return this;
        }
        window.addEvent("resize", this.position);
        this.position();
        this.showMask.apply(this, arguments);
        return this;
    },
    showMask: function () {
        this.element.setStyle("display", "block");
        this.hidden = false;
        this.fireEvent("show");
    },
    hide: function () {
        if (this.hidden) {
            return this;
        }
        window.removeEvent("resize", this.position);
        this.hideMask.apply(this, arguments);
        if (this.options.destroyOnHide) {
            return this.destroy();
        }
        return this;
    },
    hideMask: function () {
        this.element.setStyle("display", "none");
        this.hidden = true;
        this.fireEvent("hide");
    },
    toggle: function () {
        this[this.hidden ? "show" : "hide"]();
    },
    destroy: function () {
        this.hide();
        this.element.destroy();
        this.fireEvent("destroy");
        this.target.eliminate("mask");
    }
});
Element.Properties.mask = {
    set: function (b) {
        var a = this.retrieve("mask");
        if (a) {
            a.destroy();
        }
        return this.eliminate("mask").store("mask:options", b);
    }, get: function () {
        var a = this.retrieve("mask");
        if (!a) {
            a = new Mask(this, this.retrieve("mask:options"));
            this.store("mask", a);
        }
        return a;
    }
};
Element.implement({
    mask: function (a) {
        if (a) {
            this.set("mask", a);
        }
        this.get("mask").show();
        return this;
    }, unmask: function () {
        this.get("mask").hide();
        return this;
    }
});
var Spinner = new Class({
    Extends: Mask,
    Implements: Chain,
    options: {
        "class": "spinner",
        containerPosition: {},
        content: {"class": "spinner-content"},
        messageContainer: {"class": "spinner-msg"},
        img: {"class": "spinner-img"},
        fxOptions: {link: "chain"}
    },
    initialize: function (c, a) {
        this.target = document.id(c) || document.id(document.body);
        this.target.store("spinner", this);
        this.setOptions(a);
        this.render();
        this.inject();
        var b = function () {
            this.active = false;
        }.bind(this);
        this.addEvents({hide: b, show: b});
    },
    render: function () {
        this.parent();
        this.element.set("id", this.options.id || "spinner-" + String.uniqueID());
        this.content = document.id(this.options.content) || new Element("div", this.options.content);
        this.content.inject(this.element);
        if (this.options.message) {
            this.msg = document.id(this.options.message) || new Element("p", this.options.messageContainer).appendText(this.options.message);
            this.msg.inject(this.content);
        }
        if (this.options.img) {
            this.img = document.id(this.options.img) || new Element("div", this.options.img);
            this.img.inject(this.content);
        }
        this.element.set("tween", this.options.fxOptions);
    },
    show: function (a) {
        if (this.active) {
            return this.chain(this.show.bind(this));
        }
        if (!this.hidden) {
            this.callChain.delay(20, this);
            return this;
        }
        this.active = true;
        return this.parent(a);
    },
    showMask: function (a) {
        var b = function () {
            this.content.position(Object.merge({relativeTo: this.element}, this.options.containerPosition));
        }.bind(this);
        if (a) {
            this.parent();
            b();
        } else {
            if (!this.options.style.opacity) {
                this.options.style.opacity = this.element.getStyle("opacity").toFloat();
            }
            this.element.setStyles({display: "block", opacity: 0}).tween("opacity", this.options.style.opacity);
            b();
            this.hidden = false;
            this.fireEvent("show");
            this.callChain();
        }
    },
    hide: function (a) {
        if (this.active) {
            return this.chain(this.hide.bind(this));
        }
        if (this.hidden) {
            this.callChain.delay(20, this);
            return this;
        }
        this.active = true;
        return this.parent(a);
    },
    hideMask: function (a) {
        if (a) {
            return this.parent();
        }
        this.element.tween("opacity", 0).get("tween").chain(function () {
            this.element.setStyle("display", "none");
            this.hidden = true;
            this.fireEvent("hide");
            this.callChain();
        }.bind(this));
    },
    destroy: function () {
        this.content.destroy();
        this.parent();
        this.target.eliminate("spinner");
    }
});
Request = Class.refactor(Request, {
    options: {useSpinner: false, spinnerOptions: {}, spinnerTarget: false}, initialize: function (a) {
        this._send = this.send;
        this.send = function (b) {
            var c = this.getSpinner();
            if (c) {
                c.chain(this._send.pass(b, this)).show();
            } else {
                this._send(b);
            }
            return this;
        };
        this.previous(a);
    }, getSpinner: function () {
        if (!this.spinner) {
            var b = document.id(this.options.spinnerTarget) || document.id(this.options.update);
            if (this.options.useSpinner && b) {
                b.set("spinner", this.options.spinnerOptions);
                var a = this.spinner = b.get("spinner");
                ["complete", "exception", "cancel"].each(function (c) {
                    this.addEvent(c, a.hide.bind(a));
                }, this);
            }
        }
        return this.spinner;
    }
});
Element.Properties.spinner = {
    set: function (a) {
        var b = this.retrieve("spinner");
        if (b) {
            b.destroy();
        }
        return this.eliminate("spinner").store("spinner:options", a);
    }, get: function () {
        var a = this.retrieve("spinner");
        if (!a) {
            a = new Spinner(this, this.retrieve("spinner:options"));
            this.store("spinner", a);
        }
        return a;
    }
};
Element.implement({
    spin: function (a) {
        if (a) {
            this.set("spinner", a);
        }
        this.get("spinner").show();
        return this;
    }, unspin: function () {
        this.get("spinner").hide();
        return this;
    }
});
if (!window.Form) {
    window.Form = {};
}
(function () {
    Form.Request = new Class({
        Binds: ["onSubmit", "onFormValidate"],
        Implements: [Options, Events, Class.Occlude],
        options: {
            requestOptions: {evalScripts: true, useSpinner: true, emulation: false, link: "ignore"},
            sendButtonClicked: true,
            extraData: {},
            resetForm: true
        },
        property: "form.request",
        initialize: function (b, c, a) {
            this.element = document.id(b);
            if (this.occlude()) {
                return this.occluded;
            }
            this.setOptions(a).setTarget(c).attach();
        },
        setTarget: function (a) {
            this.target = document.id(a);
            if (!this.request) {
                this.makeRequest();
            } else {
                this.request.setOptions({update: this.target});
            }
            return this;
        },
        toElement: function () {
            return this.element;
        },
        makeRequest: function () {
            var a = this;
            this.request = new Request.HTML(Object.merge({
                update: this.target,
                emulation: false,
                spinnerTarget: this.element,
                method: this.element.get("method") || "post"
            }, this.options.requestOptions)).addEvents({
                success: function (c, e, d, b) {
                    ["complete", "success"].each(function (f) {
                        a.fireEvent(f, [a.target, c, e, d, b]);
                    });
                }, failure: function () {
                    a.fireEvent("complete", arguments).fireEvent("failure", arguments);
                }, exception: function () {
                    a.fireEvent("failure", arguments);
                }
            });
            return this.attachReset();
        },
        attachReset: function () {
            if (!this.options.resetForm) {
                return this;
            }
            this.request.addEvent("success", function () {
                Function.attempt(function () {
                    this.element.reset();
                }.bind(this));
                if (window.OverText) {
                    OverText.update();
                }
            }.bind(this));
            return this;
        },
        attach: function (a) {
            var c = (a != false) ? "addEvent" : "removeEvent";
            this.element[c]("click:relay(button, input[type=submit])", this.saveClickedButton.bind(this));
            var b = this.element.retrieve("validator");
            if (b) {
                b[c]("onFormValidate", this.onFormValidate);
            } else {
                this.element[c]("submit", this.onSubmit);
            }
            return this;
        },
        detach: function () {
            return this.attach(false);
        },
        enable: function () {
            return this.attach();
        },
        disable: function () {
            return this.detach();
        },
        onFormValidate: function (c, b, a) {
            if (!a) {
                return;
            }
            var d = this.element.retrieve("validator");
            if (c || (d && !d.options.stopOnFailure)) {
                a.stop();
                this.send();
            }
        },
        onSubmit: function (a) {
            var b = this.element.retrieve("validator");
            if (b) {
                this.element.removeEvent("submit", this.onSubmit);
                b.addEvent("onFormValidate", this.onFormValidate);
                this.element.validate();
                return;
            }
            if (a) {
                a.stop();
            }
            this.send();
        },
        saveClickedButton: function (b, c) {
            var a = c.get("name");
            if (!a || !this.options.sendButtonClicked) {
                return;
            }
            this.options.extraData[a] = c.get("value") || true;
            this.clickedCleaner = function () {
                delete this.options.extraData[a];
                this.clickedCleaner = function () {
                };
            }.bind(this);
        },
        clickedCleaner: function () {
        },
        send: function () {
            var b = this.element.toQueryString().trim(), a = Object.toQueryString(this.options.extraData);
            if (b) {
                b += "&" + a;
            } else {
                b = a;
            }
            this.fireEvent("send", [this.element, b.parseQueryString()]);
            this.request.send({data: b, url: this.options.requestOptions.url || this.element.get("action")});
            this.clickedCleaner();
            return this;
        }
    });
    Element.implement("formUpdate", function (c, b) {
        var a = this.retrieve("form.request");
        if (!a) {
            a = new Form.Request(this, c, b);
        } else {
            if (c) {
                a.setTarget(c);
            }
            if (b) {
                a.setOptions(b).makeRequest();
            }
        }
        a.send();
        return this;
    });
})();
(function () {
    var a = function (d) {
        var b = d.options.hideInputs;
        if (window.OverText) {
            var c = [null];
            OverText.each(function (e) {
                c.include("." + e.options.labelClass);
            });
            if (c) {
                b += c.join(", ");
            }
        }
        return (b) ? d.element.getElements(b) : null;
    };
    Fx.Reveal = new Class({
        Extends: Fx.Morph, options: {
            link: "cancel",
            styles: ["padding", "border", "margin"],
            transitionOpacity: !Browser.ie6,
            mode: "vertical",
            display: function () {
                return this.element.get("tag") != "tr" ? "block" : "table-row";
            },
            opacity: 1,
            hideInputs: Browser.ie ? "select, input, textarea, object, embed" : null
        }, dissolve: function () {
            if (!this.hiding && !this.showing) {
                if (this.element.getStyle("display") != "none") {
                    this.hiding = true;
                    this.showing = false;
                    this.hidden = true;
                    this.cssText = this.element.style.cssText;
                    var d = this.element.getComputedSize({styles: this.options.styles, mode: this.options.mode});
                    if (this.options.transitionOpacity) {
                        d.opacity = this.options.opacity;
                    }
                    var c = {};
                    Object.each(d, function (f, e) {
                        c[e] = [f, 0];
                    });
                    this.element.setStyles({
                        display: Function.from(this.options.display).call(this),
                        overflow: "hidden"
                    });
                    var b = a(this);
                    if (b) {
                        b.setStyle("visibility", "hidden");
                    }
                    this.$chain.unshift(function () {
                        if (this.hidden) {
                            this.hiding = false;
                            this.element.style.cssText = this.cssText;
                            this.element.setStyle("display", "none");
                            if (b) {
                                b.setStyle("visibility", "visible");
                            }
                        }
                        this.fireEvent("hide", this.element);
                        this.callChain();
                    }.bind(this));
                    this.start(c);
                } else {
                    this.callChain.delay(10, this);
                    this.fireEvent("complete", this.element);
                    this.fireEvent("hide", this.element);
                }
            } else {
                if (this.options.link == "chain") {
                    this.chain(this.dissolve.bind(this));
                } else {
                    if (this.options.link == "cancel" && !this.hiding) {
                        this.cancel();
                        this.dissolve();
                    }
                }
            }
            return this;
        }, reveal: function () {
            if (!this.showing && !this.hiding) {
                if (this.element.getStyle("display") == "none") {
                    this.hiding = false;
                    this.showing = true;
                    this.hidden = false;
                    this.cssText = this.element.style.cssText;
                    var d;
                    this.element.measure(function () {
                        d = this.element.getComputedSize({styles: this.options.styles, mode: this.options.mode});
                    }.bind(this));
                    if (this.options.heightOverride != null) {
                        d.height = this.options.heightOverride.toInt();
                    }
                    if (this.options.widthOverride != null) {
                        d.width = this.options.widthOverride.toInt();
                    }
                    if (this.options.transitionOpacity) {
                        this.element.setStyle("opacity", 0);
                        d.opacity = this.options.opacity;
                    }
                    var c = {height: 0, display: Function.from(this.options.display).call(this)};
                    Object.each(d, function (f, e) {
                        c[e] = 0;
                    });
                    c.overflow = "hidden";
                    this.element.setStyles(c);
                    var b = a(this);
                    if (b) {
                        b.setStyle("visibility", "hidden");
                    }
                    this.$chain.unshift(function () {
                        this.element.style.cssText = this.cssText;
                        this.element.setStyle("display", Function.from(this.options.display).call(this));
                        if (!this.hidden) {
                            this.showing = false;
                        }
                        if (b) {
                            b.setStyle("visibility", "visible");
                        }
                        this.callChain();
                        this.fireEvent("show", this.element);
                    }.bind(this));
                    this.start(d);
                } else {
                    this.callChain();
                    this.fireEvent("complete", this.element);
                    this.fireEvent("show", this.element);
                }
            } else {
                if (this.options.link == "chain") {
                    this.chain(this.reveal.bind(this));
                } else {
                    if (this.options.link == "cancel" && !this.showing) {
                        this.cancel();
                        this.reveal();
                    }
                }
            }
            return this;
        }, toggle: function () {
            if (this.element.getStyle("display") == "none") {
                this.reveal();
            } else {
                this.dissolve();
            }
            return this;
        }, cancel: function () {
            this.parent.apply(this, arguments);
            if (this.cssText != null) {
                this.element.style.cssText = this.cssText;
            }
            this.hiding = false;
            this.showing = false;
            return this;
        }
    });
    Element.Properties.reveal = {
        set: function (b) {
            this.get("reveal").cancel().setOptions(b);
            return this;
        }, get: function () {
            var b = this.retrieve("reveal");
            if (!b) {
                b = new Fx.Reveal(this);
                this.store("reveal", b);
            }
            return b;
        }
    };
    Element.Properties.dissolve = Element.Properties.reveal;
    Element.implement({
        reveal: function (b) {
            this.get("reveal").setOptions(b).reveal();
            return this;
        }, dissolve: function (b) {
            this.get("reveal").setOptions(b).dissolve();
            return this;
        }, nix: function (b) {
            var c = Array.link(arguments, {destroy: Type.isBoolean, options: Type.isObject});
            this.get("reveal").setOptions(b).dissolve().chain(function () {
                this[c.destroy ? "destroy" : "dispose"]();
            }.bind(this));
            return this;
        }, wink: function () {
            var c = Array.link(arguments, {duration: Type.isNumber, options: Type.isObject});
            var b = this.get("reveal").setOptions(c.options);
            b.reveal().chain(function () {
                (function () {
                    b.dissolve();
                }).delay(c.duration || 2000);
            });
        }
    });
})();
Form.Request.Append = new Class({
    Extends: Form.Request, options: {useReveal: true, revealOptions: {}, inject: "bottom"}, makeRequest: function () {
        this.request = new Request.HTML(Object.merge({
            url: this.element.get("action"),
            method: this.element.get("method") || "post",
            spinnerTarget: this.element
        }, this.options.requestOptions, {evalScripts: false})).addEvents({
            success: function (b, g, f, a) {
                var c;
                var d = Elements.from(f);
                if (d.length == 1) {
                    c = d[0];
                } else {
                    c = new Element("div", {styles: {display: "none"}}).adopt(d);
                }
                c.inject(this.target, this.options.inject);
                if (this.options.requestOptions.evalScripts) {
                    Browser.exec(a);
                }
                this.fireEvent("beforeEffect", c);
                var e = function () {
                    this.fireEvent("success", [c, this.target, b, g, f, a]);
                }.bind(this);
                if (this.options.useReveal) {
                    c.set("reveal", this.options.revealOptions).get("reveal").chain(e);
                    c.reveal();
                } else {
                    e();
                }
            }.bind(this), failure: function (a) {
                this.fireEvent("failure", a);
            }.bind(this)
        });
        this.attachReset();
    }
});
Locale.define("en-US", "FormValidator", {
    required: "This field is required.",
    length: "Please enter {length} characters (you entered {elLength} characters)",
    minLength: "Please enter at least {minLength} characters (you entered {length} characters).",
    maxLength: "Please enter no more than {maxLength} characters (you entered {length} characters).",
    integer: "Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.",
    numeric: 'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
    digits: "Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).",
    alpha: "Please use only letters (a-z) within this field. No spaces or other characters are allowed.",
    alphanum: "Please use only letters (a-z) or numbers (0-9) in this field. No spaces or other characters are allowed.",
    dateSuchAs: "Please enter a valid date such as {date}",
    dateInFormatMDY: 'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
    email: 'Please enter a valid email address. For example "fred@domain.com".',
    url: "Please enter a valid URL such as http://www.example.com.",
    currencyDollar: "Please enter a valid $ amount. For example $100.00 .",
    oneRequired: "Please enter something for at least one of these inputs.",
    errorPrefix: "Error: ",
    warningPrefix: "Warning: ",
    noSpace: "There can be no spaces in this input.",
    reqChkByNode: "No items are selected.",
    requiredChk: "This field is required.",
    reqChkByName: "Please select a {label}.",
    match: "This field needs to match the {matchName} field",
    startDate: "the start date",
    endDate: "the end date",
    currendDate: "the current date",
    afterDate: "The date should be the same or after {label}.",
    beforeDate: "The date should be the same or before {label}.",
    startMonth: "Please select a start month",
    sameMonth: "These two dates must be in the same month - you must change one or the other.",
    creditcard: "The credit card number entered is invalid. Please check the number and try again. {length} digits entered."
});
if (!window.Form) {
    window.Form = {};
}
var InputValidator = this.InputValidator = new Class({
    Implements: [Options],
    options: {errorMsg: "Validation failed.", test: Function.from(true)},
    initialize: function (b, a) {
        this.setOptions(a);
        this.className = b;
    },
    test: function (b, a) {
        b = document.id(b);
        return (b) ? this.options.test(b, a || this.getProps(b)) : false;
    },
    getError: function (c, a) {
        c = document.id(c);
        var b = this.options.errorMsg;
        if (typeOf(b) == "function") {
            b = b(c, a || this.getProps(c));
        }
        return b;
    },
    getProps: function (a) {
        a = document.id(a);
        return (a) ? a.get("validatorProps") : {};
    }
});
Element.Properties.validators = {
    get: function () {
        return (this.get("data-validators") || this.className).clean().split(" ");
    }
};
Element.Properties.validatorProps = {
    set: function (a) {
        return this.eliminate("$moo:validatorProps").store("$moo:validatorProps", a);
    }, get: function (a) {
        if (a) {
            this.set(a);
        }
        if (this.retrieve("$moo:validatorProps")) {
            return this.retrieve("$moo:validatorProps");
        }
        if (this.getProperty("data-validator-properties") || this.getProperty("validatorProps")) {
            try {
                this.store("$moo:validatorProps", JSON.decode(this.getProperty("validatorProps") || this.getProperty("data-validator-properties")));
            } catch (c) {
                return {};
            }
        } else {
            var b = this.get("validators").filter(function (d) {
                return d.test(":");
            });
            if (!b.length) {
                this.store("$moo:validatorProps", {});
            } else {
                a = {};
                b.each(function (d) {
                    var f = d.split(":");
                    if (f[1]) {
                        try {
                            a[f[0]] = JSON.decode(f[1]);
                        } catch (g) {
                        }
                    }
                });
                this.store("$moo:validatorProps", a);
            }
        }
        return this.retrieve("$moo:validatorProps");
    }
};
Form.Validator = new Class({
    Implements: [Options, Events], Binds: ["onSubmit"], options: {
        fieldSelectors: "input, select, textarea",
        ignoreHidden: true,
        ignoreDisabled: true,
        useTitles: false,
        evaluateOnSubmit: true,
        evaluateFieldsOnBlur: true,
        evaluateFieldsOnChange: true,
        serial: true,
        stopOnFailure: true,
        warningPrefix: function () {
            return Form.Validator.getMsg("warningPrefix") || "Warning: ";
        },
        errorPrefix: function () {
            return Form.Validator.getMsg("errorPrefix") || "Error: ";
        }
    }, initialize: function (b, a) {
        this.setOptions(a);
        this.element = document.id(b);
        this.element.store("validator", this);
        this.warningPrefix = Function.from(this.options.warningPrefix)();
        this.errorPrefix = Function.from(this.options.errorPrefix)();
        if (this.options.evaluateOnSubmit) {
            this.element.addEvent("submit", this.onSubmit);
        }
        if (this.options.evaluateFieldsOnBlur || this.options.evaluateFieldsOnChange) {
            this.watchFields(this.getFields());
        }
    }, toElement: function () {
        return this.element;
    }, getFields: function () {
        return (this.fields = this.element.getElements(this.options.fieldSelectors));
    }, watchFields: function (a) {
        a.each(function (b) {
            if (this.options.evaluateFieldsOnBlur) {
                b.addEvent("blur", this.validationMonitor.pass([b, false], this));
            }
            if (this.options.evaluateFieldsOnChange) {
                b.addEvent("change", this.validationMonitor.pass([b, true], this));
            }
        }, this);
    }, validationMonitor: function () {
        clearTimeout(this.timer);
        this.timer = this.validateField.delay(50, this, arguments);
    }, onSubmit: function (a) {
        if (this.validate(a)) {
            this.reset();
        }
    }, reset: function () {
        this.getFields().each(this.resetField, this);
        return this;
    }, validate: function (b) {
        var a = this.getFields().map(function (c) {
            return this.validateField(c, true);
        }, this).every(function (c) {
            return c;
        });
        this.fireEvent("formValidate", [a, this.element, b]);
        if (this.options.stopOnFailure && !a && b) {
            b.preventDefault();
        }
        return a;
    }, validateField: function (j, b) {
        if (this.paused) {
            return true;
        }
        j = document.id(j);
        var f = !j.hasClass("validation-failed");
        var g, i;
        if (this.options.serial && !b) {
            g = this.element.getElement(".validation-failed");
            i = this.element.getElement(".warning");
        }
        if (j && (!g || b || j.hasClass("validation-failed") || (g && !this.options.serial))) {
            var a = j.get("validators");
            var d = a.some(function (k) {
                return this.getValidator(k);
            }, this);
            var h = [];
            a.each(function (k) {
                if (k && !this.test(k, j)) {
                    h.include(k);
                }
            }, this);
            f = h.length === 0;
            if (d && !this.hasValidator(j, "warnOnly")) {
                if (f) {
                    j.addClass("validation-passed").removeClass("validation-failed");
                    this.fireEvent("elementPass", [j]);
                } else {
                    j.addClass("validation-failed").removeClass("validation-passed");
                    this.fireEvent("elementFail", [j, h]);
                }
            }
            if (!i) {
                var e = a.some(function (k) {
                    if (k.test("^warn")) {
                        return this.getValidator(k.replace(/^warn-/, ""));
                    } else {
                        return null;
                    }
                }, this);
                j.removeClass("warning");
                var c = a.map(function (k) {
                    if (k.test("^warn")) {
                        return this.test(k.replace(/^warn-/, ""), j, true);
                    } else {
                        return null;
                    }
                }, this);
            }
        }
        return f;
    }, test: function (b, d, e) {
        d = document.id(d);
        if ((this.options.ignoreHidden && !d.isVisible()) || (this.options.ignoreDisabled && d.get("disabled"))) {
            return true;
        }
        var a = this.getValidator(b);
        if (e != null) {
            e = false;
        }
        if (this.hasValidator(d, "warnOnly")) {
            e = true;
        }
        var c = this.hasValidator(d, "ignoreValidation") || (a ? a.test(d) : true);
        if (a && d.isVisible()) {
            this.fireEvent("elementValidate", [c, d, b, e]);
        }
        if (e) {
            return true;
        }
        return c;
    }, hasValidator: function (b, a) {
        return b.get("validators").contains(a);
    }, resetField: function (a) {
        a = document.id(a);
        if (a) {
            a.get("validators").each(function (b) {
                if (b.test("^warn-")) {
                    b = b.replace(/^warn-/, "");
                }
                a.removeClass("validation-failed");
                a.removeClass("warning");
                a.removeClass("validation-passed");
            }, this);
        }
        return this;
    }, stop: function () {
        this.paused = true;
        return this;
    }, start: function () {
        this.paused = false;
        return this;
    }, ignoreField: function (a, b) {
        a = document.id(a);
        if (a) {
            this.enforceField(a);
            if (b) {
                a.addClass("warnOnly");
            } else {
                a.addClass("ignoreValidation");
            }
        }
        return this;
    }, enforceField: function (a) {
        a = document.id(a);
        if (a) {
            a.removeClass("warnOnly").removeClass("ignoreValidation");
        }
        return this;
    }
});
Form.Validator.getMsg = function (a) {
    return Locale.get("FormValidator." + a);
};
Form.Validator.adders = {
    validators: {}, add: function (b, a) {
        this.validators[b] = new InputValidator(b, a);
        if (!this.initialize) {
            this.implement({validators: this.validators});
        }
    }, addAllThese: function (a) {
        Array.from(a).each(function (b) {
            this.add(b[0], b[1]);
        }, this);
    }, getValidator: function (a) {
        return this.validators[a.split(":")[0]];
    }
};
Object.append(Form.Validator, Form.Validator.adders);
Form.Validator.implement(Form.Validator.adders);
Form.Validator.add("IsEmpty", {
    errorMsg: false, test: function (a) {
        if (a.type == "select-one" || a.type == "select") {
            return !(a.selectedIndex >= 0 && a.options[a.selectedIndex].value != "");
        } else {
            return ((a.get("value") == null) || (a.get("value").length == 0));
        }
    }
});
Form.Validator.addAllThese([["required", {
    errorMsg: function () {
        return Form.Validator.getMsg("required");
    }, test: function (a) {
        return !Form.Validator.getValidator("IsEmpty").test(a);
    }
}], ["length", {
    errorMsg: function (a, b) {
        if (typeOf(b.length) != "null") {
            return Form.Validator.getMsg("length").substitute({length: b.length, elLength: a.get("value").length});
        } else {
            return "";
        }
    }, test: function (a, b) {
        if (typeOf(b.length) != "null") {
            return (a.get("value").length == b.length || a.get("value").length == 0);
        } else {
            return true;
        }
    }
}], ["minLength", {
    errorMsg: function (a, b) {
        if (typeOf(b.minLength) != "null") {
            return Form.Validator.getMsg("minLength").substitute({
                minLength: b.minLength,
                length: a.get("value").length
            });
        } else {
            return "";
        }
    }, test: function (a, b) {
        if (typeOf(b.minLength) != "null") {
            return (a.get("value").length >= (b.minLength || 0));
        } else {
            return true;
        }
    }
}], ["maxLength", {
    errorMsg: function (a, b) {
        if (typeOf(b.maxLength) != "null") {
            return Form.Validator.getMsg("maxLength").substitute({
                maxLength: b.maxLength,
                length: a.get("value").length
            });
        } else {
            return "";
        }
    }, test: function (a, b) {
        return a.get("value").length <= (b.maxLength || 10000);
    }
}], ["validate-integer", {
    errorMsg: Form.Validator.getMsg.pass("integer"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^(-?[1-9]\d*|0)$/).test(a.get("value"));
    }
}], ["validate-numeric", {
    errorMsg: Form.Validator.getMsg.pass("numeric"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(a.get("value"));
    }
}], ["validate-digits", {
    errorMsg: Form.Validator.getMsg.pass("digits"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^[\d() .:\-\+#]+$/.test(a.get("value")));
    }
}], ["validate-alpha", {
    errorMsg: Form.Validator.getMsg.pass("alpha"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^[a-zA-Z]+$/).test(a.get("value"));
    }
}], ["validate-alphanum", {
    errorMsg: Form.Validator.getMsg.pass("alphanum"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || !(/\W/).test(a.get("value"));
    }
}], ["validate-date", {
    errorMsg: function (a, b) {
        if (Date.parse) {
            var c = b.dateFormat || "%x";
            return Form.Validator.getMsg("dateSuchAs").substitute({date: new Date().format(c)});
        } else {
            return Form.Validator.getMsg("dateInFormatMDY");
        }
    }, test: function (e, g) {
        if (Form.Validator.getValidator("IsEmpty").test(e)) {
            return true;
        }
        var a = Locale.getCurrent().sets.Date, b = new RegExp([a.days, a.days_abbr, a.months, a.months_abbr].flatten().join("|"), "i"), i = e.get("value"), f = i.match(/[a-z]+/gi);
        if (f && !f.every(b.exec, b)) {
            return false;
        }
        var c = Date.parse(i), h = g.dateFormat || "%x", d = c.format(h);
        if (d != "invalid date") {
            e.set("value", d);
        }
        return c.isValid();
    }
}], ["validate-email", {
    errorMsg: Form.Validator.getMsg.pass("email"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i).test(a.get("value"));
    }
}], ["validate-url", {
    errorMsg: Form.Validator.getMsg.pass("url"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(a.get("value"));
    }
}], ["validate-currency-dollar", {
    errorMsg: Form.Validator.getMsg.pass("currencyDollar"), test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(a.get("value"));
    }
}], ["validate-one-required", {
    errorMsg: Form.Validator.getMsg.pass("oneRequired"), test: function (a, b) {
        var c = document.id(b["validate-one-required"]) || a.getParent(b["validate-one-required"]);
        return c.getElements("input").some(function (d) {
            if (["checkbox", "radio"].contains(d.get("type"))) {
                return d.get("checked");
            }
            return d.get("value");
        });
    }
}]]);
Element.Properties.validator = {
    set: function (a) {
        this.get("validator").setOptions(a);
    }, get: function () {
        var a = this.retrieve("validator");
        if (!a) {
            a = new Form.Validator(this);
            this.store("validator", a);
        }
        return a;
    }
};
Element.implement({
    validate: function (a) {
        if (a) {
            this.set("validator", a);
        }
        return this.get("validator").validate();
    }
});
Form.Validator.Inline = new Class({
    Extends: Form.Validator, options: {
        showError: function (a) {
            if (a.reveal) {
                a.reveal();
            } else {
                a.setStyle("display", "block");
            }
        },
        hideError: function (a) {
            if (a.dissolve) {
                a.dissolve();
            } else {
                a.setStyle("display", "none");
            }
        },
        scrollToErrorsOnSubmit: true,
        scrollToErrorsOnBlur: false,
        scrollToErrorsOnChange: false,
        scrollFxOptions: {transition: "quad:out", offset: {y: -20}}
    }, initialize: function (b, a) {
        this.parent(b, a);
        this.addEvent("onElementValidate", function (g, f, e, h) {
            var d = this.getValidator(e);
            if (!g && d.getError(f)) {
                if (h) {
                    f.addClass("warning");
                }
                var c = this.makeAdvice(e, f, d.getError(f), h);
                this.insertAdvice(c, f);
                this.showAdvice(e, f);
            } else {
                this.hideAdvice(e, f);
            }
        });
    }, makeAdvice: function (d, f, c, g) {
        var e = (g) ? this.warningPrefix : this.errorPrefix;
        e += (this.options.useTitles) ? f.title || c : c;
        var a = (g) ? "warning-advice" : "validation-advice";
        var b = this.getAdvice(d, f);
        if (b) {
            b = b.set("html", e);
        } else {
            b = new Element("div", {
                html: e,
                styles: {display: "none"},
                id: "advice-" + d.split(":")[0] + "-" + this.getFieldId(f)
            }).addClass(a);
        }
        f.store("$moo:advice-" + d, b);
        return b;
    }, getFieldId: function (a) {
        return a.id ? a.id : a.id = "input_" + a.name;
    }, showAdvice: function (b, c) {
        var a = this.getAdvice(b, c);
        if (a && !c.retrieve("$moo:" + this.getPropName(b)) && (a.getStyle("display") == "none" || a.getStyle("visiblity") == "hidden" || a.getStyle("opacity") == 0)) {
            c.store("$moo:" + this.getPropName(b), true);
            this.options.showError(a);
            this.fireEvent("showAdvice", [c, a, b]);
        }
    }, hideAdvice: function (b, c) {
        var a = this.getAdvice(b, c);
        if (a && c.retrieve("$moo:" + this.getPropName(b))) {
            c.store("$moo:" + this.getPropName(b), false);
            this.options.hideError(a);
            this.fireEvent("hideAdvice", [c, a, b]);
        }
    }, getPropName: function (a) {
        return "advice" + a;
    }, resetField: function (a) {
        a = document.id(a);
        if (!a) {
            return this;
        }
        this.parent(a);
        a.get("validators").each(function (b) {
            this.hideAdvice(b, a);
        }, this);
        return this;
    }, getAllAdviceMessages: function (d, c) {
        var b = [];
        if (d.hasClass("ignoreValidation") && !c) {
            return b;
        }
        var a = d.get("validators").some(function (g) {
            var e = g.test("^warn-") || d.hasClass("warnOnly");
            if (e) {
                g = g.replace(/^warn-/, "");
            }
            var f = this.getValidator(g);
            if (!f) {
                return;
            }
            b.push({message: f.getError(d), warnOnly: e, passed: f.test(), validator: f});
        }, this);
        return b;
    }, getAdvice: function (a, b) {
        return b.retrieve("$moo:advice-" + a);
    }, insertAdvice: function (a, c) {
        var b = c.get("validatorProps");
        if (!b.msgPos || !document.id(b.msgPos)) {
            if (c.type && c.type.toLowerCase() == "radio") {
                c.getParent().adopt(a);
            } else {
                a.inject(document.id(c), "after");
            }
        } else {
            document.id(b.msgPos).grab(a);
        }
    }, validateField: function (g, f, b) {
        var a = this.parent(g, f);
        if (((this.options.scrollToErrorsOnSubmit && b == null) || b) && !a) {
            var c = document.id(this).getElement(".validation-failed");
            var d = document.id(this).getParent();
            while (d != document.body && d.getScrollSize().y == d.getSize().y) {
                d = d.getParent();
            }
            var e = d.retrieve("$moo:fvScroller");
            if (!e && window.Fx && Fx.Scroll) {
                e = new Fx.Scroll(d, this.options.scrollFxOptions);
                d.store("$moo:fvScroller", e);
            }
            if (c) {
                if (e) {
                    e.toElement(c);
                } else {
                    d.scrollTo(d.getScroll().x, c.getPosition(d).y - 20);
                }
            }
        }
        return a;
    }, watchFields: function (a) {
        a.each(function (b) {
            if (this.options.evaluateFieldsOnBlur) {
                b.addEvent("blur", this.validationMonitor.pass([b, false, this.options.scrollToErrorsOnBlur], this));
            }
            if (this.options.evaluateFieldsOnChange) {
                b.addEvent("change", this.validationMonitor.pass([b, true, this.options.scrollToErrorsOnChange], this));
            }
        }, this);
    }
});
Form.Validator.addAllThese([["validate-enforce-oncheck", {
    test: function (a, b) {
        var c = a.getParent("form").retrieve("validator");
        if (!c) {
            return true;
        }
        (b.toEnforce || document.id(b.enforceChildrenOf).getElements("input, select, textarea")).map(function (d) {
            if (a.checked) {
                c.enforceField(d);
            } else {
                c.ignoreField(d);
                c.resetField(d);
            }
        });
        return true;
    }
}], ["validate-ignore-oncheck", {
    test: function (a, b) {
        var c = a.getParent("form").retrieve("validator");
        if (!c) {
            return true;
        }
        (b.toIgnore || document.id(b.ignoreChildrenOf).getElements("input, select, textarea")).each(function (d) {
            if (a.checked) {
                c.ignoreField(d);
                c.resetField(d);
            } else {
                c.enforceField(d);
            }
        });
        return true;
    }
}], ["validate-nospace", {
    errorMsg: function () {
        return Form.Validator.getMsg("noSpace");
    }, test: function (a, b) {
        return !a.get("value").test(/\s/);
    }
}], ["validate-toggle-oncheck", {
    test: function (b, c) {
        var d = b.getParent("form").retrieve("validator");
        if (!d) {
            return true;
        }
        var a = c.toToggle || document.id(c.toToggleChildrenOf).getElements("input, select, textarea");
        if (!b.checked) {
            a.each(function (e) {
                d.ignoreField(e);
                d.resetField(e);
            });
        } else {
            a.each(function (e) {
                d.enforceField(e);
            });
        }
        return true;
    }
}], ["validate-reqchk-bynode", {
    errorMsg: function () {
        return Form.Validator.getMsg("reqChkByNode");
    }, test: function (a, b) {
        return (document.id(b.nodeId).getElements(b.selector || "input[type=checkbox], input[type=radio]")).some(function (c) {
            return c.checked;
        });
    }
}], ["validate-required-check", {
    errorMsg: function (a, b) {
        return b.useTitle ? a.get("title") : Form.Validator.getMsg("requiredChk");
    }, test: function (a, b) {
        return !!a.checked;
    }
}], ["validate-reqchk-byname", {
    errorMsg: function (a, b) {
        return Form.Validator.getMsg("reqChkByName").substitute({label: b.label || a.get("type")});
    }, test: function (b, d) {
        var c = d.groupName || b.get("name");
        var a = $$(document.getElementsByName(c)).some(function (g, f) {
            return g.checked;
        });
        var e = b.getParent("form").retrieve("validator");
        if (a && e) {
            e.resetField(b);
        }
        return a;
    }
}], ["validate-match", {
    errorMsg: function (a, b) {
        return Form.Validator.getMsg("match").substitute({matchName: b.matchName || document.id(b.matchInput).get("name")});
    }, test: function (b, c) {
        var d = b.get("value");
        var a = document.id(c.matchInput) && document.id(c.matchInput).get("value");
        return d && a ? d == a : true;
    }
}], ["validate-after-date", {
    errorMsg: function (a, b) {
        return Form.Validator.getMsg("afterDate").substitute({label: b.afterLabel || (b.afterElement ? Form.Validator.getMsg("startDate") : Form.Validator.getMsg("currentDate"))});
    }, test: function (b, c) {
        var d = document.id(c.afterElement) ? Date.parse(document.id(c.afterElement).get("value")) : new Date();
        var a = Date.parse(b.get("value"));
        return a && d ? a >= d : true;
    }
}], ["validate-before-date", {
    errorMsg: function (a, b) {
        return Form.Validator.getMsg("beforeDate").substitute({label: b.beforeLabel || (b.beforeElement ? Form.Validator.getMsg("endDate") : Form.Validator.getMsg("currentDate"))});
    }, test: function (b, c) {
        var d = Date.parse(b.get("value"));
        var a = document.id(c.beforeElement) ? Date.parse(document.id(c.beforeElement).get("value")) : new Date();
        return a && d ? a >= d : true;
    }
}], ["validate-custom-required", {
    errorMsg: function () {
        return Form.Validator.getMsg("required");
    }, test: function (a, b) {
        return a.get("value") != b.emptyValue;
    }
}], ["validate-same-month", {
    errorMsg: function (a, b) {
        var c = document.id(b.sameMonthAs) && document.id(b.sameMonthAs).get("value");
        var d = a.get("value");
        if (d != "") {
            return Form.Validator.getMsg(c ? "sameMonth" : "startMonth");
        }
    }, test: function (a, b) {
        var d = Date.parse(a.get("value"));
        var c = Date.parse(document.id(b.sameMonthAs) && document.id(b.sameMonthAs).get("value"));
        return d && c ? d.format("%B") == c.format("%B") : true;
    }
}], ["validate-cc-num", {
    errorMsg: function (a) {
        var b = a.get("value").replace(/[^0-9]/g, "");
        return Form.Validator.getMsg("creditcard").substitute({length: b.length});
    }, test: function (c) {
        if (Form.Validator.getValidator("IsEmpty").test(c)) {
            return true;
        }
        var g = c.get("value");
        g = g.replace(/[^0-9]/g, "");
        var a = false;
        if (g.test(/^4[0-9]{12}([0-9]{3})?$/)) {
            a = "Visa";
        } else {
            if (g.test(/^5[1-5]([0-9]{14})$/)) {
                a = "Master Card";
            } else {
                if (g.test(/^3[47][0-9]{13}$/)) {
                    a = "American Express";
                } else {
                    if (g.test(/^6011[0-9]{12}$/)) {
                        a = "Discover";
                    }
                }
            }
        }
        if (a) {
            var d = 0;
            var e = 0;
            for (var b = g.length - 1; b >= 0; --b) {
                e = g.charAt(b).toInt();
                if (e == 0) {
                    continue;
                }
                if ((g.length - b) % 2 == 0) {
                    e += e;
                }
                if (e > 9) {
                    e = e.toString().charAt(0).toInt() + e.toString().charAt(1).toInt();
                }
                d += e;
            }
            if ((d % 10) == 0) {
                return true;
            }
        }
        var f = "";
        while (g != "") {
            f += " " + g.substr(0, 4);
            g = g.substr(4);
        }
        c.getParent("form").retrieve("validator").ignoreField(c);
        c.set("value", f.clean());
        c.getParent("form").retrieve("validator").enforceField(c);
        return false;
    }
}]]);
var OverText = new Class({
    Implements: [Options, Events, Class.Occlude],
    Binds: ["reposition", "assert", "focus", "hide"],
    options: {
        element: "label",
        labelClass: "overTxtLabel",
        positionOptions: {position: "upperLeft", edge: "upperLeft", offset: {x: 4, y: 2}},
        poll: false,
        pollInterval: 250,
        wrap: false
    },
    property: "OverText",
    initialize: function (b, a) {
        b = this.element = document.id(b);
        if (this.occlude()) {
            return this.occluded;
        }
        this.setOptions(a);
        this.attach(b);
        OverText.instances.push(this);
        if (this.options.poll) {
            this.poll();
        }
    },
    toElement: function () {
        return this.element;
    },
    attach: function () {
        var b = this.element, a = this.options, c = a.textOverride || b.get("alt") || b.get("title");
        if (!c) {
            return this;
        }
        var d = this.text = new Element(a.element, {
            "class": a.labelClass,
            styles: {lineHeight: "normal", position: "absolute", cursor: "text"},
            html: c,
            events: {click: this.hide.pass(a.element == "label", this)}
        }).inject(b, "after");
        if (a.element == "label") {
            if (!b.get("id")) {
                b.set("id", "input_" + String.uniqueID());
            }
            d.set("for", b.get("id"));
        }
        if (a.wrap) {
            this.textHolder = new Element("div.overTxtWrapper", {
                styles: {
                    lineHeight: "normal",
                    position: "relative"
                }
            }).grab(d).inject(b, "before");
        }
        return this.enable();
    },
    destroy: function () {
        this.element.eliminate(this.property);
        this.disable();
        if (this.text) {
            this.text.destroy();
        }
        if (this.textHolder) {
            this.textHolder.destroy();
        }
        return this;
    },
    disable: function () {
        this.element.removeEvents({focus: this.focus, blur: this.assert, change: this.assert});
        window.removeEvent("resize", this.reposition);
        this.hide(true, true);
        return this;
    },
    enable: function () {
        this.element.addEvents({focus: this.focus, blur: this.assert, change: this.assert});
        window.addEvent("resize", this.reposition);
        this.reposition();
        return this;
    },
    wrap: function () {
        if (this.options.element == "label") {
            if (!this.element.get("id")) {
                this.element.set("id", "input_" + String.uniqueID());
            }
            this.text.set("for", this.element.get("id"));
        }
    },
    startPolling: function () {
        this.pollingPaused = false;
        return this.poll();
    },
    poll: function (a) {
        if (this.poller && !a) {
            return this;
        }
        if (a) {
            clearInterval(this.poller);
        } else {
            this.poller = (function () {
                if (!this.pollingPaused) {
                    this.assert(true);
                }
            }).periodical(this.options.pollInterval, this);
        }
        return this;
    },
    stopPolling: function () {
        this.pollingPaused = true;
        return this.poll(true);
    },
    focus: function () {
        if (this.text && (!this.text.isDisplayed() || this.element.get("disabled"))) {
            return this;
        }
        return this.hide();
    },
    hide: function (c, a) {
        if (this.text && (this.text.isDisplayed() && (!this.element.get("disabled") || a))) {
            this.text.hide();
            this.fireEvent("textHide", [this.text, this.element]);
            this.pollingPaused = true;
            if (!c) {
                try {
                    this.element.fireEvent("focus");
                    this.element.focus();
                } catch (b) {
                }
            }
        }
        return this;
    },
    show: function () {
        if (this.text && !this.text.isDisplayed()) {
            this.text.show();
            this.reposition();
            this.fireEvent("textShow", [this.text, this.element]);
            this.pollingPaused = false;
        }
        return this;
    },
    test: function () {
        return !this.element.get("value");
    },
    assert: function (a) {
        return this[this.test() ? "show" : "hide"](a);
    },
    reposition: function () {
        this.assert(true);
        if (!this.element.isVisible()) {
            return this.stopPolling().hide();
        }
        if (this.text && this.test()) {
            this.text.position(Object.merge(this.options.positionOptions, {relativeTo: this.element}));
        }
        return this;
    }
});
OverText.instances = [];
Object.append(OverText, {
    each: function (a) {
        return OverText.instances.each(function (c, b) {
            if (c.element && c.text) {
                a.call(OverText, c, b);
            }
        });
    }, update: function () {
        return OverText.each(function (a) {
            return a.reposition();
        });
    }, hideAll: function () {
        return OverText.each(function (a) {
            return a.hide(true, true);
        });
    }, showAll: function () {
        return OverText.each(function (a) {
            return a.show();
        });
    }
});
Fx.Elements = new Class({
    Extends: Fx.CSS, initialize: function (b, a) {
        this.elements = this.subject = $$(b);
        this.parent(a);
    }, compute: function (g, h, j) {
        var c = {};
        for (var d in g) {
            var a = g[d], e = h[d], f = c[d] = {};
            for (var b in a) {
                f[b] = this.parent(a[b], e[b], j);
            }
        }
        return c;
    }, set: function (b) {
        for (var c in b) {
            if (!this.elements[c]) {
                continue;
            }
            var a = b[c];
            for (var d in a) {
                this.render(this.elements[c], d, a[d], this.options.unit);
            }
        }
        return this;
    }, start: function (c) {
        if (!this.check(c)) {
            return this;
        }
        var h = {}, j = {};
        for (var d in c) {
            if (!this.elements[d]) {
                continue;
            }
            var f = c[d], a = h[d] = {}, g = j[d] = {};
            for (var b in f) {
                var e = this.prepare(this.elements[d], b, f[b]);
                a[b] = e.from;
                g[b] = e.to;
            }
        }
        return this.parent(h, j);
    }
});
Fx.Accordion = new Class({
    Extends: Fx.Elements,
    options: {
        fixedHeight: false,
        fixedWidth: false,
        display: 0,
        show: false,
        height: true,
        width: false,
        opacity: true,
        alwaysHide: false,
        trigger: "click",
        initialDisplayFx: true,
        resetHeight: true
    },
    initialize: function () {
        var g = function (h) {
            return h != null;
        };
        var f = Array.link(arguments, {container: Type.isElement, options: Type.isObject, togglers: g, elements: g});
        this.parent(f.elements, f.options);
        var b = this.options, e = this.togglers = $$(f.togglers);
        this.previous = -1;
        this.internalChain = new Chain();
        if (b.alwaysHide) {
            this.options.link = "chain";
        }
        if (b.show || this.options.show === 0) {
            b.display = false;
            this.previous = b.show;
        }
        if (b.start) {
            b.display = false;
            b.show = false;
        }
        var d = this.effects = {};
        if (b.opacity) {
            d.opacity = "fullOpacity";
        }
        if (b.width) {
            d.width = b.fixedWidth ? "fullWidth" : "offsetWidth";
        }
        if (b.height) {
            d.height = b.fixedHeight ? "fullHeight" : "scrollHeight";
        }
        for (var c = 0, a = e.length; c < a; c++) {
            this.addSection(e[c], this.elements[c]);
        }
        this.elements.each(function (j, h) {
            if (b.show === h) {
                this.fireEvent("active", [e[h], j]);
            } else {
                for (var k in d) {
                    j.setStyle(k, 0);
                }
            }
        }, this);
        if (b.display || b.display === 0 || b.initialDisplayFx === false) {
            this.display(b.display, b.initialDisplayFx);
        }
        if (b.fixedHeight !== false) {
            b.resetHeight = false;
        }
        this.addEvent("complete", this.internalChain.callChain.bind(this.internalChain));
    },
    addSection: function (g, d) {
        g = document.id(g);
        d = document.id(d);
        this.togglers.include(g);
        this.elements.include(d);
        var f = this.togglers, c = this.options, h = f.contains(g), a = f.indexOf(g), b = this.display.pass(a, this);
        g.store("accordion:display", b).addEvent(c.trigger, b);
        if (c.height) {
            d.setStyles({"padding-top": 0, "border-top": "none", "padding-bottom": 0, "border-bottom": "none"});
        }
        if (c.width) {
            d.setStyles({"padding-left": 0, "border-left": "none", "padding-right": 0, "border-right": "none"});
        }
        d.fullOpacity = 1;
        if (c.fixedWidth) {
            d.fullWidth = c.fixedWidth;
        }
        if (c.fixedHeight) {
            d.fullHeight = c.fixedHeight;
        }
        d.setStyle("overflow", "hidden");
        if (!h) {
            for (var e in this.effects) {
                d.setStyle(e, 0);
            }
        }
        return this;
    },
    removeSection: function (f, b) {
        var e = this.togglers, a = e.indexOf(f), c = this.elements[a];
        var d = function () {
            e.erase(f);
            this.elements.erase(c);
            this.detach(f);
        }.bind(this);
        if (this.now == a || b != null) {
            this.display(b != null ? b : (a - 1 >= 0 ? a - 1 : 0)).chain(d);
        } else {
            d();
        }
        return this;
    },
    detach: function (b) {
        var a = function (c) {
            c.removeEvent(this.options.trigger, c.retrieve("accordion:display"));
        }.bind(this);
        if (!b) {
            this.togglers.each(a);
        } else {
            a(b);
        }
        return this;
    },
    display: function (b, c) {
        if (!this.check(b, c)) {
            return this;
        }
        var h = {}, g = this.elements, a = this.options, f = this.effects;
        if (c == null) {
            c = true;
        }
        if (typeOf(b) == "element") {
            b = g.indexOf(b);
        }
        if (b == this.previous && !a.alwaysHide) {
            return this;
        }
        if (a.resetHeight) {
            var e = g[this.previous];
            if (e && !this.selfHidden) {
                for (var d in f) {
                    e.setStyle(d, e[f[d]]);
                }
            }
        }
        if ((this.timer && a.link == "chain") || (b === this.previous && !a.alwaysHide)) {
            return this;
        }
        this.previous = b;
        this.selfHidden = false;
        g.each(function (l, k) {
            h[k] = {};
            var j;
            if (k != b) {
                j = true;
            } else {
                if (a.alwaysHide && ((l.offsetHeight > 0 && a.height) || l.offsetWidth > 0 && a.width)) {
                    j = true;
                    this.selfHidden = true;
                }
            }
            this.fireEvent(j ? "background" : "active", [this.togglers[k], l]);
            for (var m in f) {
                h[k][m] = j ? 0 : l[f[m]];
            }
            if (!c && !j && a.resetHeight) {
                h[k].height = "auto";
            }
        }, this);
        this.internalChain.clearChain();
        this.internalChain.chain(function () {
            if (a.resetHeight && !this.selfHidden) {
                var i = g[b];
                if (i) {
                    i.setStyle("height", "auto");
                }
            }
        }.bind(this));
        return c ? this.start(h) : this.set(h).internalChain.callChain();
    }
});
Fx.Move = new Class({
    Extends: Fx.Morph,
    options: {relativeTo: document.body, position: "center", edge: false, offset: {x: 0, y: 0}},
    start: function (a) {
        var b = this.element, c = b.getStyles("top", "left");
        if (c.top == "auto" || c.left == "auto") {
            b.setPosition(b.getPosition(b.getOffsetParent()));
        }
        return this.parent(b.position(Object.merge({}, this.options, a, {returnPos: true})));
    }
});
Element.Properties.move = {
    set: function (a) {
        this.get("move").cancel().setOptions(a);
        return this;
    }, get: function () {
        var a = this.retrieve("move");
        if (!a) {
            a = new Fx.Move(this, {link: "cancel"});
            this.store("move", a);
        }
        return a;
    }
};
Element.implement({
    move: function (a) {
        this.get("move").start(a);
        return this;
    }
});
(function () {
    Fx.Scroll = new Class({
        Extends: Fx, options: {offset: {x: 0, y: 0}, wheelStops: true}, initialize: function (c, b) {
            this.element = this.subject = document.id(c);
            this.parent(b);
            if (typeOf(this.element) != "element") {
                this.element = document.id(this.element.getDocument().body);
            }
            if (this.options.wheelStops) {
                var d = this.element, e = this.cancel.pass(false, this);
                this.addEvent("start", function () {
                    d.addEvent("mousewheel", e);
                }, true);
                this.addEvent("complete", function () {
                    d.removeEvent("mousewheel", e);
                }, true);
            }
        }, set: function () {
            var b = Array.flatten(arguments);
            if (Browser.firefox) {
                b = [Math.round(b[0]), Math.round(b[1])];
            }
            this.element.scrollTo(b[0], b[1]);
            return this;
        }, compute: function (d, c, b) {
            return [0, 1].map(function (e) {
                return Fx.compute(d[e], c[e], b);
            });
        }, start: function (c, d) {
            if (!this.check(c, d)) {
                return this;
            }
            var b = this.element.getScroll();
            return this.parent([b.x, b.y], [c, d]);
        }, calculateScroll: function (g, f) {
            var d = this.element, b = d.getScrollSize(), h = d.getScroll(), j = d.getSize(), c = this.options.offset, i = {
                x: g,
                y: f
            };
            for (var e in i) {
                if (!i[e] && i[e] !== 0) {
                    i[e] = h[e];
                }
                if (typeOf(i[e]) != "number") {
                    i[e] = b[e] - j[e];
                }
                i[e] += c[e];
            }
            return [i.x, i.y];
        }, toTop: function () {
            return this.start.apply(this, this.calculateScroll(false, 0));
        }, toLeft: function () {
            return this.start.apply(this, this.calculateScroll(0, false));
        }, toRight: function () {
            return this.start.apply(this, this.calculateScroll("right", false));
        }, toBottom: function () {
            return this.start.apply(this, this.calculateScroll(false, "bottom"));
        }, toElement: function (d, e) {
            e = e ? Array.from(e) : ["x", "y"];
            var c = a(this.element) ? {x: 0, y: 0} : this.element.getScroll();
            var b = Object.map(document.id(d).getPosition(this.element), function (g, f) {
                return e.contains(f) ? g + c[f] : false;
            });
            return this.start.apply(this, this.calculateScroll(b.x, b.y));
        }, toElementEdge: function (d, g, e) {
            g = g ? Array.from(g) : ["x", "y"];
            d = document.id(d);
            var i = {}, f = d.getPosition(this.element), j = d.getSize(), h = this.element.getScroll(), b = this.element.getSize(), c = {
                x: f.x + j.x,
                y: f.y + j.y
            };
            ["x", "y"].each(function (k) {
                if (g.contains(k)) {
                    if (c[k] > h[k] + b[k]) {
                        i[k] = c[k] - b[k];
                    }
                    if (f[k] < h[k]) {
                        i[k] = f[k];
                    }
                }
                if (i[k] == null) {
                    i[k] = h[k];
                }
                if (e && e[k]) {
                    i[k] = i[k] + e[k];
                }
            }, this);
            if (i.x != h.x || i.y != h.y) {
                this.start(i.x, i.y);
            }
            return this;
        }, toElementCenter: function (e, f, h) {
            f = f ? Array.from(f) : ["x", "y"];
            e = document.id(e);
            var i = {}, c = e.getPosition(this.element), d = e.getSize(), b = this.element.getScroll(), g = this.element.getSize();
            ["x", "y"].each(function (j) {
                if (f.contains(j)) {
                    i[j] = c[j] - (g[j] - d[j]) / 2;
                }
                if (i[j] == null) {
                    i[j] = b[j];
                }
                if (h && h[j]) {
                    i[j] = i[j] + h[j];
                }
            }, this);
            if (i.x != b.x || i.y != b.y) {
                this.start(i.x, i.y);
            }
            return this;
        }
    });
    function a(b) {
        return (/^(?:body|html)$/i).test(b.tagName);
    }
})();
Fx.Slide = new Class({
    Extends: Fx,
    options: {mode: "vertical", wrapper: false, hideOverflow: true, resetHeight: false},
    initialize: function (b, a) {
        b = this.element = this.subject = document.id(b);
        this.parent(a);
        a = this.options;
        var d = b.retrieve("wrapper"), c = b.getStyles("margin", "position", "overflow");
        if (a.hideOverflow) {
            c = Object.append(c, {overflow: "hidden"});
        }
        if (a.wrapper) {
            d = document.id(a.wrapper).setStyles(c);
        }
        if (!d) {
            d = new Element("div", {styles: c}).wraps(b);
        }
        b.store("wrapper", d).setStyle("margin", 0);
        if (b.getStyle("overflow") == "visible") {
            b.setStyle("overflow", "hidden");
        }
        this.now = [];
        this.open = true;
        this.wrapper = d;
        this.addEvent("complete", function () {
            this.open = (d["offset" + this.layout.capitalize()] != 0);
            if (this.open && this.options.resetHeight) {
                d.setStyle("height", "");
            }
        }, true);
    },
    vertical: function () {
        this.margin = "margin-top";
        this.layout = "height";
        this.offset = this.element.offsetHeight;
    },
    horizontal: function () {
        this.margin = "margin-left";
        this.layout = "width";
        this.offset = this.element.offsetWidth;
    },
    set: function (a) {
        this.element.setStyle(this.margin, a[0]);
        this.wrapper.setStyle(this.layout, a[1]);
        return this;
    },
    compute: function (c, b, a) {
        return [0, 1].map(function (d) {
            return Fx.compute(c[d], b[d], a);
        });
    },
    start: function (b, e) {
        if (!this.check(b, e)) {
            return this;
        }
        this[e || this.options.mode]();
        var d = this.element.getStyle(this.margin).toInt(), c = this.wrapper.getStyle(this.layout).toInt(), a = [[d, c], [0, this.offset]], g = [[d, c], [-this.offset, 0]], f;
        switch (b) {
            case"in":
                f = a;
                break;
            case"out":
                f = g;
                break;
            case"toggle":
                f = (c == 0) ? a : g;
        }
        return this.parent(f[0], f[1]);
    },
    slideIn: function (a) {
        return this.start("in", a);
    },
    slideOut: function (a) {
        return this.start("out", a);
    },
    hide: function (a) {
        this[a || this.options.mode]();
        this.open = false;
        return this.set([-this.offset, 0]);
    },
    show: function (a) {
        this[a || this.options.mode]();
        this.open = true;
        return this.set([0, this.offset]);
    },
    toggle: function (a) {
        return this.start("toggle", a);
    }
});
Element.Properties.slide = {
    set: function (a) {
        this.get("slide").cancel().setOptions(a);
        return this;
    }, get: function () {
        var a = this.retrieve("slide");
        if (!a) {
            a = new Fx.Slide(this, {link: "cancel"});
            this.store("slide", a);
        }
        return a;
    }
};
Element.implement({
    slide: function (d, e) {
        d = d || "toggle";
        var b = this.get("slide"), a;
        switch (d) {
            case"hide":
                b.hide(e);
                break;
            case"show":
                b.show(e);
                break;
            case"toggle":
                var c = this.retrieve("slide:flag", b.open);
                b[c ? "slideOut" : "slideIn"](e);
                this.store("slide:flag", !c);
                a = true;
                break;
            default:
                b.start(d, e);
        }
        if (!a) {
            this.eliminate("slide:flag");
        }
        return this;
    }
});
Fx.SmoothScroll = new Class({
    Extends: Fx.Scroll, options: {axes: ["x", "y"]}, initialize: function (c, d) {
        d = d || document;
        this.doc = d.getDocument();
        this.parent(this.doc, c);
        var e = d.getWindow(), a = e.location.href.match(/^[^#]*/)[0] + "#", b = $$(this.options.links || this.doc.links);
        b.each(function (g) {
            if (g.href.indexOf(a) != 0) {
                return;
            }
            var f = g.href.substr(a.length);
            if (f) {
                this.useLink(g, f);
            }
        }, this);
        this.addEvent("complete", function () {
            e.location.hash = this.anchor;
            this.element.scrollTo(this.to[0], this.to[1]);
        }, true);
    }, useLink: function (b, a) {
        b.addEvent("click", function (d) {
            var c = document.id(a) || this.doc.getElement("a[name=" + a + "]");
            if (!c) {
                return;
            }
            d.preventDefault();
            this.toElement(c, this.options.axes).chain(function () {
                this.fireEvent("scrolledTo", [b, c]);
            }.bind(this));
            this.anchor = a;
        }.bind(this));
        return this;
    }
});
Fx.Sort = new Class({
    Extends: Fx.Elements, options: {mode: "vertical"}, initialize: function (b, a) {
        this.parent(b, a);
        this.elements.each(function (c) {
            if (c.getStyle("position") == "static") {
                c.setStyle("position", "relative");
            }
        });
        this.setDefaultOrder();
    }, setDefaultOrder: function () {
        this.currentOrder = this.elements.map(function (b, a) {
            return a;
        });
    }, sort: function () {
        if (!this.check(arguments)) {
            return this;
        }
        var e = Array.flatten(arguments);
        var i = 0, a = 0, c = {}, h = {}, d = this.options.mode == "vertical";
        var f = this.elements.map(function (m, k) {
            var l = m.getComputedSize({styles: ["border", "padding", "margin"]});
            var n;
            if (d) {
                n = {top: i, margin: l["margin-top"], height: l.totalHeight};
                i += n.height - l["margin-top"];
            } else {
                n = {left: a, margin: l["margin-left"], width: l.totalWidth};
                a += n.width;
            }
            var j = d ? "top" : "left";
            h[k] = {};
            var o = m.getStyle(j).toInt();
            h[k][j] = o || 0;
            return n;
        }, this);
        this.set(h);
        e = e.map(function (j) {
            return j.toInt();
        });
        if (e.length != this.elements.length) {
            this.currentOrder.each(function (j) {
                if (!e.contains(j)) {
                    e.push(j);
                }
            });
            if (e.length > this.elements.length) {
                e.splice(this.elements.length - 1, e.length - this.elements.length);
            }
        }
        var b = 0;
        i = a = 0;
        e.each(function (k) {
            var j = {};
            if (d) {
                j.top = i - f[k].top - b;
                i += f[k].height;
            } else {
                j.left = a - f[k].left;
                a += f[k].width;
            }
            b = b + f[k].margin;
            c[k] = j;
        }, this);
        var g = {};
        Array.clone(e).sort().each(function (j) {
            g[j] = c[j];
        });
        this.start(g);
        this.currentOrder = e;
        return this;
    }, rearrangeDOM: function (a) {
        a = a || this.currentOrder;
        var b = this.elements[0].getParent();
        var c = [];
        this.elements.setStyle("opacity", 0);
        a.each(function (d) {
            c.push(this.elements[d].inject(b).setStyles({top: 0, left: 0}));
        }, this);
        this.elements.setStyle("opacity", 1);
        this.elements = $$(c);
        this.setDefaultOrder();
        return this;
    }, getDefaultOrder: function () {
        return this.elements.map(function (b, a) {
            return a;
        });
    }, getCurrentOrder: function () {
        return this.currentOrder;
    }, forward: function () {
        return this.sort(this.getDefaultOrder());
    }, backward: function () {
        return this.sort(this.getDefaultOrder().reverse());
    }, reverse: function () {
        return this.sort(this.currentOrder.reverse());
    }, sortByElements: function (a) {
        return this.sort(a.map(function (b) {
            return this.elements.indexOf(b);
        }, this));
    }, swap: function (c, b) {
        if (typeOf(c) == "element") {
            c = this.elements.indexOf(c);
        }
        if (typeOf(b) == "element") {
            b = this.elements.indexOf(b);
        }
        var a = Array.clone(this.currentOrder);
        a[this.currentOrder.indexOf(c)] = b;
        a[this.currentOrder.indexOf(b)] = c;
        return this.sort(a);
    }
});
var Drag = new Class({
    Implements: [Events, Options],
    options: {
        snap: 6,
        unit: "px",
        grid: false,
        style: true,
        limit: false,
        handle: false,
        invert: false,
        preventDefault: false,
        stopPropagation: false,
        modifiers: {x: "left", y: "top"}
    },
    initialize: function () {
        var b = Array.link(arguments, {
            options: Type.isObject, element: function (c) {
                return c != null;
            }
        });
        this.element = document.id(b.element);
        this.document = this.element.getDocument();
        this.setOptions(b.options || {});
        var a = typeOf(this.options.handle);
        this.handles = ((a == "array" || a == "collection") ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
        this.mouse = {now: {}, pos: {}};
        this.value = {start: {}, now: {}};
        this.selection = (Browser.ie) ? "selectstart" : "mousedown";
        if (Browser.ie && !Drag.ondragstartFixed) {
            document.ondragstart = Function.from(false);
            Drag.ondragstartFixed = true;
        }
        this.bound = {
            start: this.start.bind(this),
            check: this.check.bind(this),
            drag: this.drag.bind(this),
            stop: this.stop.bind(this),
            cancel: this.cancel.bind(this),
            eventStop: Function.from(false)
        };
        this.attach();
    },
    attach: function () {
        this.handles.addEvent("mousedown", this.bound.start);
        return this;
    },
    detach: function () {
        this.handles.removeEvent("mousedown", this.bound.start);
        return this;
    },
    start: function (a) {
        var j = this.options;
        if (a.rightClick) {
            return;
        }
        if (j.preventDefault) {
            a.preventDefault();
        }
        if (j.stopPropagation) {
            a.stopPropagation();
        }
        this.mouse.start = a.page;
        this.fireEvent("beforeStart", this.element);
        var c = j.limit;
        this.limit = {x: [], y: []};
        var e, g;
        for (e in j.modifiers) {
            if (!j.modifiers[e]) {
                continue;
            }
            var b = this.element.getStyle(j.modifiers[e]);
            if (b && !b.match(/px$/)) {
                if (!g) {
                    g = this.element.getCoordinates(this.element.getOffsetParent());
                }
                b = g[j.modifiers[e]];
            }
            if (j.style) {
                this.value.now[e] = (b || 0).toInt();
            } else {
                this.value.now[e] = this.element[j.modifiers[e]];
            }
            if (j.invert) {
                this.value.now[e] *= -1;
            }
            this.mouse.pos[e] = a.page[e] - this.value.now[e];
            if (c && c[e]) {
                var d = 2;
                while (d--) {
                    var f = c[e][d];
                    if (f || f === 0) {
                        this.limit[e][d] = (typeof f == "function") ? f() : f;
                    }
                }
            }
        }
        if (typeOf(this.options.grid) == "number") {
            this.options.grid = {x: this.options.grid, y: this.options.grid};
        }
        var h = {mousemove: this.bound.check, mouseup: this.bound.cancel};
        h[this.selection] = this.bound.eventStop;
        this.document.addEvents(h);
    },
    check: function (a) {
        if (this.options.preventDefault) {
            a.preventDefault();
        }
        var b = Math.round(Math.sqrt(Math.pow(a.page.x - this.mouse.start.x, 2) + Math.pow(a.page.y - this.mouse.start.y, 2)));
        if (b > this.options.snap) {
            this.cancel();
            this.document.addEvents({mousemove: this.bound.drag, mouseup: this.bound.stop});
            this.fireEvent("start", [this.element, a]).fireEvent("snap", this.element);
        }
    },
    drag: function (b) {
        var a = this.options;
        if (a.preventDefault) {
            b.preventDefault();
        }
        this.mouse.now = b.page;
        for (var c in a.modifiers) {
            if (!a.modifiers[c]) {
                continue;
            }
            this.value.now[c] = this.mouse.now[c] - this.mouse.pos[c];
            if (a.invert) {
                this.value.now[c] *= -1;
            }
            if (a.limit && this.limit[c]) {
                if ((this.limit[c][1] || this.limit[c][1] === 0) && (this.value.now[c] > this.limit[c][1])) {
                    this.value.now[c] = this.limit[c][1];
                } else {
                    if ((this.limit[c][0] || this.limit[c][0] === 0) && (this.value.now[c] < this.limit[c][0])) {
                        this.value.now[c] = this.limit[c][0];
                    }
                }
            }
            if (a.grid[c]) {
                this.value.now[c] -= ((this.value.now[c] - (this.limit[c][0] || 0)) % a.grid[c]);
            }
            if (a.style) {
                this.element.setStyle(a.modifiers[c], this.value.now[c] + a.unit);
            } else {
                this.element[a.modifiers[c]] = this.value.now[c];
            }
        }
        this.fireEvent("drag", [this.element, b]);
    },
    cancel: function (a) {
        this.document.removeEvents({mousemove: this.bound.check, mouseup: this.bound.cancel});
        if (a) {
            this.document.removeEvent(this.selection, this.bound.eventStop);
            this.fireEvent("cancel", this.element);
        }
    },
    stop: function (b) {
        var a = {mousemove: this.bound.drag, mouseup: this.bound.stop};
        a[this.selection] = this.bound.eventStop;
        this.document.removeEvents(a);
        if (b) {
            this.fireEvent("complete", [this.element, b]);
        }
    }
});
Element.implement({
    makeResizable: function (a) {
        var b = new Drag(this, Object.merge({modifiers: {x: "width", y: "height"}}, a));
        this.store("resizer", b);
        return b.addEvent("drag", function () {
            this.fireEvent("resize", b);
        }.bind(this));
    }
});
Drag.Move = new Class({
    Extends: Drag,
    options: {droppables: [], container: false, precalculate: false, includeMargins: true, checkDroppables: true},
    initialize: function (b, a) {
        this.parent(b, a);
        b = this.element;
        this.droppables = $$(this.options.droppables);
        this.container = document.id(this.options.container);
        if (this.container && typeOf(this.container) != "element") {
            this.container = document.id(this.container.getDocument().body);
        }
        if (this.options.style) {
            if (this.options.modifiers.x == "left" && this.options.modifiers.y == "top") {
                var c = b.getOffsetParent(), d = b.getStyles("left", "top");
                if (c && (d.left == "auto" || d.top == "auto")) {
                    b.setPosition(b.getPosition(c));
                }
            }
            if (b.getStyle("position") == "static") {
                b.setStyle("position", "absolute");
            }
        }
        this.addEvent("start", this.checkDroppables, true);
        this.overed = null;
    },
    start: function (a) {
        if (this.container) {
            this.options.limit = this.calculateLimit();
        }
        if (this.options.precalculate) {
            this.positions = this.droppables.map(function (b) {
                return b.getCoordinates();
            });
        }
        this.parent(a);
    },
    calculateLimit: function () {
        var j = this.element, e = this.container, d = document.id(j.getOffsetParent()) || document.body, h = e.getCoordinates(d), c = {}, b = {}, k = {}, g = {}, m = {};
        ["top", "right", "bottom", "left"].each(function (q) {
            c[q] = j.getStyle("margin-" + q).toInt();
            b[q] = j.getStyle("border-" + q).toInt();
            k[q] = e.getStyle("margin-" + q).toInt();
            g[q] = e.getStyle("border-" + q).toInt();
            m[q] = d.getStyle("padding-" + q).toInt();
        }, this);
        var f = j.offsetWidth + c.left + c.right, p = j.offsetHeight + c.top + c.bottom, i = 0, l = 0, o = h.right - g.right - f, a = h.bottom - g.bottom - p;
        if (this.options.includeMargins) {
            i += c.left;
            l += c.top;
        } else {
            o += c.right;
            a += c.bottom;
        }
        if (j.getStyle("position") == "relative") {
            var n = j.getCoordinates(d);
            n.left -= j.getStyle("left").toInt();
            n.top -= j.getStyle("top").toInt();
            i -= n.left;
            l -= n.top;
            if (e.getStyle("position") != "relative") {
                i += g.left;
                l += g.top;
            }
            o += c.left - n.left;
            a += c.top - n.top;
            if (e != d) {
                i += k.left + m.left;
                l += ((Browser.ie6 || Browser.ie7) ? 0 : k.top) + m.top;
            }
        } else {
            i -= c.left;
            l -= c.top;
            if (e != d) {
                i += h.left + g.left;
                l += h.top + g.top;
            }
        }
        return {x: [i, o], y: [l, a]};
    },
    getDroppableCoordinates: function (c) {
        var b = c.getCoordinates();
        if (c.getStyle("position") == "fixed") {
            var a = window.getScroll();
            b.left += a.x;
            b.right += a.x;
            b.top += a.y;
            b.bottom += a.y;
        }
        return b;
    },
    checkDroppables: function () {
        var a = this.droppables.filter(function (d, c) {
            d = this.positions ? this.positions[c] : this.getDroppableCoordinates(d);
            var b = this.mouse.now;
            return (b.x > d.left && b.x < d.right && b.y < d.bottom && b.y > d.top);
        }, this).getLast();
        if (this.overed != a) {
            if (this.overed) {
                this.fireEvent("leave", [this.element, this.overed]);
            }
            if (a) {
                this.fireEvent("enter", [this.element, a]);
            }
            this.overed = a;
        }
    },
    drag: function (a) {
        this.parent(a);
        if (this.options.checkDroppables && this.droppables.length) {
            this.checkDroppables();
        }
    },
    stop: function (a) {
        this.checkDroppables();
        this.fireEvent("drop", [this.element, this.overed, a]);
        this.overed = null;
        return this.parent(a);
    }
});
Element.implement({
    makeDraggable: function (a) {
        var b = new Drag.Move(this, a);
        this.store("dragger", b);
        return b;
    }
});
var Slider = new Class({
    Implements: [Events, Options], Binds: ["clickedElement", "draggedKnob", "scrolledElement"], options: {
        onTick: function (a) {
            this.setKnobPosition(a);
        }, initialStep: 0, snap: false, offset: 0, range: false, wheel: false, steps: 100, mode: "horizontal"
    }, initialize: function (f, a, e) {
        this.setOptions(e);
        e = this.options;
        this.element = document.id(f);
        a = this.knob = document.id(a);
        this.previousChange = this.previousEnd = this.step = -1;
        var b = {}, d = {x: false, y: false};
        switch (e.mode) {
            case"vertical":
                this.axis = "y";
                this.property = "top";
                this.offset = "offsetHeight";
                break;
            case"horizontal":
                this.axis = "x";
                this.property = "left";
                this.offset = "offsetWidth";
        }
        this.setSliderDimensions();
        this.setRange(e.range);
        if (a.getStyle("position") == "static") {
            a.setStyle("position", "relative");
        }
        a.setStyle(this.property, -e.offset);
        d[this.axis] = this.property;
        b[this.axis] = [-e.offset, this.full - e.offset];
        var c = {
            snap: 0,
            limit: b,
            modifiers: d,
            onDrag: this.draggedKnob,
            onStart: this.draggedKnob,
            onBeforeStart: (function () {
                this.isDragging = true;
            }).bind(this),
            onCancel: function () {
                this.isDragging = false;
            }.bind(this),
            onComplete: function () {
                this.isDragging = false;
                this.draggedKnob();
                this.end();
            }.bind(this)
        };
        if (e.snap) {
            this.setSnap(c);
        }
        this.drag = new Drag(a, c);
        this.attach();
        if (e.initialStep != null) {
            this.set(e.initialStep);
        }
    }, attach: function () {
        this.element.addEvent("mousedown", this.clickedElement);
        if (this.options.wheel) {
            this.element.addEvent("mousewheel", this.scrolledElement);
        }
        this.drag.attach();
        return this;
    }, detach: function () {
        this.element.removeEvent("mousedown", this.clickedElement).removeEvent("mousewheel", this.scrolledElement);
        this.drag.detach();
        return this;
    }, autosize: function () {
        this.setSliderDimensions().setKnobPosition(this.toPosition(this.step));
        this.drag.options.limit[this.axis] = [-this.options.offset, this.full - this.options.offset];
        if (this.options.snap) {
            this.setSnap();
        }
        return this;
    }, setSnap: function (a) {
        if (!a) {
            a = this.drag.options;
        }
        a.grid = Math.ceil(this.stepWidth);
        a.limit[this.axis][1] = this.full;
        return this;
    }, setKnobPosition: function (a) {
        if (this.options.snap) {
            a = this.toPosition(this.step);
        }
        this.knob.setStyle(this.property, a);
        return this;
    }, setSliderDimensions: function () {
        this.full = this.element.measure(function () {
            this.half = this.knob[this.offset] / 2;
            return this.element[this.offset] - this.knob[this.offset] + (this.options.offset * 2);
        }.bind(this));
        return this;
    }, set: function (a) {
        if (!((this.range > 0) ^ (a < this.min))) {
            a = this.min;
        }
        if (!((this.range > 0) ^ (a > this.max))) {
            a = this.max;
        }
        this.step = Math.round(a);
        return this.checkStep().fireEvent("tick", this.toPosition(this.step)).end();
    }, setRange: function (a, b) {
        this.min = Array.pick([a[0], 0]);
        this.max = Array.pick([a[1], this.options.steps]);
        this.range = this.max - this.min;
        this.steps = this.options.steps || this.full;
        this.stepSize = Math.abs(this.range) / this.steps;
        this.stepWidth = this.stepSize * this.full / Math.abs(this.range);
        if (a) {
            this.set(Array.pick([b, this.step]).floor(this.min).max(this.max));
        }
        return this;
    }, clickedElement: function (c) {
        if (this.isDragging || c.target == this.knob) {
            return;
        }
        var b = this.range < 0 ? -1 : 1, a = c.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
        a = a.limit(-this.options.offset, this.full - this.options.offset);
        this.step = Math.round(this.min + b * this.toStep(a));
        this.checkStep().fireEvent("tick", a).end();
    }, scrolledElement: function (a) {
        var b = (this.options.mode == "horizontal") ? (a.wheel < 0) : (a.wheel > 0);
        this.set(this.step + (b ? -1 : 1) * this.stepSize);
        a.stop();
    }, draggedKnob: function () {
        var b = this.range < 0 ? -1 : 1, a = this.drag.value.now[this.axis];
        a = a.limit(-this.options.offset, this.full - this.options.offset);
        this.step = Math.round(this.min + b * this.toStep(a));
        this.checkStep();
    }, checkStep: function () {
        var a = this.step;
        if (this.previousChange != a) {
            this.previousChange = a;
            this.fireEvent("change", a);
        }
        return this;
    }, end: function () {
        var a = this.step;
        if (this.previousEnd !== a) {
            this.previousEnd = a;
            this.fireEvent("complete", a + "");
        }
        return this;
    }, toStep: function (a) {
        var b = (a + this.options.offset) * this.stepSize / this.full * this.steps;
        return this.options.steps ? Math.round(b -= b % this.stepSize) : b;
    }, toPosition: function (a) {
        return (this.full * Math.abs(this.min - a)) / (this.steps * this.stepSize) - this.options.offset;
    }
});
var Sortables = new Class({
    Implements: [Events, Options],
    options: {opacity: 1, clone: false, revert: false, handle: false, dragOptions: {}},
    initialize: function (a, b) {
        this.setOptions(b);
        this.elements = [];
        this.lists = [];
        this.idle = true;
        this.addLists($$(document.id(a) || a));
        if (!this.options.clone) {
            this.options.revert = false;
        }
        if (this.options.revert) {
            this.effect = new Fx.Morph(null, Object.merge({duration: 250, link: "cancel"}, this.options.revert));
        }
    },
    attach: function () {
        this.addLists(this.lists);
        return this;
    },
    detach: function () {
        this.lists = this.removeLists(this.lists);
        return this;
    },
    addItems: function () {
        Array.flatten(arguments).each(function (a) {
            this.elements.push(a);
            var b = a.retrieve("sortables:start", function (c) {
                this.start.call(this, c, a);
            }.bind(this));
            (this.options.handle ? a.getElement(this.options.handle) || a : a).addEvent("mousedown", b);
        }, this);
        return this;
    },
    addLists: function () {
        Array.flatten(arguments).each(function (a) {
            this.lists.include(a);
            this.addItems(a.getChildren());
        }, this);
        return this;
    },
    removeItems: function () {
        return $$(Array.flatten(arguments).map(function (a) {
            this.elements.erase(a);
            var b = a.retrieve("sortables:start");
            (this.options.handle ? a.getElement(this.options.handle) || a : a).removeEvent("mousedown", b);
            return a;
        }, this));
    },
    removeLists: function () {
        return $$(Array.flatten(arguments).map(function (a) {
            this.lists.erase(a);
            this.removeItems(a.getChildren());
            return a;
        }, this));
    },
    getClone: function (b, a) {
        if (!this.options.clone) {
            return new Element(a.tagName).inject(document.body);
        }
        if (typeOf(this.options.clone) == "function") {
            return this.options.clone.call(this, b, a, this.list);
        }
        var c = a.clone(true).setStyles({
            margin: 0,
            position: "absolute",
            visibility: "hidden",
            width: a.getStyle("width")
        }).addEvent("mousedown", function (d) {
            a.fireEvent("mousedown", d);
        });
        if (c.get("html").test("radio")) {
            c.getElements("input[type=radio]").each(function (d, e) {
                d.set("name", "clone_" + e);
                if (d.get("checked")) {
                    a.getElements("input[type=radio]")[e].set("checked", true);
                }
            });
        }
        return c.inject(this.list).setPosition(a.getPosition(a.getOffsetParent()));
    },
    getDroppables: function () {
        var a = this.list.getChildren().erase(this.clone).erase(this.element);
        if (!this.options.constrain) {
            a.append(this.lists).erase(this.list);
        }
        return a;
    },
    insert: function (c, b) {
        var a = "inside";
        if (this.lists.contains(b)) {
            this.list = b;
            this.drag.droppables = this.getDroppables();
        } else {
            a = this.element.getAllPrevious().contains(b) ? "before" : "after";
        }
        this.element.inject(b, a);
        this.fireEvent("sort", [this.element, this.clone]);
    },
    start: function (b, a) {
        if (!this.idle || b.rightClick || ["button", "input", "a", "textarea"].contains(b.target.get("tag"))) {
            return;
        }
        this.idle = false;
        this.element = a;
        this.opacity = a.getStyle("opacity");
        this.list = a.getParent();
        this.clone = this.getClone(b, a);
        this.drag = new Drag.Move(this.clone, Object.merge({droppables: this.getDroppables()}, this.options.dragOptions)).addEvents({
            onSnap: function () {
                b.stop();
                this.clone.setStyle("visibility", "visible");
                this.element.setStyle("opacity", this.options.opacity || 0);
                this.fireEvent("start", [this.element, this.clone]);
            }.bind(this),
            onEnter: this.insert.bind(this),
            onCancel: this.end.bind(this),
            onComplete: this.end.bind(this)
        });
        this.clone.inject(this.element, "before");
        this.drag.start(b);
    },
    end: function () {
        this.drag.detach();
        this.element.setStyle("opacity", this.opacity);
        if (this.effect) {
            var b = this.element.getStyles("width", "height"), d = this.clone, c = d.computePosition(this.element.getPosition(this.clone.getOffsetParent()));
            var a = function () {
                this.removeEvent("cancel", a);
                d.destroy();
            };
            this.effect.element = d;
            this.effect.start({
                top: c.top,
                left: c.left,
                width: b.width,
                height: b.height,
                opacity: 0.25
            }).addEvent("cancel", a).chain(a);
        } else {
            this.clone.destroy();
        }
        this.reset();
    },
    reset: function () {
        this.idle = true;
        this.fireEvent("complete", this.element);
    },
    serialize: function () {
        var c = Array.link(arguments, {
            modifier: Type.isFunction, index: function (d) {
                return d != null;
            }
        });
        var b = this.lists.map(function (d) {
            return d.getChildren().map(c.modifier || function (e) {
                return e.get("id");
            }, this);
        }, this);
        var a = c.index;
        if (this.lists.length == 1) {
            a = 0;
        }
        return (a || a === 0) && a >= 0 && a < this.lists.length ? b[a] : b;
    }
});
Request.JSONP = new Class({
    Implements: [Chain, Events, Options], options: {
        onRequest: function (a) {
            if (this.options.log && window.console && console.log) {
                console.log("JSONP retrieving script with url:" + a);
            }
        },
        onError: function (a) {
            if (this.options.log && window.console && console.warn) {
                console.warn("JSONP " + a + " will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs");
            }
        },
        url: "",
        callbackKey: "callback",
        injectScript: document.head,
        data: "",
        link: "ignore",
        timeout: 0,
        log: false
    }, initialize: function (a) {
        this.setOptions(a);
    }, send: function (c) {
        if (!Request.prototype.check.call(this, c)) {
            return this;
        }
        this.running = true;
        var d = typeOf(c);
        if (d == "string" || d == "element") {
            c = {data: c};
        }
        c = Object.merge(this.options, c || {});
        var e = c.data;
        switch (typeOf(e)) {
            case"element":
                e = document.id(e).toQueryString();
                break;
            case"object":
            case"hash":
                e = Object.toQueryString(e);
        }
        var b = this.index = Request.JSONP.counter++;
        var f = c.url + (c.url.test("\\?") ? "&" : "?") + (c.callbackKey) + "=Request.JSONP.request_map.request_" + b + (e ? "&" + e : "");
        if (f.length > 2083) {
            this.fireEvent("error", f);
        }
        Request.JSONP.request_map["request_" + b] = function () {
            this.success(arguments, b);
        }.bind(this);
        var a = this.getScript(f).inject(c.injectScript);
        this.fireEvent("request", [f, a]);
        if (c.timeout) {
            this.timeout.delay(c.timeout, this);
        }
        return this;
    }, getScript: function (a) {
        if (!this.script) {
            this.script = new Element("script", {type: "text/javascript", async: true, src: a});
        }
        return this.script;
    }, success: function (b, a) {
        if (!this.running) {
            return;
        }
        this.clear().fireEvent("complete", b).fireEvent("success", b).callChain();
    }, cancel: function () {
        if (this.running) {
            this.clear().fireEvent("cancel");
        }
        return this;
    }, isRunning: function () {
        return !!this.running;
    }, clear: function () {
        this.running = false;
        if (this.script) {
            this.script.destroy();
            this.script = null;
        }
        return this;
    }, timeout: function () {
        if (this.running) {
            this.running = false;
            this.fireEvent("timeout", [this.script.get("src"), this.script]).fireEvent("failure").cancel();
        }
        return this;
    }
});
Request.JSONP.counter = 0;
Request.JSONP.request_map = {};
Request.Queue = new Class({
    Implements: [Options, Events],
    Binds: ["attach", "request", "complete", "cancel", "success", "failure", "exception"],
    options: {stopOnFailure: true, autoAdvance: true, concurrent: 1, requests: {}},
    initialize: function (a) {
        var b;
        if (a) {
            b = a.requests;
            delete a.requests;
        }
        this.setOptions(a);
        this.requests = {};
        this.queue = [];
        this.reqBinders = {};
        if (b) {
            this.addRequests(b);
        }
    },
    addRequest: function (a, b) {
        this.requests[a] = b;
        this.attach(a, b);
        return this;
    },
    addRequests: function (a) {
        Object.each(a, function (c, b) {
            this.addRequest(b, c);
        }, this);
        return this;
    },
    getName: function (a) {
        return Object.keyOf(this.requests, a);
    },
    attach: function (a, b) {
        if (b._groupSend) {
            return this;
        }
        ["request", "complete", "cancel", "success", "failure", "exception"].each(function (c) {
            if (!this.reqBinders[a]) {
                this.reqBinders[a] = {};
            }
            this.reqBinders[a][c] = function () {
                this["on" + c.capitalize()].apply(this, [a, b].append(arguments));
            }.bind(this);
            b.addEvent(c, this.reqBinders[a][c]);
        }, this);
        b._groupSend = b.send;
        b.send = function (c) {
            this.send(a, c);
            return b;
        }.bind(this);
        return this;
    },
    removeRequest: function (b) {
        var a = typeOf(b) == "object" ? this.getName(b) : b;
        if (!a && typeOf(a) != "string") {
            return this;
        }
        b = this.requests[a];
        if (!b) {
            return this;
        }
        ["request", "complete", "cancel", "success", "failure", "exception"].each(function (c) {
            b.removeEvent(c, this.reqBinders[a][c]);
        }, this);
        b.send = b._groupSend;
        delete b._groupSend;
        return this;
    },
    getRunning: function () {
        return Object.filter(this.requests, function (a) {
            return a.running;
        });
    },
    isRunning: function () {
        return !!(Object.keys(this.getRunning()).length);
    },
    send: function (b, a) {
        var c = function () {
            this.requests[b]._groupSend(a);
            this.queue.erase(c);
        }.bind(this);
        c.name = b;
        if (Object.keys(this.getRunning()).length >= this.options.concurrent || (this.error && this.options.stopOnFailure)) {
            this.queue.push(c);
        } else {
            c();
        }
        return this;
    },
    hasNext: function (a) {
        return (!a) ? !!this.queue.length : !!this.queue.filter(function (b) {
            return b.name == a;
        }).length;
    },
    resume: function () {
        this.error = false;
        (this.options.concurrent - Object.keys(this.getRunning()).length).times(this.runNext, this);
        return this;
    },
    runNext: function (a) {
        if (!this.queue.length) {
            return this;
        }
        if (!a) {
            this.queue[0]();
        } else {
            var b;
            this.queue.each(function (c) {
                if (!b && c.name == a) {
                    b = true;
                    c();
                }
            });
        }
        return this;
    },
    runAll: function () {
        this.queue.each(function (a) {
            a();
        });
        return this;
    },
    clear: function (a) {
        if (!a) {
            this.queue.empty();
        } else {
            this.queue = this.queue.map(function (b) {
                if (b.name != a) {
                    return b;
                } else {
                    return false;
                }
            }).filter(function (b) {
                return b;
            });
        }
        return this;
    },
    cancel: function (a) {
        this.requests[a].cancel();
        return this;
    },
    onRequest: function () {
        this.fireEvent("request", arguments);
    },
    onComplete: function () {
        this.fireEvent("complete", arguments);
        if (!this.queue.length) {
            this.fireEvent("end");
        }
    },
    onCancel: function () {
        if (this.options.autoAdvance && !this.error) {
            this.runNext();
        }
        this.fireEvent("cancel", arguments);
    },
    onSuccess: function () {
        if (this.options.autoAdvance && !this.error) {
            this.runNext();
        }
        this.fireEvent("success", arguments);
    },
    onFailure: function () {
        this.error = true;
        if (!this.options.stopOnFailure && this.options.autoAdvance) {
            this.runNext();
        }
        this.fireEvent("failure", arguments);
    },
    onException: function () {
        this.error = true;
        if (!this.options.stopOnFailure && this.options.autoAdvance) {
            this.runNext();
        }
        this.fireEvent("exception", arguments);
    }
});
Request.implement({
    options: {initialDelay: 5000, delay: 5000, limit: 60000}, startTimer: function (b) {
        var a = function () {
            if (!this.running) {
                this.send({data: b});
            }
        };
        this.lastDelay = this.options.initialDelay;
        this.timer = a.delay(this.lastDelay, this);
        this.completeCheck = function (c) {
            clearTimeout(this.timer);
            this.lastDelay = (c) ? this.options.delay : (this.lastDelay + this.options.delay).min(this.options.limit);
            this.timer = a.delay(this.lastDelay, this);
        };
        return this.addEvent("complete", this.completeCheck);
    }, stopTimer: function () {
        clearTimeout(this.timer);
        return this.removeEvent("complete", this.completeCheck);
    }
});
var Asset = {
    javascript: function (d, b) {
        if (!b) {
            b = {};
        }
        var a = new Element("script", {
            src: d,
            type: "text/javascript"
        }), e = b.document || document, c = b.onload || b.onLoad;
        delete b.onload;
        delete b.onLoad;
        delete b.document;
        if (c) {
            if (typeof a.onreadystatechange != "undefined") {
                a.addEvent("readystatechange", function () {
                    if (["loaded", "complete"].contains(this.readyState)) {
                        c.call(this);
                    }
                });
            } else {
                a.addEvent("load", c);
            }
        }
        return a.set(b).inject(e.head);
    }, css: function (d, a) {
        if (!a) {
            a = {};
        }
        var b = new Element("link", {rel: "stylesheet", media: "screen", type: "text/css", href: d});
        var c = a.onload || a.onLoad, e = a.document || document;
        delete a.onload;
        delete a.onLoad;
        delete a.document;
        if (c) {
            b.addEvent("load", c);
        }
        return b.set(a).inject(e.head);
    }, image: function (c, b) {
        if (!b) {
            b = {};
        }
        var d = new Image(), a = document.id(d) || new Element("img");
        ["load", "abort", "error"].each(function (e) {
            var g = "on" + e, f = "on" + e.capitalize(), h = b[g] || b[f] || function () {
                };
            delete b[f];
            delete b[g];
            d[g] = function () {
                if (!d) {
                    return;
                }
                if (!a.parentNode) {
                    a.width = d.width;
                    a.height = d.height;
                }
                d = d.onload = d.onabort = d.onerror = null;
                h.delay(1, a, a);
                a.fireEvent(e, a, 1);
            };
        });
        d.src = a.src = c;
        if (d && d.complete) {
            d.onload.delay(1);
        }
        return a.set(b);
    }, images: function (c, b) {
        c = Array.from(c);
        var d = function () {
        }, a = 0;
        b = Object.merge({onComplete: d, onProgress: d, onError: d, properties: {}}, b);
        return new Elements(c.map(function (f, e) {
            return Asset.image(f, Object.append(b.properties, {
                onload: function () {
                    a++;
                    b.onProgress.call(this, a, e, f);
                    if (a == c.length) {
                        b.onComplete();
                    }
                }, onerror: function () {
                    a++;
                    b.onError.call(this, a, e, f);
                    if (a == c.length) {
                        b.onComplete();
                    }
                }
            }));
        }));
    }
};
(function () {
    var a = this.Color = new Type("Color", function (c, d) {
        if (arguments.length >= 3) {
            d = "rgb";
            c = Array.slice(arguments, 0, 3);
        } else {
            if (typeof c == "string") {
                if (c.match(/rgb/)) {
                    c = c.rgbToHex().hexToRgb(true);
                } else {
                    if (c.match(/hsb/)) {
                        c = c.hsbToRgb();
                    } else {
                        c = c.hexToRgb(true);
                    }
                }
            }
        }
        d = d || "rgb";
        switch (d) {
            case"hsb":
                var b = c;
                c = c.hsbToRgb();
                c.hsb = b;
                break;
            case"hex":
                c = c.hexToRgb(true);
                break;
        }
        c.rgb = c.slice(0, 3);
        c.hsb = c.hsb || c.rgbToHsb();
        c.hex = c.rgbToHex();
        return Object.append(c, this);
    });
    a.implement({
        mix: function () {
            var b = Array.slice(arguments);
            var d = (typeOf(b.getLast()) == "number") ? b.pop() : 50;
            var c = this.slice();
            b.each(function (e) {
                e = new a(e);
                for (var f = 0; f < 3; f++) {
                    c[f] = Math.round((c[f] / 100 * (100 - d)) + (e[f] / 100 * d));
                }
            });
            return new a(c, "rgb");
        }, invert: function () {
            return new a(this.map(function (b) {
                return 255 - b;
            }));
        }, setHue: function (b) {
            return new a([b, this.hsb[1], this.hsb[2]], "hsb");
        }, setSaturation: function (b) {
            return new a([this.hsb[0], b, this.hsb[2]], "hsb");
        }, setBrightness: function (b) {
            return new a([this.hsb[0], this.hsb[1], b], "hsb");
        }
    });
    this.$RGB = function (e, d, c) {
        return new a([e, d, c], "rgb");
    };
    this.$HSB = function (e, d, c) {
        return new a([e, d, c], "hsb");
    };
    this.$HEX = function (b) {
        return new a(b, "hex");
    };
    Array.implement({
        rgbToHsb: function () {
            var c = this[0], d = this[1], k = this[2], h = 0;
            var j = Math.max(c, d, k), f = Math.min(c, d, k);
            var l = j - f;
            var i = j / 255, g = (j != 0) ? l / j : 0;
            if (g != 0) {
                var e = (j - c) / l;
                var b = (j - d) / l;
                var m = (j - k) / l;
                if (c == j) {
                    h = m - b;
                } else {
                    if (d == j) {
                        h = 2 + e - m;
                    } else {
                        h = 4 + b - e;
                    }
                }
                h /= 6;
                if (h < 0) {
                    h++;
                }
            }
            return [Math.round(h * 360), Math.round(g * 100), Math.round(i * 100)];
        }, hsbToRgb: function () {
            var d = Math.round(this[2] / 100 * 255);
            if (this[1] == 0) {
                return [d, d, d];
            } else {
                var b = this[0] % 360;
                var g = b % 60;
                var h = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
                var e = Math.round((this[2] * (6000 - this[1] * g)) / 600000 * 255);
                var c = Math.round((this[2] * (6000 - this[1] * (60 - g))) / 600000 * 255);
                switch (Math.floor(b / 60)) {
                    case 0:
                        return [d, c, h];
                    case 1:
                        return [e, d, h];
                    case 2:
                        return [h, d, c];
                    case 3:
                        return [h, e, d];
                    case 4:
                        return [c, h, d];
                    case 5:
                        return [d, h, e];
                }
            }
            return false;
        }
    });
    String.implement({
        rgbToHsb: function () {
            var b = this.match(/\d{1,3}/g);
            return (b) ? b.rgbToHsb() : null;
        }, hsbToRgb: function () {
            var b = this.match(/\d{1,3}/g);
            return (b) ? b.hsbToRgb() : null;
        }
    });
})();
(function () {
    this.Group = new Class({
        initialize: function () {
            this.instances = Array.flatten(arguments);
        }, addEvent: function (e, d) {
            var g = this.instances, a = g.length, f = a, c = new Array(a), b = this;
            g.each(function (h, j) {
                h.addEvent(e, function () {
                    if (!c[j]) {
                        f--;
                    }
                    c[j] = arguments;
                    if (!f) {
                        d.call(b, g, h, c);
                        f = a;
                        c = new Array(a);
                    }
                });
            });
        }
    });
})();
Hash.Cookie = new Class({
    Extends: Cookie, options: {autoSave: true}, initialize: function (b, a) {
        this.parent(b, a);
        this.load();
    }, save: function () {
        var a = JSON.encode(this.hash);
        if (!a || a.length > 4096) {
            return false;
        }
        if (a == "{}") {
            this.dispose();
        } else {
            this.write(a);
        }
        return true;
    }, load: function () {
        this.hash = new Hash(JSON.decode(this.read(), true));
        return this;
    }
});
Hash.each(Hash.prototype, function (b, a) {
    if (typeof b == "function") {
        Hash.Cookie.implement(a, function () {
            var c = b.apply(this.hash, arguments);
            if (this.options.autoSave) {
                this.save();
            }
            return c;
        });
    }
});
(function () {
    var a = this.Table = function () {
        this.length = 0;
        var c = [], b = [];
        this.set = function (e, g) {
            var d = c.indexOf(e);
            if (d == -1) {
                var f = c.length;
                c[f] = e;
                b[f] = g;
                this.length++;
            } else {
                b[d] = g;
            }
            return this;
        };
        this.get = function (e) {
            var d = c.indexOf(e);
            return (d == -1) ? null : b[d];
        };
        this.erase = function (e) {
            var d = c.indexOf(e);
            if (d != -1) {
                this.length--;
                c.splice(d, 1);
                return b.splice(d, 1)[0];
            }
            return null;
        };
        this.each = this.forEach = function (f, g) {
            for (var e = 0, d = this.length; e < d; e++) {
                f.call(g, c[e], b[e], this);
            }
        };
    };
    if (this.Type) {
        new Type("Table", a);
    }
})();
var HtmlTable = new Class({
    Implements: [Options, Events, Class.Occlude],
    options: {properties: {cellpadding: 0, cellspacing: 0, border: 0}, rows: [], headers: [], footers: []},
    property: "HtmlTable",
    initialize: function () {
        var a = Array.link(arguments, {options: Type.isObject, table: Type.isElement, id: Type.isString});
        this.setOptions(a.options);
        if (!a.table && a.id) {
            a.table = document.id(a.id);
        }
        this.element = a.table || new Element("table", this.options.properties);
        if (this.occlude()) {
            return this.occluded;
        }
        this.build();
    },
    build: function () {
        this.element.store("HtmlTable", this);
        this.body = document.id(this.element.tBodies[0]) || new Element("tbody").inject(this.element);
        $$(this.body.rows);
        if (this.options.headers.length) {
            this.setHeaders(this.options.headers);
        } else {
            this.thead = document.id(this.element.tHead);
        }
        if (this.thead) {
            this.head = this.getHead();
        }
        if (this.options.footers.length) {
            this.setFooters(this.options.footers);
        }
        this.tfoot = document.id(this.element.tFoot);
        if (this.tfoot) {
            this.foot = document.id(this.tfoot.rows[0]);
        }
        this.options.rows.each(function (a) {
            this.push(a);
        }, this);
    },
    toElement: function () {
        return this.element;
    },
    empty: function () {
        this.body.empty();
        return this;
    },
    set: function (e, a) {
        var d = (e == "headers") ? "tHead" : "tFoot", b = d.toLowerCase();
        this[b] = (document.id(this.element[d]) || new Element(b).inject(this.element, "top")).empty();
        var c = this.push(a, {}, this[b], e == "headers" ? "th" : "td");
        if (e == "headers") {
            this.head = this.getHead();
        } else {
            this.foot = this.getHead();
        }
        return c;
    },
    getHead: function () {
        var a = this.thead.rows;
        return a.length > 1 ? $$(a) : a.length ? document.id(a[0]) : false;
    },
    setHeaders: function (a) {
        this.set("headers", a);
        return this;
    },
    setFooters: function (a) {
        this.set("footers", a);
        return this;
    },
    update: function (d, e, a) {
        var b = d.getChildren(a || "td"), c = b.length - 1;
        e.each(function (i, f) {
            var j = b[f] || new Element(a || "td").inject(d), h = (i ? i.content : "") || i, g = typeOf(h);
            if (i && i.properties) {
                j.set(i.properties);
            }
            if (/(element(s?)|array|collection)/.test(g)) {
                j.empty().adopt(h);
            } else {
                j.set("html", h);
            }
            if (f > c) {
                b.push(j);
            } else {
                b[f] = j;
            }
        });
        return {tr: d, tds: b};
    },
    push: function (e, c, d, a, b) {
        if (typeOf(e) == "element" && e.get("tag") == "tr") {
            e.inject(d || this.body, b);
            return {tr: e, tds: e.getChildren("td")};
        }
        return this.update(new Element("tr", c).inject(d || this.body, b), e, a);
    },
    pushMany: function (d, c, e, a, b) {
        return d.map(function (f) {
            return this.push(f, c, e, a, b);
        }, this);
    }
});
["adopt", "inject", "wraps", "grab", "replaces", "dispose"].each(function (a) {
    HtmlTable.implement(a, function () {
        this.element[a].apply(this.element, arguments);
        return this;
    });
});
HtmlTable = Class.refactor(HtmlTable, {
    options: {classZebra: "table-tr-odd", zebra: true, zebraOnlyVisibleRows: true}, initialize: function () {
        this.previous.apply(this, arguments);
        if (this.occluded) {
            return this.occluded;
        }
        if (this.options.zebra) {
            this.updateZebras();
        }
    }, updateZebras: function () {
        var a = 0;
        Array.each(this.body.rows, function (b) {
            if (!this.options.zebraOnlyVisibleRows || b.isDisplayed()) {
                this.zebra(b, a++);
            }
        }, this);
    }, setRowStyle: function (b, a) {
        if (this.previous) {
            this.previous(b, a);
        }
        this.zebra(b, a);
    }, zebra: function (b, a) {
        return b[((a % 2) ? "remove" : "add") + "Class"](this.options.classZebra);
    }, push: function () {
        var a = this.previous.apply(this, arguments);
        if (this.options.zebra) {
            this.updateZebras();
        }
        return a;
    }
});
HtmlTable = Class.refactor(HtmlTable, {
    options: {
        sortIndex: 0,
        sortReverse: false,
        parsers: [],
        defaultParser: "string",
        classSortable: "table-sortable",
        classHeadSort: "table-th-sort",
        classHeadSortRev: "table-th-sort-rev",
        classNoSort: "table-th-nosort",
        classGroupHead: "table-tr-group-head",
        classGroup: "table-tr-group",
        classCellSort: "table-td-sort",
        classSortSpan: "table-th-sort-span",
        sortable: false,
        thSelector: "th"
    }, initialize: function () {
        this.previous.apply(this, arguments);
        if (this.occluded) {
            return this.occluded;
        }
        this.sorted = {index: null, dir: 1};
        if (!this.bound) {
            this.bound = {};
        }
        this.bound.headClick = this.headClick.bind(this);
        this.sortSpans = new Elements();
        if (this.options.sortable) {
            this.enableSort();
            if (this.options.sortIndex != null) {
                this.sort(this.options.sortIndex, this.options.sortReverse);
            }
        }
    }, attachSorts: function (a) {
        this.detachSorts();
        if (a !== false) {
            this.element.addEvent("click:relay(" + this.options.thSelector + ")", this.bound.headClick);
        }
    }, detachSorts: function () {
        this.element.removeEvents("click:relay(" + this.options.thSelector + ")");
    }, setHeaders: function () {
        this.previous.apply(this, arguments);
        if (this.sortEnabled) {
            this.setParsers();
        }
    }, setParsers: function () {
        this.parsers = this.detectParsers();
    }, detectParsers: function () {
        return this.head && this.head.getElements(this.options.thSelector).flatten().map(this.detectParser, this);
    }, detectParser: function (a, b) {
        if (a.hasClass(this.options.classNoSort) || a.retrieve("htmltable-parser")) {
            return a.retrieve("htmltable-parser");
        }
        var c = new Element("div");
        c.adopt(a.childNodes).inject(a);
        var f = new Element("span", {"class": this.options.classSortSpan}).inject(c, "top");
        this.sortSpans.push(f);
        var g = this.options.parsers[b], e = this.body.rows, d;
        switch (typeOf(g)) {
            case"function":
                g = {convert: g};
                d = true;
                break;
            case"string":
                g = g;
                d = true;
                break;
        }
        if (!d) {
            HtmlTable.ParserPriority.some(function (k) {
                var o = HtmlTable.Parsers[k], m = o.match;
                if (!m) {
                    return false;
                }
                for (var n = 0, l = e.length; n < l; n++) {
                    var h = document.id(e[n].cells[b]), p = h ? h.get("html").clean() : "";
                    if (p && m.test(p)) {
                        g = o;
                        return true;
                    }
                }
            });
        }
        if (!g) {
            g = this.options.defaultParser;
        }
        a.store("htmltable-parser", g);
        return g;
    }, headClick: function (b, a) {
        if (!this.head || a.hasClass(this.options.classNoSort)) {
            return;
        }
        return this.sort(Array.indexOf(this.head.getElements(this.options.thSelector).flatten(), a) % this.body.rows[0].cells.length);
    }, serialize: function () {
        var a = this.previous.apply(this, arguments) || {};
        if (this.options.sortable) {
            a.sortIndex = this.sorted.index;
            a.sortReverse = this.sorted.reverse;
        }
        return a;
    }, restore: function (a) {
        if (this.options.sortable && a.sortIndex) {
            this.sort(a.sortIndex, a.sortReverse);
        }
        this.previous.apply(this, arguments);
    }, setSortedState: function (b, a) {
        if (a != null) {
            this.sorted.reverse = a;
        } else {
            if (this.sorted.index == b) {
                this.sorted.reverse = !this.sorted.reverse;
            } else {
                this.sorted.reverse = this.sorted.index == null;
            }
        }
        if (b != null) {
            this.sorted.index = b;
        }
    }, setHeadSort: function (a) {
        var b = $$(!this.head.length ? this.head.cells[this.sorted.index] : this.head.map(function (c) {
            return c.getElements(this.options.thSelector)[this.sorted.index];
        }, this).clean());
        if (!b.length) {
            return;
        }
        if (a) {
            b.addClass(this.options.classHeadSort);
            if (this.sorted.reverse) {
                b.addClass(this.options.classHeadSortRev);
            } else {
                b.removeClass(this.options.classHeadSortRev);
            }
        } else {
            b.removeClass(this.options.classHeadSort).removeClass(this.options.classHeadSortRev);
        }
    }, setRowSort: function (b, a) {
        var e = b.length, d = this.body, g, f;
        while (e) {
            var h = b[--e], c = h.position, i = d.rows[c];
            if (i.disabled) {
                continue;
            }
            if (!a) {
                g = this.setGroupSort(g, i, h);
                this.setRowStyle(i, e);
            }
            d.appendChild(i);
            for (f = 0;
                 f < e; f++) {
                if (b[f].position > c) {
                    b[f].position--;
                }
            }
        }
    }, setRowStyle: function (b, a) {
        this.previous(b, a);
        b.cells[this.sorted.index].addClass(this.options.classCellSort);
    }, setGroupSort: function (b, c, a) {
        if (b == a.value) {
            c.removeClass(this.options.classGroupHead).addClass(this.options.classGroup);
        } else {
            c.removeClass(this.options.classGroup).addClass(this.options.classGroupHead);
        }
        return a.value;
    }, getParser: function () {
        var a = this.parsers[this.sorted.index];
        return typeOf(a) == "string" ? HtmlTable.Parsers[a] : a;
    }, sort: function (c, b, e) {
        if (!this.head) {
            return;
        }
        if (!e) {
            this.clearSort();
            this.setSortedState(c, b);
            this.setHeadSort(true);
        }
        var f = this.getParser();
        if (!f) {
            return;
        }
        var a;
        if (!Browser.ie) {
            a = this.body.getParent();
            this.body.dispose();
        }
        var d = this.parseData(f).sort(function (h, g) {
            if (h.value === g.value) {
                return 0;
            }
            return h.value > g.value ? 1 : -1;
        });
        if (this.sorted.reverse == (f == HtmlTable.Parsers["input-checked"])) {
            d.reverse(true);
        }
        this.setRowSort(d, e);
        if (a) {
            a.grab(this.body);
        }
        this.fireEvent("stateChanged");
        return this.fireEvent("sort", [this.body, this.sorted.index]);
    }, parseData: function (a) {
        return Array.map(this.body.rows, function (d, b) {
            var c = a.convert.call(document.id(d.cells[this.sorted.index]));
            return {position: b, value: c};
        }, this);
    }, clearSort: function () {
        this.setHeadSort(false);
        this.body.getElements("td").removeClass(this.options.classCellSort);
    }, reSort: function () {
        if (this.sortEnabled) {
            this.sort.call(this, this.sorted.index, this.sorted.reverse);
        }
        return this;
    }, enableSort: function () {
        this.element.addClass(this.options.classSortable);
        this.attachSorts(true);
        this.setParsers();
        this.sortEnabled = true;
        return this;
    }, disableSort: function () {
        this.element.removeClass(this.options.classSortable);
        this.attachSorts(false);
        this.sortSpans.each(function (a) {
            a.destroy();
        });
        this.sortSpans.empty();
        this.sortEnabled = false;
        return this;
    }
});
HtmlTable.ParserPriority = ["date", "input-checked", "input-value", "float", "number"];
HtmlTable.Parsers = {
    date: {
        match: /^\d{2}[-\/ ]\d{2}[-\/ ]\d{2,4}$/, convert: function () {
            var a = Date.parse(this.get("text").stripTags());
            return (typeOf(a) == "date") ? a.format("db") : "";
        }, type: "date"
    }, "input-checked": {
        match: / type="(radio|checkbox)" /, convert: function () {
            return this.getElement("input").checked;
        }
    }, "input-value": {
        match: /<input/, convert: function () {
            return this.getElement("input").value;
        }
    }, number: {
        match: /^\d+[^\d.,]*$/, convert: function () {
            return this.get("text").stripTags().toInt();
        }, number: true
    }, numberLax: {
        match: /^[^\d]+\d+$/, convert: function () {
            return this.get("text").replace(/[^-?^0-9]/, "").stripTags().toInt();
        }, number: true
    }, "float": {
        match: /^[\d]+\.[\d]+/, convert: function () {
            return this.get("text").replace(/[^-?^\d.]/, "").stripTags().toFloat();
        }, number: true
    }, floatLax: {
        match: /^[^\d]+[\d]+\.[\d]+$/, convert: function () {
            return this.get("text").replace(/[^-?^\d.]/, "").stripTags();
        }, number: true
    }, string: {
        match: null, convert: function () {
            return this.get("text").stripTags().toLowerCase();
        }
    }, title: {
        match: null, convert: function () {
            return this.title;
        }
    }
};
HtmlTable.defineParsers = function (a) {
    HtmlTable.Parsers = Object.append(HtmlTable.Parsers, a);
    for (var b in a) {
        HtmlTable.ParserPriority.unshift(b);
    }
};
(function () {
    var a = this.Keyboard = new Class({
        Extends: Events,
        Implements: [Options],
        options: {
            defaultEventType: "keydown",
            active: false,
            manager: null,
            events: {},
            nonParsedEvents: ["activate", "deactivate", "onactivate", "ondeactivate", "changed", "onchanged"]
        },
        initialize: function (f) {
            if (f && f.manager) {
                this._manager = f.manager;
                delete f.manager;
            }
            this.setOptions(f);
            this._setup();
        },
        addEvent: function (h, g, f) {
            return this.parent(a.parse(h, this.options.defaultEventType, this.options.nonParsedEvents), g, f);
        },
        removeEvent: function (g, f) {
            return this.parent(a.parse(g, this.options.defaultEventType, this.options.nonParsedEvents), f);
        },
        toggleActive: function () {
            return this[this.isActive() ? "deactivate" : "activate"]();
        },
        activate: function (f) {
            if (f) {
                if (f.isActive()) {
                    return this;
                }
                if (this._activeKB && f != this._activeKB) {
                    this.previous = this._activeKB;
                    this.previous.fireEvent("deactivate");
                }
                this._activeKB = f.fireEvent("activate");
                a.manager.fireEvent("changed");
            } else {
                if (this._manager) {
                    this._manager.activate(this);
                }
            }
            return this;
        },
        isActive: function () {
            return this._manager ? (this._manager._activeKB == this) : (a.manager == this);
        },
        deactivate: function (f) {
            if (f) {
                if (f === this._activeKB) {
                    this._activeKB = null;
                    f.fireEvent("deactivate");
                    a.manager.fireEvent("changed");
                }
            } else {
                if (this._manager) {
                    this._manager.deactivate(this);
                }
            }
            return this;
        },
        relinquish: function () {
            if (this.isActive() && this._manager && this._manager.previous) {
                this._manager.activate(this._manager.previous);
            } else {
                this.deactivate();
            }
            return this;
        },
        manage: function (f) {
            if (f._manager) {
                f._manager.drop(f);
            }
            this._instances.push(f);
            f._manager = this;
            if (!this._activeKB) {
                this.activate(f);
            }
            return this;
        },
        drop: function (f) {
            f.relinquish();
            this._instances.erase(f);
            if (this._activeKB == f) {
                if (this.previous && this._instances.contains(this.previous)) {
                    this.activate(this.previous);
                } else {
                    this._activeKB = this._instances[0];
                }
            }
            return this;
        },
        trace: function () {
            a.trace(this);
        },
        each: function (f) {
            a.each(this, f);
        },
        _instances: [],
        _disable: function (f) {
            if (this._activeKB == f) {
                this._activeKB = null;
            }
        },
        _setup: function () {
            this.addEvents(this.options.events);
            if (a.manager && !this._manager) {
                a.manager.manage(this);
            }
            if (this.options.active) {
                this.activate();
            } else {
                this.relinquish();
            }
        },
        _handle: function (h, g) {
            if (h.preventKeyboardPropagation) {
                return;
            }
            var f = !!this._manager;
            if (f && this._activeKB) {
                this._activeKB._handle(h, g);
                if (h.preventKeyboardPropagation) {
                    return;
                }
            }
            this.fireEvent(g, h);
            if (!f && this._activeKB) {
                this._activeKB._handle(h, g);
            }
        }
    });
    var b = {};
    var c = ["shift", "control", "alt", "meta"];
    var e = /^(?:shift|control|ctrl|alt|meta)$/;
    a.parse = function (h, g, k) {
        if (k && k.contains(h.toLowerCase())) {
            return h;
        }
        h = h.toLowerCase().replace(/^(keyup|keydown):/, function (m, l) {
            g = l;
            return "";
        });
        if (!b[h]) {
            var f, j = {};
            h.split("+").each(function (l) {
                if (e.test(l)) {
                    j[l] = true;
                } else {
                    f = l;
                }
            });
            j.control = j.control || j.ctrl;
            var i = [];
            c.each(function (l) {
                if (j[l]) {
                    i.push(l);
                }
            });
            if (f) {
                i.push(f);
            }
            b[h] = i.join("+");
        }
        return g + ":keys(" + b[h] + ")";
    };
    a.each = function (f, g) {
        var h = f || a.manager;
        while (h) {
            g.run(h);
            h = h._activeKB;
        }
    };
    a.stop = function (f) {
        f.preventKeyboardPropagation = true;
    };
    a.manager = new a({active: true});
    a.trace = function (f) {
        f = f || a.manager;
        var g = window.console && console.log;
        if (g) {
            console.log("the following items have focus: ");
        }
        a.each(f, function (h) {
            if (g) {
                console.log(document.id(h.widget) || h.wiget || h);
            }
        });
    };
    var d = function (g) {
        var f = [];
        c.each(function (h) {
            if (g[h]) {
                f.push(h);
            }
        });
        if (!e.test(g.key)) {
            f.push(g.key);
        }
        a.manager._handle(g, g.type + ":keys(" + f.join("+") + ")");
    };
    document.addEvents({keyup: d, keydown: d});
})();
Keyboard.prototype.options.nonParsedEvents.combine(["rebound", "onrebound"]);
Keyboard.implement({
    addShortcut: function (b, a) {
        this._shortcuts = this._shortcuts || [];
        this._shortcutIndex = this._shortcutIndex || {};
        a.getKeyboard = Function.from(this);
        a.name = b;
        this._shortcutIndex[b] = a;
        this._shortcuts.push(a);
        if (a.keys) {
            this.addEvent(a.keys, a.handler);
        }
        return this;
    }, addShortcuts: function (b) {
        for (var a in b) {
            this.addShortcut(a, b[a]);
        }
        return this;
    }, removeShortcut: function (b) {
        var a = this.getShortcut(b);
        if (a && a.keys) {
            this.removeEvent(a.keys, a.handler);
            delete this._shortcutIndex[b];
            this._shortcuts.erase(a);
        }
        return this;
    }, removeShortcuts: function (a) {
        a.each(this.removeShortcut, this);
        return this;
    }, getShortcuts: function () {
        return this._shortcuts || [];
    }, getShortcut: function (a) {
        return (this._shortcutIndex || {})[a];
    }
});
Keyboard.rebind = function (b, a) {
    Array.from(a).each(function (c) {
        c.getKeyboard().removeEvent(c.keys, c.handler);
        c.getKeyboard().addEvent(b, c.handler);
        c.keys = b;
        c.getKeyboard().fireEvent("rebound");
    });
};
Keyboard.getActiveShortcuts = function (b) {
    var a = [], c = [];
    Keyboard.each(b, [].push.bind(a));
    a.each(function (d) {
        c.extend(d.getShortcuts());
    });
    return c;
};
Keyboard.getShortcut = function (c, b, d) {
    d = d || {};
    var a = d.many ? [] : null, e = d.many ? function (g) {
        var f = g.getShortcut(c);
        if (f) {
            a.push(f);
        }
    } : function (f) {
        if (!a) {
            a = f.getShortcut(c);
        }
    };
    Keyboard.each(b, e);
    return a;
};
Keyboard.getShortcuts = function (b, a) {
    return Keyboard.getShortcut(b, a, {many: true});
};
HtmlTable = Class.refactor(HtmlTable, {
    options: {
        useKeyboard: true,
        classRowSelected: "table-tr-selected",
        classRowHovered: "table-tr-hovered",
        classSelectable: "table-selectable",
        shiftForMultiSelect: true,
        allowMultiSelect: true,
        selectable: false,
        selectHiddenRows: false
    }, initialize: function () {
        this.previous.apply(this, arguments);
        if (this.occluded) {
            return this.occluded;
        }
        this.selectedRows = new Elements();
        if (!this.bound) {
            this.bound = {};
        }
        this.bound.mouseleave = this.mouseleave.bind(this);
        this.bound.clickRow = this.clickRow.bind(this);
        this.bound.activateKeyboard = function () {
            if (this.keyboard && this.selectEnabled) {
                this.keyboard.activate();
            }
        }.bind(this);
        if (this.options.selectable) {
            this.enableSelect();
        }
    }, empty: function () {
        this.selectNone();
        return this.previous();
    }, enableSelect: function () {
        this.selectEnabled = true;
        this.attachSelects();
        this.element.addClass(this.options.classSelectable);
        return this;
    }, disableSelect: function () {
        this.selectEnabled = false;
        this.attachSelects(false);
        this.element.removeClass(this.options.classSelectable);
        return this;
    }, push: function () {
        var a = this.previous.apply(this, arguments);
        this.updateSelects();
        return a;
    }, toggleRow: function (a) {
        return this[(this.isSelected(a) ? "de" : "") + "selectRow"](a);
    }, selectRow: function (b, a) {
        if (this.isSelected(b) || (!a && !this.body.getChildren().contains(b))) {
            return;
        }
        if (!this.options.allowMultiSelect) {
            this.selectNone();
        }
        if (!this.isSelected(b)) {
            this.selectedRows.push(b);
            b.addClass(this.options.classRowSelected);
            this.fireEvent("rowFocus", [b, this.selectedRows]);
            this.fireEvent("stateChanged");
        }
        this.focused = b;
        document.clearSelection();
        return this;
    }, isSelected: function (a) {
        return this.selectedRows.contains(a);
    }, getSelected: function () {
        return this.selectedRows;
    }, getSelected: function () {
        return this.selectedRows;
    }, serialize: function () {
        var a = this.previous.apply(this, arguments) || {};
        if (this.options.selectable) {
            a.selectedRows = this.selectedRows.map(function (b) {
                return Array.indexOf(this.body.rows, b);
            }.bind(this));
        }
        return a;
    }, restore: function (a) {
        if (this.options.selectable && a.selectedRows) {
            a.selectedRows.each(function (b) {
                this.selectRow(this.body.rows[b]);
            }.bind(this));
        }
        this.previous.apply(this, arguments);
    }, deselectRow: function (b, a) {
        if (!this.isSelected(b) || (!a && !this.body.getChildren().contains(b))) {
            return;
        }
        this.selectedRows = new Elements(Array.from(this.selectedRows).erase(b));
        b.removeClass(this.options.classRowSelected);
        this.fireEvent("rowUnfocus", [b, this.selectedRows]);
        this.fireEvent("stateChanged");
        return this;
    }, selectAll: function (a) {
        if (!a && !this.options.allowMultiSelect) {
            return;
        }
        this.selectRange(0, this.body.rows.length, a);
        return this;
    }, selectNone: function () {
        return this.selectAll(true);
    }, selectRange: function (b, a, f) {
        if (!this.options.allowMultiSelect && !f) {
            return;
        }
        var g = f ? "deselectRow" : "selectRow", e = Array.clone(this.body.rows);
        if (typeOf(b) == "element") {
            b = e.indexOf(b);
        }
        if (typeOf(a) == "element") {
            a = e.indexOf(a);
        }
        a = a < e.length - 1 ? a : e.length - 1;
        if (a < b) {
            var d = b;
            b = a;
            a = d;
        }
        for (var c = b; c <= a;
             c++) {
            if (this.options.selectHiddenRows || e[c].isDisplayed()) {
                this[g](e[c], true);
            }
        }
        return this;
    }, deselectRange: function (b, a) {
        this.selectRange(b, a, true);
    }, getSelected: function () {
        return this.selectedRows;
    }, enterRow: function (a) {
        if (this.hovered) {
            this.hovered = this.leaveRow(this.hovered);
        }
        this.hovered = a.addClass(this.options.classRowHovered);
    }, leaveRow: function (a) {
        a.removeClass(this.options.classRowHovered);
    }, updateSelects: function () {
        Array.each(this.body.rows, function (a) {
            var b = a.retrieve("binders");
            if (!b && !this.selectEnabled) {
                return;
            }
            if (!b) {
                b = {mouseenter: this.enterRow.pass([a], this), mouseleave: this.leaveRow.pass([a], this)};
                a.store("binders", b);
            }
            if (this.selectEnabled) {
                a.addEvents(b);
            } else {
                a.removeEvents(b);
            }
        }, this);
    }, shiftFocus: function (b, a) {
        if (!this.focused) {
            return this.selectRow(this.body.rows[0], a);
        }
        var c = this.getRowByOffset(b, this.options.selectHiddenRows);
        if (c === null || this.focused == this.body.rows[c]) {
            return this;
        }
        this.toggleRow(this.body.rows[c], a);
    }, clickRow: function (a, b) {
        var c = (a.shift || a.meta || a.control) && this.options.shiftForMultiSelect;
        if (!c && !(a.rightClick && this.isSelected(b) && this.options.allowMultiSelect)) {
            this.selectNone();
        }
        if (a.rightClick) {
            this.selectRow(b);
        } else {
            this.toggleRow(b);
        }
        if (a.shift) {
            this.selectRange(this.rangeStart || this.body.rows[0], b, this.rangeStart ? !this.isSelected(b) : true);
            this.focused = b;
        }
        this.rangeStart = b;
    }, getRowByOffset: function (e, d) {
        if (!this.focused) {
            return 0;
        }
        var b = Array.indexOf(this.body.rows, this.focused);
        if ((b == 0 && e < 0) || (b == this.body.rows.length - 1 && e > 0)) {
            return null;
        }
        if (d) {
            b += e;
        } else {
            var a = 0, c = 0;
            if (e > 0) {
                while (c < e && b < this.body.rows.length - 1) {
                    if (this.body.rows[++b].isDisplayed()) {
                        c++;
                    }
                }
            } else {
                while (c > e && b > 0) {
                    if (this.body.rows[--b].isDisplayed()) {
                        c--;
                    }
                }
            }
        }
        return b;
    }, attachSelects: function (d) {
        d = d != null ? d : true;
        var g = d ? "addEvents" : "removeEvents";
        this.element[g]({mouseleave: this.bound.mouseleave, click: this.bound.activateKeyboard});
        this.body[g]({"click:relay(tr)": this.bound.clickRow, "contextmenu:relay(tr)": this.bound.clickRow});
        if (this.options.useKeyboard || this.keyboard) {
            if (!this.keyboard) {
                this.keyboard = new Keyboard();
            }
            if (!this.selectKeysDefined) {
                this.selectKeysDefined = true;
                var f, e;
                var c = function (i) {
                    var h = function (j) {
                        clearTimeout(f);
                        j.preventDefault();
                        var k = this.body.rows[this.getRowByOffset(i, this.options.selectHiddenRows)];
                        if (j.shift && k && this.isSelected(k)) {
                            this.deselectRow(this.focused);
                            this.focused = k;
                        } else {
                            if (k && (!this.options.allowMultiSelect || !j.shift)) {
                                this.selectNone();
                            }
                            this.shiftFocus(i, j);
                        }
                        if (e) {
                            f = h.delay(100, this, j);
                        } else {
                            f = (function () {
                                e = true;
                                h(j);
                            }).delay(400);
                        }
                    }.bind(this);
                    return h;
                }.bind(this);
                var b = function () {
                    clearTimeout(f);
                    e = false;
                };
                this.keyboard.addEvents({
                    "keydown:shift+up": c(-1),
                    "keydown:shift+down": c(1),
                    "keyup:shift+up": b,
                    "keyup:shift+down": b,
                    "keyup:up": b,
                    "keyup:down": b
                });
                var a = "";
                if (this.options.allowMultiSelect && this.options.shiftForMultiSelect && this.options.useKeyboard) {
                    a = " (Shift multi-selects).";
                }
                this.keyboard.addShortcuts({
                    "Select Previous Row": {
                        keys: "up",
                        shortcut: "up arrow",
                        handler: c(-1),
                        description: "Select the previous row in the table." + a
                    },
                    "Select Next Row": {
                        keys: "down",
                        shortcut: "down arrow",
                        handler: c(1),
                        description: "Select the next row in the table." + a
                    }
                });
            }
            this.keyboard[d ? "activate" : "deactivate"]();
        }
        this.updateSelects();
    }, mouseleave: function () {
        if (this.hovered) {
            this.leaveRow(this.hovered);
        }
    }
});
var Scroller = new Class({
    Implements: [Events, Options], options: {
        area: 20, velocity: 1, onChange: function (a, b) {
            this.element.scrollTo(a, b);
        }, fps: 50
    }, initialize: function (b, a) {
        this.setOptions(a);
        this.element = document.id(b);
        this.docBody = document.id(this.element.getDocument().body);
        this.listener = (typeOf(this.element) != "element") ? this.docBody : this.element;
        this.timer = null;
        this.bound = {
            attach: this.attach.bind(this),
            detach: this.detach.bind(this),
            getCoords: this.getCoords.bind(this)
        };
    }, start: function () {
        this.listener.addEvents({mouseover: this.bound.attach, mouseleave: this.bound.detach});
        return this;
    }, stop: function () {
        this.listener.removeEvents({mouseover: this.bound.attach, mouseleave: this.bound.detach});
        this.detach();
        this.timer = clearInterval(this.timer);
        return this;
    }, attach: function () {
        this.listener.addEvent("mousemove", this.bound.getCoords);
    }, detach: function () {
        this.listener.removeEvent("mousemove", this.bound.getCoords);
        this.timer = clearInterval(this.timer);
    }, getCoords: function (a) {
        this.page = (this.listener.get("tag") == "body") ? a.client : a.page;
        if (!this.timer) {
            this.timer = this.scroll.periodical(Math.round(1000 / this.options.fps), this);
        }
    }, scroll: function () {
        var c = this.element.getSize(), a = this.element.getScroll(), h = this.element != this.docBody ? this.element.getOffsets() : {
            x: 0,
            y: 0
        }, d = this.element.getScrollSize(), g = {
            x: 0,
            y: 0
        }, e = this.options.area.top || this.options.area, b = this.options.area.bottom || this.options.area;
        for (var f in this.page) {
            if (this.page[f] < (e + h[f]) && a[f] != 0) {
                g[f] = (this.page[f] - e - h[f]) * this.options.velocity;
            } else {
                if (this.page[f] + b > (c[f] + h[f]) && a[f] + c[f] != d[f]) {
                    g[f] = (this.page[f] - c[f] + b - h[f]) * this.options.velocity;
                }
            }
            g[f] = g[f].round();
        }
        if (g.y || g.x) {
            this.fireEvent("change", [a.x + g.x, a.y + g.y]);
        }
    }
});
(function () {
    var a = function (c, b) {
        return (c) ? (typeOf(c) == "function" ? c(b) : b.get(c)) : "";
    };
    this.Tips = new Class({
        Implements: [Events, Options], options: {
            onShow: function () {
                this.tip.setStyle("display", "block");
            },
            onHide: function () {
                this.tip.setStyle("display", "none");
            },
            title: "title",
            text: function (b) {
                return b.get("rel") || b.get("href");
            },
            showDelay: 100,
            hideDelay: 100,
            className: "tip-wrap",
            offset: {x: 16, y: 16},
            windowPadding: {x: 0, y: 0},
            fixed: false,
            waiAria: true
        }, initialize: function () {
            var b = Array.link(arguments, {
                options: Type.isObject, elements: function (c) {
                    return c != null;
                }
            });
            this.setOptions(b.options);
            if (b.elements) {
                this.attach(b.elements);
            }
            this.container = new Element("div", {"class": "tip"});
            if (this.options.id) {
                this.container.set("id", this.options.id);
                if (this.options.waiAria) {
                    this.attachWaiAria();
                }
            }
        }, toElement: function () {
            if (this.tip) {
                return this.tip;
            }
            this.tip = new Element("div", {
                "class": this.options.className,
                styles: {position: "absolute", top: 0, left: 0}
            }).adopt(new Element("div", {"class": "tip-top"}), this.container, new Element("div", {"class": "tip-bottom"}));
            return this.tip;
        }, attachWaiAria: function () {
            var b = this.options.id;
            this.container.set("role", "tooltip");
            if (!this.waiAria) {
                this.waiAria = {
                    show: function (c) {
                        if (b) {
                            c.set("aria-describedby", b);
                        }
                        this.container.set("aria-hidden", "false");
                    }, hide: function (c) {
                        if (b) {
                            c.erase("aria-describedby");
                        }
                        this.container.set("aria-hidden", "true");
                    }
                };
            }
            this.addEvents(this.waiAria);
        }, detachWaiAria: function () {
            if (this.waiAria) {
                this.container.erase("role");
                this.container.erase("aria-hidden");
                this.removeEvents(this.waiAria);
            }
        }, attach: function (b) {
            $$(b).each(function (d) {
                var f = a(this.options.title, d), e = a(this.options.text, d);
                d.set("title", "").store("tip:native", f).retrieve("tip:title", f);
                d.retrieve("tip:text", e);
                this.fireEvent("attach", [d]);
                var c = ["enter", "leave"];
                if (!this.options.fixed) {
                    c.push("move");
                }
                c.each(function (h) {
                    var g = d.retrieve("tip:" + h);
                    if (!g) {
                        g = function (i) {
                            this["element" + h.capitalize()].apply(this, [i, d]);
                        }.bind(this);
                    }
                    d.store("tip:" + h, g).addEvent("mouse" + h, g);
                }, this);
            }, this);
            return this;
        }, detach: function (b) {
            $$(b).each(function (d) {
                ["enter", "leave", "move"].each(function (e) {
                    d.removeEvent("mouse" + e, d.retrieve("tip:" + e)).eliminate("tip:" + e);
                });
                this.fireEvent("detach", [d]);
                if (this.options.title == "title") {
                    var c = d.retrieve("tip:native");
                    if (c) {
                        d.set("title", c);
                    }
                }
            }, this);
            return this;
        }, elementEnter: function (c, b) {
            clearTimeout(this.timer);
            this.timer = (function () {
                this.container.empty();
                ["title", "text"].each(function (e) {
                    var d = b.retrieve("tip:" + e);
                    var f = this["_" + e + "Element"] = new Element("div", {"class": "tip-" + e}).inject(this.container);
                    if (d) {
                        this.fill(f, d);
                    }
                }, this);
                this.show(b);
                this.position((this.options.fixed) ? {page: b.getPosition()} : c);
            }).delay(this.options.showDelay, this);
        }, elementLeave: function (c, b) {
            clearTimeout(this.timer);
            this.timer = this.hide.delay(this.options.hideDelay, this, b);
            this.fireForParent(c, b);
        }, setTitle: function (b) {
            if (this._titleElement) {
                this._titleElement.empty();
                this.fill(this._titleElement, b);
            }
            return this;
        }, setText: function (b) {
            if (this._textElement) {
                this._textElement.empty();
                this.fill(this._textElement, b);
            }
            return this;
        }, fireForParent: function (c, b) {
            b = b.getParent();
            if (!b || b == document.body) {
                return;
            }
            if (b.retrieve("tip:enter")) {
                b.fireEvent("mouseenter", c);
            } else {
                this.fireForParent(c, b);
            }
        }, elementMove: function (c, b) {
            this.position(c);
        }, position: function (f) {
            if (!this.tip) {
                document.id(this);
            }
            var c = window.getSize(), b = window.getScroll(), g = {
                x: this.tip.offsetWidth,
                y: this.tip.offsetHeight
            }, d = {x: "left", y: "top"}, e = {y: false, x2: false, y2: false, x: false}, h = {};
            for (var i in d) {
                h[d[i]] = f.page[i] + this.options.offset[i];
                if (h[d[i]] < 0) {
                    e[i] = true;
                }
                if ((h[d[i]] + g[i] - b[i]) > c[i] - this.options.windowPadding[i]) {
                    h[d[i]] = f.page[i] - this.options.offset[i] - g[i];
                    e[i + "2"] = true;
                }
            }
            this.fireEvent("bound", e);
            this.tip.setStyles(h);
        }, fill: function (b, c) {
            if (typeof c == "string") {
                b.set("html", c);
            } else {
                b.adopt(c);
            }
        }, show: function (b) {
            if (!this.tip) {
                document.id(this);
            }
            if (!this.tip.getParent()) {
                this.tip.inject(document.body);
            }
            this.fireEvent("show", [this.tip, b]);
        }, hide: function (b) {
            if (!this.tip) {
                document.id(this);
            }
            this.fireEvent("hide", [this.tip, b]);
        }
    });
})();
(function () {
    var a = {json: JSON.decode};
    Locale.Set.defineParser = function (b, c) {
        a[b] = c;
    };
    Locale.Set.from = function (d, c) {
        if (instanceOf(d, Locale.Set)) {
            return d;
        }
        if (!c && typeOf(d) == "string") {
            c = "json";
        }
        if (a[c]) {
            d = a[c](d);
        }
        var b = new Locale.Set;
        b.sets = d.sets || {};
        if (d.inherits) {
            b.inherits.locales = Array.from(d.inherits.locales);
            b.inherits.sets = d.inherits.sets || {};
        }
        return b;
    };
})();
Locale.define("ar", "Date", {dateOrder: ["date", "month", "year"], shortDate: "%d/%m/%Y", shortTime: "%H:%M"});
Locale.define("ar", "FormValidator", {
    required: "هذا الحقل مطلوب.",
    minLength: "رجاءً إدخال {minLength} أحرف على الأقل (تم إدخال {length} أحرف).",
    maxLength: "الرجاء عدم إدخال أكثر من {maxLength} أحرف (تم إدخال {length} أحرف).",
    integer: "الرجاء إدخال عدد صحيح في هذا الحقل. أي رقم ذو كسر عشري أو مئوي (مثال 1.25 ) غير مسموح.",
    numeric: 'الرجاء إدخال قيم رقمية في هذا الحقل (مثال "1" أو "1.1" أو "-1" أو "-1.1").',
    digits: "الرجاء أستخدام قيم رقمية وعلامات ترقيمية فقط في هذا الحقل (مثال, رقم هاتف مع نقطة أو شحطة)",
    alpha: "الرجاء أستخدام أحرف فقط (ا-ي) في هذا الحقل. أي فراغات أو علامات غير مسموحة.",
    alphanum: "الرجاء أستخدام أحرف فقط (ا-ي) أو أرقام (0-9) فقط في هذا الحقل. أي فراغات أو علامات غير مسموحة.",
    dateSuchAs: "الرجاء إدخال تاريخ صحيح كالتالي {date}",
    dateInFormatMDY: "الرجاء إدخال تاريخ صحيح (مثال, 31-12-1999)",
    email: "الرجاء إدخال بريد إلكتروني صحيح.",
    url: "الرجاء إدخال عنوان إلكتروني صحيح مثل http://www.example.com",
    currencyDollar: "الرجاء إدخال قيمة $ صحيحة. مثال, 100.00$",
    oneRequired: "الرجاء إدخال قيمة في أحد هذه الحقول على الأقل.",
    errorPrefix: "خطأ: ",
    warningPrefix: "تحذير: "
});
Locale.define("ca-CA", "Date", {
    months: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juli", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
    months_abbr: ["gen.", "febr.", "març", "abr.", "maig", "juny", "jul.", "ag.", "set.", "oct.", "nov.", "des."],
    days: ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
    days_abbr: ["dg", "dl", "dt", "dc", "dj", "dv", "ds"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 0,
    ordinal: "",
    lessThanMinuteAgo: "fa menys d`un minut",
    minuteAgo: "fa un minut",
    minutesAgo: "fa {delta} minuts",
    hourAgo: "fa un hora",
    hoursAgo: "fa unes {delta} hores",
    dayAgo: "fa un dia",
    daysAgo: "fa {delta} dies",
    lessThanMinuteUntil: "menys d`un minut des d`ara",
    minuteUntil: "un minut des d`ara",
    minutesUntil: "{delta} minuts des d`ara",
    hourUntil: "un hora des d`ara",
    hoursUntil: "unes {delta} hores des d`ara",
    dayUntil: "1 dia des d`ara",
    daysUntil: "{delta} dies des d`ara"
});
Locale.define("ca-CA", "FormValidator", {
    required: "Aquest camp es obligatori.",
    minLength: "Per favor introdueix al menys {minLength} caracters (has introduit {length} caracters).",
    maxLength: "Per favor introdueix no mes de {maxLength} caracters (has introduit {length} caracters).",
    integer: "Per favor introdueix un nombre enter en aquest camp. Nombres amb decimals (p.e. 1,25) no estan permesos.",
    numeric: 'Per favor introdueix sols valors numerics en aquest camp (p.e. "1" o "1,1" o "-1" o "-1,1").',
    digits: "Per favor usa sols numeros i puntuacio en aquest camp (per exemple, un nombre de telefon amb guions i punts no esta permes).",
    alpha: "Per favor utilitza lletres nomes (a-z) en aquest camp. No s´admiteixen espais ni altres caracters.",
    alphanum: "Per favor, utilitza nomes lletres (a-z) o numeros (0-9) en aquest camp. No s´admiteixen espais ni altres caracters.",
    dateSuchAs: "Per favor introdueix una data valida com {date}",
    dateInFormatMDY: 'Per favor introdueix una data valida com DD/MM/YYYY (p.e. "31/12/1999")',
    email: 'Per favor, introdueix una adreça de correu electronic valida. Per exemple, "fred@domain.com".',
    url: "Per favor introdueix una URL valida com http://www.example.com.",
    currencyDollar: "Per favor introdueix una quantitat valida de €. Per exemple €100,00 .",
    oneRequired: "Per favor introdueix alguna cosa per al menys una d´aquestes entrades.",
    errorPrefix: "Error: ",
    warningPrefix: "Avis: ",
    noSpace: "No poden haver espais en aquesta entrada.",
    reqChkByNode: "No hi han elements seleccionats.",
    requiredChk: "Aquest camp es obligatori.",
    reqChkByName: "Per favor selecciona una {label}.",
    match: "Aquest camp necessita coincidir amb el camp {matchName}",
    startDate: "la data de inici",
    endDate: "la data de fi",
    currendDate: "la data actual",
    afterDate: "La data deu ser igual o posterior a {label}.",
    beforeDate: "La data deu ser igual o anterior a {label}.",
    startMonth: "Per favor selecciona un mes d´orige",
    sameMonth: "Aquestes dos dates deuen estar dins del mateix mes - deus canviar una o altra."
});
(function () {
    var a = function (e, d, c, b) {
        if (e == 1) {
            return d;
        } else {
            if (e == 2 || e == 3 || e == 4) {
                return c;
            } else {
                return b;
            }
        }
    };
    Locale.define("cs-CZ", "Date", {
        months: ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"],
        months_abbr: ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"],
        days: ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"],
        days_abbr: ["ne", "po", "út", "st", "čt", "pá", "so"],
        dateOrder: ["date", "month", "year"],
        shortDate: "%d.%m.%Y",
        shortTime: "%H:%M",
        AM: "dop.",
        PM: "odp.",
        firstDayOfWeek: 1,
        ordinal: ".",
        lessThanMinuteAgo: "před chvílí",
        minuteAgo: "přibližně před minutou",
        minutesAgo: function (b) {
            return "před {delta} " + a(b, "minutou", "minutami", "minutami");
        },
        hourAgo: "přibližně před hodinou",
        hoursAgo: function (b) {
            return "před {delta} " + a(b, "hodinou", "hodinami", "hodinami");
        },
        dayAgo: "před dnem",
        daysAgo: function (b) {
            return "před {delta} " + a(b, "dnem", "dny", "dny");
        },
        weekAgo: "před týdnem",
        weeksAgo: function (b) {
            return "před {delta} " + a(b, "týdnem", "týdny", "týdny");
        },
        monthAgo: "před měsícem",
        monthsAgo: function (b) {
            return "před {delta} " + a(b, "měsícem", "měsíci", "měsíci");
        },
        yearAgo: "před rokem",
        yearsAgo: function (b) {
            return "před {delta} " + a(b, "rokem", "lety", "lety");
        },
        lessThanMinuteUntil: "za chvíli",
        minuteUntil: "přibližně za minutu",
        minutesUntil: function (b) {
            return "za {delta} " + a(b, "minutu", "minuty", "minut");
        },
        hourUntil: "přibližně za hodinu",
        hoursUntil: function (b) {
            return "za {delta} " + a(b, "hodinu", "hodiny", "hodin");
        },
        dayUntil: "za den",
        daysUntil: function (b) {
            return "za {delta} " + a(b, "den", "dny", "dnů");
        },
        weekUntil: "za týden",
        weeksUntil: function (b) {
            return "za {delta} " + a(b, "týden", "týdny", "týdnů");
        },
        monthUntil: "za měsíc",
        monthsUntil: function (b) {
            return "za {delta} " + a(b, "měsíc", "měsíce", "měsíců");
        },
        yearUntil: "za rok",
        yearsUntil: function (b) {
            return "za {delta} " + a(b, "rok", "roky", "let");
        }
    });
})();
Locale.define("cs-CZ", "FormValidator", {
    required: "Tato položka je povinná.",
    minLength: "Zadejte prosím alespoň {minLength} znaků (napsáno {length} znaků).",
    maxLength: "Zadejte prosím méně než {maxLength} znaků (nápsáno {length} znaků).",
    integer: "Zadejte prosím celé číslo. Desetinná čísla (např. 1.25) nejsou povolena.",
    numeric: 'Zadejte jen číselné hodnoty (tj. "1" nebo "1.1" nebo "-1" nebo "-1.1").',
    digits: "Zadejte prosím pouze čísla a interpunkční znaménka(například telefonní číslo s pomlčkami nebo tečkami je povoleno).",
    alpha: "Zadejte prosím pouze písmena (a-z). Mezery nebo jiné znaky nejsou povoleny.",
    alphanum: "Zadejte prosím pouze písmena (a-z) nebo číslice (0-9). Mezery nebo jiné znaky nejsou povoleny.",
    dateSuchAs: "Zadejte prosím platné datum jako {date}",
    dateInFormatMDY: 'Zadejte prosím platné datum jako MM / DD / RRRR (tj. "12/31/1999")',
    email: 'Zadejte prosím platnou e-mailovou adresu. Například "fred@domain.com".',
    url: "Zadejte prosím platnou URL adresu jako http://www.example.com.",
    currencyDollar: "Zadejte prosím platnou částku. Například $100.00.",
    oneRequired: "Zadejte prosím alespoň jednu hodnotu pro tyto položky.",
    errorPrefix: "Chyba: ",
    warningPrefix: "Upozornění: ",
    noSpace: "V této položce nejsou povoleny mezery",
    reqChkByNode: "Nejsou vybrány žádné položky.",
    requiredChk: "Tato položka je vyžadována.",
    reqChkByName: "Prosím vyberte {label}.",
    match: "Tato položka se musí shodovat s položkou {matchName}",
    startDate: "datum zahájení",
    endDate: "datum ukončení",
    currendDate: "aktuální datum",
    afterDate: "Datum by mělo být stejné nebo větší než {label}.",
    beforeDate: "Datum by mělo být stejné nebo menší než {label}.",
    startMonth: "Vyberte počáteční měsíc.",
    sameMonth: "Tyto dva datumy musí být ve stejném měsíci - změňte jeden z nich.",
    creditcard: "Zadané číslo kreditní karty je neplatné. Prosím opravte ho. Bylo zadáno {length} čísel."
});
Locale.define("da-DK", "Date", {
    months: ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"],
    months_abbr: ["jan.", "feb.", "mar.", "apr.", "maj.", "jun.", "jul.", "aug.", "sep.", "okt.", "nov.", "dec."],
    days: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
    days_abbr: ["søn", "man", "tir", "ons", "tor", "fre", "lør"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d-%m-%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: ".",
    lessThanMinuteAgo: "mindre end et minut siden",
    minuteAgo: "omkring et minut siden",
    minutesAgo: "{delta} minutter siden",
    hourAgo: "omkring en time siden",
    hoursAgo: "omkring {delta} timer siden",
    dayAgo: "1 dag siden",
    daysAgo: "{delta} dage siden",
    weekAgo: "1 uge siden",
    weeksAgo: "{delta} uger siden",
    monthAgo: "1 måned siden",
    monthsAgo: "{delta} måneder siden",
    yearAgo: "1 år siden",
    yearsAgo: "{delta} år siden",
    lessThanMinuteUntil: "mindre end et minut fra nu",
    minuteUntil: "omkring et minut fra nu",
    minutesUntil: "{delta} minutter fra nu",
    hourUntil: "omkring en time fra nu",
    hoursUntil: "omkring {delta} timer fra nu",
    dayUntil: "1 dag fra nu",
    daysUntil: "{delta} dage fra nu",
    weekUntil: "1 uge fra nu",
    weeksUntil: "{delta} uger fra nu",
    monthUntil: "1 måned fra nu",
    monthsUntil: "{delta} måneder fra nu",
    yearUntil: "1 år fra nu",
    yearsUntil: "{delta} år fra nu"
});
Locale.define("da-DK", "FormValidator", {
    required: "Feltet skal udfyldes.",
    minLength: "Skriv mindst {minLength} tegn (du skrev {length} tegn).",
    maxLength: "Skriv maksimalt {maxLength} tegn (du skrev {length} tegn).",
    integer: "Skriv et tal i dette felt. Decimal tal (f.eks. 1.25) er ikke tilladt.",
    numeric: 'Skriv kun tal i dette felt (i.e. "1" eller "1.1" eller "-1" eller "-1.1").',
    digits: "Skriv kun tal og tegnsætning i dette felt (eksempel, et telefon nummer med bindestreg eller punktum er tilladt).",
    alpha: "Skriv kun bogstaver (a-z) i dette felt. Mellemrum og andre tegn er ikke tilladt.",
    alphanum: "Skriv kun bogstaver (a-z) eller tal (0-9) i dette felt. Mellemrum og andre tegn er ikke tilladt.",
    dateSuchAs: "Skriv en gyldig dato som {date}",
    dateInFormatMDY: 'Skriv dato i formatet DD-MM-YYYY (f.eks. "31-12-1999")',
    email: 'Skriv en gyldig e-mail adresse. F.eks "fred@domain.com".',
    url: 'Skriv en gyldig URL adresse. F.eks "http://www.example.com".',
    currencyDollar: "Skriv et gldigt beløb. F.eks Kr.100.00 .",
    oneRequired: "Et eller flere af felterne i denne formular skal udfyldes.",
    errorPrefix: "Fejl: ",
    warningPrefix: "Advarsel: ",
    noSpace: "Der må ikke benyttes mellemrum i dette felt.",
    reqChkByNode: "Foretag et valg.",
    requiredChk: "Dette felt skal udfyldes.",
    reqChkByName: "Vælg en {label}.",
    match: "Dette felt skal matche {matchName} feltet",
    startDate: "start dato",
    endDate: "slut dato",
    currendDate: "dags dato",
    afterDate: "Datoen skal være større end eller lig med {label}.",
    beforeDate: "Datoen skal være mindre end eller lig med {label}.",
    startMonth: "Vælg en start måned",
    sameMonth: "De valgte datoer skal være i samme måned - skift en af dem."
});
Locale.define("de-DE", "Date", {
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    months_abbr: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    days_abbr: ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d.%m.%Y",
    shortTime: "%H:%M",
    AM: "vormittags",
    PM: "nachmittags",
    firstDayOfWeek: 1,
    ordinal: ".",
    lessThanMinuteAgo: "vor weniger als einer Minute",
    minuteAgo: "vor einer Minute",
    minutesAgo: "vor {delta} Minuten",
    hourAgo: "vor einer Stunde",
    hoursAgo: "vor {delta} Stunden",
    dayAgo: "vor einem Tag",
    daysAgo: "vor {delta} Tagen",
    weekAgo: "vor einer Woche",
    weeksAgo: "vor {delta} Wochen",
    monthAgo: "vor einem Monat",
    monthsAgo: "vor {delta} Monaten",
    yearAgo: "vor einem Jahr",
    yearsAgo: "vor {delta} Jahren",
    lessThanMinuteUntil: "in weniger als einer Minute",
    minuteUntil: "in einer Minute",
    minutesUntil: "in {delta} Minuten",
    hourUntil: "in ca. einer Stunde",
    hoursUntil: "in ca. {delta} Stunden",
    dayUntil: "in einem Tag",
    daysUntil: "in {delta} Tagen",
    weekUntil: "in einer Woche",
    weeksUntil: "in {delta} Wochen",
    monthUntil: "in einem Monat",
    monthsUntil: "in {delta} Monaten",
    yearUntil: "in einem Jahr",
    yearsUntil: "in {delta} Jahren"
});
Locale.define("de-CH").inherit("de-DE", "Date");
Locale.define("de-CH", "FormValidator", {
    required: "Dieses Feld ist obligatorisch.",
    minLength: "Geben Sie bitte mindestens {minLength} Zeichen ein (Sie haben {length} Zeichen eingegeben).",
    maxLength: "Bitte geben Sie nicht mehr als {maxLength} Zeichen ein (Sie haben {length} Zeichen eingegeben).",
    integer: "Geben Sie bitte eine ganze Zahl ein. Dezimalzahlen (z.B. 1.25) sind nicht erlaubt.",
    numeric: "Geben Sie bitte nur Zahlenwerte in dieses Eingabefeld ein (z.B. &quot;1&quot;, &quot;1.1&quot;, &quot;-1&quot; oder &quot;-1.1&quot;).",
    digits: "Benutzen Sie bitte nur Zahlen und Satzzeichen in diesem Eingabefeld (erlaubt ist z.B. eine Telefonnummer mit Bindestrichen und Punkten).",
    alpha: "Benutzen Sie bitte nur Buchstaben (a-z) in diesem Feld. Leerzeichen und andere Zeichen sind nicht erlaubt.",
    alphanum: "Benutzen Sie bitte nur Buchstaben (a-z) und Zahlen (0-9) in diesem Eingabefeld. Leerzeichen und andere Zeichen sind nicht erlaubt.",
    dateSuchAs: "Geben Sie bitte ein g&uuml;ltiges Datum ein. Wie zum Beispiel {date}",
    dateInFormatMDY: "Geben Sie bitte ein g&uuml;ltiges Datum ein. Wie zum Beispiel TT.MM.JJJJ (z.B. &quot;31.12.1999&quot;)",
    email: "Geben Sie bitte eine g&uuml;ltige E-Mail Adresse ein. Wie zum Beispiel &quot;maria@bernasconi.ch&quot;.",
    url: "Geben Sie bitte eine g&uuml;ltige URL ein. Wie zum Beispiel http://www.example.com.",
    currencyDollar: "Geben Sie bitte einen g&uuml;ltigen Betrag in Schweizer Franken ein. Wie zum Beispiel 100.00 CHF .",
    oneRequired: "Machen Sie f&uuml;r mindestens eines der Eingabefelder einen Eintrag.",
    errorPrefix: "Fehler: ",
    warningPrefix: "Warnung: ",
    noSpace: "In diesem Eingabefeld darf kein Leerzeichen sein.",
    reqChkByNode: "Es wurden keine Elemente gew&auml;hlt.",
    requiredChk: "Dieses Feld ist obligatorisch.",
    reqChkByName: "Bitte w&auml;hlen Sie ein {label}.",
    match: "Dieses Eingabefeld muss mit dem Feld {matchName} &uuml;bereinstimmen.",
    startDate: "Das Anfangsdatum",
    endDate: "Das Enddatum",
    currendDate: "Das aktuelle Datum",
    afterDate: "Das Datum sollte zur gleichen Zeit oder sp&auml;ter sein {label}.",
    beforeDate: "Das Datum sollte zur gleichen Zeit oder fr&uuml;her sein {label}.",
    startMonth: "W&auml;hlen Sie bitte einen Anfangsmonat",
    sameMonth: "Diese zwei Datumsangaben m&uuml;ssen im selben Monat sein - Sie m&uuml;ssen eine von beiden ver&auml;ndern.",
    creditcard: "Die eingegebene Kreditkartennummer ist ung&uuml;ltig. Bitte &uuml;berpr&uuml;fen Sie diese und versuchen Sie es erneut. {length} Zahlen eingegeben."
});
Locale.define("de-DE", "FormValidator", {
    required: "Dieses Eingabefeld muss ausgefüllt werden.",
    minLength: "Geben Sie bitte mindestens {minLength} Zeichen ein (Sie haben nur {length} Zeichen eingegeben).",
    maxLength: "Geben Sie bitte nicht mehr als {maxLength} Zeichen ein (Sie haben {length} Zeichen eingegeben).",
    integer: 'Geben Sie in diesem Eingabefeld bitte eine ganze Zahl ein. Dezimalzahlen (z.B. "1.25") sind nicht erlaubt.',
    numeric: 'Geben Sie in diesem Eingabefeld bitte nur Zahlenwerte (z.B. "1", "1.1", "-1" oder "-1.1") ein.',
    digits: "Geben Sie in diesem Eingabefeld bitte nur Zahlen und Satzzeichen ein (z.B. eine Telefonnummer mit Bindestrichen und Punkten ist erlaubt).",
    alpha: "Geben Sie in diesem Eingabefeld bitte nur Buchstaben (a-z) ein. Leerzeichen und andere Zeichen sind nicht erlaubt.",
    alphanum: "Geben Sie in diesem Eingabefeld bitte nur Buchstaben (a-z) und Zahlen (0-9) ein. Leerzeichen oder andere Zeichen sind nicht erlaubt.",
    dateSuchAs: 'Geben Sie bitte ein gültiges Datum ein (z.B. "{date}").',
    dateInFormatMDY: 'Geben Sie bitte ein gültiges Datum im Format TT.MM.JJJJ ein (z.B. "31.12.1999").',
    email: 'Geben Sie bitte eine gültige E-Mail-Adresse ein (z.B. "max@mustermann.de").',
    url: 'Geben Sie bitte eine gültige URL ein (z.B. "http://www.example.com").',
    currencyDollar: "Geben Sie bitte einen gültigen Betrag in EURO ein (z.B. 100.00€).",
    oneRequired: "Bitte füllen Sie mindestens ein Eingabefeld aus.",
    errorPrefix: "Fehler: ",
    warningPrefix: "Warnung: ",
    noSpace: "Es darf kein Leerzeichen in diesem Eingabefeld sein.",
    reqChkByNode: "Es wurden keine Elemente gewählt.",
    requiredChk: "Dieses Feld muss ausgefüllt werden.",
    reqChkByName: "Bitte wählen Sie ein {label}.",
    match: "Dieses Eingabefeld muss mit dem {matchName} Eingabefeld übereinstimmen.",
    startDate: "Das Anfangsdatum",
    endDate: "Das Enddatum",
    currendDate: "Das aktuelle Datum",
    afterDate: "Das Datum sollte zur gleichen Zeit oder später sein als {label}.",
    beforeDate: "Das Datum sollte zur gleichen Zeit oder früher sein als {label}.",
    startMonth: "Wählen Sie bitte einen Anfangsmonat",
    sameMonth: "Diese zwei Datumsangaben müssen im selben Monat sein - Sie müssen eines von beiden verändern.",
    creditcard: "Die eingegebene Kreditkartennummer ist ungültig. Bitte überprüfen Sie diese und versuchen Sie es erneut. {length} Zahlen eingegeben."
});
Locale.define("EU", "Number", {decimal: ",", group: ".", currency: {prefix: "€ "}});
Locale.define("de-DE").inherit("EU", "Number");
Locale.define("en-GB", "Date", {
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H:%M"
}).inherit("en-US", "Date");
Locale.define("es-ES", "Date", {
    months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    months_abbr: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    days_abbr: ["dom", "lun", "mar", "mié", "juv", "vie", "sáb"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "",
    lessThanMinuteAgo: "hace menos de un minuto",
    minuteAgo: "hace un minuto",
    minutesAgo: "hace {delta} minutos",
    hourAgo: "hace una hora",
    hoursAgo: "hace unas {delta} horas",
    dayAgo: "hace un día",
    daysAgo: "hace {delta} días",
    weekAgo: "hace una semana",
    weeksAgo: "hace unas {delta} semanas",
    monthAgo: "hace un mes",
    monthsAgo: "hace {delta} meses",
    yearAgo: "hace un año",
    yearsAgo: "hace {delta} años",
    lessThanMinuteUntil: "menos de un minuto desde ahora",
    minuteUntil: "un minuto desde ahora",
    minutesUntil: "{delta} minutos desde ahora",
    hourUntil: "una hora desde ahora",
    hoursUntil: "unas {delta} horas desde ahora",
    dayUntil: "un día desde ahora",
    daysUntil: "{delta} días desde ahora",
    weekUntil: "una semana desde ahora",
    weeksUntil: "unas {delta} semanas desde ahora",
    monthUntil: "un mes desde ahora",
    monthsUntil: "{delta} meses desde ahora",
    yearUntil: "un año desde ahora",
    yearsUntil: "{delta} años desde ahora"
});
Locale.define("es-AR").inherit("es-ES", "Date");
Locale.define("es-AR", "FormValidator", {
    required: "Este campo es obligatorio.",
    minLength: "Por favor ingrese al menos {minLength} caracteres (ha ingresado {length} caracteres).",
    maxLength: "Por favor no ingrese más de {maxLength} caracteres (ha ingresado {length} caracteres).",
    integer: "Por favor ingrese un número entero en este campo. Números con decimales (p.e. 1,25) no se permiten.",
    numeric: 'Por favor ingrese solo valores numéricos en este campo (p.e. "1" o "1,1" o "-1" o "-1,1").',
    digits: "Por favor use sólo números y puntuación en este campo (por ejemplo, un número de teléfono con guiones y/o puntos no está permitido).",
    alpha: "Por favor use sólo letras (a-z) en este campo. No se permiten espacios ni otros caracteres.",
    alphanum: "Por favor, usa sólo letras (a-z) o números (0-9) en este campo. No se permiten espacios u otros caracteres.",
    dateSuchAs: "Por favor ingrese una fecha válida como {date}",
    dateInFormatMDY: 'Por favor ingrese una fecha válida, utulizando el formato DD/MM/YYYY (p.e. "31/12/1999")',
    email: 'Por favor, ingrese una dirección de e-mail válida. Por ejemplo, "fred@dominio.com".',
    url: "Por favor ingrese una URL válida como http://www.example.com.",
    currencyDollar: "Por favor ingrese una cantidad válida de pesos. Por ejemplo $100,00 .",
    oneRequired: "Por favor ingrese algo para por lo menos una de estas entradas.",
    errorPrefix: "Error: ",
    warningPrefix: "Advertencia: ",
    noSpace: "No se permiten espacios en este campo.",
    reqChkByNode: "No hay elementos seleccionados.",
    requiredChk: "Este campo es obligatorio.",
    reqChkByName: "Por favor selecciona una {label}.",
    match: "Este campo necesita coincidir con el campo {matchName}",
    startDate: "la fecha de inicio",
    endDate: "la fecha de fin",
    currendDate: "la fecha actual",
    afterDate: "La fecha debe ser igual o posterior a {label}.",
    beforeDate: "La fecha debe ser igual o anterior a {label}.",
    startMonth: "Por favor selecciona un mes de origen",
    sameMonth: "Estas dos fechas deben estar en el mismo mes - debes cambiar una u otra."
});
Locale.define("es-ES", "FormValidator", {
    required: "Este campo es obligatorio.",
    minLength: "Por favor introduce al menos {minLength} caracteres (has introducido {length} caracteres).",
    maxLength: "Por favor introduce no m&aacute;s de {maxLength} caracteres (has introducido {length} caracteres).",
    integer: "Por favor introduce un n&uacute;mero entero en este campo. N&uacute;meros con decimales (p.e. 1,25) no se permiten.",
    numeric: 'Por favor introduce solo valores num&eacute;ricos en este campo (p.e. "1" o "1,1" o "-1" o "-1,1").',
    digits: "Por favor usa solo n&uacute;meros y puntuaci&oacute;n en este campo (por ejemplo, un n&uacute;mero de tel&eacute;fono con guiones y puntos no esta permitido).",
    alpha: "Por favor usa letras solo (a-z) en este campo. No se admiten espacios ni otros caracteres.",
    alphanum: "Por favor, usa solo letras (a-z) o n&uacute;meros (0-9) en este campo. No se admiten espacios ni otros caracteres.",
    dateSuchAs: "Por favor introduce una fecha v&aacute;lida como {date}",
    dateInFormatMDY: 'Por favor introduce una fecha v&aacute;lida como DD/MM/YYYY (p.e. "31/12/1999")',
    email: 'Por favor, introduce una direcci&oacute;n de email v&aacute;lida. Por ejemplo, "fred@domain.com".',
    url: "Por favor introduce una URL v&aacute;lida como http://www.example.com.",
    currencyDollar: "Por favor introduce una cantidad v&aacute;lida de €. Por ejemplo €100,00 .",
    oneRequired: "Por favor introduce algo para por lo menos una de estas entradas.",
    errorPrefix: "Error: ",
    warningPrefix: "Aviso: ",
    noSpace: "No pueden haber espacios en esta entrada.",
    reqChkByNode: "No hay elementos seleccionados.",
    requiredChk: "Este campo es obligatorio.",
    reqChkByName: "Por favor selecciona una {label}.",
    match: "Este campo necesita coincidir con el campo {matchName}",
    startDate: "la fecha de inicio",
    endDate: "la fecha de fin",
    currendDate: "la fecha actual",
    afterDate: "La fecha debe ser igual o posterior a {label}.",
    beforeDate: "La fecha debe ser igual o anterior a {label}.",
    startMonth: "Por favor selecciona un mes de origen",
    sameMonth: "Estas dos fechas deben estar en el mismo mes - debes cambiar una u otra."
});
Locale.define("et-EE", "Date", {
    months: ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"],
    months_abbr: ["jaan", "veebr", "märts", "apr", "mai", "juuni", "juuli", "aug", "sept", "okt", "nov", "dets"],
    days: ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"],
    days_abbr: ["pühap", "esmasp", "teisip", "kolmap", "neljap", "reede", "laup"],
    dateOrder: ["month", "date", "year"],
    shortDate: "%m.%d.%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "",
    lessThanMinuteAgo: "vähem kui minut aega tagasi",
    minuteAgo: "umbes minut aega tagasi",
    minutesAgo: "{delta} minutit tagasi",
    hourAgo: "umbes tund aega tagasi",
    hoursAgo: "umbes {delta} tundi tagasi",
    dayAgo: "1 päev tagasi",
    daysAgo: "{delta} päeva tagasi",
    weekAgo: "1 nädal tagasi",
    weeksAgo: "{delta} nädalat tagasi",
    monthAgo: "1 kuu tagasi",
    monthsAgo: "{delta} kuud tagasi",
    yearAgo: "1 aasta tagasi",
    yearsAgo: "{delta} aastat tagasi",
    lessThanMinuteUntil: "vähem kui minuti aja pärast",
    minuteUntil: "umbes minuti aja pärast",
    minutesUntil: "{delta} minuti pärast",
    hourUntil: "umbes tunni aja pärast",
    hoursUntil: "umbes {delta} tunni pärast",
    dayUntil: "1 päeva pärast",
    daysUntil: "{delta} päeva pärast",
    weekUntil: "1 nädala pärast",
    weeksUntil: "{delta} nädala pärast",
    monthUntil: "1 kuu pärast",
    monthsUntil: "{delta} kuu pärast",
    yearUntil: "1 aasta pärast",
    yearsUntil: "{delta} aasta pärast"
});
Locale.define("et-EE", "FormValidator", {
    required: "Väli peab olema täidetud.",
    minLength: "Palun sisestage vähemalt {minLength} tähte (te sisestasite {length} tähte).",
    maxLength: "Palun ärge sisestage rohkem kui {maxLength} tähte (te sisestasite {length} tähte).",
    integer: "Palun sisestage väljale täisarv. Kümnendarvud (näiteks 1.25) ei ole lubatud.",
    numeric: 'Palun sisestage ainult numbreid väljale (näiteks "1", "1.1", "-1" või "-1.1").',
    digits: "Palun kasutage ainult numbreid ja kirjavahemärke (telefoninumbri sisestamisel on lubatud kasutada kriipse ja punkte).",
    alpha: "Palun kasutage ainult tähti (a-z). Tühikud ja teised sümbolid on keelatud.",
    alphanum: "Palun kasutage ainult tähti (a-z) või numbreid (0-9). Tühikud ja teised sümbolid on keelatud.",
    dateSuchAs: "Palun sisestage kehtiv kuupäev kujul {date}",
    dateInFormatMDY: 'Palun sisestage kehtiv kuupäev kujul MM.DD.YYYY (näiteks: "12.31.1999").',
    email: 'Palun sisestage kehtiv e-maili aadress (näiteks: "fred@domain.com").',
    url: "Palun sisestage kehtiv URL (näiteks: http://www.example.com).",
    currencyDollar: "Palun sisestage kehtiv $ summa (näiteks: $100.00).",
    oneRequired: "Palun sisestage midagi vähemalt ühele antud väljadest.",
    errorPrefix: "Viga: ",
    warningPrefix: "Hoiatus: ",
    noSpace: "Väli ei tohi sisaldada tühikuid.",
    reqChkByNode: "Ükski väljadest pole valitud.",
    requiredChk: "Välja täitmine on vajalik.",
    reqChkByName: "Palun valige üks {label}.",
    match: "Väli peab sobima {matchName} väljaga",
    startDate: "algkuupäev",
    endDate: "lõppkuupäev",
    currendDate: "praegune kuupäev",
    afterDate: "Kuupäev peab olema võrdne või pärast {label}.",
    beforeDate: "Kuupäev peab olema võrdne või enne {label}.",
    startMonth: "Palun valige algkuupäev.",
    sameMonth: "Antud kaks kuupäeva peavad olema samas kuus - peate muutma ühte kuupäeva."
});
Locale.define("fa", "Date", {
    months: ["ژانویه", "فوریه", "مارس", "آپریل", "مه", "ژوئن", "ژوئیه", "آگوست", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"],
    months_abbr: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    days: ["یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"],
    days_abbr: ["ي", "د", "س", "چ", "پ", "ج", "ش"],
    dateOrder: ["month", "date", "year"],
    shortDate: "%m/%d/%Y",
    shortTime: "%I:%M%p",
    AM: "ق.ظ",
    PM: "ب.ظ",
    ordinal: "ام",
    lessThanMinuteAgo: "کمتر از یک دقیقه پیش",
    minuteAgo: "حدود یک دقیقه پیش",
    minutesAgo: "{delta} دقیقه پیش",
    hourAgo: "حدود یک ساعت پیش",
    hoursAgo: "حدود {delta} ساعت پیش",
    dayAgo: "1 روز پیش",
    daysAgo: "{delta} روز پیش",
    weekAgo: "1 هفته پیش",
    weeksAgo: "{delta} هفته پیش",
    monthAgo: "1 ماه پیش",
    monthsAgo: "{delta} ماه پیش",
    yearAgo: "1 سال پیش",
    yearsAgo: "{delta} سال پیش",
    lessThanMinuteUntil: "کمتر از یک دقیقه از حالا",
    minuteUntil: "حدود یک دقیقه از حالا",
    minutesUntil: "{delta} دقیقه از حالا",
    hourUntil: "حدود یک ساعت از حالا",
    hoursUntil: "حدود {delta} ساعت از حالا",
    dayUntil: "1 روز از حالا",
    daysUntil: "{delta} روز از حالا",
    weekUntil: "1 هفته از حالا",
    weeksUntil: "{delta} هفته از حالا",
    monthUntil: "1 ماه از حالا",
    monthsUntil: "{delta} ماه از حالا",
    yearUntil: "1 سال از حالا",
    yearsUntil: "{delta} سال از حالا"
});
Locale.define("fa", "FormValidator", {
    required: "این فیلد الزامی است.",
    minLength: "شما باید حداقل {minLength} حرف وارد کنید ({length} حرف وارد کرده اید).",
    maxLength: "لطفا حداکثر {maxLength} حرف وارد کنید (شما {length} حرف وارد کرده اید).",
    integer: "لطفا از عدد صحیح استفاده کنید. اعداد اعشاری (مانند 1.25) مجاز نیستند.",
    numeric: 'لطفا فقط داده عددی وارد کنید (مانند "1" یا "1.1" یا "1-" یا "1.1-").',
    digits: "لطفا فقط از اعداد و علامتها در این فیلد استفاده کنید (برای مثال شماره تلفن با خط تیره و نقطه قابل قبول است).",
    alpha: "لطفا فقط از حروف الفباء برای این بخش استفاده کنید. کاراکترهای دیگر و فاصله مجاز نیستند.",
    alphanum: "لطفا فقط از حروف الفباء و اعداد در این بخش استفاده کنید. کاراکترهای دیگر و فاصله مجاز نیستند.",
    dateSuchAs: "لطفا یک تاریخ معتبر مانند {date} وارد کنید.",
    dateInFormatMDY: 'لطفا یک تاریخ معتبر به شکل MM/DD/YYYY وارد کنید (مانند "12/31/1999").',
    email: 'لطفا یک آدرس ایمیل معتبر وارد کنید. برای مثال "fred@domain.com".',
    url: "لطفا یک URL معتبر مانند http://www.example.com وارد کنید.",
    currencyDollar: "لطفا یک محدوده معتبر برای این بخش وارد کنید مانند 100.00$ .",
    oneRequired: "لطفا حداقل یکی از فیلدها را پر کنید.",
    errorPrefix: "خطا: ",
    warningPrefix: "هشدار: ",
    noSpace: "استفاده از فاصله در این بخش مجاز نیست.",
    reqChkByNode: "موردی انتخاب نشده است.",
    requiredChk: "این فیلد الزامی است.",
    reqChkByName: "لطفا یک {label} را انتخاب کنید.",
    match: "این فیلد باید با فیلد {matchName} مطابقت داشته باشد.",
    startDate: "تاریخ شروع",
    endDate: "تاریخ پایان",
    currendDate: "تاریخ کنونی",
    afterDate: "تاریخ میبایست برابر یا بعد از {label} باشد",
    beforeDate: "تاریخ میبایست برابر یا قبل از {label} باشد",
    startMonth: "لطفا ماه شروع را انتخاب کنید",
    sameMonth: "این دو تاریخ باید در یک ماه باشند - شما باید یکی یا هر دو را تغییر دهید.",
    creditcard: "شماره کارت اعتباری که وارد کرده اید معتبر نیست. لطفا شماره را بررسی کنید و مجددا تلاش کنید. {length} رقم وارد شده است."
});
Locale.define("fi-FI", "Date", {
    months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
    months_abbr: ["tammik.", "helmik.", "maalisk.", "huhtik.", "toukok.", "kesäk.", "heinäk.", "elok.", "syysk.", "lokak.", "marrask.", "jouluk."],
    days: ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"],
    days_abbr: ["su", "ma", "ti", "ke", "to", "pe", "la"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d.%m.%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: ".",
    lessThanMinuteAgo: "vajaa minuutti sitten",
    minuteAgo: "noin minuutti sitten",
    minutesAgo: "{delta} minuuttia sitten",
    hourAgo: "noin tunti sitten",
    hoursAgo: "noin {delta} tuntia sitten",
    dayAgo: "päivä sitten",
    daysAgo: "{delta} päivää sitten",
    weekAgo: "viikko sitten",
    weeksAgo: "{delta} viikkoa sitten",
    monthAgo: "kuukausi sitten",
    monthsAgo: "{delta} kuukautta sitten",
    yearAgo: "vuosi sitten",
    yearsAgo: "{delta} vuotta sitten",
    lessThanMinuteUntil: "vajaan minuutin kuluttua",
    minuteUntil: "noin minuutin kuluttua",
    minutesUntil: "{delta} minuutin kuluttua",
    hourUntil: "noin tunnin kuluttua",
    hoursUntil: "noin {delta} tunnin kuluttua",
    dayUntil: "päivän kuluttua",
    daysUntil: "{delta} päivän kuluttua",
    weekUntil: "viikon kuluttua",
    weeksUntil: "{delta} viikon kuluttua",
    monthUntil: "kuukauden kuluttua",
    monthsUntil: "{delta} kuukauden kuluttua",
    yearUntil: "vuoden kuluttua",
    yearsUntil: "{delta} vuoden kuluttua"
});
Locale.define("fi-FI", "FormValidator", {
    required: "Tämä kenttä on pakollinen.",
    minLength: "Ole hyvä ja anna vähintään {minLength} merkkiä (annoit {length} merkkiä).",
    maxLength: "Älä anna enempää kuin {maxLength} merkkiä (annoit {length} merkkiä).",
    integer: "Ole hyvä ja anna kokonaisluku. Luvut, joissa on desimaaleja (esim. 1.25) eivät ole sallittuja.",
    numeric: 'Anna tähän kenttään lukuarvo (kuten "1" tai "1.1" tai "-1" tai "-1.1").',
    digits: "Käytä pelkästään numeroita ja välimerkkejä tässä kentässä (syötteet, kuten esim. puhelinnumero, jossa on väliviivoja, pilkkuja tai pisteitä, kelpaa).",
    alpha: "Anna tähän kenttään vain kirjaimia (a-z). Välilyönnit tai muut merkit eivät ole sallittuja.",
    alphanum: "Anna tähän kenttään vain kirjaimia (a-z) tai numeroita (0-9). Välilyönnit tai muut merkit eivät ole sallittuja.",
    dateSuchAs: "Ole hyvä ja anna kelvollinen päivmäärä, kuten esimerkiksi {date}",
    dateInFormatMDY: 'Ole hyvä ja anna kelvollinen päivämäärä muodossa pp/kk/vvvv (kuten "12/31/1999")',
    email: 'Ole hyvä ja anna kelvollinen sähköpostiosoite (kuten esimerkiksi "matti@meikalainen.com").',
    url: "Ole hyvä ja anna kelvollinen URL, kuten esimerkiksi http://www.example.com.",
    currencyDollar: "Ole hyvä ja anna kelvollinen eurosumma (kuten esimerkiksi 100,00 EUR) .",
    oneRequired: "Ole hyvä ja syötä jotakin ainakin johonkin näistä kentistä.",
    errorPrefix: "Virhe: ",
    warningPrefix: "Varoitus: ",
    noSpace: "Tässä syötteessä ei voi olla välilyöntejä",
    reqChkByNode: "Ei valintoja.",
    requiredChk: "Tämä kenttä on pakollinen.",
    reqChkByName: "Ole hyvä ja valitse {label}.",
    match: "Tämän kentän tulee vastata kenttää {matchName}",
    startDate: "alkupäivämäärä",
    endDate: "loppupäivämäärä",
    currendDate: "nykyinen päivämäärä",
    afterDate: "Päivämäärän tulisi olla sama tai myöhäisempi ajankohta kuin {label}.",
    beforeDate: "Päivämäärän tulisi olla sama tai aikaisempi ajankohta kuin {label}.",
    startMonth: "Ole hyvä ja valitse aloituskuukausi",
    sameMonth: "Näiden kahden päivämäärän tulee olla saman kuun sisällä -- sinun pitää muuttaa jompaa kumpaa.",
    creditcard: "Annettu luottokortin numero ei kelpaa. Ole hyvä ja tarkista numero sekä yritä uudelleen. {length} numeroa syötetty."
});
Locale.define("fi-FI", "Number", {group: " "}).inherit("EU", "Number");
Locale.define("fr-FR", "Date", {
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    months_abbr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
    days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    days_abbr: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: function (a) {
        return (a > 1) ? "" : "er";
    },
    lessThanMinuteAgo: "il y a moins d'une minute",
    minuteAgo: "il y a une minute",
    minutesAgo: "il y a {delta} minutes",
    hourAgo: "il y a une heure",
    hoursAgo: "il y a {delta} heures",
    dayAgo: "il y a un jour",
    daysAgo: "il y a {delta} jours",
    weekAgo: "il y a une semaine",
    weeksAgo: "il y a {delta} semaines",
    monthAgo: "il y a 1 mois",
    monthsAgo: "il y a {delta} mois",
    yearthAgo: "il y a 1 an",
    yearsAgo: "il y a {delta} ans",
    lessThanMinuteUntil: "dans moins d'une minute",
    minuteUntil: "dans une minute",
    minutesUntil: "dans {delta} minutes",
    hourUntil: "dans une heure",
    hoursUntil: "dans {delta} heures",
    dayUntil: "dans un jour",
    daysUntil: "dans {delta} jours",
    weekUntil: "dans 1 semaine",
    weeksUntil: "dans {delta} semaines",
    monthUntil: "dans 1 mois",
    monthsUntil: "dans {delta} mois",
    yearUntil: "dans 1 an",
    yearsUntil: "dans {delta} ans"
});
Locale.define("fr-FR", "FormValidator", {
    required: "Ce champ est obligatoire.",
    length: "Veuillez saisir {length} caract&egrave;re(s) (vous avez saisi {elLength} caract&egrave;re(s)",
    minLength: "Veuillez saisir un minimum de {minLength} caract&egrave;re(s) (vous avez saisi {length} caract&egrave;re(s)).",
    maxLength: "Veuillez saisir un maximum de {maxLength} caract&egrave;re(s) (vous avez saisi {length} caract&egrave;re(s)).",
    integer: 'Veuillez saisir un nombre entier dans ce champ. Les nombres d&eacute;cimaux (ex : "1,25") ne sont pas autoris&eacute;s.',
    numeric: 'Veuillez saisir uniquement des chiffres dans ce champ (ex : "1" ou "1,1" ou "-1" ou "-1,1").',
    digits: "Veuillez saisir uniquement des chiffres et des signes de ponctuation dans ce champ (ex : un num&eacute;ro de t&eacute;l&eacute;phone avec des traits d'union est autoris&eacute;).",
    alpha: "Veuillez saisir uniquement des lettres (a-z) dans ce champ. Les espaces ou autres caract&egrave;res ne sont pas autoris&eacute;s.",
    alphanum: "Veuillez saisir uniquement des lettres (a-z) ou des chiffres (0-9) dans ce champ. Les espaces ou autres caract&egrave;res ne sont pas autoris&eacute;s.",
    dateSuchAs: "Veuillez saisir une date correcte comme {date}",
    dateInFormatMDY: 'Veuillez saisir une date correcte, au format JJ/MM/AAAA (ex : "31/11/1999").',
    email: 'Veuillez saisir une adresse de courrier &eacute;lectronique. Par example "fred@domaine.com".',
    url: "Veuillez saisir une URL, comme http://www.example.com.",
    currencyDollar: "Veuillez saisir une quantit&eacute; correcte. Par example 100,00&euro;.",
    oneRequired: "Veuillez s&eacute;lectionner au moins une de ces options.",
    errorPrefix: "Erreur : ",
    warningPrefix: "Attention : ",
    noSpace: "Ce champ n'accepte pas les espaces.",
    reqChkByNode: "Aucun &eacute;l&eacute;ment n'est s&eacute;lectionn&eacute;.",
    requiredChk: "Ce champ est obligatoire.",
    reqChkByName: "Veuillez s&eacute;lectionner un(e) {label}.",
    match: "Ce champ doit correspondre avec le champ {matchName}.",
    startDate: "date de d&eacute;but",
    endDate: "date de fin",
    currendDate: "date actuelle",
    afterDate: "La date doit &ecirc;tre identique ou post&eacute;rieure &agrave; {label}.",
    beforeDate: "La date doit &ecirc;tre identique ou ant&eacute;rieure &agrave; {label}.",
    startMonth: "Veuillez s&eacute;lectionner un mois de d&eacute;but.",
    sameMonth: "Ces deux dates doivent &ecirc;tre dans le m&ecirc;me mois - vous devez en modifier une.",
    creditcard: "Le num&eacute;ro de carte de cr&eacute;dit est invalide. Merci de v&eacute;rifier le num&eacute;ro et de r&eacute;essayer. Vous avez entr&eacute; {length} chiffre(s)."
});
Locale.define("fr-FR", "Number", {group: " "}).inherit("EU", "Number");
Locale.define("he-IL", "Date", {
    months: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
    months_abbr: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
    days: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    days_abbr: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 0,
    ordinal: "",
    lessThanMinuteAgo: "לפני פחות מדקה",
    minuteAgo: "לפני כדקה",
    minutesAgo: "לפני {delta} דקות",
    hourAgo: "לפני כשעה",
    hoursAgo: "לפני {delta} שעות",
    dayAgo: "לפני יום",
    daysAgo: "לפני {delta} ימים",
    weekAgo: "לפני שבוע",
    weeksAgo: "לפני {delta} שבועות",
    monthAgo: "לפני חודש",
    monthsAgo: "לפני {delta} חודשים",
    yearAgo: "לפני שנה",
    yearsAgo: "לפני {delta} שנים",
    lessThanMinuteUntil: "בעוד פחות מדקה",
    minuteUntil: "בעוד כדקה",
    minutesUntil: "בעוד {delta} דקות",
    hourUntil: "בעוד כשעה",
    hoursUntil: "בעוד {delta} שעות",
    dayUntil: "בעוד יום",
    daysUntil: "בעוד {delta} ימים",
    weekUntil: "בעוד שבוע",
    weeksUntil: "בעוד {delta} שבועות",
    monthUntil: "בעוד חודש",
    monthsUntil: "בעוד {delta} חודשים",
    yearUntil: "בעוד שנה",
    yearsUntil: "בעוד {delta} שנים"
});
Locale.define("he-IL", "FormValidator", {
    required: "נא למלא שדה זה.",
    minLength: "נא להזין לפחות {minLength} תווים (הזנת {length} תווים).",
    maxLength: "נא להזין עד {maxLength} תווים (הזנת {length} תווים).",
    integer: "נא להזין מספר שלם לשדה זה. מספרים עשרוניים (כמו 1.25) אינם חוקיים.",
    numeric: 'נא להזין ערך מספרי בלבד בשדה זה (כמו "1", "1.1", "-1" או "-1.1").',
    digits: "נא להזין רק ספרות וסימני הפרדה בשדה זה (למשל, מספר טלפון עם מקפים או נקודות הוא חוקי).",
    alpha: "נא להזין רק אותיות באנגלית (a-z) בשדה זה. רווחים או תווים אחרים אינם חוקיים.",
    alphanum: "נא להזין רק אותריות באנגלית (a-z) או ספרות (0-9) בשדה זה. אווחרים או תווים אחרים אינם חוקיים.",
    dateSuchAs: "נא להזין תאריך חוקי, כמו {date}",
    dateInFormatMDY: 'נא להזין תאריך חוקי בפורמט MM/DD/YYYY (כמו "12/31/1999")',
    email: 'נא להזין כתובת אימייל חוקית. לדוגמה: "fred@domain.com".',
    url: "נא להזין כתובת אתר חוקית, כמו http://www.example.com.",
    currencyDollar: "נא להזין סכום דולרי חוקי. לדוגמה $100.00.",
    oneRequired: "נא לבחור לפחות בשדה אחד.",
    errorPrefix: "שגיאה: ",
    warningPrefix: "אזהרה: ",
    noSpace: "אין להזין רווחים בשדה זה.",
    reqChkByNode: "נא לבחור אחת מהאפשרויות.",
    requiredChk: "שדה זה נדרש.",
    reqChkByName: "נא לבחור {label}.",
    match: "שדה זה צריך להתאים לשדה {matchName}",
    startDate: "תאריך ההתחלה",
    endDate: "תאריך הסיום",
    currendDate: "התאריך הנוכחי",
    afterDate: "התאריך צריך להיות זהה או אחרי {label}.",
    beforeDate: "התאריך צריך להיות זהה או לפני {label}.",
    startMonth: "נא לבחור חודש התחלה",
    sameMonth: "שני תאריכים אלה צריכים להיות באותו חודש - נא לשנות אחד התאריכים.",
    creditcard: "מספר כרטיס האשראי שהוזן אינו חוקי. נא לבדוק שנית. הוזנו {length} ספרות."
});
Locale.define("he-IL", "Number", {decimal: ".", group: ",", currency: {suffix: " ₪"}});
Locale.define("hu-HU", "Date", {
    months: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
    months_abbr: ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."],
    days: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"],
    days_abbr: ["V", "H", "K", "Sze", "Cs", "P", "Szo"],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y.%m.%d.",
    shortTime: "%I:%M",
    AM: "de.",
    PM: "du.",
    firstDayOfWeek: 1,
    ordinal: ".",
    lessThanMinuteAgo: "alig egy perce",
    minuteAgo: "egy perce",
    minutesAgo: "{delta} perce",
    hourAgo: "egy órája",
    hoursAgo: "{delta} órája",
    dayAgo: "1 napja",
    daysAgo: "{delta} napja",
    weekAgo: "1 hete",
    weeksAgo: "{delta} hete",
    monthAgo: "1 hónapja",
    monthsAgo: "{delta} hónapja",
    yearAgo: "1 éve",
    yearsAgo: "{delta} éve",
    lessThanMinuteUntil: "alig egy perc múlva",
    minuteUntil: "egy perc múlva",
    minutesUntil: "{delta} perc múlva",
    hourUntil: "egy óra múlva",
    hoursUntil: "{delta} óra múlva",
    dayUntil: "1 nap múlva",
    daysUntil: "{delta} nap múlva",
    weekUntil: "1 hét múlva",
    weeksUntil: "{delta} hét múlva",
    monthUntil: "1 hónap múlva",
    monthsUntil: "{delta} hónap múlva",
    yearUntil: "1 év múlva",
    yearsUntil: "{delta} év múlva"
});
Locale.define("hu-HU", "FormValidator", {
    required: "A mező kitöltése kötelező.",
    minLength: "Legalább {minLength} karakter megadása szükséges (megadva {length} karakter).",
    maxLength: "Legfeljebb {maxLength} karakter megadása lehetséges (megadva {length} karakter).",
    integer: "Egész szám megadása szükséges. A tizedesjegyek (pl. 1.25) nem engedélyezettek.",
    numeric: 'Szám megadása szükséges (pl. "1" vagy "1.1" vagy "-1" vagy "-1.1").',
    digits: "Csak számok és írásjelek megadása lehetséges (pl. telefonszám kötőjelek és/vagy perjelekkel).",
    alpha: "Csak betűk (a-z) megadása lehetséges. Szóköz és egyéb karakterek nem engedélyezettek.",
    alphanum: "Csak betűk (a-z) vagy számok (0-9) megadása lehetséges. Szóköz és egyéb karakterek nem engedélyezettek.",
    dateSuchAs: "Valós dátum megadása szükséges (pl. {date}).",
    dateInFormatMDY: 'Valós dátum megadása szükséges ÉÉÉÉ.HH.NN. formában. (pl. "1999.12.31.")',
    email: 'Valós e-mail cím megadása szükséges (pl. "fred@domain.hu").',
    url: "Valós URL megadása szükséges (pl. http://www.example.com).",
    currencyDollar: "Valós pénzösszeg megadása szükséges (pl. 100.00 Ft.).",
    oneRequired: "Az alábbi mezők legalább egyikének kitöltése kötelező.",
    errorPrefix: "Hiba: ",
    warningPrefix: "Figyelem: ",
    noSpace: "A mező nem tartalmazhat szóközöket.",
    reqChkByNode: "Nincs egyetlen kijelölt elem sem.",
    requiredChk: "A mező kitöltése kötelező.",
    reqChkByName: "Egy {label} kiválasztása szükséges.",
    match: "A mezőnek egyeznie kell a(z) {matchName} mezővel.",
    startDate: "a kezdet dátuma",
    endDate: "a vég dátuma",
    currendDate: "jelenlegi dátum",
    afterDate: "A dátum nem lehet kisebb, mint {label}.",
    beforeDate: "A dátum nem lehet nagyobb, mint {label}.",
    startMonth: "Kezdeti hónap megadása szükséges.",
    sameMonth: "A két dátumnak ugyanazon hónapban kell lennie.",
    creditcard: "A megadott bankkártyaszám nem valódi (megadva {length} számjegy)."
});
Locale.define("it-IT", "Date", {
    months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    months_abbr: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
    days: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    days_abbr: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d/%m/%Y",
    shortTime: "%H.%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "º",
    lessThanMinuteAgo: "meno di un minuto fa",
    minuteAgo: "circa un minuto fa",
    minutesAgo: "circa {delta} minuti fa",
    hourAgo: "circa un'ora fa",
    hoursAgo: "circa {delta} ore fa",
    dayAgo: "circa 1 giorno fa",
    daysAgo: "circa {delta} giorni fa",
    weekAgo: "una settimana fa",
    weeksAgo: "{delta} settimane fa",
    monthAgo: "un mese fa",
    monthsAgo: "{delta} mesi fa",
    yearAgo: "un anno fa",
    yearsAgo: "{delta} anni fa",
    lessThanMinuteUntil: "tra meno di un minuto",
    minuteUntil: "tra circa un minuto",
    minutesUntil: "tra circa {delta} minuti",
    hourUntil: "tra circa un'ora",
    hoursUntil: "tra circa {delta} ore",
    dayUntil: "tra circa un giorno",
    daysUntil: "tra circa {delta} giorni",
    weekUntil: "tra una settimana",
    weeksUntil: "tra {delta} settimane",
    monthUntil: "tra un mese",
    monthsUntil: "tra {delta} mesi",
    yearUntil: "tra un anno",
    yearsUntil: "tra {delta} anni"
});
Locale.define("it-IT", "FormValidator", {
    required: "Il campo &egrave; obbligatorio.",
    minLength: "Inserire almeno {minLength} caratteri (ne sono stati inseriti {length}).",
    maxLength: "Inserire al massimo {maxLength} caratteri (ne sono stati inseriti {length}).",
    integer: "Inserire un numero intero. Non sono consentiti decimali (es.: 1.25).",
    numeric: 'Inserire solo valori numerici (es.: "1" oppure "1.1" oppure "-1" oppure "-1.1").',
    digits: "Inserire solo numeri e caratteri di punteggiatura. Per esempio &egrave; consentito un numero telefonico con trattini o punti.",
    alpha: "Inserire solo lettere (a-z). Non sono consentiti spazi o altri caratteri.",
    alphanum: "Inserire solo lettere (a-z) o numeri (0-9). Non sono consentiti spazi o altri caratteri.",
    dateSuchAs: "Inserire una data valida del tipo {date}",
    dateInFormatMDY: 'Inserire una data valida nel formato MM/GG/AAAA (es.: "12/31/1999")',
    email: 'Inserire un indirizzo email valido. Per esempio "nome@dominio.com".',
    url: 'Inserire un indirizzo valido. Per esempio "http://www.example.com".',
    currencyDollar: 'Inserire un importo valido. Per esempio "$100.00".',
    oneRequired: "Completare almeno uno dei campi richiesti.",
    errorPrefix: "Errore: ",
    warningPrefix: "Attenzione: ",
    noSpace: "Non sono consentiti spazi.",
    reqChkByNode: "Nessuna voce selezionata.",
    requiredChk: "Il campo &egrave; obbligatorio.",
    reqChkByName: "Selezionare un(a) {label}.",
    match: "Il valore deve corrispondere al campo {matchName}",
    startDate: "data d'inizio",
    endDate: "data di fine",
    currendDate: "data attuale",
    afterDate: "La data deve corrispondere o essere successiva al {label}.",
    beforeDate: "La data deve corrispondere o essere precedente al {label}.",
    startMonth: "Selezionare un mese d'inizio",
    sameMonth: "Le due date devono essere dello stesso mese - occorre modificarne una."
});
Locale.define("ja-JP", "Date", {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    months_abbr: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    days: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
    days_abbr: ["日", "月", "火", "水", "木", "金", "土"],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y/%m/%d",
    shortTime: "%H:%M",
    AM: "午前",
    PM: "午後",
    firstDayOfWeek: 0,
    ordinal: "",
    lessThanMinuteAgo: "1分以内前",
    minuteAgo: "約1分前",
    minutesAgo: "約{delta}分前",
    hourAgo: "約1時間前",
    hoursAgo: "約{delta}時間前",
    dayAgo: "1日前",
    daysAgo: "{delta}日前",
    weekAgo: "1週間前",
    weeksAgo: "{delta}週間前",
    monthAgo: "1ヶ月前",
    monthsAgo: "{delta}ヶ月前",
    yearAgo: "1年前",
    yearsAgo: "{delta}年前",
    lessThanMinuteUntil: "今から約1分以内",
    minuteUntil: "今から約1分",
    minutesUntil: "今から約{delta}分",
    hourUntil: "今から約1時間",
    hoursUntil: "今から約{delta}時間",
    dayUntil: "今から1日間",
    daysUntil: "今から{delta}日間",
    weekUntil: "今から1週間",
    weeksUntil: "今から{delta}週間",
    monthUntil: "今から1ヶ月",
    monthsUntil: "今から{delta}ヶ月",
    yearUntil: "今から1年",
    yearsUntil: "今から{delta}年"
});
Locale.define("ja-JP", "FormValidator", {
    required: "入力は必須です。",
    minLength: "入力文字数は{minLength}以上にしてください。({length}文字)",
    maxLength: "入力文字数は{maxLength}以下にしてください。({length}文字)",
    integer: "整数を入力してください。",
    numeric: '入力できるのは数値だけです。(例: "1", "1.1", "-1", "-1.1"....)',
    digits: "入力できるのは数値と句読記号です。 (例: -や+を含む電話番号など).",
    alpha: "入力できるのは半角英字だけです。それ以外の文字は入力できません。",
    alphanum: "入力できるのは半角英数字だけです。それ以外の文字は入力できません。",
    dateSuchAs: "有効な日付を入力してください。{date}",
    dateInFormatMDY: '日付の書式に誤りがあります。YYYY/MM/DD (i.e. "1999/12/31")',
    email: "メールアドレスに誤りがあります。",
    url: "URLアドレスに誤りがあります。",
    currencyDollar: "金額に誤りがあります。",
    oneRequired: "ひとつ以上入力してください。",
    errorPrefix: "エラー: ",
    warningPrefix: "警告: ",
    noSpace: "スペースは入力できません。",
    reqChkByNode: "選択されていません。",
    requiredChk: "この項目は必須です。",
    reqChkByName: "{label}を選択してください。",
    match: "{matchName}が入力されている場合必須です。",
    startDate: "開始日",
    endDate: "終了日",
    currendDate: "今日",
    afterDate: "{label}以降の日付にしてください。",
    beforeDate: "{label}以前の日付にしてください。",
    startMonth: "開始月を選択してください。",
    sameMonth: "日付が同一です。どちらかを変更してください。"
});
Locale.define("ja-JP", "Number", {decimal: ".", group: ",", currency: {decimals: 0, prefix: "\\"}});
Locale.define("nl-NL", "Date", {
    months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    months_abbr: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    days: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    days_abbr: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d-%m-%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "e",
    lessThanMinuteAgo: "minder dan een minuut geleden",
    minuteAgo: "ongeveer een minuut geleden",
    minutesAgo: "{delta} minuten geleden",
    hourAgo: "ongeveer een uur geleden",
    hoursAgo: "ongeveer {delta} uur geleden",
    dayAgo: "een dag geleden",
    daysAgo: "{delta} dagen geleden",
    weekAgo: "een week geleden",
    weeksAgo: "{delta} weken geleden",
    monthAgo: "een maand geleden",
    monthsAgo: "{delta} maanden geleden",
    yearAgo: "een jaar geleden",
    yearsAgo: "{delta} jaar geleden",
    lessThanMinuteUntil: "over minder dan een minuut",
    minuteUntil: "over ongeveer een minuut",
    minutesUntil: "over {delta} minuten",
    hourUntil: "over ongeveer een uur",
    hoursUntil: "over {delta} uur",
    dayUntil: "over ongeveer een dag",
    daysUntil: "over {delta} dagen",
    weekUntil: "over een week",
    weeksUntil: "over {delta} weken",
    monthUntil: "over een maand",
    monthsUntil: "over {delta} maanden",
    yearUntil: "over een jaar",
    yearsUntil: "over {delta} jaar"
});
Locale.define("nl-NL", "FormValidator", {
    required: "Dit veld is verplicht.",
    length: "Vul precies {length} karakters in (je hebt {elLength} karakters ingevoerd).",
    minLength: "Vul minimaal {minLength} karakters in (je hebt {length} karakters ingevoerd).",
    maxLength: "Vul niet meer dan {maxLength} karakters in (je hebt {length} karakters ingevoerd).",
    integer: "Vul een getal in. Getallen met decimalen (bijvoorbeeld 1.25) zijn niet toegestaan.",
    numeric: 'Vul alleen numerieke waarden in (bijvoorbeeld "1" of "1.1" of "-1" of "-1.1").',
    digits: "Vul alleen nummers en leestekens in (bijvoorbeeld een telefoonnummer met streepjes is toegestaan).",
    alpha: "Vul alleen letters in (a-z). Spaties en andere karakters zijn niet toegestaan.",
    alphanum: "Vul alleen letters (a-z) of nummers (0-9) in. Spaties en andere karakters zijn niet toegestaan.",
    dateSuchAs: "Vul een geldige datum in, zoals {date}",
    dateInFormatMDY: 'Vul een geldige datum, in het formaat MM/DD/YYYY (bijvoorbeeld "12/31/1999")',
    email: 'Vul een geldig e-mailadres in. Bijvoorbeeld "fred@domein.nl".',
    url: "Vul een geldige URL in, zoals http://www.example.com.",
    currencyDollar: "Vul een geldig $ bedrag in. Bijvoorbeeld $100.00 .",
    oneRequired: "Vul iets in bij in ieder geval een van deze velden.",
    warningPrefix: "Waarschuwing: ",
    errorPrefix: "Fout: ",
    noSpace: "Spaties zijn niet toegestaan in dit veld.",
    reqChkByNode: "Er zijn geen items geselecteerd.",
    requiredChk: "Dit veld is verplicht.",
    reqChkByName: "Selecteer een {label}.",
    match: "Dit veld moet overeen komen met het {matchName} veld",
    startDate: "de begin datum",
    endDate: "de eind datum",
    currendDate: "de huidige datum",
    afterDate: "De datum moet hetzelfde of na {label} zijn.",
    beforeDate: "De datum moet hetzelfde of voor {label} zijn.",
    startMonth: "Selecteer een begin maand",
    sameMonth: "Deze twee data moeten in dezelfde maand zijn - u moet een van beide aanpassen.",
    creditcard: "Het ingevulde creditcardnummer is niet geldig. Controleer het nummer en probeer opnieuw. {length} getallen ingevuld."
});
Locale.define("nl-NL").inherit("EU", "Number");
Locale.define("no-NO", "Date", {
    dateOrder: ["date", "month", "year"],
    shortDate: "%d.%m.%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    lessThanMinuteAgo: "kortere enn et minutt siden",
    minuteAgo: "omtrent et minutt siden",
    minutesAgo: "{delta} minutter siden",
    hourAgo: "omtrent en time siden",
    hoursAgo: "omtrent {delta} timer siden",
    dayAgo: "{delta} dag siden",
    daysAgo: "{delta} dager siden"
});
Locale.define("no-NO", "FormValidator", {
    required: "Dette feltet er pÃ¥krevd.",
    minLength: "Vennligst skriv inn minst {minLength} tegn (du skrev {length} tegn).",
    maxLength: "Vennligst skriv inn maksimalt {maxLength} tegn (du skrev {length} tegn).",
    integer: "Vennligst skriv inn et tall i dette feltet. Tall med desimaler (for eksempel 1,25) er ikke tillat.",
    numeric: 'Vennligst skriv inn kun numeriske verdier i dette feltet (for eksempel "1", "1.1", "-1" eller "-1.1").',
    digits: "Vennligst bruk kun nummer og skilletegn i dette feltet.",
    alpha: "Vennligst bruk kun bokstaver (a-z) i dette feltet. Ingen mellomrom eller andre tegn er tillat.",
    alphanum: "Vennligst bruk kun bokstaver (a-z) eller nummer (0-9) i dette feltet. Ingen mellomrom eller andre tegn er tillat.",
    dateSuchAs: "Vennligst skriv inn en gyldig dato, som {date}",
    dateInFormatMDY: 'Vennligst skriv inn en gyldig dato, i formatet MM/DD/YYYY (for eksempel "12/31/1999")',
    email: 'Vennligst skriv inn en gyldig epost-adresse. For eksempel "espen@domene.no".',
    url: "Vennligst skriv inn en gyldig URL, for eksempel http://www.example.com.",
    currencyDollar: "Vennligst fyll ut et gyldig $ belÃ¸p. For eksempel $100.00 .",
    oneRequired: "Vennligst fyll ut noe i minst ett av disse feltene.",
    errorPrefix: "Feil: ",
    warningPrefix: "Advarsel: "
});
Locale.define("pl-PL", "Date", {
    months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
    months_abbr: ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"],
    days: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
    days_abbr: ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y-%m-%d",
    shortTime: "%H:%M",
    AM: "nad ranem",
    PM: "po południu",
    firstDayOfWeek: 1,
    ordinal: function (a) {
        return (a > 3 && a < 21) ? "ty" : ["ty", "szy", "gi", "ci", "ty"][Math.min(a % 10, 4)];
    },
    lessThanMinuteAgo: "mniej niż minute temu",
    minuteAgo: "około minutę temu",
    minutesAgo: "{delta} minut temu",
    hourAgo: "około godzinę temu",
    hoursAgo: "około {delta} godzin temu",
    dayAgo: "Wczoraj",
    daysAgo: "{delta} dni temu",
    lessThanMinuteUntil: "za niecałą minutę",
    minuteUntil: "za około minutę",
    minutesUntil: "za {delta} minut",
    hourUntil: "za około godzinę",
    hoursUntil: "za około {delta} godzin",
    dayUntil: "za 1 dzień",
    daysUntil: "za {delta} dni"
});
Locale.define("pl-PL", "FormValidator", {
    required: "To pole jest wymagane.",
    minLength: "Wymagane jest przynajmniej {minLength} znaków (wpisanych zostało tylko {length}).",
    maxLength: "Dozwolone jest nie więcej niż {maxLength} znaków (wpisanych zostało {length})",
    integer: "To pole wymaga liczb całych. Liczby dziesiętne (np. 1.25) są niedozwolone.",
    numeric: 'Prosimy używać tylko numerycznych wartości w tym polu (np. "1", "1.1", "-1" lub "-1.1").',
    digits: "Prosimy używać liczb oraz zankow punktuacyjnych w typ polu (dla przykładu, przy numerze telefonu myślniki i kropki są dozwolone).",
    alpha: "Prosimy używać tylko liter (a-z) w tym polu. Spacje oraz inne znaki są niedozwolone.",
    alphanum: "Prosimy używać tylko liter (a-z) lub liczb (0-9) w tym polu. Spacje oraz inne znaki są niedozwolone.",
    dateSuchAs: "Prosimy podać prawidłową datę w formacie: {date}",
    dateInFormatMDY: 'Prosimy podać poprawną date w formacie DD.MM.RRRR (i.e. "12.01.2009")',
    email: 'Prosimy podać prawidłowy adres e-mail, np. "jan@domena.pl".',
    url: "Prosimy podać prawidłowy adres URL, np. http://www.example.com.",
    currencyDollar: "Prosimy podać prawidłową sumę w PLN. Dla przykładu: 100.00 PLN.",
    oneRequired: "Prosimy wypełnić chociaż jedno z pól.",
    errorPrefix: "Błąd: ",
    warningPrefix: "Uwaga: ",
    noSpace: "W tym polu nie mogą znajdować się spacje.",
    reqChkByNode: "Brak zaznaczonych elementów.",
    requiredChk: "To pole jest wymagane.",
    reqChkByName: "Prosimy wybrać z {label}.",
    match: "To pole musi być takie samo jak {matchName}",
    startDate: "data początkowa",
    endDate: "data końcowa",
    currendDate: "aktualna data",
    afterDate: "Podana data poinna być taka sama lub po {label}.",
    beforeDate: "Podana data poinna być taka sama lub przed {label}.",
    startMonth: "Prosimy wybrać początkowy miesiąc.",
    sameMonth: "Te dwie daty muszą być w zakresie tego samego miesiąca - wymagana jest zmiana któregoś z pól."
});
Locale.define("pt-PT", "Date", {
    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    months_abbr: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    days: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
    days_abbr: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    dateOrder: ["date", "month", "year"],
    shortDate: "%d-%m-%Y",
    shortTime: "%H:%M",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "º",
    lessThanMinuteAgo: "há menos de um minuto",
    minuteAgo: "há cerca de um minuto",
    minutesAgo: "há {delta} minutos",
    hourAgo: "há cerca de uma hora",
    hoursAgo: "há cerca de {delta} horas",
    dayAgo: "há um dia",
    daysAgo: "há {delta} dias",
    weekAgo: "há uma semana",
    weeksAgo: "há {delta} semanas",
    monthAgo: "há um mês",
    monthsAgo: "há {delta} meses",
    yearAgo: "há um ano",
    yearsAgo: "há {delta} anos",
    lessThanMinuteUntil: "em menos de um minuto",
    minuteUntil: "em um minuto",
    minutesUntil: "em {delta} minutos",
    hourUntil: "em uma hora",
    hoursUntil: "em {delta} horas",
    dayUntil: "em um dia",
    daysUntil: "em {delta} dias",
    weekUntil: "em uma semana",
    weeksUntil: "em {delta} semanas",
    monthUntil: "em um mês",
    monthsUntil: "em {delta} meses",
    yearUntil: "em um ano",
    yearsUntil: "em {delta} anos"
});
Locale.define("pt-BR", "Date", {shortDate: "%d/%m/%Y"}).inherit("pt-PT", "Date");
Locale.define("pt-BR", "FormValidator", {
    required: "Este campo é obrigatório.",
    minLength: "Digite pelo menos {minLength} caracteres (tamanho atual: {length}).",
    maxLength: "Não digite mais de {maxLength} caracteres (tamanho atual: {length}).",
    integer: "Por favor digite apenas um número inteiro neste campo. Não são permitidos números decimais (por exemplo, 1,25).",
    numeric: 'Por favor digite apenas valores numéricos neste campo (por exemplo, "1" ou "1.1" ou "-1" ou "-1,1").',
    digits: "Por favor use apenas números e pontuação neste campo (por exemplo, um número de telefone com traços ou pontos é permitido).",
    alpha: "Por favor use somente letras (a-z). Espaço e outros caracteres não são permitidos.",
    alphanum: "Use somente letras (a-z) ou números (0-9) neste campo. Espaço e outros caracteres não são permitidos.",
    dateSuchAs: "Digite uma data válida, como {date}",
    dateInFormatMDY: 'Digite uma data válida, como DD/MM/YYYY (por exemplo, "31/12/1999")',
    email: 'Digite um endereço de email válido. Por exemplo "nome@dominio.com".',
    url: "Digite uma URL válida. Exemplo: http://www.example.com.",
    currencyDollar: "Digite um valor em dinheiro válido. Exemplo: R$100,00 .",
    oneRequired: "Digite algo para pelo menos um desses campos.",
    errorPrefix: "Erro: ",
    warningPrefix: "Aviso: ",
    noSpace: "Não é possível digitar espaços neste campo.",
    reqChkByNode: "Não foi selecionado nenhum item.",
    requiredChk: "Este campo é obrigatório.",
    reqChkByName: "Por favor digite um {label}.",
    match: "Este campo deve ser igual ao campo {matchName}.",
    startDate: "a data inicial",
    endDate: "a data final",
    currendDate: "a data atual",
    afterDate: "A data deve ser igual ou posterior a {label}.",
    beforeDate: "A data deve ser igual ou anterior a {label}.",
    startMonth: "Por favor selecione uma data inicial.",
    sameMonth: "Estas duas datas devem ter o mesmo mês - você deve modificar uma das duas.",
    creditcard: "O número do cartão de crédito informado é inválido. Por favor verifique o valor e tente novamente. {length} números informados."
});
Locale.define("pt-PT", "FormValidator", {
    required: "Este campo é necessário.",
    minLength: "Digite pelo menos{minLength} caracteres (comprimento {length} caracteres).",
    maxLength: "Não insira mais de {maxLength} caracteres (comprimento {length} caracteres).",
    integer: "Digite um número inteiro neste domínio. Com números decimais (por exemplo, 1,25), não são permitidas.",
    numeric: 'Digite apenas valores numéricos neste domínio (p.ex., "1" ou "1.1" ou "-1" ou "-1,1").',
    digits: "Por favor, use números e pontuação apenas neste campo (p.ex., um número de telefone com traços ou pontos é permitida).",
    alpha: "Por favor use somente letras (a-z), com nesta área. Não utilize espaços nem outros caracteres são permitidos.",
    alphanum: "Use somente letras (a-z) ou números (0-9) neste campo. Não utilize espaços nem outros caracteres são permitidos.",
    dateSuchAs: "Digite uma data válida, como {date}",
    dateInFormatMDY: 'Digite uma data válida, como DD/MM/YYYY (p.ex. "31/12/1999")',
    email: 'Digite um endereço de email válido. Por exemplo "fred@domain.com".',
    url: "Digite uma URL válida, como http://www.example.com.",
    currencyDollar: "Digite um valor válido $. Por exemplo $ 100,00. ",
    oneRequired: "Digite algo para pelo menos um desses insumos.",
    errorPrefix: "Erro: ",
    warningPrefix: "Aviso: "
});
(function () {
    var a = function (h, e, d, g, b) {
        var c = h % 10, f = h % 100;
        if (c == 1 && f != 11) {
            return e;
        } else {
            if ((c == 2 || c == 3 || c == 4) && !(f == 12 || f == 13 || f == 14)) {
                return d;
            } else {
                if (c == 0 || (c == 5 || c == 6 || c == 7 || c == 8 || c == 9) || (f == 11 || f == 12 || f == 13 || f == 14)) {
                    return g;
                } else {
                    return b;
                }
            }
        }
    };
    Locale.define("ru-RU", "Date", {
        months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        months_abbr: ["янв", "февр", "март", "апр", "май", "июнь", "июль", "авг", "сент", "окт", "нояб", "дек"],
        days: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
        days_abbr: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        dateOrder: ["date", "month", "year"],
        shortDate: "%d.%m.%Y",
        shortTime: "%H:%M",
        AM: "AM",
        PM: "PM",
        firstDayOfWeek: 1,
        ordinal: "",
        lessThanMinuteAgo: "меньше минуты назад",
        minuteAgo: "минуту назад",
        minutesAgo: function (b) {
            return "{delta} " + a(b, "минуту", "минуты", "минут") + " назад";
        },
        hourAgo: "час назад",
        hoursAgo: function (b) {
            return "{delta} " + a(b, "час", "часа", "часов") + " назад";
        },
        dayAgo: "вчера",
        daysAgo: function (b) {
            return "{delta} " + a(b, "день", "дня", "дней") + " назад";
        },
        weekAgo: "неделю назад",
        weeksAgo: function (b) {
            return "{delta} " + a(b, "неделя", "недели", "недель") + " назад";
        },
        monthAgo: "месяц назад",
        monthsAgo: function (b) {
            return "{delta} " + a(b, "месяц", "месяца", "месецев") + " назад";
        },
        yearAgo: "год назад",
        yearsAgo: function (b) {
            return "{delta} " + a(b, "год", "года", "лет") + " назад";
        },
        lessThanMinuteUntil: "меньше чем через минуту",
        minuteUntil: "через минуту",
        minutesUntil: function (b) {
            return "через {delta} " + a(b, "час", "часа", "часов") + "";
        },
        hourUntil: "через час",
        hoursUntil: function (b) {
            return "через {delta} " + a(b, "час", "часа", "часов") + "";
        },
        dayUntil: "завтра",
        daysUntil: function (b) {
            return "через {delta} " + a(b, "день", "дня", "дней") + "";
        },
        weekUntil: "через неделю",
        weeksUntil: function (b) {
            return "через {delta} " + a(b, "неделю", "недели", "недель") + "";
        },
        monthUntil: "через месяц",
        monthsUntil: function (b) {
            return "через {delta} " + a(b, "месяц", "месяца", "месецев") + "";
        },
        yearUntil: "через",
        yearsUntil: function (b) {
            return "через {delta} " + a(b, "год", "года", "лет") + "";
        }
    });
})();
Locale.define("ru-RU", "FormValidator", {
    required: "Это поле обязательно к заполнению.",
    minLength: "Пожалуйста, введите хотя бы {minLength} символов (Вы ввели {length}).",
    maxLength: "Пожалуйста, введите не больше {maxLength} символов (Вы ввели {length}).",
    integer: "Пожалуйста, введите в это поле число. Дробные числа (например 1.25) тут не разрешены.",
    numeric: 'Пожалуйста, введите в это поле число (например "1" или "1.1", или "-1", или "-1.1").',
    digits: "В этом поле Вы можете использовать только цифры и знаки пунктуации (например, телефонный номер со знаками дефиса или с точками).",
    alpha: "В этом поле можно использовать только латинские буквы (a-z). Пробелы и другие символы запрещены.",
    alphanum: "В этом поле можно использовать только латинские буквы (a-z) и цифры (0-9). Пробелы и другие символы запрещены.",
    dateSuchAs: "Пожалуйста, введите корректную дату {date}",
    dateInFormatMDY: 'Пожалуйста, введите дату в формате ММ/ДД/ГГГГ (например "12/31/1999")',
    email: 'Пожалуйста, введите корректный емейл-адрес. Для примера "fred@domain.com".',
    url: "Пожалуйста, введите правильную ссылку вида http://www.example.com.",
    currencyDollar: "Пожалуйста, введите сумму в долларах. Например: $100.00 .",
    oneRequired: "Пожалуйста, выберите хоть что-нибудь в одном из этих полей.",
    errorPrefix: "Ошибка: ",
    warningPrefix: "Внимание: "
});
(function () {
    var a = function (f, d, c, e, b) {
        return (f >= 1 && f <= 3) ? arguments[f] : b;
    };
    Locale.define("si-SI", "Date", {
        months: ["januar", "februar", "marec", "april", "maj", "junij", "julij", "avgust", "september", "oktober", "november", "december"],
        months_abbr: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"],
        days: ["nedelja", "ponedeljek", "torek", "sreda", "četrtek", "petek", "sobota"],
        days_abbr: ["ned", "pon", "tor", "sre", "čet", "pet", "sob"],
        dateOrder: ["date", "month", "year"],
        shortDate: "%d.%m.%Y",
        shortTime: "%H.%M",
        AM: "AM",
        PM: "PM",
        firstDayOfWeek: 1,
        ordinal: ".",
        lessThanMinuteAgo: "manj kot minuto nazaj",
        minuteAgo: "minuto nazaj",
        minutesAgo: function (b) {
            return "{delta} " + a(b, "minuto", "minuti", "minute", "minut") + " nazaj";
        },
        hourAgo: "uro nazaj",
        hoursAgo: function (b) {
            return "{delta} " + a(b, "uro", "uri", "ure", "ur") + " nazaj";
        },
        dayAgo: "dan nazaj",
        daysAgo: function (b) {
            return "{delta} " + a(b, "dan", "dneva", "dni", "dni") + " nazaj";
        },
        weekAgo: "teden nazaj",
        weeksAgo: function (b) {
            return "{delta} " + a(b, "teden", "tedna", "tedne", "tednov") + " nazaj";
        },
        monthAgo: "mesec nazaj",
        monthsAgo: function (b) {
            return "{delta} " + a(b, "mesec", "meseca", "mesece", "mesecov") + " nazaj";
        },
        yearthAgo: "leto nazaj",
        yearsAgo: function (b) {
            return "{delta} " + a(b, "leto", "leti", "leta", "let") + " nazaj";
        },
        lessThanMinuteUntil: "še manj kot minuto",
        minuteUntil: "še minuta",
        minutesUntil: function (b) {
            return "še {delta} " + a(b, "minuta", "minuti", "minute", "minut");
        },
        hourUntil: "še ura",
        hoursUntil: function (b) {
            return "še {delta} " + a(b, "ura", "uri", "ure", "ur");
        },
        dayUntil: "še dan",
        daysUntil: function (b) {
            return "še {delta} " + a(b, "dan", "dneva", "dnevi", "dni");
        },
        weekUntil: "še tedn",
        weeksUntil: function (b) {
            return "še {delta} " + a(b, "teden", "tedna", "tedni", "tednov");
        },
        monthUntil: "še mesec",
        monthsUntil: function (b) {
            return "še {delta} " + a(b, "mesec", "meseca", "meseci", "mesecov");
        },
        yearUntil: "še leto",
        yearsUntil: function (b) {
            return "še {delta} " + a(b, "leto", "leti", "leta", "let");
        }
    });
})();
Locale.define("si-SI", "FormValidator", {
    required: "To polje je obvezno",
    minLength: "Prosim, vnesite vsaj {minLength} znakov (vnesli ste {length} znakov).",
    maxLength: "Prosim, ne vnesite več kot {maxLength} znakov (vnesli ste {length} znakov).",
    integer: "Prosim, vnesite celo število. Decimalna števila (kot 1,25) niso dovoljena.",
    numeric: 'Prosim, vnesite samo numerične vrednosti (kot "1" ali "1.1" ali "-1" ali "-1.1").',
    digits: "Prosim, uporabite številke in ločila le na tem polju (na primer, dovoljena je telefonska številka z pomišlaji ali pikami).",
    alpha: "Prosim, uporabite le črke v tem plju. Presledki in drugi znaki niso dovoljeni.",
    alphanum: "Prosim, uporabite samo črke ali številke v tem polju. Presledki in drugi znaki niso dovoljeni.",
    dateSuchAs: "Prosim, vnesite pravilen datum kot {date}",
    dateInFormatMDY: 'Prosim, vnesite pravilen datum kot MM.DD.YYYY (primer "12.31.1999")',
    email: 'Prosim, vnesite pravilen email naslov. Na primer "fred@domain.com".',
    url: "Prosim, vnesite pravilen URL kot http://www.example.com.",
    currencyDollar: "Prosim, vnesit epravilno vrednost €. Primer 100,00€ .",
    oneRequired: "Prosimo, vnesite nekaj za vsaj eno izmed teh polj.",
    errorPrefix: "Napaka: ",
    warningPrefix: "Opozorilo: ",
    noSpace: "To vnosno polje ne dopušča presledkov.",
    reqChkByNode: "Nič niste izbrali.",
    requiredChk: "To polje je obvezno",
    reqChkByName: "Prosim, izberite {label}.",
    match: "To polje se mora ujemati z poljem {matchName}",
    startDate: "datum začetka",
    endDate: "datum konca",
    currendDate: "trenuten datum",
    afterDate: "Datum bi moral biti isti ali po {label}.",
    beforeDate: "Datum bi moral biti isti ali pred {label}.",
    startMonth: "Prosim, vnesite začetni datum",
    sameMonth: "Ta dva datuma morata biti v istem mesecu - premeniti morate eno ali drugo.",
    creditcard: "Številka kreditne kartice ni pravilna. Preverite številko ali poskusite še enkrat. Vnešenih {length} znakov."
});
Locale.define("sv-SE", "Date", {
    months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
    months_abbr: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    days: ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"],
    days_abbr: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y-%m-%d",
    shortTime: "%H:%M",
    AM: "",
    PM: "",
    firstDayOfWeek: 1,
    ordinal: "",
    lessThanMinuteAgo: "mindre än en minut sedan",
    minuteAgo: "ungefär en minut sedan",
    minutesAgo: "{delta} minuter sedan",
    hourAgo: "ungefär en timme sedan",
    hoursAgo: "ungefär {delta} timmar sedan",
    dayAgo: "1 dag sedan",
    daysAgo: "{delta} dagar sedan",
    lessThanMinuteUntil: "mindre än en minut sedan",
    minuteUntil: "ungefär en minut sedan",
    minutesUntil: "{delta} minuter sedan",
    hourUntil: "ungefär en timme sedan",
    hoursUntil: "ungefär {delta} timmar sedan",
    dayUntil: "1 dag sedan",
    daysUntil: "{delta} dagar sedan"
});
Locale.define("sv-SE", "FormValidator", {
    required: "Fältet är obligatoriskt.",
    minLength: "Ange minst {minLength} tecken (du angav {length} tecken).",
    maxLength: "Ange högst {maxLength} tecken (du angav {length} tecken). ",
    integer: "Ange ett heltal i fältet. Tal med decimaler (t.ex. 1,25) är inte tillåtna.",
    numeric: 'Ange endast numeriska värden i detta fält (t.ex. "1" eller "1.1" eller "-1" eller "-1,1").',
    digits: "Använd endast siffror och skiljetecken i detta fält (till exempel ett telefonnummer med bindestreck tillåtet).",
    alpha: "Använd endast bokstäver (a-ö) i detta fält. Inga mellanslag eller andra tecken är tillåtna.",
    alphanum: "Använd endast bokstäver (a-ö) och siffror (0-9) i detta fält. Inga mellanslag eller andra tecken är tillåtna.",
    dateSuchAs: "Ange ett giltigt datum som t.ex. {date}",
    dateInFormatMDY: 'Ange ett giltigt datum som t.ex. YYYY-MM-DD (i.e. "1999-12-31")',
    email: 'Ange en giltig e-postadress. Till exempel "erik@domain.com".',
    url: "Ange en giltig webbadress som http://www.example.com.",
    currencyDollar: "Ange en giltig belopp. Exempelvis 100,00.",
    oneRequired: "Vänligen ange minst ett av dessa alternativ.",
    errorPrefix: "Fel: ",
    warningPrefix: "Varning: ",
    noSpace: "Det får inte finnas några mellanslag i detta fält.",
    reqChkByNode: "Inga objekt är valda.",
    requiredChk: "Detta är ett obligatoriskt fält.",
    reqChkByName: "Välj en {label}.",
    match: "Detta fält måste matcha {matchName}",
    startDate: "startdatumet",
    endDate: "slutdatum",
    currendDate: "dagens datum",
    afterDate: "Datumet bör vara samma eller senare än {label}.",
    beforeDate: "Datumet bör vara samma eller tidigare än {label}.",
    startMonth: "Välj en start månad",
    sameMonth: "Dessa två datum måste vara i samma månad - du måste ändra det ena eller det andra."
});
(function () {
    var a = function (j, e, c, i, b) {
        var h = (j / 10).toInt(), g = j % 10, f = (j / 100).toInt();
        if (h == 1 && j > 10) {
            return i;
        }
        if (g == 1) {
            return e;
        }
        if (g > 0 && g < 5) {
            return c;
        }
        return i;
    };
    Locale.define("uk-UA", "Date", {
        months: ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"],
        months_abbr: ["Січ", "Лют", "Бер", "Квіт", "Трав", "Черв", "Лип", "Серп", "Вер", "Жовт", "Лист", "Груд"],
        days: ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"],
        days_abbr: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        dateOrder: ["date", "month", "year"],
        shortDate: "%d/%m/%Y",
        shortTime: "%H:%M",
        AM: "до полудня",
        PM: "по полудню",
        firstDayOfWeek: 1,
        ordinal: "",
        lessThanMinuteAgo: "меньше хвилини тому",
        minuteAgo: "хвилину тому",
        minutesAgo: function (b) {
            return "{delta} " + a(b, "хвилину", "хвилини", "хвилин") + " тому";
        },
        hourAgo: "годину тому",
        hoursAgo: function (b) {
            return "{delta} " + a(b, "годину", "години", "годин") + " тому";
        },
        dayAgo: "вчора",
        daysAgo: function (b) {
            return "{delta} " + a(b, "день", "дня", "днів") + " тому";
        },
        weekAgo: "тиждень тому",
        weeksAgo: function (b) {
            return "{delta} " + a(b, "тиждень", "тижні", "тижнів") + " тому";
        },
        monthAgo: "місяць тому",
        monthsAgo: function (b) {
            return "{delta} " + a(b, "місяць", "місяці", "місяців") + " тому";
        },
        yearAgo: "рік тому",
        yearsAgo: function (b) {
            return "{delta} " + a(b, "рік", "роки", "років") + " тому";
        },
        lessThanMinuteUntil: "за мить",
        minuteUntil: "через хвилину",
        minutesUntil: function (b) {
            return "через {delta} " + a(b, "хвилину", "хвилини", "хвилин");
        },
        hourUntil: "через годину",
        hoursUntil: function (b) {
            return "через {delta} " + a(b, "годину", "години", "годин");
        },
        dayUntil: "завтра",
        daysUntil: function (b) {
            return "через {delta} " + a(b, "день", "дня", "днів");
        },
        weekUntil: "через тиждень",
        weeksUntil: function (b) {
            return "через {delta} " + a(b, "тиждень", "тижні", "тижнів");
        },
        monthUntil: "через місяць",
        monthesUntil: function (b) {
            return "через {delta} " + a(b, "місяць", "місяці", "місяців");
        },
        yearUntil: "через рік",
        yearsUntil: function (b) {
            return "через {delta} " + a(b, "рік", "роки", "років");
        }
    });
})();
Locale.define("uk-UA", "FormValidator", {
    required: "Це поле повинне бути заповненим.",
    minLength: "Введіть хоча б {minLength} символів (Ви ввели {length}).",
    maxLength: "Кількість символів не може бути більше {maxLength} (Ви ввели {length}).",
    integer: "Введіть в це поле число. Дробові числа (наприклад 1.25) не дозволені.",
    numeric: 'Введіть в це поле число (наприклад "1" або "1.1", або "-1", або "-1.1").',
    digits: "В цьому полі ви можете використовувати лише цифри і знаки пунктіації (наприклад, телефонний номер з знаками дефізу або з крапками).",
    alpha: "В цьому полі можна використовувати лише латинські літери (a-z). Пробіли і інші символи заборонені.",
    alphanum: "В цьому полі можна використовувати лише латинські літери (a-z) і цифри (0-9). Пробіли і інші символи заборонені.",
    dateSuchAs: "Введіть коректну дату {date}.",
    dateInFormatMDY: 'Введіть дату в форматі ММ/ДД/РРРР (наприклад "12/31/2009").',
    email: 'Введіть коректну адресу електронної пошти (наприклад "name@domain.com").',
    url: "Введіть коректне інтернет-посилання (наприклад http://www.example.com).",
    currencyDollar: 'Введіть суму в доларах (наприклад "$100.00").',
    oneRequired: "Заповніть одне з полів.",
    errorPrefix: "Помилка: ",
    warningPrefix: "Увага: ",
    noSpace: "Пробіли заборонені.",
    reqChkByNode: "Не відмічено жодного варіанту.",
    requiredChk: "Це поле повинне бути віміченим.",
    reqChkByName: "Будь ласка, відмітьте {label}.",
    match: "Це поле повинно відповідати {matchName}",
    startDate: "початкова дата",
    endDate: "кінцева дата",
    currendDate: "сьогоднішня дата",
    afterDate: "Ця дата повинна бути такою ж, або пізнішою за {label}.",
    beforeDate: "Ця дата повинна бути такою ж, або ранішою за {label}.",
    startMonth: "Будь ласка, виберіть початковий місяць",
    sameMonth: "Ці дати повинні відноситись одного і того ж місяця. Будь ласка, змініть одну з них.",
    creditcard: "Номер кредитної карти введений неправильно. Будь ласка, перевірте його. Введено {length} символів."
});
Locale.define("zh-CHS", "Date", {
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    months_abbr: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
    days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    days_abbr: ["日", "一", "二", "三", "四", "五", "六"],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y-%m-%d",
    shortTime: "%I:%M%p",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "",
    lessThanMinuteAgo: "不到1分钟前",
    minuteAgo: "大约1分钟前",
    minutesAgo: "{delta}分钟之前",
    hourAgo: "大约1小时前",
    hoursAgo: "大约{delta}小时前",
    dayAgo: "1天前",
    daysAgo: "{delta}天前",
    weekAgo: "1星期前",
    weeksAgo: "{delta}星期前",
    monthAgo: "1个月前",
    monthsAgo: "{delta}个月前",
    yearAgo: "1年前",
    yearsAgo: "{delta}年前",
    lessThanMinuteUntil: "从现在开始不到1分钟",
    minuteUntil: "从现在开始約1分钟",
    minutesUntil: "从现在开始约{delta}分钟",
    hourUntil: "从现在开始1小时",
    hoursUntil: "从现在开始约{delta}小时",
    dayUntil: "从现在开始1天",
    daysUntil: "从现在开始{delta}天",
    weekUntil: "从现在开始1星期",
    weeksUntil: "从现在开始{delta}星期",
    monthUntil: "从现在开始一个月",
    monthsUntil: "从现在开始{delta}个月",
    yearUntil: "从现在开始1年",
    yearsUntil: "从现在开始{delta}年"
});
Locale.define("zh-CHT", "Date", {
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    months_abbr: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
    days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    days_abbr: ["日", "一", "二", "三", "四", "五", "六"],
    dateOrder: ["year", "month", "date"],
    shortDate: "%Y-%m-%d",
    shortTime: "%I:%M%p",
    AM: "AM",
    PM: "PM",
    firstDayOfWeek: 1,
    ordinal: "",
    lessThanMinuteAgo: "不到1分鐘前",
    minuteAgo: "大約1分鐘前",
    minutesAgo: "{delta}分鐘之前",
    hourAgo: "大約1小時前",
    hoursAgo: "大約{delta}小時前",
    dayAgo: "1天前",
    daysAgo: "{delta}天前",
    weekAgo: "1星期前",
    weeksAgo: "{delta}星期前",
    monthAgo: "1个月前",
    monthsAgo: "{delta}个月前",
    yearAgo: "1年前",
    yearsAgo: "{delta}年前",
    lessThanMinuteUntil: "從現在開始不到1分鐘",
    minuteUntil: "從現在開始約1分鐘",
    minutesUntil: "從現在開始約{delta}分鐘",
    hourUntil: "從現在開始1小時",
    hoursUntil: "從現在開始約{delta}小時",
    dayUntil: "從現在開始1天",
    daysUntil: "從現在開始{delta}天",
    weekUntil: "從現在開始1星期",
    weeksUntil: "從現在開始{delta}星期",
    monthUntil: "從現在開始一個月",
    monthsUntil: "從現在開始{delta}個月",
    yearUntil: "從現在開始1年",
    yearsUntil: "從現在開始{delta}年"
});
Locale.define("zh-CHS", "FormValidator", {
    required: "此项必填。",
    minLength: "请至少输入 {minLength} 个字符 (已输入 {length} 个)。",
    maxLength: "最多只能输入 {maxLength} 个字符 (已输入 {length} 个)。",
    integer: '请输入一个整数，不能包含小数点。例如："1", "200"。',
    numeric: '请输入一个数字，例如："1", "1.1", "-1", "-1.1"。',
    digits: "请输入由数字和标点符号组成的内容。例如电话号码。",
    alpha: "请输入 A-Z 的 26 个字母，不能包含空格或任何其他字符。",
    alphanum: "请输入 A-Z 的 26 个字母或 0-9 的 10 个数字，不能包含空格或任何其他字符。",
    dateSuchAs: "请输入合法的日期格式，如：{date}。",
    dateInFormatMDY: '请输入合法的日期格式，例如：YYYY-MM-DD ("2010-12-31")。',
    email: '请输入合法的电子信箱地址，例如："fred@domain.com"。',
    url: "请输入合法的 Url 地址，例如：http://www.example.com。",
    currencyDollar: "请输入合法的货币符号，例如：￥100.0",
    oneRequired: "请至少选择一项。",
    errorPrefix: "错误：",
    warningPrefix: "警告：",
    noSpace: "不能包含空格。",
    reqChkByNode: "未选择任何内容。",
    requiredChk: "此项必填。",
    reqChkByName: "请选择 {label}.",
    match: "必须与{matchName}相匹配",
    startDate: "起始日期",
    endDate: "结束日期",
    currendDate: "当前日期",
    afterDate: "日期必须等于或晚于 {label}.",
    beforeDate: "日期必须早于或等于 {label}.",
    startMonth: "请选择起始月份",
    sameMonth: "您必须修改两个日期中的一个，以确保它们在同一月份。",
    creditcard: "您输入的信用卡号码不正确。当前已输入{length}个字符。"
});
Locale.define("zh-CHT", "FormValidator", {
    required: "此項必填。 ",
    minLength: "請至少輸入{minLength} 個字符(已輸入{length} 個)。 ",
    maxLength: "最多只能輸入{maxLength} 個字符(已輸入{length} 個)。 ",
    integer: '請輸入一個整數，不能包含小數點。例如："1", "200"。 ',
    numeric: '請輸入一個數字，例如："1", "1.1", "-1", "-1.1"。 ',
    digits: "請輸入由數字和標點符號組成的內容。例如電話號碼。 ",
    alpha: "請輸入AZ 的26 個字母，不能包含空格或任何其他字符。 ",
    alphanum: "請輸入AZ 的26 個字母或0-9 的10 個數字，不能包含空格或任何其他字符。 ",
    dateSuchAs: "請輸入合法的日期格式，如：{date}。 ",
    dateInFormatMDY: '請輸入合法的日期格式，例如：YYYY-MM-DD ("2010-12-31")。 ',
    email: '請輸入合法的電子信箱地址，例如："fred@domain.com"。 ',
    url: "請輸入合法的Url 地址，例如：http://www.example.com。 ",
    currencyDollar: "請輸入合法的貨幣符號，例如：￥100.0",
    oneRequired: "請至少選擇一項。 ",
    errorPrefix: "錯誤：",
    warningPrefix: "警告：",
    noSpace: "不能包含空格。 ",
    reqChkByNode: "未選擇任何內容。 ",
    requiredChk: "此項必填。 ",
    reqChkByName: "請選擇 {label}.",
    match: "必須與{matchName}相匹配",
    startDate: "起始日期",
    endDate: "結束日期",
    currendDate: "當前日期",
    afterDate: "日期必須等於或晚於{label}.",
    beforeDate: "日期必須早於或等於{label}.",
    startMonth: "請選擇起始月份",
    sameMonth: "您必須修改兩個日期中的一個，以確保它們在同一月份。 ",
    creditcard: "您輸入的信用卡號碼不正確。當前已輸入{length}個字符。 "
});
Form.Validator.add("validate-currency-yuan", {
    errorMsg: function () {
        return Form.Validator.getMsg("currencyYuan");
    }, test: function (a) {
        return Form.Validator.getValidator("IsEmpty").test(a) || (/^￥?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(a.get("value"));
    }
});


// test
var CI = (CI) ? CI : {};
CI.StyleableSelective = (CI.StyleableSelective) ? CI.StyleableSelective : {};

// inis n selectboxes
CI.StyleableSelective.Lists = function (selectBoxes, options) {
    "use strict";
    var substitutes = [];
    selectBoxes.each(function (selectBox) {
        substitutes = CI.StyleableSelective.instances.include(new CI.StyleableSelective.List(selectBox, options));
    });
};
// inis n linked selectboxes
CI.StyleableSelective.LinkedLists = new Class({
    "use strict";
Implements: Events,

    initialize
:
function (selectBoxes, options) {
    this.options = options;
    this.selectBoxes = selectBoxes;

    if (this.options.onSelected) {
        this.selectedEventFunction = this.options.onSelected;
        this.options.onSelected = 'undefined';
        this.addEvent('selected', this.selectedEventFunction);
    }

    this.substitutes = this.getSubstitutes();

    return this;
}
,
getSubstitutes: function () {
    var substitutes = [];
    this.selectBoxes.each(function (selectBox) {
        var substitute = new CI.StyleableSelective.List(selectBox, this.options);

        substitute.addEvent('selected', this.updateLinkedLists.bind(this));

        substitutes.push(substitute);
    }.bind(this));

    return substitutes;
}
,
updateLinkedLists: function () {
    var newSelectedIndex = arguments[0].selectedIndex;
    this.substitutes.each(function (list) {
        list.sync(newSelectedIndex);
    });
    this.fireEvent('selected');
}
})
;

/* Description: Substitutes selectlists with styleable js powered markup
 *
 */
CI.StyleableSelective.List = new Class({
    "use strict";
Implements: [Options, Events],

    options
:
{
    /*
     onInited: $empty,
     onOpened: $empty,
     onCLosed: $empty,
     onSelected: $empty,  
     */
    substituteMarkup: 'div.substituteMarkup',
        selectedOption
:
    'span.selectedOption',
        toggleBtn
:
    'button.toggleBtn',
        optionsList
:
    'ul.optionsList',
        option
:
    'li',
        selectedOptionClass
:
    'selected',

        variableWidth
:
    true,
        fixedWidthAdjustment
:
    24
}
,
initialize: function (selectBox, options) {
    this.setOptions(options);

    this.selectBox = selectBox.store('object', this);
    this.selectedIndex = this.selectBox.selectedIndex;
    this.value = this.getValue();

    // selectBox substitute
    this.substitute = {};
    this.substitute.box = this.makeSubstitute().store('object', this);
    this.substitute.button = this.substitute.box.getElement('button');
    this.substitute.list = this.substitute.box.getElement(this.options.optionsList);
    this.substitute.options = this.substitute.list.getElements('li');

    this.charMap = this.getcharMap();

    // insert substitute markup into DOM
    this.selectBox.grab(this.substitute.box, 'after');

    // playing with widths
    if (this.options.variableWidth) {
        this.addEvents({
            'opened': this.equalizeSubstituteWidth.bind(this),
            // equalize width of subtitute box and option list if list is opened
            'closed': this.resetSubstituteWidth.bind(this) // reset width if list is closed
        });
    } else {
        this.setWidth();
    }
    // attach events
    this.attach();

    this.fireEvent('onInited', this);
}
,
attach: function () {
    this.bound = {
        hideList: this.hideList.bind(this),
        showList: this.showList.bind(this),
        selectOnKeys: this.selectOnKeys.bind(this),
        navigateOptionList: this.navigateOptionList.bind(this)
    };

    // DOM-Events
    this.substitute.box.addEvents({
        'click:once': this.toggleVisibilityOfOptionsList.bind(this),
        // open optionlist on click once
        'click:relay(li)': this.select.bind(this) // select hovered option on click
    });
    this.substitute.list.addEvents({
        'mouseenter': this.removeSelectedClass.bind(this),
        // the selected Option is visually marked. If the mouse hovers the optionlist remove mark.
        'mouseleave': this.addSelectedClass.bind(this) // if the mouse leaves the option list remark the selected option.
    });
    this.substitute.button.addEvents({
        'focus': function () {
            this.substitute.box.addClass('focus');
            this.substitute.box.addEvent('keydown', this.bound.navigateOptionList);
        }.bind(this),
        'blur': function () {
            this.substitute.box.removeClass('focus');
            this.substitute.box.removeEvent('keydown', this.bound.navigateOptionList);
            this.hideList();
        }.bind(this)

    });

    // Class Events
    this.addEvents({
        'opened:pause(10)': function () {
            document.getElement('body').addEvent('click:once', this.bound.hideList); // global hide optionlist on click once
            this.substitute.box.addEvent('keydown', this.bound.selectOnKeys);
            console.log('opened');
        },
        'closed:pause(10)': function () {
            this.substitute.box.addEvent('click:once', this.bound.showList); // open optionlist on click once
            this.substitute.box.removeEvent('keydown', this.bound.selectOnKeys);
            console.log('closed');
        }
    });

}
,
navigateOptionList: function (event) {
    var key = event.key,
        newSelectedIndex = this.selectedIndex;

    if (key == 'down' || key == 'up') {
        event.preventDefault();
        if (!this.substitute.list.isVisible()) {
            this.showList();
        }
    }
    if (key == 'down') {
        if (this.selectedIndex + 1 > this.substitute.options.length - 1) {
            newSelectedIndex = 0;
        } else {
            newSelectedIndex = this.selectedIndex + 1;
        }
    }
    if (key == 'up') {
        if (this.selectedIndex - 1 < 0) {
            newSelectedIndex = this.substitute.options.length - 1;
        } else {
            newSelectedIndex = this.selectedIndex - 1;
        }
    }
    this.update(newSelectedIndex);

    console.log(event.key);
}
,
getcharMap: function () {
    var charMap = {};

    this.substitute.options.each(function (option) {
        var value = option.get('text');
        this.addCharToMap(charMap, value, option);
    }.bind(this));

    return charMap;
}
,
addCharToMap: function (point, value, option) {
    var charAt = value.charAt(0).toLowerCase(),
        newPoint,
        newValue;

    if (value.length !== 0) {
        if (point[charAt]) {
            point[charAt].options.push(option);
            newPoint = point[charAt];
        } else {
            newPoint = point[charAt] = {options: [option]};
        }
        newValue = value.slice(1);
        this.addCharToMap(newPoint, newValue, option);
    } else {
        return;
    }
}
,
selectOnKeys: function (event) {
    var key = event.key,
        newSelectedIndex;

    if (!this.index) {
        this.index = 0;
    }

    if (this.reset) {
        clearTimeout(this.reset);
    }
    this.reset = this.resetPoint.delay(1000, this);

    if (key == 'enter') {
        this.fireEvent('selected', this);
    }
    if (!key.test(/[^A-Za-z0-9]/)) {
        return;
    }

    if (!this.point) {
        this.point = this.charMap;
    }

    if (this.point[key]) {
        this.prevPoint = this.point;
        this.point = this.point[key];
        newSelectedIndex = this.point.options[0].retrieve('index');
        console.log(newSelectedIndex);
        this.update(newSelectedIndex);
        console.log(key);
    } else {
        if (this.prevPoint[key]) {
            this.point = this.prevPoint[key];
            console.log(this.point);
            if (this.point.options.length - 1 >= this.index + 1) {
                console.log(this.point.options.length, this.index);
                this.index++;
            } else {
                this.index = 0;
            }
            newSelectedIndex = this.point.options[this.index].retrieve('index');
            this.update(newSelectedIndex);
            console.log(key);
        }
    }

}
,
resetPoint: function () {
    this.point = this.charMap;
    console.log('timeout', this.point);
}
,
// select the clicked option, update data and syncronize original selectbox
select: function (event) {
    var clickedOption = (typeof event == 'object') ? event.target.retrieve('index') : event,
        newSelectedIndex = clickedOption;

    this.update(newSelectedIndex);
    this.fireEvent('selected', this);
}
,
sync: function (newSelectedIndex) {
    if (this.selectedIndex != newSelectedIndex) {
        this.update(newSelectedIndex);
    }
}
,
update: function (newSelectedIndex) {
    this.oldSelectedIndex = this.selectedIndex;
    this.selectedIndex = newSelectedIndex;

    this.syncSelectBox(); // syncronize original selectbox
    this.syncSubstitute(); // syncronize Substitute
    this.equalizeSubstituteWidth();
}
,
// syncronize original selectbox
syncSelectBox: function () {
    this.selectBox.selectedIndex = this.selectedIndex;
    this.value = this.getValue();
}
,
// set new selected option in option list
syncSubstitute: function () {
    this.substitute.options[this.oldSelectedIndex].removeClass(this.options.selectedOptionClass);
    this.substitute.options[this.selectedIndex].addClass(this.options.selectedOptionClass);
    this.substitute.box.getElement(this.options.selectedOption).set('text', this.value);
}
,
getValue: function () {
    return this.selectBox.value || this.selectBox.getElements('option')[this.selectedIndex].get('text');
}
,
// set fixed Width for substitute box
setWidth: function () {
    var substituteWidth = this.substitute.box.clientWidth,
        substituteListWidth = this.getSubstituteListClientWidth();

    if (substituteWidth < substituteListWidth) {
        var adjust = substituteListWidth + this.options.fixedWidthAdjustment;
        this.substitute.box.setStyle('width', adjust);
        if (substituteListWidth < adjust) {
            this.substitute.list.setStyle('width', adjust);
        }
    }
}
,
getSubstituteListClientWidth: function () {
    var substituteListClientWidth;

    this.substitute.list.show();
    substituteListClientWidth = this.substitute.list.clientWidth;
    this.substitute.list.hide();

    return substituteListClientWidth;
}
,

// equalize width of subtitute box and option list if list is opened
equalizeSubstituteWidth: function () {
    if (this.substitute.box.clientWidth < this.substitute.list.clientWidth) {
        this.originalSubstituteWidth = this.substitute.box.clientWidth;
        this.substitute.box.setStyle('width', this.substitute.list.clientWidth);
    } else {
        this.originalListWidth = this.substitute.list.clientWidth;
        this.substitute.list.setStyle('width', this.substitute.box.clientWidth);
    }
}
,
// reset substitute width if option list is closed
resetSubstituteWidth: function () {
    if (this.originalSubstituteWidth) {
        this.substitute.box.setStyle('width', 'auto');
    }
    if (this.originalListWidth) {
        this.substitute.list.setStyle('width', 'auto');
    }
}
,
// removes the selected option marker from an option in the option list
removeSelectedClass: function () {
    this.substitute.options[this.selectedIndex].removeClass(this.options.selectedOptionClass);
}
,
// adds the selected option marker to an option in the option list
addSelectedClass: function () {
    this.substitute.options[this.selectedIndex].addClass(this.options.selectedOptionClass);
}
,
// if option list is visible hide it else show it
toggleVisibilityOfOptionsList: function () {
    if (this.substitute.list.isVisible()) {
        this.hideList();
    } else {
        this.showList();
    }
}
,
showList: function () {
    this.substitute.list.show();
    this.fireEvent('opened');
}
,
hideList: function () {
    this.substitute.list.hide();
    this.fireEvent('closed');
}
,
// inquire and return the subtitutes selected option
getSelectedLi: function () {
    var selectedLi;
    this.substitute.box.getElements('li').each(function (li) {
        if (li.hasClass(this.options.selectedOptionClass)) {
            selectedLi = li;
        }
    }.bind(this));
    return selectedLi;
}
,
// inquire and return the selected option by using the selected index of the select box
getSelectedOption: function (selectBox) {
    var index = selectBox.selectedIndex;
    return selectBox.getElements('option')[index];
}
,
// create and return substitute markup
makeSubstitute: function () {
    var substituteMarkup = new Element(this.options.substituteMarkup),
        selectedOption = new Element(this.options.selectedOption, {
            text: this.value
        }),
        toggleBtn = new Element(this.options.toggleBtn, {
            html: '<span>&bull;</span>',
            type: 'button'
        }),
        optionsList = new Element(this.options.optionsList);

    this.getOptionsMarkup(optionsList);

    return substituteMarkup.adopt(selectedOption, toggleBtn, optionsList);
}
,
// create list elements for the option list of the substitute
getOptionsMarkup: function (optionsList) {
    this.selectBox.getElements('option').each(function (option, index) {
        var optionMarkup = new Element(this.options.option, {
            text: option.get('text') || option.get('value')
        });
        if (this.selectedIndex == index) {
            optionMarkup.addClass(this.options.selectedOptionClass);
        }
        optionMarkup.store('index', index);
        optionsList.grab(optionMarkup);
    }.bind(this));
}
})
;

window.addEvent('domready', function () {
    "use strict";
    CI.StyleableSelective.instances = [];

    CI.StyleableSelective.instances.push(new CI.StyleableSelective.List(document.getElement('#oneList'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));
    CI.StyleableSelective.instances.push(new CI.StyleableSelective.List(document.getElement('#ajax'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        },
        onSelected: function () {
            this.selectBox.getParent('form').send();
        }
    }));
    CI.StyleableSelective.instances.push(CI.StyleableSelective.Lists(document.getElements('select.substitute'), {
        variableWidth: false,
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));
    CI.StyleableSelective.instances.push(new CI.StyleableSelective.LinkedLists(document.getElements('select.linkedSubstitute'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));

    CI.StyleableSelective.instances.push(new CI.StyleableSelective.LinkedLists(document.getElements('select.linkedSubstituteAjax'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        },
        onSelected: function () {
            this.selectBoxes.pick().getParent('form').send();
        }
    }));

    CI.StyleableSelective.instances.flatten();
});