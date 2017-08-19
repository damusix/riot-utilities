(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _prettifier = require('./lib/prettifier');

var Beautify = _interopRequireWildcard(_prettifier);

var _observer = require('./lib/observer');

var _actionForms = require('./lib/action-forms');

var ActionForms = _interopRequireWildcard(_actionForms);

require('./tags');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var RiotUtils = {

    Observer: _observer.Observer,
    ActionForms: ActionForms,
    Beautify: Beautify
};

global.RiotUtils = RiotUtils;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/action-forms":4,"./lib/observer":6,"./lib/prettifier":7,"./tags":12}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bindField = bindField;

var _observer = require('../observer');

var _utils = require('./utils');

var classes = _utils.config.classes;

/**
 * Adds validation functionality to form fields
 * to display errors and help fields. Binds field with
 * Riot Observable and gives elements event features.
 *
 * @param { HTMLFormElement } field - Field whose parent we will return
 * @param { Object } validations - Parent form validation object
 *
 */
function bindField(field, validations) {

    var parent = (0, _utils.findFieldContainer)(field, classes.container || '.field');

    var name = field.getAttribute('name');
    var type = field.getAttribute('type');
    var required = field.getAttribute('required') !== undefined;

    // Formatting function
    var format = field.getAttribute('format');

    // Validation function
    // input[data-validate] should be a function in
    var validate = field.getAttribute('validate');

    // Match value against another element
    // Should be a CSS selector
    var equals = field.getAttribute('equals');

    // Custom regular expression
    var regex = field.getAttribute('regex');

    // Events to bind to
    var on = field.getAttribute('on') || 'change';

    // Input validation object to handle multiple methods
    var validation = {};

    var isValid = false;

    if (field.getAttribute('disabled') || type === 'hidden') {

        return;
    }

    (0, _observer.Observer)(field);

    // Form validation object
    validations[name] = isValid;

    if (format) {

        (0, _utils.formatValue)(format, field);
    }

    var validateFn = function validateFn(e) {

        var keyCode = window.event ? e.which : e.keyCode;
        var isBlur = e.type === 'blur';
        var value = field.value;
        var empty = !value.length;

        // If it's required, it can't be empty
        if (required) {

            validation.required = !!value;

            if (type === 'checkbox') {

                validation.checked = field.checked;
            }
        }

        // Assert against existing validation function
        if (validate) {

            validation.validate = (0, _utils.validateRegex)(value, validate);
        }

        // Assert against custom regex
        if (regex) {

            var rgx = new RegExp(regex);
            validation.regex = rgx.test(value);
        }

        // Assert against another field's value
        if (equals) {

            var equalsElement = field.form.querySelector(equals);

            validation.equals = value === equalsElement.value;

            if (!equalsElement.isValid) {

                equalsElement.trigger('validate', {});
            }
        }

        // Check input validation
        isValid = (0, _utils.confirmValidation)(validation);

        // Input is not required and is empty
        if (!isValid && !required && !value && isBlur) {

            isValid = null;
        }

        validated(isValid);
        return isValid;
    };

    var validated = function validated(isValid) {

        // Bind to validation object for form check
        if (validate || regex || equals || required) {

            validations[name] = isValid;
        }

        // Bind validity to html element
        field.isValid = isValid;

        // If it's valid, remove error classes and hide the help block.
        // This is meant to work with bootstrap forms.
        if (isValid) {

            parent.classList.remove(classes.error);
            parent.classList.add(classes.success);

            parent.querySelector('.' + classes.help).classList.add(classes.hide);
        } else {

            parent.classList.add(classes.error);
            parent.classList.remove(classes.success);

            parent.querySelector('.' + classes.help).classList.remove(classes.hide);
        }

        // Allow fields that are not required
        if (isValid === null) {

            field.setBlank();
        }

        field.trigger('validated');
    };

    // Bind events to validation function
    on.split(' ').map(function (o) {
        return field['on' + o] = validateFn;
    });

    field.on('validate', validateFn);

    var setBlank = function setBlank() {

        parent.classList.remove(classes.success, classes.error, classes.warning, classes.info);
        parent.querySelector('.' + classes.help).classList.add(classes.hide);
    };
}

},{"../observer":6,"./utils":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bind = bind;

var _observer = require('../observer');

var _bindField = require('./bind-field');

var _utils = require('./utils');

function bind(form) {

    var inputs = form.querySelectorAll(_utils.config.elements);
    var submit = form.querySelector('[type=submit]');
    var validations = {};

    form.validations = validations;
    form.isValid = false;
    form.noValidate = true;

    (0, _observer.Observer)(form);

    var validate = function validate() {

        form.isValid = (0, _utils.confirmValidation)(validations);
        return form.isValid;
    };

    var validateAll = function validateAll() {

        return new Promise(function (resolve, reject) {

            function assessSubmit() {

                // Returns true if valid
                if (validate()) {

                    resolve();
                } else {

                    reject();
                }
            }

            inputs.forEach(function (field, i) {

                if (i === inputs.length - 1) {

                    field.one('validated', function () {

                        assessSubmit();
                    });
                }

                field.trigger('validate', {});
            });
        });
    };

    form.on('validate', function () {

        validateAll().then(function () {

            form.trigger('validated');
        });
    });

    form.on('validated', function () {

        if (form.isValid) {

            form.trigger('submitted');
        }
    });

    // When the form is submitting, iterate through all the fields and validate them
    form.onsubmit = function (e) {

        e.preventDefault();

        if (!form.isValid) {

            form.trigger('validate');
        } else {

            form.trigger('validated');
            form.trigger('submitted');
        }
    };

    // Add validation functionality to form elements
    function bindFields() {

        inputs.forEach(function (field) {

            if (!field.on) {

                (0, _bindField.bindField)(field, validations);
            }
        });
    }

    bindFields();

    // Rebind validations in case of new required fields
    if (!form.rebind) {

        form.rebind = function () {

            inputs = form.find(_utils.config.elements);
            bindFields();
        };

        form.on('rebind', form.rebind);
    }

    form.on('reset', function () {

        form.reset();
        form.isValid = false;

        inputs.forEach(function (field) {

            field.setBlank();
        });
    });
};

},{"../observer":6,"./bind-field":2,"./utils":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bindForm = require('./bind-form');

Object.defineProperty(exports, 'bind', {
  enumerable: true,
  get: function get() {
    return _bindForm.bind;
  }
});

var _utils = require('./utils');

Object.keys(_utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _utils[key];
    }
  });
});

},{"./bind-form":3,"./utils":5}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatValue = formatValue;
exports.configure = configure;
exports.validateRegex = validateRegex;
exports.confirmValidation = confirmValidation;
exports.findFieldContainer = findFieldContainer;
var config = exports.config = {

    // Elements to be selected for validation
    elements: '[required],[data-validate],[data-equals],[data-regex],[data-cc]',

    // Regular expressions used to validate
    regexes: {

        alphanum: /^[a-z0-9]+$/i,
        alphanumspace: /^[a-z0-9\s]+$/i,
        name: /^[a-z\s\-\,\.]+$/i,
        username: /^[a-z0-9][a-z0-9\s\-\_\+\.]+[a-z0-9]$/i,
        fqdn: /^[a-z0-9][a-z0-9\-\_\.]+[a-z0-9]{2,20}$/i,
        tld: /^[a-z]{2,20}/i,
        phone: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
        email: /.+@.+\..+/i
    },

    // Feedback, state, and container classes
    classes: {

        container: 'field',
        error: 'error',
        help: 'help',
        hide: 'hide',
        info: 'info',
        success: 'success',
        warning: 'warning'
    },

    // Field formatting functions
    format: {
        cc: function cc() {}
    }

    /*
     * Format a field's value based on functions in `config.format`
     *
     * @param { String } formatFn - Name of function in `config.format`
     * @param { HTMLFormElement } field - Field to format value of
     */
};function formatValue(formatFn, field) {

    if (typeof config.format[formatFn] === 'function') {

        throw TypeError(formatFn + ' does not exist or is not a function');
    }

    field.value = config.format[formatFn](field.value);
}

// Overwrite config
function configure(opts) {

    for (opt in opts) {

        if (config[opt].constructor === Object) {

            config[opt] = Object.assign({}, config[opt], opts[opt]);
        } else {

            config[opt] = opts[opt];
        }
    }
}

/**
 * Validates a value and returns true or false.
 * Throws error if it cannot validate
 *
 * @param { String } value - Value to be validated
 * @param { String | RegExp } rgx - String reference to `regexes` or a RegExp
 *
 * @returns { Boolean }
 */
function validateRegex(value, rgx) {

    // Accepts RegExp as second value
    if (rgx.constructor === RegExp) {

        return rgx.test(value);
    }

    // Second value is a string, so it must exist
    // inside of `config.regexes` object
    if (typeof rgx === 'string' && config.regexes[rgx] !== undefined) {

        return config.regexes[rgx].test(value);
    }

    // If conditions aren't met, throw error
    throw Error('second parameter is an invalid regular expression or does not exist within utilities object');
}

/**
 * Iterates through an object and checks for true or false
 *
 * @param { Object } obj - Object to iterate
 *
 * @returns { Boolean }
 */
function confirmValidation(obj) {

    // Iterate through the object
    for (var v in obj) {

        // And return false if any key is false
        if (obj[v] === false) {

            return false;
        }
    }

    return true;
};

/**
 * Crawls up the DOM starting from the `field` element
 * and finds containing element with class names specified
 * in the `classes` object.
 *
 * @param { HTMLFormElement } field - Field whose parent we will return
 * @param { Object } containerClass - Name of class the container will have
 *
 * @returns { HTMLElement }
 */
function findFieldContainer(field, containerClass) {

    if (field === document.body) {

        throw new Error('Field named ' + field.name + ' is not inside a field container');
    }

    var parent = field.parentElement;

    if (!parent.classList.contains(containerClass)) {

        parent = findFieldContainer(parent, containerClass);
    }

    return parent;
}

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Observer = Observer;
var observable = riot.observable;

var opts = {
    debug: false,
    debugFn: false
};

function Observer(obj) {

    var self = this;

    // Observerable observer for this instance
    var observer = observable();

    // Properties object to rewrap
    var properties = {};

    // Rewrap observer functions for debugging
    ['on', 'one', 'off', 'trigger'].forEach(function (fn) {

        // Simply pass by reference in production
        var execFn = observer[fn];

        // Rewrap and log if debugging
        if (opts.debug) {

            execFn = function execFn() {

                observer[fn].apply(observer[fn], arguments);

                // Hook into function for making debugging tools
                if (opts.debugFn && typeof opts.debugFn === 'function') {

                    var args = Array.prototype.slice.apply(arguments);
                    var action = args.shift();

                    opts.debugFn.apply({}, [obj, fn, action, args]);
                }
            };
        }

        // Make sure those functions cannot be overwritten
        properties[fn] = {
            value: execFn,
            enumerable: false,
            writable: false,
            configurable: false
        };
    });

    Object.defineProperties(obj, properties);
}

Observer.configure = function (obj) {

    Object.assign(opts, obj);
};

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.name = undefined;

var _jsBeautify = require('js-beautify');

Object.keys(_jsBeautify).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _jsBeautify[key];
    }
  });
});
exports.escapeHTML = escapeHTML;
exports.unescapeHTML = unescapeHTML;

var _observer = require('./observer');

var name = exports.name = 'prettifier';

/** Used for escape and unescape HTML. */
var escElement = document.createElement('textarea');

/**
 * Escapes HTML.
 * Used for pretty formatting HTML, CSS and JS to prepare for syntax highlighting.
 * @param {String} html - Valid HTML syntax
 */
function escapeHTML(html) {
  escElement.textContent = html;
  return escElement.innerHTML;
}

/**
 * Unescapes HTML.
 * @param {String} html - Valid HTML syntax,
 */
function unescapeHTML(html) {
  escElement.innerHTML = html;
  return escElement.textContent;
}

(0, _observer.Observer)(module.exports);

},{"./observer":6,"js-beautify":8}],8:[function(require,module,exports){
/*
  The MIT License (MIT)

  Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

*/

/**
The following batches are equivalent:

var beautify_js = require('js-beautify');
var beautify_js = require('js-beautify').js;
var beautify_js = require('js-beautify').js_beautify;

var beautify_css = require('js-beautify').css;
var beautify_css = require('js-beautify').css_beautify;

var beautify_html = require('js-beautify').html;
var beautify_html = require('js-beautify').html_beautify;

All methods returned accept two arguments, the source string and an options object.
**/

function get_beautify(js_beautify, css_beautify, html_beautify) {
    // the default is js
    var beautify = function(src, config) {
        return js_beautify.js_beautify(src, config);
    };

    // short aliases
    beautify.js = js_beautify.js_beautify;
    beautify.css = css_beautify.css_beautify;
    beautify.html = html_beautify.html_beautify;

    // legacy aliases
    beautify.js_beautify = js_beautify.js_beautify;
    beautify.css_beautify = css_beautify.css_beautify;
    beautify.html_beautify = html_beautify.html_beautify;

    return beautify;
}

if (typeof define === "function" && define.amd) {
    // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
    define([
        "./lib/beautify",
        "./lib/beautify-css",
        "./lib/beautify-html"
    ], function(js_beautify, css_beautify, html_beautify) {
        return get_beautify(js_beautify, css_beautify, html_beautify);
    });
} else {
    (function(mod) {
        var js_beautify = require('./lib/beautify');
        var css_beautify = require('./lib/beautify-css');
        var html_beautify = require('./lib/beautify-html');

        mod.exports = get_beautify(js_beautify, css_beautify, html_beautify);

    })(module);
}
},{"./lib/beautify":11,"./lib/beautify-css":9,"./lib/beautify-html":10}],9:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 CSS Beautifier
---------------

    Written by Harutyun Amirjanyan, (amirjanyan@gmail.com)

    Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
        http://jsbeautifier.org/

    Usage:
        css_beautify(source_text);
        css_beautify(source_text, options);

    The options are (default in brackets):
        indent_size (4)                         — indentation size,
        indent_char (space)                     — character to indent with,
        preserve_newlines (default false)       - whether existing line breaks should be preserved,
        selector_separator_newline (true)       - separate selectors with newline or
                                                  not (e.g. "a,\nbr" or "a, br")
        end_with_newline (false)                - end with a newline
        newline_between_rules (true)            - add a new line after every css rule
        space_around_selector_separator (false) - ensure space around selector separators:
                                                  '>', '+', '~' (e.g. "a>b" -> "a > b")
    e.g

    css_beautify(css_source_text, {
      'indent_size': 1,
      'indent_char': '\t',
      'selector_separator': ' ',
      'end_with_newline': false,
      'newline_between_rules': true,
      'space_around_selector_separator': true
    });
*/

// http://www.w3.org/TR/CSS21/syndata.html#tokenization
// http://www.w3.org/TR/css3-syntax/

(function() {

    function mergeOpts(allOptions, targetType) {
        var finalOpts = {};
        var name;

        for (name in allOptions) {
            if (name !== targetType) {
                finalOpts[name] = allOptions[name];
            }
        }


        //merge in the per type settings for the targetType
        if (targetType in allOptions) {
            for (name in allOptions[targetType]) {
                finalOpts[name] = allOptions[targetType][name];
            }
        }
        return finalOpts;
    }

    var lineBreak = /\r\n|[\n\r\u2028\u2029]/;
    var allLineBreaks = new RegExp(lineBreak.source, 'g');

    function css_beautify(source_text, options) {
        options = options || {};

        // Allow the setting of language/file-type specific options
        // with inheritance of overall settings
        options = mergeOpts(options, 'css');

        source_text = source_text || '';

        var newlinesFromLastWSEat = 0;
        var indentSize = options.indent_size ? parseInt(options.indent_size, 10) : 4;
        var indentCharacter = options.indent_char || ' ';
        var preserve_newlines = (options.preserve_newlines === undefined) ? false : options.preserve_newlines;
        var selectorSeparatorNewline = (options.selector_separator_newline === undefined) ? true : options.selector_separator_newline;
        var end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;
        var newline_between_rules = (options.newline_between_rules === undefined) ? true : options.newline_between_rules;
        var space_around_combinator = (options.space_around_combinator === undefined) ? false : options.space_around_combinator;
        space_around_combinator = space_around_combinator || ((options.space_around_selector_separator === undefined) ? false : options.space_around_selector_separator);
        var eol = options.eol ? options.eol : 'auto';

        if (options.indent_with_tabs) {
            indentCharacter = '\t';
            indentSize = 1;
        }

        if (eol === 'auto') {
            eol = '\n';
            if (source_text && lineBreak.test(source_text || '')) {
                eol = source_text.match(lineBreak)[0];
            }
        }

        eol = eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

        // HACK: newline parsing inconsistent. This brute force normalizes the input.
        source_text = source_text.replace(allLineBreaks, '\n');

        // tokenizer
        var whiteRe = /^\s+$/;

        var pos = -1,
            ch;
        var parenLevel = 0;

        function next() {
            ch = source_text.charAt(++pos);
            return ch || '';
        }

        function peek(skipWhitespace) {
            var result = '';
            var prev_pos = pos;
            if (skipWhitespace) {
                eatWhitespace();
            }
            result = source_text.charAt(pos + 1) || '';
            pos = prev_pos - 1;
            next();
            return result;
        }

        function eatString(endChars) {
            var start = pos;
            while (next()) {
                if (ch === "\\") {
                    next();
                } else if (endChars.indexOf(ch) !== -1) {
                    break;
                } else if (ch === "\n") {
                    break;
                }
            }
            return source_text.substring(start, pos + 1);
        }

        function peekString(endChar) {
            var prev_pos = pos;
            var str = eatString(endChar);
            pos = prev_pos - 1;
            next();
            return str;
        }

        function eatWhitespace(preserve_newlines_local) {
            var result = 0;
            while (whiteRe.test(peek())) {
                next();
                if (ch === '\n' && preserve_newlines_local && preserve_newlines) {
                    print.newLine(true);
                    result++;
                }
            }
            newlinesFromLastWSEat = result;
            return result;
        }

        function skipWhitespace() {
            var result = '';
            if (ch && whiteRe.test(ch)) {
                result = ch;
            }
            while (whiteRe.test(next())) {
                result += ch;
            }
            return result;
        }

        function eatComment(singleLine) {
            var start = pos;
            singleLine = peek() === "/";
            next();
            while (next()) {
                if (!singleLine && ch === "*" && peek() === "/") {
                    next();
                    break;
                } else if (singleLine && ch === "\n") {
                    return source_text.substring(start, pos);
                }
            }

            return source_text.substring(start, pos) + ch;
        }


        function lookBack(str) {
            return source_text.substring(pos - str.length, pos).toLowerCase() ===
                str;
        }

        // Nested pseudo-class if we are insideRule
        // and the next special character found opens
        // a new block
        function foundNestedPseudoClass() {
            var openParen = 0;
            for (var i = pos + 1; i < source_text.length; i++) {
                var ch = source_text.charAt(i);
                if (ch === "{") {
                    return true;
                } else if (ch === '(') {
                    // pseudoclasses can contain ()
                    openParen += 1;
                } else if (ch === ')') {
                    if (openParen === 0) {
                        return false;
                    }
                    openParen -= 1;
                } else if (ch === ";" || ch === "}") {
                    return false;
                }
            }
            return false;
        }

        // printer
        var basebaseIndentString = source_text.match(/^[\t ]*/)[0];
        var singleIndent = new Array(indentSize + 1).join(indentCharacter);
        var indentLevel = 0;
        var nestedLevel = 0;

        function indent() {
            indentLevel++;
            basebaseIndentString += singleIndent;
        }

        function outdent() {
            indentLevel--;
            basebaseIndentString = basebaseIndentString.slice(0, -indentSize);
        }

        var print = {};
        print["{"] = function(ch) {
            print.singleSpace();
            output.push(ch);
            if (!eatWhitespace(true)) {
                print.newLine();
            }
        };
        print["}"] = function(newline) {
            if (newline) {
                print.newLine();
            }
            output.push('}');
            if (!eatWhitespace(true)) {
                print.newLine();
            }
        };

        print._lastCharWhitespace = function() {
            return whiteRe.test(output[output.length - 1]);
        };

        print.newLine = function(keepWhitespace) {
            if (output.length) {
                if (!keepWhitespace && output[output.length - 1] !== '\n') {
                    print.trim();
                } else if (output[output.length - 1] === basebaseIndentString) {
                    output.pop();
                }
                output.push('\n');

                if (basebaseIndentString) {
                    output.push(basebaseIndentString);
                }
            }
        };
        print.singleSpace = function() {
            if (output.length && !print._lastCharWhitespace()) {
                output.push(' ');
            }
        };

        print.preserveSingleSpace = function() {
            if (isAfterSpace) {
                print.singleSpace();
            }
        };

        print.trim = function() {
            while (print._lastCharWhitespace()) {
                output.pop();
            }
        };


        var output = [];
        /*_____________________--------------------_____________________*/

        var insideRule = false;
        var insidePropertyValue = false;
        var enteringConditionalGroup = false;
        var top_ch = '';
        var last_top_ch = '';

        while (true) {
            var whitespace = skipWhitespace();
            var isAfterSpace = whitespace !== '';
            var isAfterNewline = whitespace.indexOf('\n') !== -1;
            last_top_ch = top_ch;
            top_ch = ch;

            if (!ch) {
                break;
            } else if (ch === '/' && peek() === '*') { /* css comment */
                var header = indentLevel === 0;

                if (isAfterNewline || header) {
                    print.newLine();
                }

                output.push(eatComment());
                print.newLine();
                if (header) {
                    print.newLine(true);
                }
            } else if (ch === '/' && peek() === '/') { // single line comment
                if (!isAfterNewline && last_top_ch !== '{') {
                    print.trim();
                }
                print.singleSpace();
                output.push(eatComment());
                print.newLine();
            } else if (ch === '@') {
                print.preserveSingleSpace();

                // deal with less propery mixins @{...}
                if (peek() === '{') {
                    output.push(eatString('}'));
                } else {
                    output.push(ch);

                    // strip trailing space, if present, for hash property checks
                    var variableOrRule = peekString(": ,;{}()[]/='\"");

                    if (variableOrRule.match(/[ :]$/)) {
                        // we have a variable or pseudo-class, add it and insert one space before continuing
                        next();
                        variableOrRule = eatString(": ").replace(/\s$/, '');
                        output.push(variableOrRule);
                        print.singleSpace();
                    }

                    variableOrRule = variableOrRule.replace(/\s$/, '');

                    // might be a nesting at-rule
                    if (variableOrRule in css_beautify.NESTED_AT_RULE) {
                        nestedLevel += 1;
                        if (variableOrRule in css_beautify.CONDITIONAL_GROUP_RULE) {
                            enteringConditionalGroup = true;
                        }
                    }
                }
            } else if (ch === '#' && peek() === '{') {
                print.preserveSingleSpace();
                output.push(eatString('}'));
            } else if (ch === '{') {
                if (peek(true) === '}') {
                    eatWhitespace();
                    next();
                    print.singleSpace();
                    output.push("{");
                    print['}'](false);
                    if (newlinesFromLastWSEat < 2 && newline_between_rules && indentLevel === 0) {
                        print.newLine(true);
                    }
                } else {
                    indent();
                    print["{"](ch);
                    // when entering conditional groups, only rulesets are allowed
                    if (enteringConditionalGroup) {
                        enteringConditionalGroup = false;
                        insideRule = (indentLevel > nestedLevel);
                    } else {
                        // otherwise, declarations are also allowed
                        insideRule = (indentLevel >= nestedLevel);
                    }
                }
            } else if (ch === '}') {
                outdent();
                print["}"](true);
                insideRule = false;
                insidePropertyValue = false;
                if (nestedLevel) {
                    nestedLevel--;
                }
                if (newlinesFromLastWSEat < 2 && newline_between_rules && indentLevel === 0) {
                    print.newLine(true);
                }
            } else if (ch === ":") {
                eatWhitespace();
                if ((insideRule || enteringConditionalGroup) &&
                    !(lookBack("&") || foundNestedPseudoClass()) &&
                    !lookBack("(")) {
                    // 'property: value' delimiter
                    // which could be in a conditional group query
                    output.push(':');
                    if (!insidePropertyValue) {
                        insidePropertyValue = true;
                        print.singleSpace();
                    }
                } else {
                    // sass/less parent reference don't use a space
                    // sass nested pseudo-class don't use a space

                    // preserve space before pseudoclasses/pseudoelements, as it means "in any child"
                    if (lookBack(" ") && output[output.length - 1] !== " ") {
                        output.push(" ");
                    }
                    if (peek() === ":") {
                        // pseudo-element
                        next();
                        output.push("::");
                    } else {
                        // pseudo-class
                        output.push(':');
                    }
                }
            } else if (ch === '"' || ch === '\'') {
                print.preserveSingleSpace();
                output.push(eatString(ch));
            } else if (ch === ';') {
                insidePropertyValue = false;
                output.push(ch);
                if (!eatWhitespace(true)) {
                    print.newLine();
                }
            } else if (ch === '(') { // may be a url
                if (lookBack("url")) {
                    output.push(ch);
                    eatWhitespace();
                    if (next()) {
                        if (ch !== ')' && ch !== '"' && ch !== '\'') {
                            output.push(eatString(')'));
                        } else {
                            pos--;
                        }
                    }
                } else {
                    parenLevel++;
                    print.preserveSingleSpace();
                    output.push(ch);
                    eatWhitespace();
                }
            } else if (ch === ')') {
                output.push(ch);
                parenLevel--;
            } else if (ch === ',') {
                output.push(ch);
                if (!eatWhitespace(true) && selectorSeparatorNewline && !insidePropertyValue && parenLevel < 1) {
                    print.newLine();
                } else {
                    print.singleSpace();
                }
            } else if ((ch === '>' || ch === '+' || ch === '~') &&
                !insidePropertyValue && parenLevel < 1) {
                //handle combinator spacing
                if (space_around_combinator) {
                    print.singleSpace();
                    output.push(ch);
                    print.singleSpace();
                } else {
                    output.push(ch);
                    eatWhitespace();
                    // squash extra whitespace
                    if (ch && whiteRe.test(ch)) {
                        ch = '';
                    }
                }
            } else if (ch === ']') {
                output.push(ch);
            } else if (ch === '[') {
                print.preserveSingleSpace();
                output.push(ch);
            } else if (ch === '=') { // no whitespace before or after
                eatWhitespace();
                output.push('=');
                if (whiteRe.test(ch)) {
                    ch = '';
                }
            } else {
                print.preserveSingleSpace();
                output.push(ch);
            }
        }


        var sweetCode = '';
        if (basebaseIndentString) {
            sweetCode += basebaseIndentString;
        }

        sweetCode += output.join('').replace(/[\r\n\t ]+$/, '');

        // establish end_with_newline
        if (end_with_newline) {
            sweetCode += '\n';
        }

        if (eol !== '\n') {
            sweetCode = sweetCode.replace(/[\n]/g, eol);
        }

        return sweetCode;
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
    css_beautify.NESTED_AT_RULE = {
        "@page": true,
        "@font-face": true,
        "@keyframes": true,
        // also in CONDITIONAL_GROUP_RULE below
        "@media": true,
        "@supports": true,
        "@document": true
    };
    css_beautify.CONDITIONAL_GROUP_RULE = {
        "@media": true,
        "@supports": true,
        "@document": true
    };

    /*global define */
    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() {
            return {
                css_beautify: css_beautify
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        exports.css_beautify = css_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.css_beautify = css_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.css_beautify = css_beautify;
    }

}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
    http://jsbeautifier.org/

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_inner_html (default false)  — indent <head> and <body> sections,
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    wrap_line_length (default 250)            -  maximum amount of characters per line (0 = disable)
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    content_unformatted (defaults to pre tag) - list of tags, that its content shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"
    preserve_newlines (default true) - whether existing line breaks before elements should be preserved
                                        Only works before elements, not inside tags or for text.
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk
    indent_handlebars (default false) - format and indent {{#foo}} and {{/foo}}
    end_with_newline (false)          - end with a newline
    extra_liners (default [head,body,/html]) -List of tags that should have an extra newline before them.

    e.g.

    style_html(html_source, {
      'indent_inner_html': false,
      'indent_size': 2,
      'indent_char': ' ',
      'wrap_line_length': 78,
      'brace_style': 'expand',
      'preserve_newlines': true,
      'max_preserve_newlines': 5,
      'indent_handlebars': false,
      'extra_liners': ['/html']
    });
*/

(function() {

    // function trim(s) {
    //     return s.replace(/^\s+|\s+$/g, '');
    // }

    function ltrim(s) {
        return s.replace(/^\s+/g, '');
    }

    function rtrim(s) {
        return s.replace(/\s+$/g, '');
    }

    function mergeOpts(allOptions, targetType) {
        var finalOpts = {};
        var name;

        for (name in allOptions) {
            if (name !== targetType) {
                finalOpts[name] = allOptions[name];
            }
        }

        //merge in the per type settings for the targetType
        if (targetType in allOptions) {
            for (name in allOptions[targetType]) {
                finalOpts[name] = allOptions[targetType][name];
            }
        }
        return finalOpts;
    }

    var lineBreak = /\r\n|[\n\r\u2028\u2029]/;
    var allLineBreaks = new RegExp(lineBreak.source, 'g');

    function style_html(html_source, options, js_beautify, css_beautify) {
        //Wrapper function to invoke all the necessary constructors and deal with the output.

        var multi_parser,
            indent_inner_html,
            indent_body_inner_html,
            indent_head_inner_html,
            indent_size,
            indent_character,
            wrap_line_length,
            brace_style,
            unformatted,
            content_unformatted,
            preserve_newlines,
            max_preserve_newlines,
            indent_handlebars,
            wrap_attributes,
            wrap_attributes_indent_size,
            is_wrap_attributes_force,
            is_wrap_attributes_force_expand_multiline,
            is_wrap_attributes_force_aligned,
            end_with_newline,
            extra_liners,
            eol;

        options = options || {};

        // Allow the setting of language/file-type specific options
        // with inheritance of overall settings
        options = mergeOpts(options, 'html');

        // backwards compatibility to 1.3.4
        if ((options.wrap_line_length === undefined || parseInt(options.wrap_line_length, 10) === 0) &&
            (options.max_char !== undefined && parseInt(options.max_char, 10) !== 0)) {
            options.wrap_line_length = options.max_char;
        }

        indent_inner_html = (options.indent_inner_html === undefined) ? false : options.indent_inner_html;
        indent_body_inner_html = (options.indent_body_inner_html === undefined) ? true : options.indent_body_inner_html;
        indent_head_inner_html = (options.indent_head_inner_html === undefined) ? true : options.indent_head_inner_html;
        indent_size = (options.indent_size === undefined) ? 4 : parseInt(options.indent_size, 10);
        indent_character = (options.indent_char === undefined) ? ' ' : options.indent_char;
        brace_style = (options.brace_style === undefined) ? 'collapse' : options.brace_style;
        wrap_line_length = parseInt(options.wrap_line_length, 10) === 0 ? 32786 : parseInt(options.wrap_line_length || 250, 10);
        unformatted = options.unformatted || [
            // https://www.w3.org/TR/html5/dom.html#phrasing-content
            'a', 'abbr', 'area', 'audio', 'b', 'bdi', 'bdo', 'br', 'button', 'canvas', 'cite',
            'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i', 'iframe', 'img',
            'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'math', 'meter', 'noscript',
            'object', 'output', 'progress', 'q', 'ruby', 's', 'samp', /* 'script', */ 'select', 'small',
            'span', 'strong', 'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'u', 'var',
            'video', 'wbr', 'text',
            // prexisting - not sure of full effect of removing, leaving in
            'acronym', 'address', 'big', 'dt', 'ins', 'strike', 'tt',
        ];
        content_unformatted = options.content_unformatted || [
            'pre',
        ];
        preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        max_preserve_newlines = preserve_newlines ?
            (isNaN(parseInt(options.max_preserve_newlines, 10)) ? 32786 : parseInt(options.max_preserve_newlines, 10)) :
            0;
        indent_handlebars = (options.indent_handlebars === undefined) ? false : options.indent_handlebars;
        wrap_attributes = (options.wrap_attributes === undefined) ? 'auto' : options.wrap_attributes;
        wrap_attributes_indent_size = (isNaN(parseInt(options.wrap_attributes_indent_size, 10))) ? indent_size : parseInt(options.wrap_attributes_indent_size, 10);
        is_wrap_attributes_force = wrap_attributes.substr(0, 'force'.length) === 'force';
        is_wrap_attributes_force_expand_multiline = (wrap_attributes === 'force-expand-multiline');
        is_wrap_attributes_force_aligned = (wrap_attributes === 'force-aligned');
        end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;
        extra_liners = (typeof options.extra_liners === 'object') && options.extra_liners ?
            options.extra_liners.concat() : (typeof options.extra_liners === 'string') ?
            options.extra_liners.split(',') : 'head,body,/html'.split(',');
        eol = options.eol ? options.eol : 'auto';

        if (options.indent_with_tabs) {
            indent_character = '\t';
            indent_size = 1;
        }

        if (eol === 'auto') {
            eol = '\n';
            if (html_source && lineBreak.test(html_source || '')) {
                eol = html_source.match(lineBreak)[0];
            }
        }

        eol = eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

        // HACK: newline parsing inconsistent. This brute force normalizes the input.
        html_source = html_source.replace(allLineBreaks, '\n');

        function Parser() {

            this.pos = 0; //Parser position
            this.token = '';
            this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
            this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
                parent: 'parent1',
                parentcount: 1,
                parent1: ''
            };
            this.tag_type = '';
            this.token_text = this.last_token = this.last_text = this.token_type = '';
            this.newlines = 0;
            this.indent_content = indent_inner_html;
            this.indent_body_inner_html = indent_body_inner_html;
            this.indent_head_inner_html = indent_head_inner_html;

            this.Utils = { //Uilities made available to the various functions
                whitespace: "\n\r\t ".split(''),

                single_token: options.void_elements || [
                    // HTLM void elements - aka self-closing tags - aka singletons
                    // https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
                    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
                    'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
                    // NOTE: Optional tags - are not understood.
                    // https://www.w3.org/TR/html5/syntax.html#optional-tags
                    // The rules for optional tags are too complex for a simple list
                    // Also, the content of these tags should still be indented in many cases.
                    // 'li' is a good exmple.

                    // Doctype and xml elements
                    '!doctype', '?xml',
                    // ?php tag
                    '?php',
                    // other tags that were in this list, keeping just in case
                    'basefont', 'isindex'
                ],
                extra_liners: extra_liners, //for tags that need a line of whitespace before them
                in_array: function(what, arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (what === arr[i]) {
                            return true;
                        }
                    }
                    return false;
                }
            };

            // Return true if the given text is composed entirely of whitespace.
            this.is_whitespace = function(text) {
                for (var n = 0; n < text.length; n++) {
                    if (!this.Utils.in_array(text.charAt(n), this.Utils.whitespace)) {
                        return false;
                    }
                }
                return true;
            };

            this.traverse_whitespace = function() {
                var input_char = '';

                input_char = this.input.charAt(this.pos);
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    this.newlines = 0;
                    while (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (preserve_newlines && input_char === '\n' && this.newlines <= max_preserve_newlines) {
                            this.newlines += 1;
                        }

                        this.pos++;
                        input_char = this.input.charAt(this.pos);
                    }
                    return true;
                }
                return false;
            };

            // Append a space to the given content (string array) or, if we are
            // at the wrap_line_length, append a newline/indentation.
            // return true if a newline was added, false if a space was added
            this.space_or_wrap = function(content) {
                if (this.line_char_count >= this.wrap_line_length) { //insert a line when the wrap_line_length is reached
                    this.print_newline(false, content);
                    this.print_indentation(content);
                    return true;
                } else {
                    this.line_char_count++;
                    content.push(' ');
                    return false;
                }
            };

            this.get_content = function() { //function to capture regular content between tags
                var input_char = '',
                    content = [],
                    handlebarsStarted = 0;

                while (this.input.charAt(this.pos) !== '<' || handlebarsStarted === 2) {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    if (handlebarsStarted < 2 && this.traverse_whitespace()) {
                        this.space_or_wrap(content);
                        continue;
                    }

                    input_char = this.input.charAt(this.pos);

                    if (indent_handlebars) {
                        if (input_char === '{') {
                            handlebarsStarted += 1;
                        } else if (handlebarsStarted < 2) {
                            handlebarsStarted = 0;
                        }

                        if (input_char === '}' && handlebarsStarted > 0) {
                            if (handlebarsStarted-- === 0) {
                                break;
                            }
                        }
                        // Handlebars parsing is complicated.
                        // {{#foo}} and {{/foo}} are formatted tags.
                        // {{something}} should get treated as content, except:
                        // {{else}} specifically behaves like {{#if}} and {{/if}}
                        var peek3 = this.input.substr(this.pos, 3);
                        if (peek3 === '{{#' || peek3 === '{{/') {
                            // These are tags and not content.
                            break;
                        } else if (peek3 === '{{!') {
                            return [this.get_tag(), 'TK_TAG_HANDLEBARS_COMMENT'];
                        } else if (this.input.substr(this.pos, 2) === '{{') {
                            if (this.get_tag(true) === '{{else}}') {
                                break;
                            }
                        }
                    }

                    this.pos++;
                    this.line_char_count++;
                    content.push(input_char); //letter at-a-time (or string) inserted to an array
                }
                return content.length ? content.join('') : '';
            };

            this.get_contents_to = function(name) { //get the full content of a script or style to pass to js_beautify
                if (this.pos === this.input.length) {
                    return ['', 'TK_EOF'];
                }
                var content = '';
                var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
                reg_match.lastIndex = this.pos;
                var reg_array = reg_match.exec(this.input);
                var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script
                if (this.pos < end_script) { //get everything in between the script tags
                    content = this.input.substring(this.pos, end_script);
                    this.pos = end_script;
                }
                return content;
            };

            this.record_tag = function(tag) { //function to record a tag and its parent in this.tags Object
                if (this.tags[tag + 'count']) { //check for the existence of this tag type
                    this.tags[tag + 'count']++;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                } else { //otherwise initialize this tag type
                    this.tags[tag + 'count'] = 1;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                }
                this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
                this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
            };

            this.retrieve_tag = function(tag) { //function to retrieve the opening tag to the corresponding closer
                if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
                    var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                    while (temp_parent) { //till we reach '' (the initial value);
                        if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
                            break;
                        }
                        temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                    }
                    if (temp_parent) { //if we caught something
                        this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                        this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
                    }
                    delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                    delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                    if (this.tags[tag + 'count'] === 1) {
                        delete this.tags[tag + 'count'];
                    } else {
                        this.tags[tag + 'count']--;
                    }
                }
            };

            this.indent_to_tag = function(tag) {
                // Match the indentation level to the last use of this tag, but don't remove it.
                if (!this.tags[tag + 'count']) {
                    return;
                }
                var temp_parent = this.tags.parent;
                while (temp_parent) {
                    if (tag + this.tags[tag + 'count'] === temp_parent) {
                        break;
                    }
                    temp_parent = this.tags[temp_parent + 'parent'];
                }
                if (temp_parent) {
                    this.indent_level = this.tags[tag + this.tags[tag + 'count']];
                }
            };

            this.get_tag = function(peek) { //function to get a full tag and parse its type
                var input_char = '',
                    content = [],
                    comment = '',
                    space = false,
                    first_attr = true,
                    has_wrapped_attrs = false,
                    tag_start, tag_end,
                    tag_start_char,
                    orig_pos = this.pos,
                    orig_line_char_count = this.line_char_count,
                    is_tag_closed = false,
                    tail;

                peek = peek !== undefined ? peek : false;

                do {
                    if (this.pos >= this.input.length) {
                        if (peek) {
                            this.pos = orig_pos;
                            this.line_char_count = orig_line_char_count;
                        }
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
                        space = true;
                        continue;
                    }

                    if (input_char === "'" || input_char === '"') {
                        input_char += this.get_unformatted(input_char);
                        space = true;
                    }

                    if (input_char === '=') { //no space before =
                        space = false;
                    }
                    tail = this.input.substr(this.pos - 1);
                    if (is_wrap_attributes_force_expand_multiline && has_wrapped_attrs && !is_tag_closed && (input_char === '>' || input_char === '/')) {
                        if (tail.match(/^\/?\s*>/)) {
                            space = false;
                            is_tag_closed = true;
                            this.print_newline(false, content);
                            this.print_indentation(content);
                        }
                    }
                    if (content.length && content[content.length - 1] !== '=' && input_char !== '>' && space) {
                        //no space after = or before >
                        var wrapped = this.space_or_wrap(content);
                        var indentAttrs = wrapped && input_char !== '/' && !is_wrap_attributes_force;
                        space = false;

                        if (is_wrap_attributes_force && input_char !== '/') {
                            var force_first_attr_wrap = false;
                            if (is_wrap_attributes_force_expand_multiline && first_attr) {
                                var is_only_attribute = tail.match(/^\S*(="([^"]|\\")*")?\s*\/?\s*>/) !== null;
                                force_first_attr_wrap = !is_only_attribute;
                            }
                            if (!first_attr || force_first_attr_wrap) {
                                this.print_newline(false, content);
                                this.print_indentation(content);
                                indentAttrs = true;
                            }
                        }
                        if (indentAttrs) {
                            has_wrapped_attrs = true;

                            //indent attributes an auto, forced, or forced-align line-wrap
                            var alignment_size = wrap_attributes_indent_size;
                            if (is_wrap_attributes_force_aligned) {
                                alignment_size = content.indexOf(' ') + 1;
                            }

                            for (var count = 0; count < alignment_size; count++) {
                                // only ever further indent with spaces since we're trying to align characters
                                content.push(' ');
                            }
                        }
                        if (first_attr) {
                            for (var i = 0; i < content.length; i++) {
                                if (content[i] === ' ') {
                                    first_attr = false;
                                    break;
                                }
                            }
                        }
                    }

                    if (indent_handlebars && tag_start_char === '<') {
                        // When inside an angle-bracket tag, put spaces around
                        // handlebars not inside of strings.
                        if ((input_char + this.input.charAt(this.pos)) === '{{') {
                            input_char += this.get_unformatted('}}');
                            if (content.length && content[content.length - 1] !== ' ' && content[content.length - 1] !== '<') {
                                input_char = ' ' + input_char;
                            }
                            space = true;
                        }
                    }

                    if (input_char === '<' && !tag_start_char) {
                        tag_start = this.pos - 1;
                        tag_start_char = '<';
                    }

                    if (indent_handlebars && !tag_start_char) {
                        if (content.length >= 2 && content[content.length - 1] === '{' && content[content.length - 2] === '{') {
                            if (input_char === '#' || input_char === '/' || input_char === '!') {
                                tag_start = this.pos - 3;
                            } else {
                                tag_start = this.pos - 2;
                            }
                            tag_start_char = '{';
                        }
                    }

                    this.line_char_count++;
                    content.push(input_char); //inserts character at-a-time (or string)

                    if (content[1] && (content[1] === '!' || content[1] === '?' || content[1] === '%')) { //if we're in a comment, do something special
                        // We treat all comments as literals, even more than preformatted tags
                        // we just look for the appropriate close tag
                        content = [this.get_comment(tag_start)];
                        break;
                    }

                    if (indent_handlebars && content[1] && content[1] === '{' && content[2] && content[2] === '!') { //if we're in a comment, do something special
                        // We treat all comments as literals, even more than preformatted tags
                        // we just look for the appropriate close tag
                        content = [this.get_comment(tag_start)];
                        break;
                    }

                    if (indent_handlebars && tag_start_char === '{' && content.length > 2 && content[content.length - 2] === '}' && content[content.length - 1] === '}') {
                        break;
                    }
                } while (input_char !== '>');

                var tag_complete = content.join('');
                var tag_index;
                var tag_offset;

                // must check for space first otherwise the tag could have the first attribute included, and
                // then not un-indent correctly
                if (tag_complete.indexOf(' ') !== -1) { //if there's whitespace, thats where the tag name ends
                    tag_index = tag_complete.indexOf(' ');
                } else if (tag_complete.indexOf('\n') !== -1) { //if there's a line break, thats where the tag name ends
                    tag_index = tag_complete.indexOf('\n');
                } else if (tag_complete.charAt(0) === '{') {
                    tag_index = tag_complete.indexOf('}');
                } else { //otherwise go with the tag ending
                    tag_index = tag_complete.indexOf('>');
                }
                if (tag_complete.charAt(0) === '<' || !indent_handlebars) {
                    tag_offset = 1;
                } else {
                    tag_offset = tag_complete.charAt(2) === '#' ? 3 : 2;
                }
                var tag_check = tag_complete.substring(tag_offset, tag_index).toLowerCase();
                if (tag_complete.charAt(tag_complete.length - 2) === '/' ||
                    this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                    }
                } else if (indent_handlebars && tag_complete.charAt(0) === '{' && tag_check === 'else') {
                    if (!peek) {
                        this.indent_to_tag('if');
                        this.tag_type = 'HANDLEBARS_ELSE';
                        this.indent_content = true;
                        this.traverse_whitespace();
                    }
                } else if (this.is_unformatted(tag_check, unformatted) ||
                    this.is_unformatted(tag_check, content_unformatted)) {
                    // do not reformat the "unformatted" or "content_unformatted" tags
                    comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function
                    content.push(comment);
                    tag_end = this.pos - 1;
                    this.tag_type = 'SINGLE';
                } else if (tag_check === 'script' &&
                    (tag_complete.search('type') === -1 ||
                        (tag_complete.search('type') > -1 &&
                            tag_complete.search(/\b(text|application|dojo)\/(x-)?(javascript|ecmascript|jscript|livescript|(ld\+)?json|method|aspect)/) > -1))) {
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'SCRIPT';
                    }
                } else if (tag_check === 'style' &&
                    (tag_complete.search('type') === -1 ||
                        (tag_complete.search('type') > -1 && tag_complete.search('text/css') > -1))) {
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'STYLE';
                    }
                } else if (tag_check.charAt(0) === '!') { //peek for <! comment
                    // for comments content is already correct.
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                        this.traverse_whitespace();
                    }
                } else if (!peek) {
                    if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
                        this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
                        this.tag_type = 'END';
                    } else { //otherwise it's a start-tag
                        this.record_tag(tag_check); //push it on the tag stack
                        if (tag_check.toLowerCase() !== 'html') {
                            this.indent_content = true;
                        }
                        this.tag_type = 'START';
                    }

                    // Allow preserving of newlines after a start or end tag
                    if (this.traverse_whitespace()) {
                        this.space_or_wrap(content);
                    }

                    if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
                        this.print_newline(false, this.output);
                        if (this.output.length && this.output[this.output.length - 2] !== '\n') {
                            this.print_newline(true, this.output);
                        }
                    }
                }

                if (peek) {
                    this.pos = orig_pos;
                    this.line_char_count = orig_line_char_count;
                }

                return content.join(''); //returns fully formatted tag
            };

            this.get_comment = function(start_pos) { //function to return comment content in its entirety
                // this is will have very poor perf, but will work for now.
                var comment = '',
                    delimiter = '>',
                    matched = false;

                this.pos = start_pos;
                var input_char = this.input.charAt(this.pos);
                this.pos++;

                while (this.pos <= this.input.length) {
                    comment += input_char;

                    // only need to check for the delimiter if the last chars match
                    if (comment.charAt(comment.length - 1) === delimiter.charAt(delimiter.length - 1) &&
                        comment.indexOf(delimiter) !== -1) {
                        break;
                    }

                    // only need to search for custom delimiter for the first few characters
                    if (!matched && comment.length < 10) {
                        if (comment.indexOf('<![if') === 0) { //peek for <![if conditional comment
                            delimiter = '<![endif]>';
                            matched = true;
                        } else if (comment.indexOf('<![cdata[') === 0) { //if it's a <[cdata[ comment...
                            delimiter = ']]>';
                            matched = true;
                        } else if (comment.indexOf('<![') === 0) { // some other ![ comment? ...
                            delimiter = ']>';
                            matched = true;
                        } else if (comment.indexOf('<!--') === 0) { // <!-- comment ...
                            delimiter = '-->';
                            matched = true;
                        } else if (comment.indexOf('{{!--') === 0) { // {{!-- handlebars comment
                            delimiter = '--}}';
                            matched = true;
                        } else if (comment.indexOf('{{!') === 0) { // {{! handlebars comment
                            if (comment.length === 5 && comment.indexOf('{{!--') === -1) {
                                delimiter = '}}';
                                matched = true;
                            }
                        } else if (comment.indexOf('<?') === 0) { // {{! handlebars comment
                            delimiter = '?>';
                            matched = true;
                        } else if (comment.indexOf('<%') === 0) { // {{! handlebars comment
                            delimiter = '%>';
                            matched = true;
                        }
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                }

                return comment;
            };

            function tokenMatcher(delimiter) {
                var token = '';

                var add = function(str) {
                    var newToken = token + str.toLowerCase();
                    token = newToken.length <= delimiter.length ? newToken : newToken.substr(newToken.length - delimiter.length, delimiter.length);
                };

                var doesNotMatch = function() {
                    return token.indexOf(delimiter) === -1;
                };

                return {
                    add: add,
                    doesNotMatch: doesNotMatch
                };
            }

            this.get_unformatted = function(delimiter, orig_tag) { //function to return unformatted content in its entirety
                if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) !== -1) {
                    return '';
                }
                var input_char = '';
                var content = '';
                var space = true;

                var delimiterMatcher = tokenMatcher(delimiter);

                do {

                    if (this.pos >= this.input.length) {
                        return content;
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (!space) {
                            this.line_char_count--;
                            continue;
                        }
                        if (input_char === '\n' || input_char === '\r') {
                            content += '\n';
                            /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                for (var i=0; i<this.indent_level; i++) {
                  content += this.indent_string;
                }
                space = false; //...and make sure other indentation is erased
                */
                            this.line_char_count = 0;
                            continue;
                        }
                    }
                    content += input_char;
                    delimiterMatcher.add(input_char);
                    this.line_char_count++;
                    space = true;

                    if (indent_handlebars && input_char === '{' && content.length && content.charAt(content.length - 2) === '{') {
                        // Handlebars expressions in strings should also be unformatted.
                        content += this.get_unformatted('}}');
                        // Don't consider when stopping for delimiters.
                    }
                } while (delimiterMatcher.doesNotMatch());

                return content;
            };

            this.get_token = function() { //initial handler for token-retrieval
                var token;

                if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') { //check if we need to format javascript
                    var type = this.last_token.substr(7);
                    token = this.get_contents_to(type);
                    if (typeof token !== 'string') {
                        return token;
                    }
                    return [token, 'TK_' + type];
                }
                if (this.current_mode === 'CONTENT') {
                    token = this.get_content();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        return [token, 'TK_CONTENT'];
                    }
                }

                if (this.current_mode === 'TAG') {
                    token = this.get_tag();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        var tag_name_type = 'TK_TAG_' + this.tag_type;
                        return [token, tag_name_type];
                    }
                }
            };

            this.get_full_indent = function(level) {
                level = this.indent_level + level || 0;
                if (level < 1) {
                    return '';
                }

                return Array(level + 1).join(this.indent_string);
            };

            this.is_unformatted = function(tag_check, unformatted) {
                //is this an HTML5 block-level link?
                if (!this.Utils.in_array(tag_check, unformatted)) {
                    return false;
                }

                if (tag_check.toLowerCase() !== 'a' || !this.Utils.in_array('a', unformatted)) {
                    return true;
                }

                //at this point we have an  tag; is its first child something we want to remain
                //unformatted?
                var next_tag = this.get_tag(true /* peek. */ );

                // test next_tag to see if it is just html tag (no external content)
                var tag = (next_tag || "").match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/);

                // if next_tag comes back but is not an isolated tag, then
                // let's treat the 'a' tag as having content
                // and respect the unformatted option
                if (!tag || this.Utils.in_array(tag[1], unformatted)) {
                    return true;
                } else {
                    return false;
                }
            };

            this.printer = function(js_source, indent_character, indent_size, wrap_line_length, brace_style) { //handles input/output and some other printing functions

                this.input = js_source || ''; //gets the input for the Parser

                // HACK: newline parsing inconsistent. This brute force normalizes the input.
                this.input = this.input.replace(/\r\n|[\r\u2028\u2029]/g, '\n');

                this.output = [];
                this.indent_character = indent_character;
                this.indent_string = '';
                this.indent_size = indent_size;
                this.brace_style = brace_style;
                this.indent_level = 0;
                this.wrap_line_length = wrap_line_length;
                this.line_char_count = 0; //count to see if wrap_line_length was exceeded

                for (var i = 0; i < this.indent_size; i++) {
                    this.indent_string += this.indent_character;
                }

                this.print_newline = function(force, arr) {
                    this.line_char_count = 0;
                    if (!arr || !arr.length) {
                        return;
                    }
                    if (force || (arr[arr.length - 1] !== '\n')) { //we might want the extra line
                        if ((arr[arr.length - 1] !== '\n')) {
                            arr[arr.length - 1] = rtrim(arr[arr.length - 1]);
                        }
                        arr.push('\n');
                    }
                };

                this.print_indentation = function(arr) {
                    for (var i = 0; i < this.indent_level; i++) {
                        arr.push(this.indent_string);
                        this.line_char_count += this.indent_string.length;
                    }
                };

                this.print_token = function(text) {
                    // Avoid printing initial whitespace.
                    if (this.is_whitespace(text) && !this.output.length) {
                        return;
                    }
                    if (text || text !== '') {
                        if (this.output.length && this.output[this.output.length - 1] === '\n') {
                            this.print_indentation(this.output);
                            text = ltrim(text);
                        }
                    }
                    this.print_token_raw(text);
                };

                this.print_token_raw = function(text) {
                    // If we are going to print newlines, truncate trailing
                    // whitespace, as the newlines will represent the space.
                    if (this.newlines > 0) {
                        text = rtrim(text);
                    }

                    if (text && text !== '') {
                        if (text.length > 1 && text.charAt(text.length - 1) === '\n') {
                            // unformatted tags can grab newlines as their last character
                            this.output.push(text.slice(0, -1));
                            this.print_newline(false, this.output);
                        } else {
                            this.output.push(text);
                        }
                    }

                    for (var n = 0; n < this.newlines; n++) {
                        this.print_newline(n > 0, this.output);
                    }
                    this.newlines = 0;
                };

                this.indent = function() {
                    this.indent_level++;
                };

                this.unindent = function() {
                    if (this.indent_level > 0) {
                        this.indent_level--;
                    }
                };
            };
            return this;
        }

        /*_____________________--------------------_____________________*/

        multi_parser = new Parser(); //wrapping functions Parser
        multi_parser.printer(html_source, indent_character, indent_size, wrap_line_length, brace_style); //initialize starting values

        while (true) {
            var t = multi_parser.get_token();
            multi_parser.token_text = t[0];
            multi_parser.token_type = t[1];

            if (multi_parser.token_type === 'TK_EOF') {
                break;
            }

            switch (multi_parser.token_type) {
                case 'TK_TAG_START':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        if ((multi_parser.indent_body_inner_html || !multi_parser.token_text.match(/<body(?:.*)>/)) &&
                            (multi_parser.indent_head_inner_html || !multi_parser.token_text.match(/<head(?:.*)>/))) {

                            multi_parser.indent();
                        }

                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_STYLE':
                case 'TK_TAG_SCRIPT':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_END':
                    //Print new line only if the tag has no content and has child
                    if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
                        var tag_name = (multi_parser.token_text.match(/\w+/) || [])[0];
                        var tag_extracted_from_last_output = null;
                        if (multi_parser.output.length) {
                            tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/(?:<|{{#)\s*(\w+)/);
                        }
                        if (tag_extracted_from_last_output === null ||
                            (tag_extracted_from_last_output[1] !== tag_name && !multi_parser.Utils.in_array(tag_extracted_from_last_output[1], unformatted))) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_SINGLE':
                    // Don't add a newline before elements that should remain unformatted.
                    var tag_check = multi_parser.token_text.match(/^\s*<([a-z-]+)/i);
                    if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
                        multi_parser.print_newline(false, multi_parser.output);
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_HANDLEBARS_ELSE':
                    // Don't add a newline if opening {{#if}} tag is on the current line
                    var foundIfOnCurrentLine = false;
                    for (var lastCheckedOutput = multi_parser.output.length - 1; lastCheckedOutput >= 0; lastCheckedOutput--) {
                        if (multi_parser.output[lastCheckedOutput] === '\n') {
                            break;
                        } else {
                            if (multi_parser.output[lastCheckedOutput].match(/{{#if/)) {
                                foundIfOnCurrentLine = true;
                                break;
                            }
                        }
                    }
                    if (!foundIfOnCurrentLine) {
                        multi_parser.print_newline(false, multi_parser.output);
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        multi_parser.indent();
                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_HANDLEBARS_COMMENT':
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'TAG';
                    break;
                case 'TK_CONTENT':
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'TAG';
                    break;
                case 'TK_STYLE':
                case 'TK_SCRIPT':
                    if (multi_parser.token_text !== '') {
                        multi_parser.print_newline(false, multi_parser.output);
                        var text = multi_parser.token_text,
                            _beautifier,
                            script_indent_level = 1;
                        if (multi_parser.token_type === 'TK_SCRIPT') {
                            _beautifier = typeof js_beautify === 'function' && js_beautify;
                        } else if (multi_parser.token_type === 'TK_STYLE') {
                            _beautifier = typeof css_beautify === 'function' && css_beautify;
                        }

                        if (options.indent_scripts === "keep") {
                            script_indent_level = 0;
                        } else if (options.indent_scripts === "separate") {
                            script_indent_level = -multi_parser.indent_level;
                        }

                        var indentation = multi_parser.get_full_indent(script_indent_level);
                        if (_beautifier) {

                            // call the Beautifier if avaliable
                            var Child_options = function() {
                                this.eol = '\n';
                            };
                            Child_options.prototype = options;
                            var child_options = new Child_options();
                            text = _beautifier(text.replace(/^\s*/, indentation), child_options);
                        } else {
                            // simply indent the string otherwise
                            var white = text.match(/^\s*/)[0];
                            var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                            var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                            text = text.replace(/^\s*/, indentation)
                                .replace(/\r\n|\r|\n/g, '\n' + reindent)
                                .replace(/\s+$/, '');
                        }
                        if (text) {
                            multi_parser.print_token_raw(text);
                            multi_parser.print_newline(true, multi_parser.output);
                        }
                    }
                    multi_parser.current_mode = 'TAG';
                    break;
                default:
                    // We should not be getting here but we don't want to drop input on the floor
                    // Just output the text and move on
                    if (multi_parser.token_text !== '') {
                        multi_parser.print_token(multi_parser.token_text);
                    }
                    break;
            }
            multi_parser.last_token = multi_parser.token_type;
            multi_parser.last_text = multi_parser.token_text;
        }
        var sweet_code = multi_parser.output.join('').replace(/[\r\n\t ]+$/, '');

        // establish end_with_newline
        if (end_with_newline) {
            sweet_code += '\n';
        }

        if (eol !== '\n') {
            sweet_code = sweet_code.replace(/[\n]/g, eol);
        }

        return sweet_code;
    }

    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define(["require", "./beautify", "./beautify-css"], function(requireamd) {
            var js_beautify = requireamd("./beautify");
            var css_beautify = requireamd("./beautify-css");

            return {
                html_beautify: function(html_source, options) {
                    return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
                }
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        var js_beautify = require('./beautify.js');
        var css_beautify = require('./beautify-css.js');

        exports.html_beautify = function(html_source, options) {
            return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
        };
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.html_beautify = function(html_source, options) {
            return style_html(html_source, options, window.js_beautify, window.css_beautify);
        };
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.html_beautify = function(html_source, options) {
            return style_html(html_source, options, global.js_beautify, global.css_beautify);
        };
    }

}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./beautify-css.js":9,"./beautify.js":11}],11:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2017 Einar Lielmanis, Liam Newman, and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 JS Beautifier
---------------


  Written by Einar Lielmanis, <einar@jsbeautifier.org>
      http://jsbeautifier.org/

  Originally converted to javascript by Vital, <vital76@gmail.com>
  "End braces on own line" added by Chris J. Shull, <chrisjshull@gmail.com>
  Parsing improvements for brace-less statements by Liam Newman <bitwiseman@gmail.com>


  Usage:
    js_beautify(js_source_text);
    js_beautify(js_source_text, options);

  The options are:
    indent_size (default 4)          - indentation size,
    indent_char (default space)      - character to indent with,
    preserve_newlines (default true) - whether existing line breaks should be preserved,
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk,

    jslint_happy (default false) - if true, then jslint-stricter mode is enforced.

            jslint_happy        !jslint_happy
            ---------------------------------
            function ()         function()

            switch () {         switch() {
            case 1:               case 1:
              break;                break;
            }                   }

    space_after_anon_function (default false) - should the space before an anonymous function's parens be added, "function()" vs "function ()",
          NOTE: This option is overriden by jslint_happy (i.e. if jslint_happy is true, space_after_anon_function is true by design)

    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none" | any of the former + ",preserve-inline"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
            preserve-inline will try to preserve inline blocks of curly braces

    space_before_conditional (default true) - should the space before conditional statement be added, "if(true)" vs "if (true)",

    unescape_strings (default false) - should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"

    wrap_line_length (default unlimited) - lines should wrap at next opportunity after this number of characters.
          NOTE: This is not a hard limit. Lines will continue until a point where a newline would
                be preserved if it were present.

    end_with_newline (default false)  - end output with a newline


    e.g

    js_beautify(js_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });

*/

// Object.values polyfill found here:
// http://tokenposts.blogspot.com.au/2012/04/javascript-objectkeys-browser.html
if (!Object.values) {
    Object.values = function(o) {
        if (o !== Object(o)) {
            throw new TypeError('Object.values called on a non-object');
        }
        var k = [],
            p;
        for (p in o) {
            if (Object.prototype.hasOwnProperty.call(o, p)) {
                k.push(o[p]);
            }
        }
        return k;
    };
}

(function() {

    function mergeOpts(allOptions, targetType) {
        var finalOpts = {};
        var name;

        for (name in allOptions) {
            if (name !== targetType) {
                finalOpts[name] = allOptions[name];
            }
        }

        //merge in the per type settings for the targetType
        if (targetType in allOptions) {
            for (name in allOptions[targetType]) {
                finalOpts[name] = allOptions[targetType][name];
            }
        }
        return finalOpts;
    }

    function js_beautify(js_source_text, options) {

        var acorn = {};
        (function(exports) {
            /* jshint curly: false */
            // This section of code is taken from acorn.
            //
            // Acorn was written by Marijn Haverbeke and released under an MIT
            // license. The Unicode regexps (for identifiers and whitespace) were
            // taken from [Esprima](http://esprima.org) by Ariya Hidayat.
            //
            // Git repositories for Acorn are available at
            //
            //     http://marijnhaverbeke.nl/git/acorn
            //     https://github.com/marijnh/acorn.git

            // ## Character categories

            // Big ugly regular expressions that match characters in the
            // whitespace, identifier, and identifier-start categories. These
            // are only applied when a character is found to actually have a
            // code point above 128.

            var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/; // jshint ignore:line
            var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
            var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
            var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
            var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

            // Whether a single character denotes a newline.

            exports.newline = /[\n\r\u2028\u2029]/;

            // Matches a whole line break (where CRLF is considered a single
            // line break). Used to count lines.

            // in javascript, these two differ
            // in python they are the same, different methods are called on them
            exports.lineBreak = new RegExp('\r\n|' + exports.newline.source);
            exports.allLineBreaks = new RegExp(exports.lineBreak.source, 'g');


            // Test whether a given character code starts an identifier.

            exports.isIdentifierStart = function(code) {
                // permit $ (36) and @ (64). @ is used in ES7 decorators.
                if (code < 65) return code === 36 || code === 64;
                // 65 through 91 are uppercase letters.
                if (code < 91) return true;
                // permit _ (95).
                if (code < 97) return code === 95;
                // 97 through 123 are lowercase letters.
                if (code < 123) return true;
                return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
            };

            // Test whether a given character is part of an identifier.

            exports.isIdentifierChar = function(code) {
                if (code < 48) return code === 36;
                if (code < 58) return true;
                if (code < 65) return false;
                if (code < 91) return true;
                if (code < 97) return code === 95;
                if (code < 123) return true;
                return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
            };
        })(acorn);
        /* jshint curly: true */

        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        }

        function trim(s) {
            return s.replace(/^\s+|\s+$/g, '');
        }

        function ltrim(s) {
            return s.replace(/^\s+/g, '');
        }

        // function rtrim(s) {
        //     return s.replace(/\s+$/g, '');
        // }

        function sanitizeOperatorPosition(opPosition) {
            opPosition = opPosition || OPERATOR_POSITION.before_newline;

            var validPositionValues = Object.values(OPERATOR_POSITION);

            if (!in_array(opPosition, validPositionValues)) {
                throw new Error("Invalid Option Value: The option 'operator_position' must be one of the following values\n" +
                    validPositionValues +
                    "\nYou passed in: '" + opPosition + "'");
            }

            return opPosition;
        }

        var OPERATOR_POSITION = {
            before_newline: 'before-newline',
            after_newline: 'after-newline',
            preserve_newline: 'preserve-newline',
        };

        var OPERATOR_POSITION_BEFORE_OR_PRESERVE = [OPERATOR_POSITION.before_newline, OPERATOR_POSITION.preserve_newline];

        var MODE = {
            BlockStatement: 'BlockStatement', // 'BLOCK'
            Statement: 'Statement', // 'STATEMENT'
            ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
            ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
            ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
            Conditional: 'Conditional', //'(COND-EXPRESSION)',
            Expression: 'Expression' //'(EXPRESSION)'
        };

        function Beautifier(js_source_text, options) {
            "use strict";
            var output;
            var tokens = [],
                token_pos;
            var Tokenizer;
            var current_token;
            var last_type, last_last_text, indent_string;
            var flags, previous_flags, flag_store;
            var prefix;

            var handlers, opt;
            var baseIndentString = '';

            handlers = {
                'TK_START_EXPR': handle_start_expr,
                'TK_END_EXPR': handle_end_expr,
                'TK_START_BLOCK': handle_start_block,
                'TK_END_BLOCK': handle_end_block,
                'TK_WORD': handle_word,
                'TK_RESERVED': handle_word,
                'TK_SEMICOLON': handle_semicolon,
                'TK_STRING': handle_string,
                'TK_EQUALS': handle_equals,
                'TK_OPERATOR': handle_operator,
                'TK_COMMA': handle_comma,
                'TK_BLOCK_COMMENT': handle_block_comment,
                'TK_COMMENT': handle_comment,
                'TK_DOT': handle_dot,
                'TK_UNKNOWN': handle_unknown,
                'TK_EOF': handle_eof
            };

            function create_flags(flags_base, mode) {
                var next_indent_level = 0;
                if (flags_base) {
                    next_indent_level = flags_base.indentation_level;
                    if (!output.just_added_newline() &&
                        flags_base.line_indent_level > next_indent_level) {
                        next_indent_level = flags_base.line_indent_level;
                    }
                }

                var next_flags = {
                    mode: mode,
                    parent: flags_base,
                    last_text: flags_base ? flags_base.last_text : '', // last token text
                    last_word: flags_base ? flags_base.last_word : '', // last 'TK_WORD' passed
                    declaration_statement: false,
                    declaration_assignment: false,
                    multiline_frame: false,
                    inline_frame: false,
                    if_block: false,
                    else_block: false,
                    do_block: false,
                    do_while: false,
                    import_block: false,
                    in_case_statement: false, // switch(..){ INSIDE HERE }
                    in_case: false, // we're on the exact line with "case 0:"
                    case_body: false, // the indented case-action block
                    indentation_level: next_indent_level,
                    line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
                    start_line_index: output.get_line_number(),
                    ternary_depth: 0
                };
                return next_flags;
            }

            // Some interpreters have unexpected results with foo = baz || bar;
            options = options ? options : {};

            // Allow the setting of language/file-type specific options
            // with inheritance of overall settings
            options = mergeOpts(options, 'js');

            opt = {};

            // compatibility, re
            if (options.brace_style === "expand-strict") { //graceful handling of deprecated option
                options.brace_style = "expand";
            } else if (options.brace_style === "collapse-preserve-inline") { //graceful handling of deprecated option
                options.brace_style = "collapse,preserve-inline";
            } else if (options.braces_on_own_line !== undefined) { //graceful handling of deprecated option
                options.brace_style = options.braces_on_own_line ? "expand" : "collapse";
            } else if (!options.brace_style) //Nothing exists to set it
            {
                options.brace_style = "collapse";
            }


            var brace_style_split = options.brace_style.split(/[^a-zA-Z0-9_\-]+/);
            opt.brace_style = brace_style_split[0];
            opt.brace_preserve_inline = brace_style_split[1] ? brace_style_split[1] : false;

            opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
            opt.indent_char = options.indent_char ? options.indent_char : ' ';
            opt.eol = options.eol ? options.eol : 'auto';
            opt.preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
            opt.break_chained_methods = (options.break_chained_methods === undefined) ? false : options.break_chained_methods;
            opt.max_preserve_newlines = (options.max_preserve_newlines === undefined) ? 0 : parseInt(options.max_preserve_newlines, 10);
            opt.space_in_paren = (options.space_in_paren === undefined) ? false : options.space_in_paren;
            opt.space_in_empty_paren = (options.space_in_empty_paren === undefined) ? false : options.space_in_empty_paren;
            opt.jslint_happy = (options.jslint_happy === undefined) ? false : options.jslint_happy;
            opt.space_after_anon_function = (options.space_after_anon_function === undefined) ? false : options.space_after_anon_function;
            opt.keep_array_indentation = (options.keep_array_indentation === undefined) ? false : options.keep_array_indentation;
            opt.space_before_conditional = (options.space_before_conditional === undefined) ? true : options.space_before_conditional;
            opt.unescape_strings = (options.unescape_strings === undefined) ? false : options.unescape_strings;
            opt.wrap_line_length = (options.wrap_line_length === undefined) ? 0 : parseInt(options.wrap_line_length, 10);
            opt.e4x = (options.e4x === undefined) ? false : options.e4x;
            opt.end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;
            opt.comma_first = (options.comma_first === undefined) ? false : options.comma_first;
            opt.operator_position = sanitizeOperatorPosition(options.operator_position);

            // For testing of beautify ignore:start directive
            opt.test_output_raw = (options.test_output_raw === undefined) ? false : options.test_output_raw;

            // force opt.space_after_anon_function to true if opt.jslint_happy
            if (opt.jslint_happy) {
                opt.space_after_anon_function = true;
            }

            if (options.indent_with_tabs) {
                opt.indent_char = '\t';
                opt.indent_size = 1;
            }

            if (opt.eol === 'auto') {
                opt.eol = '\n';
                if (js_source_text && acorn.lineBreak.test(js_source_text || '')) {
                    opt.eol = js_source_text.match(acorn.lineBreak)[0];
                }
            }

            opt.eol = opt.eol.replace(/\\r/, '\r').replace(/\\n/, '\n');

            //----------------------------------
            indent_string = '';
            while (opt.indent_size > 0) {
                indent_string += opt.indent_char;
                opt.indent_size -= 1;
            }

            var preindent_index = 0;
            if (js_source_text && js_source_text.length) {
                while ((js_source_text.charAt(preindent_index) === ' ' ||
                        js_source_text.charAt(preindent_index) === '\t')) {
                    baseIndentString += js_source_text.charAt(preindent_index);
                    preindent_index += 1;
                }
                js_source_text = js_source_text.substring(preindent_index);
            }

            last_type = 'TK_START_BLOCK'; // last token type
            last_last_text = ''; // pre-last token text
            output = new Output(indent_string, baseIndentString);

            // If testing the ignore directive, start with output disable set to true
            output.raw = opt.test_output_raw;


            // Stack of parsing/formatting states, including MODE.
            // We tokenize, parse, and output in an almost purely a forward-only stream of token input
            // and formatted output.  This makes the beautifier less accurate than full parsers
            // but also far more tolerant of syntax errors.
            //
            // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
            // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
            // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a ";",
            // most full parsers would die, but the beautifier gracefully falls back to
            // MODE.BlockStatement and continues on.
            flag_store = [];
            set_mode(MODE.BlockStatement);

            this.beautify = function() {

                /*jshint onevar:true */
                var sweet_code;
                Tokenizer = new tokenizer(js_source_text, opt, indent_string);
                tokens = Tokenizer.tokenize();
                token_pos = 0;

                current_token = get_token();
                while (current_token) {
                    handlers[current_token.type]();

                    last_last_text = flags.last_text;
                    last_type = current_token.type;
                    flags.last_text = current_token.text;

                    token_pos += 1;
                    current_token = get_token();
                }

                sweet_code = output.get_code();
                if (opt.end_with_newline) {
                    sweet_code += '\n';
                }

                if (opt.eol !== '\n') {
                    sweet_code = sweet_code.replace(/[\n]/g, opt.eol);
                }

                return sweet_code;
            };

            function handle_whitespace_and_comments(local_token, preserve_statement_flags) {
                var newlines = local_token.newlines;
                var keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);
                var temp_token = current_token;

                for (var h = 0; h < local_token.comments_before.length; h++) {
                    // The cleanest handling of inline comments is to treat them as though they aren't there.
                    // Just continue formatting and the behavior should be logical.
                    // Also ignore unknown tokens.  Again, this should result in better behavior.
                    current_token = local_token.comments_before[h];
                    handle_whitespace_and_comments(current_token, preserve_statement_flags);
                    handlers[current_token.type](preserve_statement_flags);
                }
                current_token = temp_token;

                if (keep_whitespace) {
                    for (var i = 0; i < newlines; i += 1) {
                        print_newline(i > 0, preserve_statement_flags);
                    }
                } else {
                    if (opt.max_preserve_newlines && newlines > opt.max_preserve_newlines) {
                        newlines = opt.max_preserve_newlines;
                    }

                    if (opt.preserve_newlines) {
                        if (local_token.newlines > 1) {
                            print_newline(false, preserve_statement_flags);
                            for (var j = 1; j < newlines; j += 1) {
                                print_newline(true, preserve_statement_flags);
                            }
                        }
                    }
                }

            }

            // we could use just string.split, but
            // IE doesn't like returning empty strings
            function split_linebreaks(s) {
                //return s.split(/\x0d\x0a|\x0a/);

                s = s.replace(acorn.allLineBreaks, '\n');
                var out = [],
                    idx = s.indexOf("\n");
                while (idx !== -1) {
                    out.push(s.substring(0, idx));
                    s = s.substring(idx + 1);
                    idx = s.indexOf("\n");
                }
                if (s.length) {
                    out.push(s);
                }
                return out;
            }

            var newline_restricted_tokens = ['break', 'continue', 'return', 'throw'];

            function allow_wrap_or_preserved_newline(force_linewrap) {
                force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;

                // Never wrap the first token on a line
                if (output.just_added_newline()) {
                    return;
                }

                var shouldPreserveOrForce = (opt.preserve_newlines && current_token.wanted_newline) || force_linewrap;
                var operatorLogicApplies = in_array(flags.last_text, Tokenizer.positionable_operators) || in_array(current_token.text, Tokenizer.positionable_operators);

                if (operatorLogicApplies) {
                    var shouldPrintOperatorNewline = (
                            in_array(flags.last_text, Tokenizer.positionable_operators) &&
                            in_array(opt.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)
                        ) ||
                        in_array(current_token.text, Tokenizer.positionable_operators);
                    shouldPreserveOrForce = shouldPreserveOrForce && shouldPrintOperatorNewline;
                }

                if (shouldPreserveOrForce) {
                    print_newline(false, true);
                } else if (opt.wrap_line_length) {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, newline_restricted_tokens)) {
                        // These tokens should never have a newline inserted
                        // between them and the following expression.
                        return;
                    }
                    var proposed_line_length = output.current_line.get_character_count() + current_token.text.length +
                        (output.space_before_token ? 1 : 0);
                    if (proposed_line_length >= opt.wrap_line_length) {
                        print_newline(false, true);
                    }
                }
            }

            function print_newline(force_newline, preserve_statement_flags) {
                if (!preserve_statement_flags) {
                    if (flags.last_text !== ';' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
                        var next_token = get_token(1);
                        while (flags.mode === MODE.Statement &&
                            !(flags.if_block && next_token && next_token.type === 'TK_RESERVED' && next_token.text === 'else') &&
                            !flags.do_block) {
                            restore_mode();
                        }
                    }
                }

                if (output.add_new_line(force_newline)) {
                    flags.multiline_frame = true;
                }
            }

            function print_token_line_indentation() {
                if (output.just_added_newline()) {
                    if (opt.keep_array_indentation && is_array(flags.mode) && current_token.wanted_newline) {
                        output.current_line.push(current_token.whitespace_before);
                        output.space_before_token = false;
                    } else if (output.set_indent(flags.indentation_level)) {
                        flags.line_indent_level = flags.indentation_level;
                    }
                }
            }

            function print_token(printable_token) {
                if (output.raw) {
                    output.add_raw_token(current_token);
                    return;
                }

                if (opt.comma_first && last_type === 'TK_COMMA' &&
                    output.just_added_newline()) {
                    if (output.previous_line.last() === ',') {
                        var popped = output.previous_line.pop();
                        // if the comma was already at the start of the line,
                        // pull back onto that line and reprint the indentation
                        if (output.previous_line.is_empty()) {
                            output.previous_line.push(popped);
                            output.trim(true);
                            output.current_line.pop();
                            output.trim();
                        }

                        // add the comma in front of the next token
                        print_token_line_indentation();
                        output.add_token(',');
                        output.space_before_token = true;
                    }
                }

                printable_token = printable_token || current_token.text;
                print_token_line_indentation();
                output.add_token(printable_token);
            }

            function indent() {
                flags.indentation_level += 1;
            }

            function deindent() {
                if (flags.indentation_level > 0 &&
                    ((!flags.parent) || flags.indentation_level > flags.parent.indentation_level)) {
                    flags.indentation_level -= 1;

                }
            }

            function set_mode(mode) {
                if (flags) {
                    flag_store.push(flags);
                    previous_flags = flags;
                } else {
                    previous_flags = create_flags(null, mode);
                }

                flags = create_flags(previous_flags, mode);
            }

            function is_array(mode) {
                return mode === MODE.ArrayLiteral;
            }

            function is_expression(mode) {
                return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
            }

            function restore_mode() {
                if (flag_store.length > 0) {
                    previous_flags = flags;
                    flags = flag_store.pop();
                    if (previous_flags.mode === MODE.Statement) {
                        output.remove_redundant_indentation(previous_flags);
                    }
                }
            }

            function start_of_object_property() {
                return flags.parent.mode === MODE.ObjectLiteral && flags.mode === MODE.Statement && (
                    (flags.last_text === ':' && flags.ternary_depth === 0) || (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set'])));
            }

            function start_of_statement() {
                if (
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD') ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'do') ||
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['return', 'throw']) && !current_token.wanted_newline) ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'else' &&
                        !(current_token.type === 'TK_RESERVED' && current_token.text === 'if' && !current_token.comments_before.length)) ||
                    (last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional)) ||
                    (last_type === 'TK_WORD' && flags.mode === MODE.BlockStatement &&
                        !flags.in_case &&
                        !(current_token.text === '--' || current_token.text === '++') &&
                        last_last_text !== 'function' &&
                        current_token.type !== 'TK_WORD' && current_token.type !== 'TK_RESERVED') ||
                    (flags.mode === MODE.ObjectLiteral && (
                        (flags.last_text === ':' && flags.ternary_depth === 0) || (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']))))
                ) {

                    set_mode(MODE.Statement);
                    indent();

                    handle_whitespace_and_comments(current_token, true);

                    // Issue #276:
                    // If starting a new statement with [if, for, while, do], push to a new line.
                    // if (a) if (b) if(c) d(); else e(); else f();
                    if (!start_of_object_property()) {
                        allow_wrap_or_preserved_newline(
                            current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['do', 'for', 'if', 'while']));
                    }

                    return true;
                }
                return false;
            }

            function all_lines_start_with(lines, c) {
                for (var i = 0; i < lines.length; i++) {
                    var line = trim(lines[i]);
                    if (line.charAt(0) !== c) {
                        return false;
                    }
                }
                return true;
            }

            function each_line_matches_indent(lines, indent) {
                var i = 0,
                    len = lines.length,
                    line;
                for (; i < len; i++) {
                    line = lines[i];
                    // allow empty lines to pass through
                    if (line && line.indexOf(indent) !== 0) {
                        return false;
                    }
                }
                return true;
            }

            function is_special_word(word) {
                return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
            }

            function get_token(offset) {
                var index = token_pos + (offset || 0);
                return (index < 0 || index >= tokens.length) ? null : tokens[index];
            }

            function handle_start_expr() {
                // The conditional starts the statement if appropriate.
                if (!start_of_statement()) {
                    handle_whitespace_and_comments(current_token);
                }

                var next_mode = MODE.Expression;
                if (current_token.text === '[') {

                    if (last_type === 'TK_WORD' || flags.last_text === ')') {
                        // this is array index specifier, break immediately
                        // a[x], fn()[x]
                        if (last_type === 'TK_RESERVED' && in_array(flags.last_text, Tokenizer.line_starters)) {
                            output.space_before_token = true;
                        }
                        set_mode(next_mode);
                        print_token();
                        indent();
                        if (opt.space_in_paren) {
                            output.space_before_token = true;
                        }
                        return;
                    }

                    next_mode = MODE.ArrayLiteral;
                    if (is_array(flags.mode)) {
                        if (flags.last_text === '[' ||
                            (flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}'))) {
                            // ], [ goes to new line
                            // }, [ goes to new line
                            if (!opt.keep_array_indentation) {
                                print_newline();
                            }
                        }
                    }

                } else {
                    if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
                        next_mode = MODE.ForInitializer;
                    } else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
                        next_mode = MODE.Conditional;
                    } else {
                        // next_mode = MODE.Expression;
                    }
                }

                if (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                    print_newline();
                } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                    // TODO: Consider whether forcing this is required.  Review failing tests when removed.
                    allow_wrap_or_preserved_newline(current_token.wanted_newline);
                    // do nothing on (( and )( and ][ and ]( and .(
                } else if (!(last_type === 'TK_RESERVED' && current_token.text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                    output.space_before_token = true;
                } else if ((last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof')) ||
                    (flags.last_text === '*' &&
                        (in_array(last_last_text, ['function', 'yield']) ||
                            (flags.mode === MODE.ObjectLiteral && in_array(last_last_text, ['{', ',']))))) {
                    // function() vs function ()
                    // yield*() vs yield* ()
                    // function*() vs function* ()
                    if (opt.space_after_anon_function) {
                        output.space_before_token = true;
                    }
                } else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === 'catch')) {
                    if (opt.space_before_conditional) {
                        output.space_before_token = true;
                    }
                }

                // Should be a space between await and an IIFE
                if (current_token.text === '(' && last_type === 'TK_RESERVED' && flags.last_word === 'await') {
                    output.space_before_token = true;
                }

                // Support of this kind of newline preservation.
                // a = (b &&
                //     (c || d));
                if (current_token.text === '(') {
                    if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                        if (!start_of_object_property()) {
                            allow_wrap_or_preserved_newline();
                        }
                    }
                }

                // Support preserving wrapped arrow function expressions
                // a.b('c',
                //     () => d.e
                // )
                if (current_token.text === '(' && last_type !== 'TK_WORD' && last_type !== 'TK_RESERVED') {
                    allow_wrap_or_preserved_newline();
                }

                set_mode(next_mode);
                print_token();
                if (opt.space_in_paren) {
                    output.space_before_token = true;
                }

                // In all cases, if we newline while inside an expression it should be indented.
                indent();
            }

            function handle_end_expr() {
                // statements inside expressions are not valid syntax, but...
                // statements must all be closed when their container closes
                while (flags.mode === MODE.Statement) {
                    restore_mode();
                }

                handle_whitespace_and_comments(current_token);

                if (flags.multiline_frame) {
                    allow_wrap_or_preserved_newline(current_token.text === ']' && is_array(flags.mode) && !opt.keep_array_indentation);
                }

                if (opt.space_in_paren) {
                    if (last_type === 'TK_START_EXPR' && !opt.space_in_empty_paren) {
                        // () [] no inner space in empty parens like these, ever, ref #320
                        output.trim();
                        output.space_before_token = false;
                    } else {
                        output.space_before_token = true;
                    }
                }
                if (current_token.text === ']' && opt.keep_array_indentation) {
                    print_token();
                    restore_mode();
                } else {
                    restore_mode();
                    print_token();
                }
                output.remove_redundant_indentation(previous_flags);

                // do {} while () // no statement required after
                if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                    previous_flags.mode = MODE.Expression;
                    flags.do_block = false;
                    flags.do_while = false;

                }
            }

            function handle_start_block() {
                handle_whitespace_and_comments(current_token);

                // Check if this is should be treated as a ObjectLiteral
                var next_token = get_token(1);
                var second_token = get_token(2);
                if (second_token && (
                        (in_array(second_token.text, [':', ',']) && in_array(next_token.type, ['TK_STRING', 'TK_WORD', 'TK_RESERVED'])) ||
                        (in_array(next_token.text, ['get', 'set', '...']) && in_array(second_token.type, ['TK_WORD', 'TK_RESERVED']))
                    )) {
                    // We don't support TypeScript,but we didn't break it for a very long time.
                    // We'll try to keep not breaking it.
                    if (!in_array(last_last_text, ['class', 'interface'])) {
                        set_mode(MODE.ObjectLiteral);
                    } else {
                        set_mode(MODE.BlockStatement);
                    }
                } else if (last_type === 'TK_OPERATOR' && flags.last_text === '=>') {
                    // arrow function: (param1, paramN) => { statements }
                    set_mode(MODE.BlockStatement);
                } else if (in_array(last_type, ['TK_EQUALS', 'TK_START_EXPR', 'TK_COMMA', 'TK_OPERATOR']) ||
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['return', 'throw', 'import', 'default']))
                ) {
                    // Detecting shorthand function syntax is difficult by scanning forward,
                    //     so check the surrounding context.
                    // If the block is being returned, imported, export default, passed as arg,
                    //     assigned with = or assigned in a nested object, treat as an ObjectLiteral.
                    set_mode(MODE.ObjectLiteral);
                } else {
                    set_mode(MODE.BlockStatement);
                }

                var empty_braces = !next_token.comments_before.length && next_token.text === '}';
                var empty_anonymous_function = empty_braces && flags.last_word === 'function' &&
                    last_type === 'TK_END_EXPR';

                if (opt.brace_preserve_inline) // check for inline, set inline_frame if so
                {
                    // search forward for a newline wanted inside this block
                    var index = 0;
                    var check_token = null;
                    flags.inline_frame = true;
                    do {
                        index += 1;
                        check_token = get_token(index);
                        if (check_token.wanted_newline) {
                            flags.inline_frame = false;
                            break;
                        }
                    } while (check_token.type !== 'TK_EOF' &&
                        !(check_token.type === 'TK_END_BLOCK' && check_token.opened === current_token));
                }

                if ((opt.brace_style === "expand" ||
                        (opt.brace_style === "none" && current_token.wanted_newline)) &&
                    !flags.inline_frame) {
                    if (last_type !== 'TK_OPERATOR' &&
                        (empty_anonymous_function ||
                            last_type === 'TK_EQUALS' ||
                            (last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else'))) {
                        output.space_before_token = true;
                    } else {
                        print_newline(false, true);
                    }
                } else { // collapse || inline_frame
                    if (is_array(previous_flags.mode) && (last_type === 'TK_START_EXPR' || last_type === 'TK_COMMA')) {
                        if (last_type === 'TK_COMMA' || opt.space_in_paren) {
                            output.space_before_token = true;
                        }

                        if (last_type === 'TK_COMMA' || (last_type === 'TK_START_EXPR' && flags.inline_frame)) {
                            allow_wrap_or_preserved_newline();
                            previous_flags.multiline_frame = previous_flags.multiline_frame || flags.multiline_frame;
                            flags.multiline_frame = false;
                        }
                    }
                    if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                        if (last_type === 'TK_START_BLOCK' && !flags.inline_frame) {
                            print_newline();
                        } else {
                            output.space_before_token = true;
                        }
                    }
                }
                print_token();
                indent();
            }

            function handle_end_block() {
                // statements must all be closed when their container closes
                handle_whitespace_and_comments(current_token);

                while (flags.mode === MODE.Statement) {
                    restore_mode();
                }

                var empty_braces = last_type === 'TK_START_BLOCK';

                if (flags.inline_frame && !empty_braces) { // try inline_frame (only set if opt.braces-preserve-inline) first
                    output.space_before_token = true;
                } else if (opt.brace_style === "expand") {
                    if (!empty_braces) {
                        print_newline();
                    }
                } else {
                    // skip {}
                    if (!empty_braces) {
                        if (is_array(flags.mode) && opt.keep_array_indentation) {
                            // we REALLY need a newline here, but newliner would skip that
                            opt.keep_array_indentation = false;
                            print_newline();
                            opt.keep_array_indentation = true;

                        } else {
                            print_newline();
                        }
                    }
                }
                restore_mode();
                print_token();
            }

            function handle_word() {
                if (current_token.type === 'TK_RESERVED') {
                    if (in_array(current_token.text, ['set', 'get']) && flags.mode !== MODE.ObjectLiteral) {
                        current_token.type = 'TK_WORD';
                    } else if (in_array(current_token.text, ['as', 'from']) && !flags.import_block) {
                        current_token.type = 'TK_WORD';
                    } else if (flags.mode === MODE.ObjectLiteral) {
                        var next_token = get_token(1);
                        if (next_token.text === ':') {
                            current_token.type = 'TK_WORD';
                        }
                    }
                }

                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD') {
                        flags.declaration_statement = true;
                    }
                } else if (current_token.wanted_newline && !is_expression(flags.mode) &&
                    (last_type !== 'TK_OPERATOR' || (flags.last_text === '--' || flags.last_text === '++')) &&
                    last_type !== 'TK_EQUALS' &&
                    (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const', 'set', 'get'])))) {
                    handle_whitespace_and_comments(current_token);
                    print_newline();
                } else {
                    handle_whitespace_and_comments(current_token);
                }

                if (flags.do_block && !flags.do_while) {
                    if (current_token.type === 'TK_RESERVED' && current_token.text === 'while') {
                        // do {} ## while ()
                        output.space_before_token = true;
                        print_token();
                        output.space_before_token = true;
                        flags.do_while = true;
                        return;
                    } else {
                        // do {} should always have while as the next word.
                        // if we don't see the expected while, recover
                        print_newline();
                        flags.do_block = false;
                    }
                }

                // if may be followed by else, or not
                // Bare/inline ifs are tricky
                // Need to unwind the modes correctly: if (a) if (b) c(); else d(); else e();
                if (flags.if_block) {
                    if (!flags.else_block && (current_token.type === 'TK_RESERVED' && current_token.text === 'else')) {
                        flags.else_block = true;
                    } else {
                        while (flags.mode === MODE.Statement) {
                            restore_mode();
                        }
                        flags.if_block = false;
                        flags.else_block = false;
                    }
                }

                if (current_token.type === 'TK_RESERVED' && (current_token.text === 'case' || (current_token.text === 'default' && flags.in_case_statement))) {
                    print_newline();
                    if (flags.case_body || opt.jslint_happy) {
                        // switch cases following one another
                        deindent();
                        flags.case_body = false;
                    }
                    print_token();
                    flags.in_case = true;
                    flags.in_case_statement = true;
                    return;
                }

                if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                    if (!start_of_object_property()) {
                        allow_wrap_or_preserved_newline();
                    }
                }

                if (current_token.type === 'TK_RESERVED' && current_token.text === 'function') {
                    if (in_array(flags.last_text, ['}', ';']) ||
                        (output.just_added_newline() && !(in_array(flags.last_text, ['(', '[', '{', ':', '=', ',']) || last_type === 'TK_OPERATOR'))) {
                        // make sure there is a nice clean space of at least one blank line
                        // before a new function definition
                        if (!output.just_added_blankline() && !current_token.comments_before.length) {
                            print_newline();
                            print_newline(true);
                        }
                    }
                    if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                        if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return', 'export', 'async'])) {
                            output.space_before_token = true;
                        } else if (last_type === 'TK_RESERVED' && flags.last_text === 'default' && last_last_text === 'export') {
                            output.space_before_token = true;
                        } else {
                            print_newline();
                        }
                    } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                        // foo = function
                        output.space_before_token = true;
                    } else if (!flags.multiline_frame && (is_expression(flags.mode) || is_array(flags.mode))) {
                        // (function
                    } else {
                        print_newline();
                    }

                    print_token();
                    flags.last_word = current_token.text;
                    return;
                }

                prefix = 'NONE';

                if (last_type === 'TK_END_BLOCK') {

                    if (previous_flags.inline_frame) {
                        prefix = 'SPACE';
                    } else if (!(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally', 'from']))) {
                        prefix = 'NEWLINE';
                    } else {
                        if (opt.brace_style === "expand" ||
                            opt.brace_style === "end-expand" ||
                            (opt.brace_style === "none" && current_token.wanted_newline)) {
                            prefix = 'NEWLINE';
                        } else {
                            prefix = 'SPACE';
                            output.space_before_token = true;
                        }
                    }
                } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                    // TODO: Should this be for STATEMENT as well?
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                    prefix = 'SPACE';
                } else if (last_type === 'TK_STRING') {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' ||
                    (flags.last_text === '*' &&
                        (in_array(last_last_text, ['function', 'yield']) ||
                            (flags.mode === MODE.ObjectLiteral && in_array(last_last_text, ['{', ',']))))) {
                    prefix = 'SPACE';
                } else if (last_type === 'TK_START_BLOCK') {
                    if (flags.inline_frame) {
                        prefix = 'SPACE';
                    } else {
                        prefix = 'NEWLINE';
                    }
                } else if (last_type === 'TK_END_EXPR') {
                    output.space_before_token = true;
                    prefix = 'NEWLINE';
                }

                if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                    if (flags.inline_frame || flags.last_text === 'else' || flags.last_text === 'export') {
                        prefix = 'SPACE';
                    } else {
                        prefix = 'NEWLINE';
                    }

                }

                if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally'])) {
                    if ((!(last_type === 'TK_END_BLOCK' && previous_flags.mode === MODE.BlockStatement) ||
                            opt.brace_style === "expand" ||
                            opt.brace_style === "end-expand" ||
                            (opt.brace_style === "none" && current_token.wanted_newline)) &&
                        !flags.inline_frame) {
                        print_newline();
                    } else {
                        output.trim(true);
                        var line = output.current_line;
                        // If we trimmed and there's something other than a close block before us
                        // put a newline back in.  Handles '} // comment' scenario.
                        if (line.last() !== '}') {
                            print_newline();
                        }
                        output.space_before_token = true;
                    }
                } else if (prefix === 'NEWLINE') {
                    if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                        // no newline between 'return nnn'
                        output.space_before_token = true;
                    } else if (last_type !== 'TK_END_EXPR') {
                        if ((last_type !== 'TK_START_EXPR' || !(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['var', 'let', 'const']))) && flags.last_text !== ':') {
                            // no need to force newline on 'var': for (var x = 0...)
                            if (current_token.type === 'TK_RESERVED' && current_token.text === 'if' && flags.last_text === 'else') {
                                // no newline for } else if {
                                output.space_before_token = true;
                            } else {
                                print_newline();
                            }
                        }
                    } else if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                        print_newline();
                    }
                } else if (flags.multiline_frame && is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                    print_newline(); // }, in lists get a newline treatment
                } else if (prefix === 'SPACE') {
                    output.space_before_token = true;
                }
                print_token();
                flags.last_word = current_token.text;

                if (current_token.type === 'TK_RESERVED') {
                    if (current_token.text === 'do') {
                        flags.do_block = true;
                    } else if (current_token.text === 'if') {
                        flags.if_block = true;
                    } else if (current_token.text === 'import') {
                        flags.import_block = true;
                    } else if (flags.import_block && current_token.type === 'TK_RESERVED' && current_token.text === 'from') {
                        flags.import_block = false;
                    }
                }
            }

            function handle_semicolon() {
                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                    // Semicolon can be the start (and end) of a statement
                    output.space_before_token = false;
                } else {
                    handle_whitespace_and_comments(current_token);
                }

                var next_token = get_token(1);
                while (flags.mode === MODE.Statement &&
                    !(flags.if_block && next_token && next_token.type === 'TK_RESERVED' && next_token.text === 'else') &&
                    !flags.do_block) {
                    restore_mode();
                }

                // hacky but effective for the moment
                if (flags.import_block) {
                    flags.import_block = false;
                }
                print_token();
            }

            function handle_string() {
                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                    // One difference - strings want at least a space before
                    output.space_before_token = true;
                } else {
                    handle_whitespace_and_comments(current_token);
                    if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' || flags.inline_frame) {
                        output.space_before_token = true;
                    } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                        if (!start_of_object_property()) {
                            allow_wrap_or_preserved_newline();
                        }
                    } else {
                        print_newline();
                    }
                }
                print_token();
            }

            function handle_equals() {
                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                } else {
                    handle_whitespace_and_comments(current_token);
                }

                if (flags.declaration_statement) {
                    // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                    flags.declaration_assignment = true;
                }
                output.space_before_token = true;
                print_token();
                output.space_before_token = true;
            }

            function handle_comma() {
                handle_whitespace_and_comments(current_token, true);

                print_token();
                output.space_before_token = true;
                if (flags.declaration_statement) {
                    if (is_expression(flags.parent.mode)) {
                        // do not break on comma, for(var a = 1, b = 2)
                        flags.declaration_assignment = false;
                    }

                    if (flags.declaration_assignment) {
                        flags.declaration_assignment = false;
                        print_newline(false, true);
                    } else if (opt.comma_first) {
                        // for comma-first, we want to allow a newline before the comma
                        // to turn into a newline after the comma, which we will fixup later
                        allow_wrap_or_preserved_newline();
                    }
                } else if (flags.mode === MODE.ObjectLiteral ||
                    (flags.mode === MODE.Statement && flags.parent.mode === MODE.ObjectLiteral)) {
                    if (flags.mode === MODE.Statement) {
                        restore_mode();
                    }

                    if (!flags.inline_frame) {
                        print_newline();
                    }
                } else if (opt.comma_first) {
                    // EXPR or DO_BLOCK
                    // for comma-first, we want to allow a newline before the comma
                    // to turn into a newline after the comma, which we will fixup later
                    allow_wrap_or_preserved_newline();
                }
            }

            function handle_operator() {
                var isGeneratorAsterisk = current_token.text === '*' &&
                    ((last_type === 'TK_RESERVED' && in_array(flags.last_text, ['function', 'yield'])) ||
                        (in_array(last_type, ['TK_START_BLOCK', 'TK_COMMA', 'TK_END_BLOCK', 'TK_SEMICOLON']))
                    );
                var isUnary = in_array(current_token.text, ['-', '+']) && (
                    in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) ||
                    in_array(flags.last_text, Tokenizer.line_starters) ||
                    flags.last_text === ','
                );

                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                } else {
                    var preserve_statement_flags = !isGeneratorAsterisk;
                    handle_whitespace_and_comments(current_token, preserve_statement_flags);
                }

                if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                    // "return" had a special handling in TK_WORD. Now we need to return the favor
                    output.space_before_token = true;
                    print_token();
                    return;
                }

                // hack for actionscript's import .*;
                if (current_token.text === '*' && last_type === 'TK_DOT') {
                    print_token();
                    return;
                }

                if (current_token.text === '::') {
                    // no spaces around exotic namespacing syntax operator
                    print_token();
                    return;
                }

                // Allow line wrapping between operators when operator_position is
                //   set to before or preserve
                if (last_type === 'TK_OPERATOR' && in_array(opt.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)) {
                    allow_wrap_or_preserved_newline();
                }

                if (current_token.text === ':' && flags.in_case) {
                    flags.case_body = true;
                    indent();
                    print_token();
                    print_newline();
                    flags.in_case = false;
                    return;
                }

                var space_before = true;
                var space_after = true;
                var in_ternary = false;
                if (current_token.text === ':') {
                    if (flags.ternary_depth === 0) {
                        // Colon is invalid javascript outside of ternary and object, but do our best to guess what was meant.
                        space_before = false;
                    } else {
                        flags.ternary_depth -= 1;
                        in_ternary = true;
                    }
                } else if (current_token.text === '?') {
                    flags.ternary_depth += 1;
                }

                // let's handle the operator_position option prior to any conflicting logic
                if (!isUnary && !isGeneratorAsterisk && opt.preserve_newlines && in_array(current_token.text, Tokenizer.positionable_operators)) {
                    var isColon = current_token.text === ':';
                    var isTernaryColon = (isColon && in_ternary);
                    var isOtherColon = (isColon && !in_ternary);

                    switch (opt.operator_position) {
                        case OPERATOR_POSITION.before_newline:
                            // if the current token is : and it's not a ternary statement then we set space_before to false
                            output.space_before_token = !isOtherColon;

                            print_token();

                            if (!isColon || isTernaryColon) {
                                allow_wrap_or_preserved_newline();
                            }

                            output.space_before_token = true;
                            return;

                        case OPERATOR_POSITION.after_newline:
                            // if the current token is anything but colon, or (via deduction) it's a colon and in a ternary statement,
                            //   then print a newline.

                            output.space_before_token = true;

                            if (!isColon || isTernaryColon) {
                                if (get_token(1).wanted_newline) {
                                    print_newline(false, true);
                                } else {
                                    allow_wrap_or_preserved_newline();
                                }
                            } else {
                                output.space_before_token = false;
                            }

                            print_token();

                            output.space_before_token = true;
                            return;

                        case OPERATOR_POSITION.preserve_newline:
                            if (!isOtherColon) {
                                allow_wrap_or_preserved_newline();
                            }

                            // if we just added a newline, or the current token is : and it's not a ternary statement,
                            //   then we set space_before to false
                            space_before = !(output.just_added_newline() || isOtherColon);

                            output.space_before_token = space_before;
                            print_token();
                            output.space_before_token = true;
                            return;
                    }
                }

                if (isGeneratorAsterisk) {
                    allow_wrap_or_preserved_newline();
                    space_before = false;
                    var next_token = get_token(1);
                    space_after = next_token && in_array(next_token.type, ['TK_WORD', 'TK_RESERVED']);
                } else if (current_token.text === '...') {
                    allow_wrap_or_preserved_newline();
                    space_before = last_type === 'TK_START_BLOCK';
                    space_after = false;
                } else if (in_array(current_token.text, ['--', '++', '!', '~']) || isUnary) {
                    // unary operators (and binary +/- pretending to be unary) special cases

                    space_before = false;
                    space_after = false;

                    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
                    // if there is a newline between -- or ++ and anything else we should preserve it.
                    if (current_token.wanted_newline && (current_token.text === '--' || current_token.text === '++')) {
                        print_newline(false, true);
                    }

                    if (flags.last_text === ';' && is_expression(flags.mode)) {
                        // for (;; ++i)
                        //        ^^^
                        space_before = true;
                    }

                    if (last_type === 'TK_RESERVED') {
                        space_before = true;
                    } else if (last_type === 'TK_END_EXPR') {
                        space_before = !(flags.last_text === ']' && (current_token.text === '--' || current_token.text === '++'));
                    } else if (last_type === 'TK_OPERATOR') {
                        // a++ + ++b;
                        // a - -b
                        space_before = in_array(current_token.text, ['--', '-', '++', '+']) && in_array(flags.last_text, ['--', '-', '++', '+']);
                        // + and - are not unary when preceeded by -- or ++ operator
                        // a-- + b
                        // a * +b
                        // a - -b
                        if (in_array(current_token.text, ['+', '-']) && in_array(flags.last_text, ['--', '++'])) {
                            space_after = true;
                        }
                    }


                    if (((flags.mode === MODE.BlockStatement && !flags.inline_frame) || flags.mode === MODE.Statement) &&
                        (flags.last_text === '{' || flags.last_text === ';')) {
                        // { foo; --i }
                        // foo(); --bar;
                        print_newline();
                    }
                }

                output.space_before_token = output.space_before_token || space_before;
                print_token();
                output.space_before_token = space_after;
            }

            function handle_block_comment(preserve_statement_flags) {
                if (output.raw) {
                    output.add_raw_token(current_token);
                    if (current_token.directives && current_token.directives.preserve === 'end') {
                        // If we're testing the raw output behavior, do not allow a directive to turn it off.
                        output.raw = opt.test_output_raw;
                    }
                    return;
                }

                if (current_token.directives) {
                    print_newline(false, preserve_statement_flags);
                    print_token();
                    if (current_token.directives.preserve === 'start') {
                        output.raw = true;
                    }
                    print_newline(false, true);
                    return;
                }

                // inline block
                if (!acorn.newline.test(current_token.text) && !current_token.wanted_newline) {
                    output.space_before_token = true;
                    print_token();
                    output.space_before_token = true;
                    return;
                }

                var lines = split_linebreaks(current_token.text);
                var j; // iterator for this case
                var javadoc = false;
                var starless = false;
                var lastIndent = current_token.whitespace_before;
                var lastIndentLength = lastIndent.length;

                // block comment starts with a new line
                print_newline(false, preserve_statement_flags);
                if (lines.length > 1) {
                    javadoc = all_lines_start_with(lines.slice(1), '*');
                    starless = each_line_matches_indent(lines.slice(1), lastIndent);
                }

                // first line always indented
                print_token(lines[0]);
                for (j = 1; j < lines.length; j++) {
                    print_newline(false, true);
                    if (javadoc) {
                        // javadoc: reformat and re-indent
                        print_token(' ' + ltrim(lines[j]));
                    } else if (starless && lines[j].length > lastIndentLength) {
                        // starless: re-indent non-empty content, avoiding trim
                        print_token(lines[j].substring(lastIndentLength));
                    } else {
                        // normal comments output raw
                        output.add_token(lines[j]);
                    }
                }

                // for comments of more than one line, make sure there's a new line after
                print_newline(false, preserve_statement_flags);
            }

            function handle_comment(preserve_statement_flags) {
                if (current_token.wanted_newline) {
                    print_newline(false, preserve_statement_flags);
                } else {
                    output.trim(true);
                }

                output.space_before_token = true;
                print_token();
                print_newline(false, preserve_statement_flags);
            }

            function handle_dot() {
                if (start_of_statement()) {
                    // The conditional starts the statement if appropriate.
                } else {
                    handle_whitespace_and_comments(current_token, true);
                }

                if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                    output.space_before_token = true;
                } else {
                    // allow preserved newlines before dots in general
                    // force newlines on dots after close paren when break_chained - for bar().baz()
                    allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
                }

                print_token();
            }

            function handle_unknown(preserve_statement_flags) {
                print_token();

                if (current_token.text[current_token.text.length - 1] === '\n') {
                    print_newline(false, preserve_statement_flags);
                }
            }

            function handle_eof() {
                // Unwind any open statements
                while (flags.mode === MODE.Statement) {
                    restore_mode();
                }
                handle_whitespace_and_comments(current_token);
            }
        }


        function OutputLine(parent) {
            var _character_count = 0;
            // use indent_count as a marker for lines that have preserved indentation
            var _indent_count = -1;

            var _items = [];
            var _empty = true;

            this.set_indent = function(level) {
                _character_count = parent.baseIndentLength + level * parent.indent_length;
                _indent_count = level;
            };

            this.get_character_count = function() {
                return _character_count;
            };

            this.is_empty = function() {
                return _empty;
            };

            this.last = function() {
                if (!this._empty) {
                    return _items[_items.length - 1];
                } else {
                    return null;
                }
            };

            this.push = function(input) {
                _items.push(input);
                _character_count += input.length;
                _empty = false;
            };

            this.pop = function() {
                var item = null;
                if (!_empty) {
                    item = _items.pop();
                    _character_count -= item.length;
                    _empty = _items.length === 0;
                }
                return item;
            };

            this.remove_indent = function() {
                if (_indent_count > 0) {
                    _indent_count -= 1;
                    _character_count -= parent.indent_length;
                }
            };

            this.trim = function() {
                while (this.last() === ' ') {
                    _items.pop();
                    _character_count -= 1;
                }
                _empty = _items.length === 0;
            };

            this.toString = function() {
                var result = '';
                if (!this._empty) {
                    if (_indent_count >= 0) {
                        result = parent.indent_cache[_indent_count];
                    }
                    result += _items.join('');
                }
                return result;
            };
        }

        function Output(indent_string, baseIndentString) {
            baseIndentString = baseIndentString || '';
            this.indent_cache = [baseIndentString];
            this.baseIndentLength = baseIndentString.length;
            this.indent_length = indent_string.length;
            this.raw = false;

            var lines = [];
            this.baseIndentString = baseIndentString;
            this.indent_string = indent_string;
            this.previous_line = null;
            this.current_line = null;
            this.space_before_token = false;

            this.add_outputline = function() {
                this.previous_line = this.current_line;
                this.current_line = new OutputLine(this);
                lines.push(this.current_line);
            };

            // initialize
            this.add_outputline();


            this.get_line_number = function() {
                return lines.length;
            };

            // Using object instead of string to allow for later expansion of info about each line
            this.add_new_line = function(force_newline) {
                if (this.get_line_number() === 1 && this.just_added_newline()) {
                    return false; // no newline on start of file
                }

                if (force_newline || !this.just_added_newline()) {
                    if (!this.raw) {
                        this.add_outputline();
                    }
                    return true;
                }

                return false;
            };

            this.get_code = function() {
                var sweet_code = lines.join('\n').replace(/[\r\n\t ]+$/, '');
                return sweet_code;
            };

            this.set_indent = function(level) {
                // Never indent your first output indent at the start of the file
                if (lines.length > 1) {
                    while (level >= this.indent_cache.length) {
                        this.indent_cache.push(this.indent_cache[this.indent_cache.length - 1] + this.indent_string);
                    }

                    this.current_line.set_indent(level);
                    return true;
                }
                this.current_line.set_indent(0);
                return false;
            };

            this.add_raw_token = function(token) {
                for (var x = 0; x < token.newlines; x++) {
                    this.add_outputline();
                }
                this.current_line.push(token.whitespace_before);
                this.current_line.push(token.text);
                this.space_before_token = false;
            };

            this.add_token = function(printable_token) {
                this.add_space_before_token();
                this.current_line.push(printable_token);
            };

            this.add_space_before_token = function() {
                if (this.space_before_token && !this.just_added_newline()) {
                    this.current_line.push(' ');
                }
                this.space_before_token = false;
            };

            this.remove_redundant_indentation = function(frame) {
                // This implementation is effective but has some issues:
                //     - can cause line wrap to happen too soon due to indent removal
                //           after wrap points are calculated
                // These issues are minor compared to ugly indentation.

                if (frame.multiline_frame ||
                    frame.mode === MODE.ForInitializer ||
                    frame.mode === MODE.Conditional) {
                    return;
                }

                // remove one indent from each line inside this section
                var index = frame.start_line_index;

                var output_length = lines.length;
                while (index < output_length) {
                    lines[index].remove_indent();
                    index++;
                }
            };

            this.trim = function(eat_newlines) {
                eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;

                this.current_line.trim(indent_string, baseIndentString);

                while (eat_newlines && lines.length > 1 &&
                    this.current_line.is_empty()) {
                    lines.pop();
                    this.current_line = lines[lines.length - 1];
                    this.current_line.trim();
                }

                this.previous_line = lines.length > 1 ? lines[lines.length - 2] : null;
            };

            this.just_added_newline = function() {
                return this.current_line.is_empty();
            };

            this.just_added_blankline = function() {
                if (this.just_added_newline()) {
                    if (lines.length === 1) {
                        return true; // start of the file and newline = blank
                    }

                    var line = lines[lines.length - 2];
                    return line.is_empty();
                }
                return false;
            };
        }

        var InputScanner = function(input) {
            var _input = input;
            var _input_length = _input.length;
            var _position = 0;

            this.back = function() {
                _position -= 1;
            };

            this.hasNext = function() {
                return _position < _input_length;
            };

            this.next = function() {
                var val = null;
                if (this.hasNext()) {
                    val = _input.charAt(_position);
                    _position += 1;
                }
                return val;
            };

            this.peek = function(index) {
                var val = null;
                index = index || 0;
                index += _position;
                if (index >= 0 && index < _input_length) {
                    val = _input.charAt(index);
                }
                return val;
            };

            this.peekCharCode = function(index) {
                var val = 0;
                index = index || 0;
                index += _position;
                if (index >= 0 && index < _input_length) {
                    val = _input.charCodeAt(index);
                }
                return val;
            };

            this.test = function(pattern, index) {
                index = index || 0;
                pattern.lastIndex = _position + index;
                return pattern.test(_input);
            };

            this.testChar = function(pattern, index) {
                var val = this.peek(index);
                return val !== null && pattern.test(val);
            };

            this.match = function(pattern) {
                pattern.lastIndex = _position;
                var pattern_match = pattern.exec(_input);
                if (pattern_match && pattern_match.index === _position) {
                    _position += pattern_match[0].length;
                } else {
                    pattern_match = null;
                }
                return pattern_match;
            };
        };

        var Token = function(type, text, newlines, whitespace_before, parent) {
            this.type = type;
            this.text = text;

            // comments_before are
            // comments that have a new line before them
            // and may or may not have a newline after
            // this is a set of comments before
            this.comments_before = /* inline comment*/ [];


            this.comments_after = []; // no new line before and newline after
            this.newlines = newlines || 0;
            this.wanted_newline = newlines > 0;
            this.whitespace_before = whitespace_before || '';
            this.parent = parent || null;
            this.opened = null;
            this.directives = null;
        };

        function tokenizer(input_string, opts) {

            var whitespace = "\n\r\t ".split('');
            var digit = /[0-9]/;
            var digit_bin = /[01]/;
            var digit_oct = /[01234567]/;
            var digit_hex = /[0123456789abcdefABCDEF]/;

            this.positionable_operators = '!= !== % & && * ** + - / : < << <= == === > >= >> >>> ? ^ | ||'.split(' ');
            var punct = this.positionable_operators.concat(
                // non-positionable operators - these do not follow operator position settings
                '! %= &= *= **= ++ += , -- -= /= :: <<= = => >>= >>>= ^= |= ~ ...'.split(' '));

            // words which should always start on new line.
            this.line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,import,export'.split(',');
            var reserved_words = this.line_starters.concat(['do', 'in', 'of', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof', 'yield', 'async', 'await', 'from', 'as']);

            //  /* ... */ comment ends with nearest */ or end of file
            var block_comment_pattern = /([\s\S]*?)((?:\*\/)|$)/g;

            // comment ends just before nearest linefeed or end of file
            var comment_pattern = /([^\n\r\u2028\u2029]*)/g;

            var directives_block_pattern = /\/\* beautify( \w+[:]\w+)+ \*\//g;
            var directive_pattern = / (\w+)[:](\w+)/g;
            var directives_end_ignore_pattern = /([\s\S]*?)((?:\/\*\sbeautify\signore:end\s\*\/)|$)/g;

            var template_pattern = /((<\?php|<\?=)[\s\S]*?\?>)|(<%[\s\S]*?%>)/g;

            var n_newlines, whitespace_before_token, in_html_comment, tokens;
            var input;

            this.tokenize = function() {
                input = new InputScanner(input_string);
                in_html_comment = false;
                tokens = [];

                var next, last;
                var token_values;
                var open = null;
                var open_stack = [];
                var comments = [];

                while (!(last && last.type === 'TK_EOF')) {
                    token_values = tokenize_next();
                    next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                    while (next.type === 'TK_COMMENT' || next.type === 'TK_BLOCK_COMMENT' || next.type === 'TK_UNKNOWN') {
                        if (next.type === 'TK_BLOCK_COMMENT') {
                            next.directives = token_values[2];
                        }
                        comments.push(next);
                        token_values = tokenize_next();
                        next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                    }

                    if (comments.length) {
                        next.comments_before = comments;
                        comments = [];
                    }

                    if (next.type === 'TK_START_BLOCK' || next.type === 'TK_START_EXPR') {
                        next.parent = last;
                        open_stack.push(open);
                        open = next;
                    } else if ((next.type === 'TK_END_BLOCK' || next.type === 'TK_END_EXPR') &&
                        (open && (
                            (next.text === ']' && open.text === '[') ||
                            (next.text === ')' && open.text === '(') ||
                            (next.text === '}' && open.text === '{')))) {
                        next.parent = open.parent;
                        next.opened = open;

                        open = open_stack.pop();
                    }

                    tokens.push(next);
                    last = next;
                }

                return tokens;
            };

            function get_directives(text) {
                if (!text.match(directives_block_pattern)) {
                    return null;
                }

                var directives = {};
                directive_pattern.lastIndex = 0;
                var directive_match = directive_pattern.exec(text);

                while (directive_match) {
                    directives[directive_match[1]] = directive_match[2];
                    directive_match = directive_pattern.exec(text);
                }

                return directives;
            }

            function tokenize_next() {
                var resulting_string;
                var whitespace_on_this_line = [];

                n_newlines = 0;
                whitespace_before_token = '';

                var c = input.next();

                if (c === null) {
                    return ['', 'TK_EOF'];
                }

                var last_token;
                if (tokens.length) {
                    last_token = tokens[tokens.length - 1];
                } else {
                    // For the sake of tokenizing we can pretend that there was on open brace to start
                    last_token = new Token('TK_START_BLOCK', '{');
                }

                while (in_array(c, whitespace)) {

                    if (acorn.newline.test(c)) {
                        if (!(c === '\n' && input.peek(-2) === '\r')) {
                            n_newlines += 1;
                            whitespace_on_this_line = [];
                        }
                    } else {
                        whitespace_on_this_line.push(c);
                    }

                    c = input.next();

                    if (c === null) {
                        return ['', 'TK_EOF'];
                    }
                }

                if (whitespace_on_this_line.length) {
                    whitespace_before_token = whitespace_on_this_line.join('');
                }

                if (digit.test(c) || (c === '.' && input.testChar(digit))) {
                    var allow_decimal = true;
                    var allow_e = true;
                    var local_digit = digit;

                    if (c === '0' && input.testChar(/[XxOoBb]/)) {
                        // switch to hex/oct/bin number, no decimal or e, just hex/oct/bin digits
                        allow_decimal = false;
                        allow_e = false;
                        if (input.testChar(/[Bb]/)) {
                            local_digit = digit_bin;
                        } else if (input.testChar(/[Oo]/)) {
                            local_digit = digit_oct;
                        } else {
                            local_digit = digit_hex;
                        }
                        c += input.next();
                    } else if (c === '.') {
                        // Already have a decimal for this literal, don't allow another
                        allow_decimal = false;
                    } else {
                        // we know this first loop will run.  It keeps the logic simpler.
                        c = '';
                        input.back();
                    }

                    // Add the digits
                    while (input.testChar(local_digit)) {
                        c += input.next();

                        if (allow_decimal && input.peek() === '.') {
                            c += input.next();
                            allow_decimal = false;
                        }

                        // a = 1.e-7 is valid, so we test for . then e in one loop
                        if (allow_e && input.testChar(/[Ee]/)) {
                            c += input.next();

                            if (input.testChar(/[+-]/)) {
                                c += input.next();
                            }

                            allow_e = false;
                            allow_decimal = false;
                        }
                    }

                    return [c, 'TK_WORD'];
                }

                if (acorn.isIdentifierStart(input.peekCharCode(-1))) {
                    if (input.hasNext()) {
                        while (acorn.isIdentifierChar(input.peekCharCode())) {
                            c += input.next();
                            if (!input.hasNext()) {
                                break;
                            }
                        }
                    }

                    if (!(last_token.type === 'TK_DOT' ||
                            (last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['set', 'get']))) &&
                        in_array(c, reserved_words)) {
                        if (c === 'in' || c === 'of') { // hack for 'in' and 'of' operators
                            return [c, 'TK_OPERATOR'];
                        }
                        return [c, 'TK_RESERVED'];
                    }

                    return [c, 'TK_WORD'];
                }

                if (c === '(' || c === '[') {
                    return [c, 'TK_START_EXPR'];
                }

                if (c === ')' || c === ']') {
                    return [c, 'TK_END_EXPR'];
                }

                if (c === '{') {
                    return [c, 'TK_START_BLOCK'];
                }

                if (c === '}') {
                    return [c, 'TK_END_BLOCK'];
                }

                if (c === ';') {
                    return [c, 'TK_SEMICOLON'];
                }

                if (c === '/') {
                    var comment = '';
                    var comment_match;
                    // peek for comment /* ... */
                    if (input.peek() === '*') {
                        input.next();
                        comment_match = input.match(block_comment_pattern);
                        comment = '/*' + comment_match[0];
                        var directives = get_directives(comment);
                        if (directives && directives.ignore === 'start') {
                            comment_match = input.match(directives_end_ignore_pattern);
                            comment += comment_match[0];
                        }
                        comment = comment.replace(acorn.allLineBreaks, '\n');
                        return [comment, 'TK_BLOCK_COMMENT', directives];
                    }
                    // peek for comment // ...
                    if (input.peek() === '/') {
                        input.next();
                        comment_match = input.match(comment_pattern);
                        comment = '//' + comment_match[0];
                        return [comment, 'TK_COMMENT'];
                    }

                }

                var startXmlRegExp = /<()([-a-zA-Z:0-9_.]+|{[\s\S]+?}|!\[CDATA\[[\s\S]*?\]\])(\s+{[\s\S]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{[\s\S]+?}))*\s*(\/?)\s*>/g;

                if (c === '`' || c === "'" || c === '"' || // string
                    (
                        (c === '/') || // regexp
                        (opts.e4x && c === "<" && input.test(startXmlRegExp, -1)) // xml
                    ) && ( // regex and xml can only appear in specific locations during parsing
                        (last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['return', 'case', 'throw', 'else', 'do', 'typeof', 'yield'])) ||
                        (last_token.type === 'TK_END_EXPR' && last_token.text === ')' &&
                            last_token.parent && last_token.parent.type === 'TK_RESERVED' && in_array(last_token.parent.text, ['if', 'while', 'for'])) ||
                        (in_array(last_token.type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK',
                            'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA'
                        ]))
                    )) {

                    var sep = c,
                        esc = false,
                        has_char_escapes = false;

                    resulting_string = c;

                    if (sep === '/') {
                        //
                        // handle regexp
                        //
                        var in_char_class = false;
                        while (input.hasNext() &&
                            ((esc || in_char_class || input.peek() !== sep) &&
                                !input.testChar(acorn.newline))) {
                            resulting_string += input.peek();
                            if (!esc) {
                                esc = input.peek() === '\\';
                                if (input.peek() === '[') {
                                    in_char_class = true;
                                } else if (input.peek() === ']') {
                                    in_char_class = false;
                                }
                            } else {
                                esc = false;
                            }
                            input.next();
                        }
                    } else if (opts.e4x && sep === '<') {
                        //
                        // handle e4x xml literals
                        //

                        var xmlRegExp = /[\s\S]*?<(\/?)([-a-zA-Z:0-9_.]+|{[\s\S]+?}|!\[CDATA\[[\s\S]*?\]\])(\s+{[\s\S]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{[\s\S]+?}))*\s*(\/?)\s*>/g;
                        input.back();
                        var xmlStr = '';
                        var match = input.match(startXmlRegExp);
                        if (match) {
                            // Trim root tag to attempt to
                            var rootTag = match[2].replace(/^{\s+/, '{').replace(/\s+}$/, '}');
                            var isCurlyRoot = rootTag.indexOf('{') === 0;
                            var depth = 0;
                            while (match) {
                                var isEndTag = !!match[1];
                                var tagName = match[2];
                                var isSingletonTag = (!!match[match.length - 1]) || (tagName.slice(0, 8) === "![CDATA[");
                                if (!isSingletonTag &&
                                    (tagName === rootTag || (isCurlyRoot && tagName.replace(/^{\s+/, '{').replace(/\s+}$/, '}')))) {
                                    if (isEndTag) {
                                        --depth;
                                    } else {
                                        ++depth;
                                    }
                                }
                                xmlStr += match[0];
                                if (depth <= 0) {
                                    break;
                                }
                                match = input.match(xmlRegExp);
                            }
                            // if we didn't close correctly, keep unformatted.
                            if (!match) {
                                xmlStr += input.match(/[\s\S]*/g)[0];
                            }
                            xmlStr = xmlStr.replace(acorn.allLineBreaks, '\n');
                            return [xmlStr, "TK_STRING"];
                        }
                    } else {
                        //
                        // handle string
                        //
                        var parse_string = function(delimiter, allow_unescaped_newlines, start_sub) {
                            // Template strings can travers lines without escape characters.
                            // Other strings cannot
                            var current_char;
                            while (input.hasNext()) {
                                current_char = input.peek();
                                if (!(esc || (current_char !== delimiter &&
                                        (allow_unescaped_newlines || !acorn.newline.test(current_char))))) {
                                    break;
                                }

                                // Handle \r\n linebreaks after escapes or in template strings
                                if ((esc || allow_unescaped_newlines) && acorn.newline.test(current_char)) {
                                    if (current_char === '\r' && input.peek(1) === '\n') {
                                        input.next();
                                        current_char = input.peek();
                                    }
                                    resulting_string += '\n';
                                } else {
                                    resulting_string += current_char;
                                }

                                if (esc) {
                                    if (current_char === 'x' || current_char === 'u') {
                                        has_char_escapes = true;
                                    }
                                    esc = false;
                                } else {
                                    esc = current_char === '\\';
                                }

                                input.next();

                                if (start_sub && resulting_string.indexOf(start_sub, resulting_string.length - start_sub.length) !== -1) {
                                    if (delimiter === '`') {
                                        parse_string('}', allow_unescaped_newlines, '`');
                                    } else {
                                        parse_string('`', allow_unescaped_newlines, '${');
                                    }

                                    if (input.hasNext()) {
                                        resulting_string += input.next();
                                    }
                                }
                            }
                        };

                        if (sep === '`') {
                            parse_string('`', true, '${');
                        } else {
                            parse_string(sep);
                        }
                    }

                    if (has_char_escapes && opts.unescape_strings) {
                        resulting_string = unescape_string(resulting_string);
                    }

                    if (input.peek() === sep) {
                        resulting_string += sep;
                        input.next();

                        if (sep === '/') {
                            // regexps may have modifiers /regexp/MOD , so fetch those, too
                            // Only [gim] are valid, but if the user puts in garbage, do what we can to take it.
                            while (input.hasNext() && acorn.isIdentifierStart(input.peekCharCode())) {
                                resulting_string += input.next();
                            }
                        }
                    }
                    return [resulting_string, 'TK_STRING'];
                }

                if (c === '#') {

                    if (tokens.length === 0 && input.peek() === '!') {
                        // shebang
                        resulting_string = c;
                        while (input.hasNext() && c !== '\n') {
                            c = input.next();
                            resulting_string += c;
                        }
                        return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
                    }



                    // Spidermonkey-specific sharp variables for circular references
                    // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                    // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
                    var sharp = '#';
                    if (input.hasNext() && input.testChar(digit)) {
                        do {
                            c = input.next();
                            sharp += c;
                        } while (input.hasNext() && c !== '#' && c !== '=');
                        if (c === '#') {
                            //
                        } else if (input.peek() === '[' && input.peek(1) === ']') {
                            sharp += '[]';
                            input.next();
                            input.next();
                        } else if (input.peek() === '{' && input.peek(1) === '}') {
                            sharp += '{}';
                            input.next();
                            input.next();
                        }
                        return [sharp, 'TK_WORD'];
                    }
                }

                if (c === '<' && (input.peek() === '?' || input.peek() === '%')) {
                    input.back();
                    var template_match = input.match(template_pattern);
                    if (template_match) {
                        c = template_match[0];
                        c = c.replace(acorn.allLineBreaks, '\n');
                        return [c, 'TK_STRING'];
                    }
                }

                if (c === '<' && input.match(/\!--/g)) {
                    c = '<!--';
                    while (input.hasNext() && !input.testChar(acorn.newline)) {
                        c += input.next();
                    }
                    in_html_comment = true;
                    return [c, 'TK_COMMENT'];
                }

                if (c === '-' && in_html_comment && input.match(/->/g)) {
                    in_html_comment = false;
                    return ['-->', 'TK_COMMENT'];
                }

                if (c === '.') {
                    if (input.peek() === '.' && input.peek(1) === '.') {
                        c += input.next() + input.next();
                        return [c, 'TK_OPERATOR'];
                    }
                    return [c, 'TK_DOT'];
                }

                if (in_array(c, punct)) {
                    while (input.hasNext() && in_array(c + input.peek(), punct)) {
                        c += input.next();
                        if (!input.hasNext()) {
                            break;
                        }
                    }

                    if (c === ',') {
                        return [c, 'TK_COMMA'];
                    } else if (c === '=') {
                        return [c, 'TK_EQUALS'];
                    } else {
                        return [c, 'TK_OPERATOR'];
                    }
                }

                return [c, 'TK_UNKNOWN'];
            }


            function unescape_string(s) {
                // You think that a regex would work for this
                // return s.replace(/\\x([0-9a-f]{2})/gi, function(match, val) {
                //         return String.fromCharCode(parseInt(val, 16));
                //     })
                // However, dealing with '\xff', '\\xff', '\\\xff' makes this more fun.
                var out = '',
                    escaped = 0;

                var input_scan = new InputScanner(s);
                var matched = null;

                while (input_scan.hasNext()) {
                    // Keep any whitespace, non-slash characters
                    // also keep slash pairs.
                    matched = input_scan.match(/([\s]|[^\\]|\\\\)+/g);

                    if (matched) {
                        out += matched[0];
                    }

                    if (input_scan.peek() === '\\') {
                        input_scan.next();
                        if (input_scan.peek() === 'x') {
                            matched = input_scan.match(/x([0-9A-Fa-f]{2})/g);
                        } else if (input_scan.peek() === 'u') {
                            matched = input_scan.match(/u([0-9A-Fa-f]{4})/g);
                        } else {
                            out += '\\';
                            if (input_scan.hasNext()) {
                                out += input_scan.next();
                            }
                            continue;
                        }

                        // If there's some error decoding, return the original string
                        if (!matched) {
                            return s;
                        }

                        escaped = parseInt(matched[1], 16);

                        if (escaped > 0x7e && escaped <= 0xff && matched[0].indexOf('x') === 0) {
                            // we bail out on \x7f..\xff,
                            // leaving whole string escaped,
                            // as it's probably completely binary
                            return s;
                        } else if (escaped >= 0x00 && escaped < 0x20) {
                            // leave 0x00...0x1f escaped
                            out += '\\' + matched[0];
                            continue;
                        } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
                            // single-quote, apostrophe, backslash - escape these
                            out += '\\' + String.fromCharCode(escaped);
                        } else {
                            out += String.fromCharCode(escaped);
                        }
                    }
                }

                return out;
            }
        }

        var beautifier = new Beautifier(js_source_text, options);
        return beautifier.beautify();

    }

    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() {
            return { js_beautify: js_beautify };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var js_beautify = require("beautify").js_beautify`.
        exports.js_beautify = js_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.js_beautify = js_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.js_beautify = js_beautify;
    }

}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],12:[function(require,module,exports){
'use strict';

riot.tag2('debugger', '<b id="stick" onclick="{stickToggle}" if="{open}">{stickIndicator}</b><select onchange="{changePos}" if="{open}"><option>top-right</option><option>top-left</option><option selected="">bottom-right</option><option>bottom-left</option></select><b id="clear" onclick="{clear}" if="{open}">clear</b><h3 onclick="{toggle}"><b id="toggle">{toggleIndicator}</b> Debugger </h3><section id="actions"><debugitem each="{actions}"></debugitem><p class="message" onclick="{changeNumActions}"> Showing last {numActions} actions... </p></section>', 'debugger,[data-is="debugger"]{ position: fixed; z-index: 9999; bottom: 10px; right: -300px; opacity: 0.25; width: 400px; height: 600px; background: #eee; font-family: monospace; font-size: 11px; } debugger.top-left,[data-is="debugger"].top-left,debugger.top-right,[data-is="debugger"].top-right{ top: 10px; } debugger.bottom-left,[data-is="debugger"].bottom-left,debugger.bottom-right,[data-is="debugger"].bottom-right{ bottom: 10px; } debugger.top-left,[data-is="debugger"].top-left,debugger.bottom-left,[data-is="debugger"].bottom-left{ left: -300px; } debugger.top-right,[data-is="debugger"].top-right,debugger.bottom-right,[data-is="debugger"].bottom-right{ right: -300px; } debugger.top-left:hover,[data-is="debugger"].top-left:hover,debugger.top-left.stick,[data-is="debugger"].top-left.stick,debugger.bottom-left:hover,[data-is="debugger"].bottom-left:hover,debugger.bottom-left.stick,[data-is="debugger"].bottom-left.stick{ left: 10px; opacity: 1; } debugger.top-right:hover,[data-is="debugger"].top-right:hover,debugger.top-right.stick,[data-is="debugger"].top-right.stick,debugger.bottom-right:hover,[data-is="debugger"].bottom-right:hover,debugger.bottom-right.stick,[data-is="debugger"].bottom-right.stick{ right: 10px; opacity: 1; } debugger.close,[data-is="debugger"].close{ height: 15px; } debugger #toggle,[data-is="debugger"] #toggle,debugger #stick,[data-is="debugger"] #stick,debugger h3,[data-is="debugger"] h3,debugger #clear,[data-is="debugger"] #clear{ cursor: pointer; } debugger #stick,[data-is="debugger"] #stick,debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ float: right; } debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ margin-right: 20px; } debugger h3,[data-is="debugger"] h3{ margin: 0; font-size: 15px; line-height: 15px; padding: 0; } debugger #actions,[data-is="debugger"] #actions{ display: block; position: absolute; top: 50px; left: 10px; right: 10px; bottom: 10px; overflow: auto; } debugger,[data-is="debugger"],debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ display: block; padding: 10px; margin-bottom: 10px; border: 1px solid #aaa; transition: all 250ms cubic-bezier(0.22, 0.61, 0.36, 1); } debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ background: #fff; position: relative; box-shadow: 0; } debugger #actions debugitem:hover,[data-is="debugger"] #actions debugitem:hover{ border-color: #f70; box-shadow: 0px 10px 5px -8px rgba(0,0,0,0.25); } debugger #actions debugitem code,[data-is="debugger"] #actions debugitem code{ background: #eee; padding: 2.5px 5px; line-height: 11px; } debugger #actions debugitem i#num,[data-is="debugger"] #actions debugitem i#num{ position: absolute; top: 10px; right: 10px; } debugger #actions debugitem #time,[data-is="debugger"] #actions debugitem #time{ position: absolute; top: 10px; right: 60px; opacity: 0.25; } debugger #actions .message,[data-is="debugger"] #actions .message{ cursor: pointer; text-align: center; opacity: 0.25; }', '', function (opts) {

    var self = this;
    self.actions = [];
    self.i = 0;
    self.toggleIndicator = '-';
    self.stickIndicator = 'stick';
    self.open = true;
    self.stick = false;

    self.toggle = function () {

        self.open = !self.open;
        self.root.classList[self.open ? 'remove' : 'add']('close');
        self.toggleIndicator = self.open ? '-' : '+';
    };

    self.stickToggle = function () {

        self.stick = !self.stick;
        self.root.classList[self.stick ? 'add' : 'remove']('stick');
        self.stickIndicator = self.stick ? 'fade' : 'stick';
    };

    self.clear = function () {

        self.actions = [];
    };

    self.changePos = function (event) {

        self.root.classList.remove('top-right', 'top-left', 'bottom-right', 'bottom-left');
        self.root.classList.add(event.target.value);
    };

    self.numActions = 20;
    self.changeNumActions = function () {

        var ask = prompt('Number of actions to show?');

        if (ask) {

            self.numActions = parseInt(ask.replace(/[a-z]+/ig, ''));
        }
    };

    self.on('state', function (obj, fn, action, args) {

        var time = +new Date();

        self.i++;
        var i = self.i;
        self.actions.unshift({ obj: obj, fn: fn, action: action, args: args, time: time, i: i });

        if (self.actions.length > self.numActions) {

            self.actions.pop();
        }

        self.update();
    });

    self.root.classList.add('bottom-right');

    app.debugger = self;
});

riot.tag2('debugitem', '<span class="name" if="{obj && obj.name}"> {obj.name} </span><b>{fn}</b> &mdash; <i>{action}</i><span id="time">{time}</span><i id="num">{i}</i><br><p>Arguments</p><div each="{arg in args}"><i>{arg.constructor.name}</i> &mdash; <span if="{[\'object\', \'function\'].indexOf(typeof arg) === -1}">{arg}</span><code if="{typeof arg === \'object\'}">{JSON.stringify(arg)}</code><code if="{typeof arg === \'function\'}">{arg}</code></div>', '', '', function (opts) {});

riot.tag2('icon', '<i class="fa {icon}"></i>', '', '', function (opts) {

    this.icon = Object.keys(this.opts).map(function (i) {
        return 'fa-' + i;
    }).join(' ');
});

riot.tag2('pretty-code', '<pre><code ref="code"></code></pre>', '', '', function (opts) {

    var self = this;
    var defaultOpts = {

        "indent_size": 4,
        "indent_char": " "
    };

    var before = RiotUtils.Beautify.before;
    var after = RiotUtils.Beautify.after;

    var type = self.opts.type || 'js';
    var decode = self.opts.decode !== undefined;
    var beautifyOpts = Object.assign({}, defaultOpts, self.opts);

    var raw = self.__.innerHTML;

    this.on('mount', function () {

        var prettified = RiotUtils.Beautify[type](raw, beautifyOpts);

        var prettify = { prettified: prettified, raw: raw };

        if (before && before.constructor === Function) {

            before(prettify);
        }

        if (decode && type === 'html') {

            prettify.prettified = RiotUtils.Beautify.escapeHTML(prettify.prettified);
        }

        self.refs.code.innerHTML = prettify.prettified;

        if (after && after.constructor === Function) {

            after(prettify);
        }

        RiotUtils.Beautify.trigger('prettified', prettify);
    });
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1maWVsZC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1mb3JtLmpzIiwibGliL2FjdGlvbi1mb3Jtcy9pbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvdXRpbHMuanMiLCJsaWIvb2JzZXJ2ZXIuanMiLCJsaWIvcHJldHRpZmllci5qcyIsIm5vZGVfbW9kdWxlcy9qcy1iZWF1dGlmeS9qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qcy1iZWF1dGlmeS9qcy9saWIvYmVhdXRpZnktY3NzLmpzIiwibm9kZV9tb2R1bGVzL2pzLWJlYXV0aWZ5L2pzL2xpYi9iZWF1dGlmeS1odG1sLmpzIiwibm9kZV9tb2R1bGVzL2pzLWJlYXV0aWZ5L2pzL2xpYi9iZWF1dGlmeS5qcyIsInRhZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7O0FBRUE7O0lBQVksUTs7QUFFWjs7QUFDQTs7SUFBWSxXOztBQUNaOzs7O0FBRUEsSUFBTSxZQUFZOztBQUVkLGdDQUZjO0FBR2QsNEJBSGM7QUFJZDtBQUpjLENBQWxCOztBQU9BLE9BQU8sU0FBUCxHQUFtQixTQUFuQjs7Ozs7Ozs7OztRQ0RnQixTLEdBQUEsUzs7QUFkaEI7O0FBQ0E7O0FBRUEsSUFBTSxVQUFVLGNBQU8sT0FBdkI7O0FBRUE7Ozs7Ozs7OztBQVNPLFNBQVMsU0FBVCxDQUFvQixLQUFwQixFQUEyQixXQUEzQixFQUF3Qzs7QUFFM0MsUUFBTSxTQUFTLCtCQUFtQixLQUFuQixFQUEwQixRQUFRLFNBQVIsSUFBcUIsUUFBL0MsQ0FBZjs7QUFFQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLE1BQW1DLFNBQXBEOztBQUVBO0FBQ0EsUUFBTSxTQUFTLE1BQU0sWUFBTixDQUFtQixRQUFuQixDQUFmOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLENBQWpCOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFNBQVMsTUFBTSxZQUFOLENBQW1CLFFBQW5CLENBQWY7O0FBRUE7QUFDQSxRQUFNLFFBQVEsTUFBTSxZQUFOLENBQW1CLE9BQW5CLENBQWQ7O0FBRUE7QUFDQSxRQUFNLEtBQUssTUFBTSxZQUFOLENBQW1CLElBQW5CLEtBQTRCLFFBQXZDOztBQUVBO0FBQ0EsUUFBTSxhQUFhLEVBQW5COztBQUVBLFFBQUksVUFBVSxLQUFkOztBQUVBLFFBQUksTUFBTSxZQUFOLENBQW1CLFVBQW5CLEtBQWtDLFNBQVMsUUFBL0MsRUFBeUQ7O0FBRXJEO0FBQ0g7O0FBRUQsNEJBQVMsS0FBVDs7QUFFQTtBQUNBLGdCQUFZLElBQVosSUFBb0IsT0FBcEI7O0FBRUEsUUFBSSxNQUFKLEVBQVk7O0FBRVIsZ0NBQVksTUFBWixFQUFvQixLQUFwQjtBQUNIOztBQUVELFFBQU0sYUFBYSxTQUFiLFVBQWEsQ0FBUyxDQUFULEVBQVk7O0FBRTNCLFlBQU0sVUFBVyxPQUFPLEtBQVIsR0FBaUIsRUFBRSxLQUFuQixHQUEyQixFQUFFLE9BQTdDO0FBQ0EsWUFBTSxTQUFTLEVBQUUsSUFBRixLQUFVLE1BQXpCO0FBQ0EsWUFBTSxRQUFRLE1BQU0sS0FBcEI7QUFDQSxZQUFNLFFBQVEsQ0FBQyxNQUFNLE1BQXJCOztBQUVBO0FBQ0EsWUFBSSxRQUFKLEVBQWM7O0FBRVYsdUJBQVcsUUFBWCxHQUFzQixDQUFDLENBQUMsS0FBeEI7O0FBRUEsZ0JBQUksU0FBUyxVQUFiLEVBQXlCOztBQUVyQiwyQkFBVyxPQUFYLEdBQXFCLE1BQU0sT0FBM0I7QUFDSDtBQUVKOztBQUVEO0FBQ0EsWUFBSSxRQUFKLEVBQWM7O0FBRVYsdUJBQVcsUUFBWCxHQUFzQiwwQkFBYyxLQUFkLEVBQXFCLFFBQXJCLENBQXRCO0FBQ0g7O0FBRUQ7QUFDQSxZQUFJLEtBQUosRUFBVzs7QUFFUCxnQkFBTSxNQUFNLElBQUksTUFBSixDQUFXLEtBQVgsQ0FBWjtBQUNBLHVCQUFXLEtBQVgsR0FBbUIsSUFBSSxJQUFKLENBQVMsS0FBVCxDQUFuQjtBQUNIOztBQUVEO0FBQ0EsWUFBSSxNQUFKLEVBQVk7O0FBRVIsZ0JBQU0sZ0JBQWdCLE1BQU0sSUFBTixDQUFXLGFBQVgsQ0FBeUIsTUFBekIsQ0FBdEI7O0FBRUEsdUJBQVcsTUFBWCxHQUFvQixVQUFVLGNBQWMsS0FBNUM7O0FBRUEsZ0JBQUksQ0FBQyxjQUFjLE9BQW5CLEVBQTRCOztBQUV4Qiw4QkFBYyxPQUFkLENBQXNCLFVBQXRCLEVBQWtDLEVBQWxDO0FBQ0g7QUFDSjs7QUFHRDtBQUNBLGtCQUFVLDhCQUFrQixVQUFsQixDQUFWOztBQUVBO0FBQ0EsWUFBSSxDQUFDLE9BQUQsSUFBWSxDQUFDLFFBQWIsSUFBeUIsQ0FBQyxLQUExQixJQUFtQyxNQUF2QyxFQUErQzs7QUFFM0Msc0JBQVUsSUFBVjtBQUNIOztBQUVELGtCQUFVLE9BQVY7QUFDQSxlQUFPLE9BQVA7QUFFSCxLQTFERDs7QUE0REEsUUFBTSxZQUFZLFNBQVosU0FBWSxDQUFTLE9BQVQsRUFBa0I7O0FBRWhDO0FBQ0EsWUFBSSxZQUFZLEtBQVosSUFBcUIsTUFBckIsSUFBK0IsUUFBbkMsRUFBNkM7O0FBRXpDLHdCQUFZLElBQVosSUFBb0IsT0FBcEI7QUFDSDs7QUFFRDtBQUNBLGNBQU0sT0FBTixHQUFnQixPQUFoQjs7QUFFQTtBQUNBO0FBQ0EsWUFBSSxPQUFKLEVBQWE7O0FBRVQsbUJBQU8sU0FBUCxDQUFpQixNQUFqQixDQUF3QixRQUFRLEtBQWhDO0FBQ0EsbUJBQU8sU0FBUCxDQUFpQixHQUFqQixDQUFxQixRQUFRLE9BQTdCOztBQUVBLG1CQUFPLGFBQVAsT0FBeUIsUUFBUSxJQUFqQyxFQUF5QyxTQUF6QyxDQUFtRCxHQUFuRCxDQUF1RCxRQUFRLElBQS9EO0FBQ0gsU0FORCxNQU9LOztBQUVELG1CQUFPLFNBQVAsQ0FBaUIsR0FBakIsQ0FBcUIsUUFBUSxLQUE3QjtBQUNBLG1CQUFPLFNBQVAsQ0FBaUIsTUFBakIsQ0FBd0IsUUFBUSxPQUFoQzs7QUFFQSxtQkFBTyxhQUFQLE9BQXlCLFFBQVEsSUFBakMsRUFBeUMsU0FBekMsQ0FBbUQsTUFBbkQsQ0FBMEQsUUFBUSxJQUFsRTtBQUNIOztBQUVEO0FBQ0EsWUFBSSxZQUFZLElBQWhCLEVBQXNCOztBQUVsQixrQkFBTSxRQUFOO0FBQ0g7O0FBRUQsY0FBTSxPQUFOLENBQWMsV0FBZDtBQUNILEtBbkNEOztBQXFDQTtBQUNBLE9BQUcsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLENBQWtCO0FBQUEsZUFBSyxhQUFXLENBQVgsSUFBa0IsVUFBdkI7QUFBQSxLQUFsQjs7QUFFQSxVQUFNLEVBQU4sQ0FBUyxVQUFULEVBQXFCLFVBQXJCOztBQUVBLFFBQU0sV0FBVyxTQUFYLFFBQVcsR0FBTTs7QUFFbkIsZUFBTyxTQUFQLENBQWlCLE1BQWpCLENBQXdCLFFBQVEsT0FBaEMsRUFBeUMsUUFBUSxLQUFqRCxFQUF3RCxRQUFRLE9BQWhFLEVBQXlFLFFBQVEsSUFBakY7QUFDQSxlQUFPLGFBQVAsT0FBeUIsUUFBUSxJQUFqQyxFQUF5QyxTQUF6QyxDQUFtRCxHQUFuRCxDQUF1RCxRQUFRLElBQS9EO0FBQ0gsS0FKRDtBQUtIOzs7Ozs7OztRQ2xLZSxJLEdBQUEsSTs7QUFKaEI7O0FBQ0E7O0FBQ0E7O0FBRU8sU0FBUyxJQUFULENBQWMsSUFBZCxFQUFvQjs7QUFFdkIsUUFBSSxTQUFTLEtBQUssZ0JBQUwsQ0FBc0IsY0FBTyxRQUE3QixDQUFiO0FBQ0EsUUFBTSxTQUFTLEtBQUssYUFBTCxDQUFtQixlQUFuQixDQUFmO0FBQ0EsUUFBTSxjQUFjLEVBQXBCOztBQUVBLFNBQUssV0FBTCxHQUFtQixXQUFuQjtBQUNBLFNBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLLFVBQUwsR0FBa0IsSUFBbEI7O0FBRUEsNEJBQVMsSUFBVDs7QUFFQSxRQUFNLFdBQVcsU0FBWCxRQUFXLEdBQVc7O0FBRXhCLGFBQUssT0FBTCxHQUFlLDhCQUFrQixXQUFsQixDQUFmO0FBQ0EsZUFBTyxLQUFLLE9BQVo7QUFDSCxLQUpEOztBQU1BLFFBQU0sY0FBYyxTQUFkLFdBQWMsR0FBVzs7QUFFM0IsZUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCOztBQUVwQyxxQkFBUyxZQUFULEdBQXdCOztBQUVwQjtBQUNBLG9CQUFJLFVBQUosRUFBZ0I7O0FBRVo7QUFDSCxpQkFIRCxNQUlLOztBQUVEO0FBQ0g7QUFDSjs7QUFFRCxtQkFBTyxPQUFQLENBQWUsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjOztBQUV6QixvQkFBSSxNQUFPLE9BQU8sTUFBUCxHQUFjLENBQXpCLEVBQTZCOztBQUV6QiwwQkFBTSxHQUFOLENBQVUsV0FBVixFQUF1QixZQUFNOztBQUV6QjtBQUNILHFCQUhEO0FBSUg7O0FBRUQsc0JBQU0sT0FBTixDQUFjLFVBQWQsRUFBMEIsRUFBMUI7QUFDSCxhQVhEO0FBWUgsU0EzQk0sQ0FBUDtBQTRCSCxLQTlCRDs7QUFnQ0EsU0FBSyxFQUFMLENBQVEsVUFBUixFQUFvQixZQUFXOztBQUUzQixzQkFBYyxJQUFkLENBQW1CLFlBQVc7O0FBRTFCLGlCQUFLLE9BQUwsQ0FBYSxXQUFiO0FBQ0gsU0FIRDtBQUlILEtBTkQ7O0FBUUEsU0FBSyxFQUFMLENBQVEsV0FBUixFQUFxQixZQUFZOztBQUU3QixZQUFJLEtBQUssT0FBVCxFQUFrQjs7QUFFZCxpQkFBSyxPQUFMLENBQWEsV0FBYjtBQUNIO0FBQ0osS0FORDs7QUFRQTtBQUNBLFNBQUssUUFBTCxHQUFnQixVQUFTLENBQVQsRUFBWTs7QUFFeEIsVUFBRSxjQUFGOztBQUVBLFlBQUksQ0FBQyxLQUFLLE9BQVYsRUFBbUI7O0FBRWYsaUJBQUssT0FBTCxDQUFhLFVBQWI7QUFDSCxTQUhELE1BSUs7O0FBRUQsaUJBQUssT0FBTCxDQUFhLFdBQWI7QUFDQSxpQkFBSyxPQUFMLENBQWEsV0FBYjtBQUNIO0FBQ0osS0FiRDs7QUFnQkE7QUFDQSxhQUFTLFVBQVQsR0FBc0I7O0FBRWxCLGVBQU8sT0FBUCxDQUFlLFVBQVMsS0FBVCxFQUFnQjs7QUFFM0IsZ0JBQUksQ0FBQyxNQUFNLEVBQVgsRUFBZTs7QUFFWCwwQ0FBVSxLQUFWLEVBQWlCLFdBQWpCO0FBQ0g7QUFDSixTQU5EO0FBT0g7O0FBRUQ7O0FBRUE7QUFDQSxRQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCOztBQUVkLGFBQUssTUFBTCxHQUFjLFlBQVc7O0FBRXJCLHFCQUFTLEtBQUssSUFBTCxDQUFVLGNBQU8sUUFBakIsQ0FBVDtBQUNBO0FBQ0gsU0FKRDs7QUFNQSxhQUFLLEVBQUwsQ0FBUSxRQUFSLEVBQWtCLEtBQUssTUFBdkI7QUFDSDs7QUFFRCxTQUFLLEVBQUwsQ0FBUSxPQUFSLEVBQWlCLFlBQVc7O0FBRXhCLGFBQUssS0FBTDtBQUNBLGFBQUssT0FBTCxHQUFlLEtBQWY7O0FBRUEsZUFBTyxPQUFQLENBQWUsVUFBUyxLQUFULEVBQWdCOztBQUUzQixrQkFBTSxRQUFOO0FBQ0gsU0FIRDtBQUlILEtBVEQ7QUFVSDs7Ozs7Ozs7Ozs7Ozs7cUJDM0hRLEk7Ozs7OztBQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7Ozs7Ozs7UUN5Q2dCLFcsR0FBQSxXO1FBV0EsUyxHQUFBLFM7UUF5QkEsYSxHQUFBLGE7UUE0QkEsaUIsR0FBQSxpQjtRQTBCQSxrQixHQUFBLGtCO0FBcElULElBQU0sMEJBQVM7O0FBRWxCO0FBQ0EsY0FBVSxpRUFIUTs7QUFLbEI7QUFDQSxhQUFTOztBQUVMLGtCQUFVLGNBRkw7QUFHTCx1QkFBZSxnQkFIVjtBQUlMLGNBQU0sbUJBSkQ7QUFLTCxrQkFBVSx3Q0FMTDtBQU1MLGNBQU0sMENBTkQ7QUFPTCxhQUFLLGVBUEE7QUFRTCxlQUFPLG9EQVJGO0FBU0wsZUFBTztBQVRGLEtBTlM7O0FBa0JsQjtBQUNBLGFBQVM7O0FBRUwsbUJBQVcsT0FGTjtBQUdMLGVBQU8sT0FIRjtBQUlMLGNBQU0sTUFKRDtBQUtMLGNBQU0sTUFMRDtBQU1MLGNBQU0sTUFORDtBQU9MLGlCQUFTLFNBUEo7QUFRTCxpQkFBUztBQVJKLEtBbkJTOztBQThCbEI7QUFDQSxZQUFRO0FBQ0osWUFBSSxjQUFZLENBQUU7QUFEZDs7QUFLWjs7Ozs7O0FBcENzQixDQUFmLENBMENBLFNBQVMsV0FBVCxDQUFxQixRQUFyQixFQUErQixLQUEvQixFQUFzQzs7QUFFekMsUUFBSSxPQUFPLE9BQU8sTUFBUCxDQUFjLFFBQWQsQ0FBUCxLQUFtQyxVQUF2QyxFQUFtRDs7QUFFL0MsY0FBTSxVQUFhLFFBQWIsMENBQU47QUFDSDs7QUFFRCxVQUFNLEtBQU4sR0FBYyxPQUFPLE1BQVAsQ0FBYyxRQUFkLEVBQXdCLE1BQU0sS0FBOUIsQ0FBZDtBQUNIOztBQUVEO0FBQ08sU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCOztBQUU1QixTQUFLLEdBQUwsSUFBWSxJQUFaLEVBQWtCOztBQUVkLFlBQUksT0FBTyxHQUFQLEVBQVksV0FBWixLQUE0QixNQUFoQyxFQUF3Qzs7QUFFcEMsbUJBQU8sR0FBUCxJQUFjLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBTyxHQUFQLENBQWxCLEVBQStCLEtBQUssR0FBTCxDQUEvQixDQUFkO0FBQ0gsU0FIRCxNQUlLOztBQUVELG1CQUFPLEdBQVAsSUFBYyxLQUFLLEdBQUwsQ0FBZDtBQUNIO0FBQ0o7QUFDSjs7QUFHRDs7Ozs7Ozs7O0FBU08sU0FBUyxhQUFULENBQXVCLEtBQXZCLEVBQThCLEdBQTlCLEVBQW1DOztBQUV0QztBQUNBLFFBQUksSUFBSSxXQUFKLEtBQW9CLE1BQXhCLEVBQWdDOztBQUU1QixlQUFPLElBQUksSUFBSixDQUFTLEtBQVQsQ0FBUDtBQUNIOztBQUVEO0FBQ0E7QUFDQSxRQUFJLE9BQU8sR0FBUCxLQUFlLFFBQWYsSUFBMkIsT0FBTyxPQUFQLENBQWUsR0FBZixNQUF3QixTQUF2RCxFQUFrRTs7QUFFOUQsZUFBTyxPQUFPLE9BQVAsQ0FBZSxHQUFmLEVBQW9CLElBQXBCLENBQXlCLEtBQXpCLENBQVA7QUFDSDs7QUFFRDtBQUNBLFVBQU0sTUFBTSw2RkFBTixDQUFOO0FBRUg7O0FBR0Q7Ozs7Ozs7QUFPTyxTQUFTLGlCQUFULENBQTJCLEdBQTNCLEVBQWdDOztBQUVuQztBQUNBLFNBQUssSUFBSSxDQUFULElBQWMsR0FBZCxFQUFtQjs7QUFFZjtBQUNBLFlBQUksSUFBSSxDQUFKLE1BQVcsS0FBZixFQUFzQjs7QUFFbEIsbUJBQU8sS0FBUDtBQUNIO0FBQ0o7O0FBRUQsV0FBTyxJQUFQO0FBQ0g7O0FBR0Q7Ozs7Ozs7Ozs7QUFVTyxTQUFTLGtCQUFULENBQTZCLEtBQTdCLEVBQW9DLGNBQXBDLEVBQW9EOztBQUV2RCxRQUFJLFVBQVUsU0FBUyxJQUF2QixFQUE2Qjs7QUFFekIsY0FBTSxJQUFJLEtBQUosa0JBQXlCLE1BQU0sSUFBL0Isc0NBQU47QUFDSDs7QUFFRCxRQUFJLFNBQVMsTUFBTSxhQUFuQjs7QUFFQSxRQUFJLENBQUMsT0FBTyxTQUFQLENBQWlCLFFBQWpCLENBQTBCLGNBQTFCLENBQUwsRUFBZ0Q7O0FBRTVDLGlCQUFTLG1CQUFtQixNQUFuQixFQUEyQixjQUEzQixDQUFUO0FBQ0g7O0FBRUQsV0FBTyxNQUFQO0FBQ0g7Ozs7Ozs7O1FDNUllLFEsR0FBQSxRO0FBUGhCLElBQU0sYUFBYSxLQUFLLFVBQXhCOztBQUVBLElBQU0sT0FBTztBQUNULFdBQU8sS0FERTtBQUVULGFBQVM7QUFGQSxDQUFiOztBQUtPLFNBQVMsUUFBVCxDQUFtQixHQUFuQixFQUF3Qjs7QUFFM0IsUUFBTSxPQUFPLElBQWI7O0FBRUE7QUFDQSxRQUFNLFdBQVcsWUFBakI7O0FBRUE7QUFDQSxRQUFNLGFBQWEsRUFBbkI7O0FBRUE7QUFDQSxLQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsS0FBZCxFQUFxQixTQUFyQixFQUFnQyxPQUFoQyxDQUF3QyxVQUFDLEVBQUQsRUFBUTs7QUFFNUM7QUFDQSxZQUFJLFNBQVMsU0FBUyxFQUFULENBQWI7O0FBRUE7QUFDQSxZQUFJLEtBQUssS0FBVCxFQUFnQjs7QUFFWixxQkFBUyxrQkFBWTs7QUFFakIseUJBQVMsRUFBVCxFQUFhLEtBQWIsQ0FBbUIsU0FBUyxFQUFULENBQW5CLEVBQWlDLFNBQWpDOztBQUVBO0FBQ0Esb0JBQUksS0FBSyxPQUFMLElBQWdCLE9BQU8sS0FBSyxPQUFaLEtBQXdCLFVBQTVDLEVBQXdEOztBQUVwRCx3QkFBTSxPQUFPLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixLQUF0QixDQUE0QixTQUE1QixDQUFiO0FBQ0Esd0JBQU0sU0FBUyxLQUFLLEtBQUwsRUFBZjs7QUFFQSx5QkFBSyxPQUFMLENBQWEsS0FBYixDQUFtQixFQUFuQixFQUF1QixDQUFDLEdBQUQsRUFBTSxFQUFOLEVBQVUsTUFBVixFQUFrQixJQUFsQixDQUF2QjtBQUNIO0FBQ0osYUFaRDtBQWFIOztBQUVEO0FBQ0EsbUJBQVcsRUFBWCxJQUFpQjtBQUNiLG1CQUFPLE1BRE07QUFFYix3QkFBWSxLQUZDO0FBR2Isc0JBQVUsS0FIRztBQUliLDBCQUFjO0FBSkQsU0FBakI7QUFNSCxLQTlCRDs7QUFnQ0EsV0FBTyxnQkFBUCxDQUF3QixHQUF4QixFQUE2QixVQUE3QjtBQUNIOztBQUVELFNBQVMsU0FBVCxHQUFxQixVQUFDLEdBQUQsRUFBUzs7QUFFMUIsV0FBTyxNQUFQLENBQWMsSUFBZCxFQUFvQixHQUFwQjtBQUNILENBSEQ7Ozs7Ozs7Ozs7OztBQ25EQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7UUFjZ0IsVSxHQUFBLFU7UUFTQSxZLEdBQUEsWTs7QUF6QmhCOztBQUlPLElBQU0sc0JBQU8sWUFBYjs7QUFHUDtBQUNBLElBQU0sYUFBYSxTQUFTLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBbkI7O0FBR0E7Ozs7O0FBS08sU0FBUyxVQUFULENBQW9CLElBQXBCLEVBQTBCO0FBQzdCLGFBQVcsV0FBWCxHQUF5QixJQUF6QjtBQUNBLFNBQU8sV0FBVyxTQUFsQjtBQUNIOztBQUVEOzs7O0FBSU8sU0FBUyxZQUFULENBQXNCLElBQXRCLEVBQTRCO0FBQy9CLGFBQVcsU0FBWCxHQUF1QixJQUF2QjtBQUNBLFNBQU8sV0FBVyxXQUFsQjtBQUNIOztBQUVELHdCQUFTLE9BQU8sT0FBaEI7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2bUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDaDdFQSxLQUFLLElBQUwsQ0FBVSxVQUFWLEVBQXNCLHFoQkFBdEIsRUFBNmlCLG8rRkFBN2lCLEVBQW1oSCxFQUFuaEgsRUFBdWhILFVBQVMsSUFBVCxFQUFlOztBQUU5aEgsUUFBTSxPQUFPLElBQWI7QUFDQSxTQUFLLE9BQUwsR0FBZSxFQUFmO0FBQ0EsU0FBSyxDQUFMLEdBQVMsQ0FBVDtBQUNBLFNBQUssZUFBTCxHQUF1QixHQUF2QjtBQUNBLFNBQUssY0FBTCxHQUFzQixPQUF0QjtBQUNBLFNBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxTQUFLLEtBQUwsR0FBYSxLQUFiOztBQUVBLFNBQUssTUFBTCxHQUFjLFlBQU07O0FBRWhCLGFBQUssSUFBTCxHQUFZLENBQUMsS0FBSyxJQUFsQjtBQUNBLGFBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxJQUFMLEdBQVksUUFBWixHQUF1QixLQUEzQyxFQUFrRCxPQUFsRDtBQUNBLGFBQUssZUFBTCxHQUF1QixLQUFLLElBQUwsR0FBWSxHQUFaLEdBQWtCLEdBQXpDO0FBQ0gsS0FMRDs7QUFPQSxTQUFLLFdBQUwsR0FBbUIsWUFBTTs7QUFFckIsYUFBSyxLQUFMLEdBQWEsQ0FBQyxLQUFLLEtBQW5CO0FBQ0EsYUFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixLQUFLLEtBQUwsR0FBYSxLQUFiLEdBQXFCLFFBQXpDLEVBQW1ELE9BQW5EO0FBQ0EsYUFBSyxjQUFMLEdBQXNCLEtBQUssS0FBTCxHQUFhLE1BQWIsR0FBc0IsT0FBNUM7QUFDSCxLQUxEOztBQU9BLFNBQUssS0FBTCxHQUFhLFlBQU07O0FBRWYsYUFBSyxPQUFMLEdBQWUsRUFBZjtBQUNILEtBSEQ7O0FBS0EsU0FBSyxTQUFMLEdBQWlCLFVBQUMsS0FBRCxFQUFXOztBQUV4QixhQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLE1BQXBCLENBQTJCLFdBQTNCLEVBQXdDLFVBQXhDLEVBQW9ELGNBQXBELEVBQW9FLGFBQXBFO0FBQ0EsYUFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixNQUFNLE1BQU4sQ0FBYSxLQUFyQztBQUNILEtBSkQ7O0FBTUEsU0FBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsU0FBSyxnQkFBTCxHQUF3QixZQUFNOztBQUUxQixZQUFNLE1BQU0sT0FBTyw0QkFBUCxDQUFaOztBQUVBLFlBQUksR0FBSixFQUFTOztBQUVMLGlCQUFLLFVBQUwsR0FBa0IsU0FBUyxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQXdCLEVBQXhCLENBQVQsQ0FBbEI7QUFDSDtBQUNKLEtBUkQ7O0FBVUEsU0FBSyxFQUFMLENBQVEsT0FBUixFQUFpQixVQUFDLEdBQUQsRUFBTSxFQUFOLEVBQVUsTUFBVixFQUFrQixJQUFsQixFQUEyQjs7QUFFeEMsWUFBTSxPQUFPLENBQUMsSUFBSSxJQUFKLEVBQWQ7O0FBRUEsYUFBSyxDQUFMO0FBQ0EsWUFBTSxJQUFJLEtBQUssQ0FBZjtBQUNBLGFBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsRUFBRSxRQUFGLEVBQU8sTUFBUCxFQUFXLGNBQVgsRUFBbUIsVUFBbkIsRUFBeUIsVUFBekIsRUFBK0IsSUFBL0IsRUFBckI7O0FBRUEsWUFBSSxLQUFLLE9BQUwsQ0FBYSxNQUFiLEdBQXNCLEtBQUssVUFBL0IsRUFBMkM7O0FBRXZDLGlCQUFLLE9BQUwsQ0FBYSxHQUFiO0FBQ0g7O0FBRUQsYUFBSyxNQUFMO0FBQ0gsS0FkRDs7QUFnQkEsU0FBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixjQUF4Qjs7QUFFQSxRQUFJLFFBQUosR0FBZSxJQUFmO0FBQ1AsQ0FqRUQ7O0FBb0VBLEtBQUssSUFBTCxDQUFVLFdBQVYsRUFBdUIsbWJBQXZCLEVBQTRjLEVBQTVjLEVBQWdkLEVBQWhkLEVBQW9kLFVBQVMsSUFBVCxFQUFlLENBQ2xlLENBREQ7O0FBSUEsS0FBSyxJQUFMLENBQVUsTUFBVixFQUFrQiwyQkFBbEIsRUFBK0MsRUFBL0MsRUFBbUQsRUFBbkQsRUFBdUQsVUFBUyxJQUFULEVBQWU7O0FBRWxFLFNBQUssSUFBTCxHQUFZLE9BQU8sSUFBUCxDQUFZLEtBQUssSUFBakIsRUFBdUIsR0FBdkIsQ0FBMkI7QUFBQSx1QkFBVyxDQUFYO0FBQUEsS0FBM0IsRUFBMkMsSUFBM0MsQ0FBZ0QsR0FBaEQsQ0FBWjtBQUNILENBSEQ7O0FBS0EsS0FBSyxJQUFMLENBQVUsYUFBVixFQUF5QixxQ0FBekIsRUFBZ0UsRUFBaEUsRUFBb0UsRUFBcEUsRUFBd0UsVUFBUyxJQUFULEVBQWU7O0FBRS9FLFFBQU0sT0FBTyxJQUFiO0FBQ0EsUUFBTSxjQUFjOztBQUVoQix1QkFBZSxDQUZDO0FBR2hCLHVCQUFlO0FBSEMsS0FBcEI7O0FBTUEsUUFBTSxTQUFTLFVBQVUsUUFBVixDQUFtQixNQUFsQztBQUNBLFFBQU0sUUFBUSxVQUFVLFFBQVYsQ0FBbUIsS0FBakM7O0FBRUEsUUFBTSxPQUFPLEtBQUssSUFBTCxDQUFVLElBQVYsSUFBa0IsSUFBL0I7QUFDQSxRQUFNLFNBQVMsS0FBSyxJQUFMLENBQVUsTUFBVixLQUFxQixTQUFwQztBQUNBLFFBQU0sZUFBZSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLFdBQWxCLEVBQStCLEtBQUssSUFBcEMsQ0FBckI7O0FBRUEsUUFBSSxNQUFNLEtBQUssRUFBTCxDQUFRLFNBQWxCOztBQUVBLFNBQUssRUFBTCxDQUFRLE9BQVIsRUFBaUIsWUFBTTs7QUFFbkIsWUFBTSxhQUFhLFVBQVUsUUFBVixDQUFtQixJQUFuQixFQUF5QixHQUF6QixFQUE4QixZQUE5QixDQUFuQjs7QUFFQSxZQUFNLFdBQVcsRUFBRSxzQkFBRixFQUFjLFFBQWQsRUFBakI7O0FBRUEsWUFBSSxVQUFVLE9BQU8sV0FBUCxLQUF1QixRQUFyQyxFQUErQzs7QUFFM0MsbUJBQU8sUUFBUDtBQUNIOztBQUVELFlBQUksVUFBVSxTQUFTLE1BQXZCLEVBQStCOztBQUUzQixxQkFBUyxVQUFULEdBQXNCLFVBQVUsUUFBVixDQUFtQixVQUFuQixDQUE4QixTQUFTLFVBQXZDLENBQXRCO0FBQ0g7O0FBRUQsYUFBSyxJQUFMLENBQVUsSUFBVixDQUFlLFNBQWYsR0FBMkIsU0FBUyxVQUFwQzs7QUFFQSxZQUFJLFNBQVMsTUFBTSxXQUFOLEtBQXNCLFFBQW5DLEVBQTZDOztBQUV6QyxrQkFBTSxRQUFOO0FBQ0g7O0FBRUQsa0JBQVUsUUFBVixDQUFtQixPQUFuQixDQUEyQixZQUEzQixFQUF5QyxRQUF6QztBQUNILEtBeEJEO0FBeUJQLENBM0NEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgQmVhdXRpZnkgZnJvbSAnLi9saWIvcHJldHRpZmllcic7XG5cbmltcG9ydCB7IE9ic2VydmVyIH0gZnJvbSAnLi9saWIvb2JzZXJ2ZXInO1xuaW1wb3J0ICogYXMgQWN0aW9uRm9ybXMgZnJvbSAnLi9saWIvYWN0aW9uLWZvcm1zJztcbmltcG9ydCAnLi90YWdzJztcblxuY29uc3QgUmlvdFV0aWxzID0ge1xuXG4gICAgT2JzZXJ2ZXIsXG4gICAgQWN0aW9uRm9ybXMsXG4gICAgQmVhdXRpZnlcbn1cblxuZ2xvYmFsLlJpb3RVdGlscyA9IFJpb3RVdGlscztcbiIsImltcG9ydCB7IE9ic2VydmVyIH0gZnJvbSAnLi4vb2JzZXJ2ZXInO1xuaW1wb3J0IHsgdmFsaWRhdGVSZWdleCwgY29uZmlybVZhbGlkYXRpb24sIGZpbmRGaWVsZENvbnRhaW5lciwgZm9ybWF0VmFsdWUsIGNvbmZpZyB9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBjbGFzc2VzID0gY29uZmlnLmNsYXNzZXM7XG5cbi8qKlxuICogQWRkcyB2YWxpZGF0aW9uIGZ1bmN0aW9uYWxpdHkgdG8gZm9ybSBmaWVsZHNcbiAqIHRvIGRpc3BsYXkgZXJyb3JzIGFuZCBoZWxwIGZpZWxkcy4gQmluZHMgZmllbGQgd2l0aFxuICogUmlvdCBPYnNlcnZhYmxlIGFuZCBnaXZlcyBlbGVtZW50cyBldmVudCBmZWF0dXJlcy5cbiAqXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHdob3NlIHBhcmVudCB3ZSB3aWxsIHJldHVyblxuICogQHBhcmFtIHsgT2JqZWN0IH0gdmFsaWRhdGlvbnMgLSBQYXJlbnQgZm9ybSB2YWxpZGF0aW9uIG9iamVjdFxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRGaWVsZCAoZmllbGQsIHZhbGlkYXRpb25zKSB7XG5cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kRmllbGRDb250YWluZXIoZmllbGQsIGNsYXNzZXMuY29udGFpbmVyIHx8ICcuZmllbGQnICk7XG5cbiAgICBjb25zdCBuYW1lID0gZmllbGQuZ2V0QXR0cmlidXRlKCduYW1lJyk7XG4gICAgY29uc3QgdHlwZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgndHlwZScpO1xuICAgIGNvbnN0IHJlcXVpcmVkID0gZmllbGQuZ2V0QXR0cmlidXRlKCdyZXF1aXJlZCcpICE9PSB1bmRlZmluZWQ7XG5cbiAgICAvLyBGb3JtYXR0aW5nIGZ1bmN0aW9uXG4gICAgY29uc3QgZm9ybWF0ID0gZmllbGQuZ2V0QXR0cmlidXRlKCdmb3JtYXQnKTtcblxuICAgIC8vIFZhbGlkYXRpb24gZnVuY3Rpb25cbiAgICAvLyBpbnB1dFtkYXRhLXZhbGlkYXRlXSBzaG91bGQgYmUgYSBmdW5jdGlvbiBpblxuICAgIGNvbnN0IHZhbGlkYXRlID0gZmllbGQuZ2V0QXR0cmlidXRlKCd2YWxpZGF0ZScpO1xuXG4gICAgLy8gTWF0Y2ggdmFsdWUgYWdhaW5zdCBhbm90aGVyIGVsZW1lbnRcbiAgICAvLyBTaG91bGQgYmUgYSBDU1Mgc2VsZWN0b3JcbiAgICBjb25zdCBlcXVhbHMgPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ2VxdWFscycpO1xuXG4gICAgLy8gQ3VzdG9tIHJlZ3VsYXIgZXhwcmVzc2lvblxuICAgIGNvbnN0IHJlZ2V4ID0gZmllbGQuZ2V0QXR0cmlidXRlKCdyZWdleCcpO1xuXG4gICAgLy8gRXZlbnRzIHRvIGJpbmQgdG9cbiAgICBjb25zdCBvbiA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnb24nKSB8fCAnY2hhbmdlJztcblxuICAgIC8vIElucHV0IHZhbGlkYXRpb24gb2JqZWN0IHRvIGhhbmRsZSBtdWx0aXBsZSBtZXRob2RzXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHt9O1xuXG4gICAgbGV0IGlzVmFsaWQgPSBmYWxzZTtcblxuICAgIGlmIChmaWVsZC5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgfHwgdHlwZSA9PT0gJ2hpZGRlbicpIHtcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgT2JzZXJ2ZXIoZmllbGQpO1xuXG4gICAgLy8gRm9ybSB2YWxpZGF0aW9uIG9iamVjdFxuICAgIHZhbGlkYXRpb25zW25hbWVdID0gaXNWYWxpZDtcblxuICAgIGlmIChmb3JtYXQpIHtcblxuICAgICAgICBmb3JtYXRWYWx1ZShmb3JtYXQsIGZpZWxkKTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWxpZGF0ZUZuID0gZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGNvbnN0IGtleUNvZGUgPSAod2luZG93LmV2ZW50KSA/IGUud2hpY2ggOiBlLmtleUNvZGU7XG4gICAgICAgIGNvbnN0IGlzQmx1ciA9IGUudHlwZSA9PT0nYmx1cic7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZmllbGQudmFsdWU7XG4gICAgICAgIGNvbnN0IGVtcHR5ID0gIXZhbHVlLmxlbmd0aDtcblxuICAgICAgICAvLyBJZiBpdCdzIHJlcXVpcmVkLCBpdCBjYW4ndCBiZSBlbXB0eVxuICAgICAgICBpZiAocmVxdWlyZWQpIHtcblxuICAgICAgICAgICAgdmFsaWRhdGlvbi5yZXF1aXJlZCA9ICEhdmFsdWU7XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnY2hlY2tib3gnKSB7XG5cbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uLmNoZWNrZWQgPSBmaWVsZC5jaGVja2VkXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFzc2VydCBhZ2FpbnN0IGV4aXN0aW5nIHZhbGlkYXRpb24gZnVuY3Rpb25cbiAgICAgICAgaWYgKHZhbGlkYXRlKSB7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24udmFsaWRhdGUgPSB2YWxpZGF0ZVJlZ2V4KHZhbHVlLCB2YWxpZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBjdXN0b20gcmVnZXhcbiAgICAgICAgaWYgKHJlZ2V4KSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHJneCA9IG5ldyBSZWdFeHAocmVnZXgpO1xuICAgICAgICAgICAgdmFsaWRhdGlvbi5yZWdleCA9IHJneC50ZXN0KHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFzc2VydCBhZ2FpbnN0IGFub3RoZXIgZmllbGQncyB2YWx1ZVxuICAgICAgICBpZiAoZXF1YWxzKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IGVxdWFsc0VsZW1lbnQgPSBmaWVsZC5mb3JtLnF1ZXJ5U2VsZWN0b3IoZXF1YWxzKTtcblxuICAgICAgICAgICAgdmFsaWRhdGlvbi5lcXVhbHMgPSB2YWx1ZSA9PT0gZXF1YWxzRWxlbWVudC52YWx1ZTtcblxuICAgICAgICAgICAgaWYgKCFlcXVhbHNFbGVtZW50LmlzVmFsaWQpIHtcblxuICAgICAgICAgICAgICAgIGVxdWFsc0VsZW1lbnQudHJpZ2dlcigndmFsaWRhdGUnLCB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIENoZWNrIGlucHV0IHZhbGlkYXRpb25cbiAgICAgICAgaXNWYWxpZCA9IGNvbmZpcm1WYWxpZGF0aW9uKHZhbGlkYXRpb24pO1xuXG4gICAgICAgIC8vIElucHV0IGlzIG5vdCByZXF1aXJlZCBhbmQgaXMgZW1wdHlcbiAgICAgICAgaWYgKCFpc1ZhbGlkICYmICFyZXF1aXJlZCAmJiAhdmFsdWUgJiYgaXNCbHVyKSB7XG5cbiAgICAgICAgICAgIGlzVmFsaWQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsaWRhdGVkKGlzVmFsaWQpO1xuICAgICAgICByZXR1cm4gaXNWYWxpZDtcblxuICAgIH07XG5cbiAgICBjb25zdCB2YWxpZGF0ZWQgPSBmdW5jdGlvbihpc1ZhbGlkKSB7XG5cbiAgICAgICAgLy8gQmluZCB0byB2YWxpZGF0aW9uIG9iamVjdCBmb3IgZm9ybSBjaGVja1xuICAgICAgICBpZiAodmFsaWRhdGUgfHwgcmVnZXggfHwgZXF1YWxzIHx8IHJlcXVpcmVkKSB7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb25zW25hbWVdID0gaXNWYWxpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmQgdmFsaWRpdHkgdG8gaHRtbCBlbGVtZW50XG4gICAgICAgIGZpZWxkLmlzVmFsaWQgPSBpc1ZhbGlkO1xuXG4gICAgICAgIC8vIElmIGl0J3MgdmFsaWQsIHJlbW92ZSBlcnJvciBjbGFzc2VzIGFuZCBoaWRlIHRoZSBoZWxwIGJsb2NrLlxuICAgICAgICAvLyBUaGlzIGlzIG1lYW50IHRvIHdvcmsgd2l0aCBib290c3RyYXAgZm9ybXMuXG4gICAgICAgIGlmIChpc1ZhbGlkKSB7XG5cbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuZXJyb3IpO1xuICAgICAgICAgICAgcGFyZW50LmNsYXNzTGlzdC5hZGQoY2xhc3Nlcy5zdWNjZXNzKTtcblxuICAgICAgICAgICAgcGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2NsYXNzZXMuaGVscH1gKS5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuaGlkZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuZXJyb3IpO1xuICAgICAgICAgICAgcGFyZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3Nlcy5zdWNjZXNzKTtcblxuICAgICAgICAgICAgcGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2NsYXNzZXMuaGVscH1gKS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuaGlkZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbGxvdyBmaWVsZHMgdGhhdCBhcmUgbm90IHJlcXVpcmVkXG4gICAgICAgIGlmIChpc1ZhbGlkID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIGZpZWxkLnNldEJsYW5rKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC50cmlnZ2VyKCd2YWxpZGF0ZWQnKTtcbiAgICB9O1xuXG4gICAgLy8gQmluZCBldmVudHMgdG8gdmFsaWRhdGlvbiBmdW5jdGlvblxuICAgIG9uLnNwbGl0KCcgJykubWFwKG8gPT4gZmllbGRbYG9uJHtvfWBdID0gdmFsaWRhdGVGbik7XG5cbiAgICBmaWVsZC5vbigndmFsaWRhdGUnLCB2YWxpZGF0ZUZuKTtcblxuICAgIGNvbnN0IHNldEJsYW5rID0gKCkgPT4ge1xuXG4gICAgICAgIHBhcmVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuc3VjY2VzcywgY2xhc3Nlcy5lcnJvciwgY2xhc3Nlcy53YXJuaW5nLCBjbGFzc2VzLmluZm8pO1xuICAgICAgICBwYXJlbnQucXVlcnlTZWxlY3RvcihgLiR7Y2xhc3Nlcy5oZWxwfWApLmNsYXNzTGlzdC5hZGQoY2xhc3Nlcy5oaWRlKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgT2JzZXJ2ZXIgfSBmcm9tICcuLi9vYnNlcnZlcic7XG5pbXBvcnQgeyBiaW5kRmllbGQgfSBmcm9tICcuL2JpbmQtZmllbGQnO1xuaW1wb3J0IHsgY29uZmlybVZhbGlkYXRpb24sIGNvbmZpZyB9IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYmluZChmb3JtKSB7XG5cbiAgICBsZXQgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKGNvbmZpZy5lbGVtZW50cyk7XG4gICAgY29uc3Qgc3VibWl0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgY29uc3QgdmFsaWRhdGlvbnMgPSB7fTtcblxuICAgIGZvcm0udmFsaWRhdGlvbnMgPSB2YWxpZGF0aW9ucztcbiAgICBmb3JtLmlzVmFsaWQgPSBmYWxzZTtcbiAgICBmb3JtLm5vVmFsaWRhdGUgPSB0cnVlO1xuXG4gICAgT2JzZXJ2ZXIoZm9ybSk7XG5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0uaXNWYWxpZCA9IGNvbmZpcm1WYWxpZGF0aW9uKHZhbGlkYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIGZvcm0uaXNWYWxpZDtcbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVBbGwgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhc3Nlc3NTdWJtaXQoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgdmFsaWRcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dHMuZm9yRWFjaCgoZmllbGQsIGkpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpID09PSAoaW5wdXRzLmxlbmd0aC0xKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLm9uZSgndmFsaWRhdGVkJywgKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3Nlc3NTdWJtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGUnLCB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9ybS5vbigndmFsaWRhdGUnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YWxpZGF0ZUFsbCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZm9ybS5vbigndmFsaWRhdGVkJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmIChmb3JtLmlzVmFsaWQpIHtcblxuICAgICAgICAgICAgZm9ybS50cmlnZ2VyKCdzdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGUgZm9ybSBpcyBzdWJtaXR0aW5nLCBpdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBmaWVsZHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICBmb3JtLm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAoIWZvcm0uaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3ZhbGlkYXRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3N1Ym1pdHRlZCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8gQWRkIHZhbGlkYXRpb24gZnVuY3Rpb25hbGl0eSB0byBmb3JtIGVsZW1lbnRzXG4gICAgZnVuY3Rpb24gYmluZEZpZWxkcygpIHtcblxuICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuXG4gICAgICAgICAgICBpZiAoIWZpZWxkLm9uKSB7XG5cbiAgICAgICAgICAgICAgICBiaW5kRmllbGQoZmllbGQsIHZhbGlkYXRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmluZEZpZWxkcygpO1xuXG4gICAgLy8gUmViaW5kIHZhbGlkYXRpb25zIGluIGNhc2Ugb2YgbmV3IHJlcXVpcmVkIGZpZWxkc1xuICAgIGlmICghZm9ybS5yZWJpbmQpIHtcblxuICAgICAgICBmb3JtLnJlYmluZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpbnB1dHMgPSBmb3JtLmZpbmQoY29uZmlnLmVsZW1lbnRzKTtcbiAgICAgICAgICAgIGJpbmRGaWVsZHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm0ub24oJ3JlYmluZCcsIGZvcm0ucmViaW5kKTtcbiAgICB9XG5cbiAgICBmb3JtLm9uKCdyZXNldCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0ucmVzZXQoKTtcbiAgICAgICAgZm9ybS5pc1ZhbGlkID0gZmFsc2U7XG5cbiAgICAgICAgaW5wdXRzLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcblxuICAgICAgICAgICAgZmllbGQuc2V0QmxhbmsoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuIiwiZXhwb3J0IHsgYmluZCB9IGZyb20gJy4vYmluZC1mb3JtJztcbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMnO1xuIiwiZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcblxuICAgIC8vIEVsZW1lbnRzIHRvIGJlIHNlbGVjdGVkIGZvciB2YWxpZGF0aW9uXG4gICAgZWxlbWVudHM6ICdbcmVxdWlyZWRdLFtkYXRhLXZhbGlkYXRlXSxbZGF0YS1lcXVhbHNdLFtkYXRhLXJlZ2V4XSxbZGF0YS1jY10nLFxuXG4gICAgLy8gUmVndWxhciBleHByZXNzaW9ucyB1c2VkIHRvIHZhbGlkYXRlXG4gICAgcmVnZXhlczoge1xuXG4gICAgICAgIGFscGhhbnVtOiAvXlthLXowLTldKyQvaSxcbiAgICAgICAgYWxwaGFudW1zcGFjZTogL15bYS16MC05XFxzXSskL2ksXG4gICAgICAgIG5hbWU6IC9eW2Etelxcc1xcLVxcLFxcLl0rJC9pLFxuICAgICAgICB1c2VybmFtZTogL15bYS16MC05XVthLXowLTlcXHNcXC1cXF9cXCtcXC5dK1thLXowLTldJC9pLFxuICAgICAgICBmcWRuOiAvXlthLXowLTldW2EtejAtOVxcLVxcX1xcLl0rW2EtejAtOV17MiwyMH0kL2ksXG4gICAgICAgIHRsZDogL15bYS16XXsyLDIwfS9pLFxuICAgICAgICBwaG9uZTogL15cXCg/KFswLTldezN9KVxcKT9bLS4gXT8oWzAtOV17M30pWy0uIF0/KFswLTldezR9KSQvLFxuICAgICAgICBlbWFpbDogLy4rQC4rXFwuLisvaVxuICAgIH0sXG5cbiAgICAvLyBGZWVkYmFjaywgc3RhdGUsIGFuZCBjb250YWluZXIgY2xhc3Nlc1xuICAgIGNsYXNzZXM6IHtcblxuICAgICAgICBjb250YWluZXI6ICdmaWVsZCcsXG4gICAgICAgIGVycm9yOiAnZXJyb3InLFxuICAgICAgICBoZWxwOiAnaGVscCcsXG4gICAgICAgIGhpZGU6ICdoaWRlJyxcbiAgICAgICAgaW5mbzogJ2luZm8nLFxuICAgICAgICBzdWNjZXNzOiAnc3VjY2VzcycsXG4gICAgICAgIHdhcm5pbmc6ICd3YXJuaW5nJ1xuICAgIH0sXG5cbiAgICAvLyBGaWVsZCBmb3JtYXR0aW5nIGZ1bmN0aW9uc1xuICAgIGZvcm1hdDoge1xuICAgICAgICBjYzogZnVuY3Rpb24gKCkge31cbiAgICB9XG59XG5cbi8qXG4gKiBGb3JtYXQgYSBmaWVsZCdzIHZhbHVlIGJhc2VkIG9uIGZ1bmN0aW9ucyBpbiBgY29uZmlnLmZvcm1hdGBcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSBmb3JtYXRGbiAtIE5hbWUgb2YgZnVuY3Rpb24gaW4gYGNvbmZpZy5mb3JtYXRgXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHRvIGZvcm1hdCB2YWx1ZSBvZlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUoZm9ybWF0Rm4sIGZpZWxkKSB7XG5cbiAgICBpZiAodHlwZW9mIGNvbmZpZy5mb3JtYXRbZm9ybWF0Rm5dID09PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGAke2Zvcm1hdEZufSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYSBmdW5jdGlvbmApO1xuICAgIH1cblxuICAgIGZpZWxkLnZhbHVlID0gY29uZmlnLmZvcm1hdFtmb3JtYXRGbl0oZmllbGQudmFsdWUpO1xufVxuXG4vLyBPdmVyd3JpdGUgY29uZmlnXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKG9wdHMpIHtcblxuICAgIGZvciAob3B0IGluIG9wdHMpIHtcblxuICAgICAgICBpZiAoY29uZmlnW29wdF0uY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbmZpZ1tvcHRdLCBvcHRzW29wdF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IG9wdHNbb3B0XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIHZhbHVlIGFuZCByZXR1cm5zIHRydWUgb3IgZmFsc2UuXG4gKiBUaHJvd3MgZXJyb3IgaWYgaXQgY2Fubm90IHZhbGlkYXRlXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gdmFsdWUgLSBWYWx1ZSB0byBiZSB2YWxpZGF0ZWRcbiAqIEBwYXJhbSB7IFN0cmluZyB8IFJlZ0V4cCB9IHJneCAtIFN0cmluZyByZWZlcmVuY2UgdG8gYHJlZ2V4ZXNgIG9yIGEgUmVnRXhwXG4gKlxuICogQHJldHVybnMgeyBCb29sZWFuIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUmVnZXgodmFsdWUsIHJneCkge1xuXG4gICAgLy8gQWNjZXB0cyBSZWdFeHAgYXMgc2Vjb25kIHZhbHVlXG4gICAgaWYgKHJneC5jb25zdHJ1Y3RvciA9PT0gUmVnRXhwKSB7XG5cbiAgICAgICAgcmV0dXJuIHJneC50ZXN0KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBTZWNvbmQgdmFsdWUgaXMgYSBzdHJpbmcsIHNvIGl0IG11c3QgZXhpc3RcbiAgICAvLyBpbnNpZGUgb2YgYGNvbmZpZy5yZWdleGVzYCBvYmplY3RcbiAgICBpZiAodHlwZW9mIHJneCA9PT0gJ3N0cmluZycgJiYgY29uZmlnLnJlZ2V4ZXNbcmd4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZWdleGVzW3JneF0udGVzdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgY29uZGl0aW9ucyBhcmVuJ3QgbWV0LCB0aHJvdyBlcnJvclxuICAgIHRocm93IEVycm9yKCdzZWNvbmQgcGFyYW1ldGVyIGlzIGFuIGludmFsaWQgcmVndWxhciBleHByZXNzaW9uIG9yIGRvZXMgbm90IGV4aXN0IHdpdGhpbiB1dGlsaXRpZXMgb2JqZWN0Jyk7XG5cbn1cblxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW4gb2JqZWN0IGFuZCBjaGVja3MgZm9yIHRydWUgb3IgZmFsc2VcbiAqXG4gKiBAcGFyYW0geyBPYmplY3QgfSBvYmogLSBPYmplY3QgdG8gaXRlcmF0ZVxuICpcbiAqIEByZXR1cm5zIHsgQm9vbGVhbiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25maXJtVmFsaWRhdGlvbihvYmopIHtcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgb2JqZWN0XG4gICAgZm9yICh2YXIgdiBpbiBvYmopIHtcblxuICAgICAgICAvLyBBbmQgcmV0dXJuIGZhbHNlIGlmIGFueSBrZXkgaXMgZmFsc2VcbiAgICAgICAgaWYgKG9ialt2XSA9PT0gZmFsc2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8qKlxuICogQ3Jhd2xzIHVwIHRoZSBET00gc3RhcnRpbmcgZnJvbSB0aGUgYGZpZWxkYCBlbGVtZW50XG4gKiBhbmQgZmluZHMgY29udGFpbmluZyBlbGVtZW50IHdpdGggY2xhc3MgbmFtZXMgc3BlY2lmaWVkXG4gKiBpbiB0aGUgYGNsYXNzZXNgIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHdob3NlIHBhcmVudCB3ZSB3aWxsIHJldHVyblxuICogQHBhcmFtIHsgT2JqZWN0IH0gY29udGFpbmVyQ2xhc3MgLSBOYW1lIG9mIGNsYXNzIHRoZSBjb250YWluZXIgd2lsbCBoYXZlXG4gKlxuICogQHJldHVybnMgeyBIVE1MRWxlbWVudCB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRmllbGRDb250YWluZXIgKGZpZWxkLCBjb250YWluZXJDbGFzcykge1xuXG4gICAgaWYgKGZpZWxkID09PSBkb2N1bWVudC5ib2R5KSB7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWVsZCBuYW1lZCAke2ZpZWxkLm5hbWV9IGlzIG5vdCBpbnNpZGUgYSBmaWVsZCBjb250YWluZXJgKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyZW50ID0gZmllbGQucGFyZW50RWxlbWVudDtcblxuICAgIGlmICghcGFyZW50LmNsYXNzTGlzdC5jb250YWlucyhjb250YWluZXJDbGFzcykpIHtcblxuICAgICAgICBwYXJlbnQgPSBmaW5kRmllbGRDb250YWluZXIocGFyZW50LCBjb250YWluZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudDtcbn1cbiIsImNvbnN0IG9ic2VydmFibGUgPSByaW90Lm9ic2VydmFibGU7XHJcblxyXG5jb25zdCBvcHRzID0ge1xyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgZGVidWdGbjogZmFsc2VcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIE9ic2VydmVyIChvYmopIHtcclxuXHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAvLyBPYnNlcnZlcmFibGUgb2JzZXJ2ZXIgZm9yIHRoaXMgaW5zdGFuY2VcclxuICAgIGNvbnN0IG9ic2VydmVyID0gb2JzZXJ2YWJsZSgpO1xyXG5cclxuICAgIC8vIFByb3BlcnRpZXMgb2JqZWN0IHRvIHJld3JhcFxyXG4gICAgY29uc3QgcHJvcGVydGllcyA9IHt9O1xyXG5cclxuICAgIC8vIFJld3JhcCBvYnNlcnZlciBmdW5jdGlvbnMgZm9yIGRlYnVnZ2luZ1xyXG4gICAgWydvbicsICdvbmUnLCAnb2ZmJywgJ3RyaWdnZXInXS5mb3JFYWNoKChmbikgPT4ge1xyXG5cclxuICAgICAgICAvLyBTaW1wbHkgcGFzcyBieSByZWZlcmVuY2UgaW4gcHJvZHVjdGlvblxyXG4gICAgICAgIGxldCBleGVjRm4gPSBvYnNlcnZlcltmbl07XHJcblxyXG4gICAgICAgIC8vIFJld3JhcCBhbmQgbG9nIGlmIGRlYnVnZ2luZ1xyXG4gICAgICAgIGlmIChvcHRzLmRlYnVnKSB7XHJcblxyXG4gICAgICAgICAgICBleGVjRm4gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXJbZm5dLmFwcGx5KG9ic2VydmVyW2ZuXSwgYXJndW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBIb29rIGludG8gZnVuY3Rpb24gZm9yIG1ha2luZyBkZWJ1Z2dpbmcgdG9vbHNcclxuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRlYnVnRm4gJiYgdHlwZW9mIG9wdHMuZGVidWdGbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gYXJncy5zaGlmdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBvcHRzLmRlYnVnRm4uYXBwbHkoe30sIFtvYmosIGZuLCBhY3Rpb24sIGFyZ3NdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aG9zZSBmdW5jdGlvbnMgY2Fubm90IGJlIG92ZXJ3cml0dGVuXHJcbiAgICAgICAgcHJvcGVydGllc1tmbl0gPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBleGVjRm4sXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqLCBwcm9wZXJ0aWVzKTtcclxufVxyXG5cclxuT2JzZXJ2ZXIuY29uZmlndXJlID0gKG9iaikgPT4ge1xyXG5cclxuICAgIE9iamVjdC5hc3NpZ24ob3B0cywgb2JqKTtcclxufVxyXG4iLCJpbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4vb2JzZXJ2ZXInO1xuXG5leHBvcnQgKiBmcm9tICdqcy1iZWF1dGlmeSc7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3ByZXR0aWZpZXInO1xuXG5cbi8qKiBVc2VkIGZvciBlc2NhcGUgYW5kIHVuZXNjYXBlIEhUTUwuICovXG5jb25zdCBlc2NFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcblxuXG4vKipcbiAqIEVzY2FwZXMgSFRNTC5cbiAqIFVzZWQgZm9yIHByZXR0eSBmb3JtYXR0aW5nIEhUTUwsIENTUyBhbmQgSlMgdG8gcHJlcGFyZSBmb3Igc3ludGF4IGhpZ2hsaWdodGluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIC0gVmFsaWQgSFRNTCBzeW50YXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUhUTUwoaHRtbCkge1xuICAgIGVzY0VsZW1lbnQudGV4dENvbnRlbnQgPSBodG1sO1xuICAgIHJldHVybiBlc2NFbGVtZW50LmlubmVySFRNTDtcbn1cblxuLyoqXG4gKiBVbmVzY2FwZXMgSFRNTC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIC0gVmFsaWQgSFRNTCBzeW50YXgsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmVzY2FwZUhUTUwoaHRtbCkge1xuICAgIGVzY0VsZW1lbnQuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZXNjRWxlbWVudC50ZXh0Q29udGVudDtcbn1cblxuT2JzZXJ2ZXIobW9kdWxlLmV4cG9ydHMpO1xuIiwiLypcbiAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXG5cbiAgQ29weXJpZ2h0IChjKSAyMDA3LTIwMTcgRWluYXIgTGllbG1hbmlzLCBMaWFtIE5ld21hbiwgYW5kIGNvbnRyaWJ1dG9ycy5cblxuICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxuICBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlc1xuICAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sXG4gIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsXG4gIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsXG4gIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG4gIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTXG4gIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuICBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gIFNPRlRXQVJFLlxuXG4qL1xuXG4vKipcblRoZSBmb2xsb3dpbmcgYmF0Y2hlcyBhcmUgZXF1aXZhbGVudDpcblxudmFyIGJlYXV0aWZ5X2pzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKTtcbnZhciBiZWF1dGlmeV9qcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuanM7XG52YXIgYmVhdXRpZnlfanMgPSByZXF1aXJlKCdqcy1iZWF1dGlmeScpLmpzX2JlYXV0aWZ5O1xuXG52YXIgYmVhdXRpZnlfY3NzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5jc3M7XG52YXIgYmVhdXRpZnlfY3NzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5jc3NfYmVhdXRpZnk7XG5cbnZhciBiZWF1dGlmeV9odG1sID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5odG1sO1xudmFyIGJlYXV0aWZ5X2h0bWwgPSByZXF1aXJlKCdqcy1iZWF1dGlmeScpLmh0bWxfYmVhdXRpZnk7XG5cbkFsbCBtZXRob2RzIHJldHVybmVkIGFjY2VwdCB0d28gYXJndW1lbnRzLCB0aGUgc291cmNlIHN0cmluZyBhbmQgYW4gb3B0aW9ucyBvYmplY3QuXG4qKi9cblxuZnVuY3Rpb24gZ2V0X2JlYXV0aWZ5KGpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnksIGh0bWxfYmVhdXRpZnkpIHtcbiAgICAvLyB0aGUgZGVmYXVsdCBpcyBqc1xuICAgIHZhciBiZWF1dGlmeSA9IGZ1bmN0aW9uKHNyYywgY29uZmlnKSB7XG4gICAgICAgIHJldHVybiBqc19iZWF1dGlmeS5qc19iZWF1dGlmeShzcmMsIGNvbmZpZyk7XG4gICAgfTtcblxuICAgIC8vIHNob3J0IGFsaWFzZXNcbiAgICBiZWF1dGlmeS5qcyA9IGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5O1xuICAgIGJlYXV0aWZ5LmNzcyA9IGNzc19iZWF1dGlmeS5jc3NfYmVhdXRpZnk7XG4gICAgYmVhdXRpZnkuaHRtbCA9IGh0bWxfYmVhdXRpZnkuaHRtbF9iZWF1dGlmeTtcblxuICAgIC8vIGxlZ2FjeSBhbGlhc2VzXG4gICAgYmVhdXRpZnkuanNfYmVhdXRpZnkgPSBqc19iZWF1dGlmeS5qc19iZWF1dGlmeTtcbiAgICBiZWF1dGlmeS5jc3NfYmVhdXRpZnkgPSBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5O1xuICAgIGJlYXV0aWZ5Lmh0bWxfYmVhdXRpZnkgPSBodG1sX2JlYXV0aWZ5Lmh0bWxfYmVhdXRpZnk7XG5cbiAgICByZXR1cm4gYmVhdXRpZnk7XG59XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKCBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EI2RlZmluZWFtZC1wcm9wZXJ0eS0gKVxuICAgIGRlZmluZShbXG4gICAgICAgIFwiLi9saWIvYmVhdXRpZnlcIixcbiAgICAgICAgXCIuL2xpYi9iZWF1dGlmeS1jc3NcIixcbiAgICAgICAgXCIuL2xpYi9iZWF1dGlmeS1odG1sXCJcbiAgICBdLCBmdW5jdGlvbihqc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LCBodG1sX2JlYXV0aWZ5KSB7XG4gICAgICAgIHJldHVybiBnZXRfYmVhdXRpZnkoanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSwgaHRtbF9iZWF1dGlmeSk7XG4gICAgfSk7XG59IGVsc2Uge1xuICAgIChmdW5jdGlvbihtb2QpIHtcbiAgICAgICAgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZSgnLi9saWIvYmVhdXRpZnknKTtcbiAgICAgICAgdmFyIGNzc19iZWF1dGlmeSA9IHJlcXVpcmUoJy4vbGliL2JlYXV0aWZ5LWNzcycpO1xuICAgICAgICB2YXIgaHRtbF9iZWF1dGlmeSA9IHJlcXVpcmUoJy4vbGliL2JlYXV0aWZ5LWh0bWwnKTtcblxuICAgICAgICBtb2QuZXhwb3J0cyA9IGdldF9iZWF1dGlmeShqc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LCBodG1sX2JlYXV0aWZ5KTtcblxuICAgIH0pKG1vZHVsZSk7XG59IiwiLypqc2hpbnQgY3VybHk6dHJ1ZSwgZXFlcWVxOnRydWUsIGxheGJyZWFrOnRydWUsIG5vZW1wdHk6ZmFsc2UgKi9cbi8qXG5cbiAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXG5cbiAgQ29weXJpZ2h0IChjKSAyMDA3LTIwMTcgRWluYXIgTGllbG1hbmlzLCBMaWFtIE5ld21hbiwgYW5kIGNvbnRyaWJ1dG9ycy5cblxuICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxuICBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlc1xuICAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sXG4gIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsXG4gIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsXG4gIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG4gIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTXG4gIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuICBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gIFNPRlRXQVJFLlxuXG5cbiBDU1MgQmVhdXRpZmllclxuLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBXcml0dGVuIGJ5IEhhcnV0eXVuIEFtaXJqYW55YW4sIChhbWlyamFueWFuQGdtYWlsLmNvbSlcblxuICAgIEJhc2VkIG9uIGNvZGUgaW5pdGlhbGx5IGRldmVsb3BlZCBieTogRWluYXIgTGllbG1hbmlzLCA8ZWluYXJAanNiZWF1dGlmaWVyLm9yZz5cbiAgICAgICAgaHR0cDovL2pzYmVhdXRpZmllci5vcmcvXG5cbiAgICBVc2FnZTpcbiAgICAgICAgY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0KTtcbiAgICAgICAgY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0LCBvcHRpb25zKTtcblxuICAgIFRoZSBvcHRpb25zIGFyZSAoZGVmYXVsdCBpbiBicmFja2V0cyk6XG4gICAgICAgIGluZGVudF9zaXplICg0KSAgICAgICAgICAgICAgICAgICAgICAgICDigJQgaW5kZW50YXRpb24gc2l6ZSxcbiAgICAgICAgaW5kZW50X2NoYXIgKHNwYWNlKSAgICAgICAgICAgICAgICAgICAgIOKAlCBjaGFyYWN0ZXIgdG8gaW5kZW50IHdpdGgsXG4gICAgICAgIHByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IGZhbHNlKSAgICAgICAtIHdoZXRoZXIgZXhpc3RpbmcgbGluZSBicmVha3Mgc2hvdWxkIGJlIHByZXNlcnZlZCxcbiAgICAgICAgc2VsZWN0b3Jfc2VwYXJhdG9yX25ld2xpbmUgKHRydWUpICAgICAgIC0gc2VwYXJhdGUgc2VsZWN0b3JzIHdpdGggbmV3bGluZSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3QgKGUuZy4gXCJhLFxcbmJyXCIgb3IgXCJhLCBiclwiKVxuICAgICAgICBlbmRfd2l0aF9uZXdsaW5lIChmYWxzZSkgICAgICAgICAgICAgICAgLSBlbmQgd2l0aCBhIG5ld2xpbmVcbiAgICAgICAgbmV3bGluZV9iZXR3ZWVuX3J1bGVzICh0cnVlKSAgICAgICAgICAgIC0gYWRkIGEgbmV3IGxpbmUgYWZ0ZXIgZXZlcnkgY3NzIHJ1bGVcbiAgICAgICAgc3BhY2VfYXJvdW5kX3NlbGVjdG9yX3NlcGFyYXRvciAoZmFsc2UpIC0gZW5zdXJlIHNwYWNlIGFyb3VuZCBzZWxlY3RvciBzZXBhcmF0b3JzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPicsICcrJywgJ34nIChlLmcuIFwiYT5iXCIgLT4gXCJhID4gYlwiKVxuICAgIGUuZ1xuXG4gICAgY3NzX2JlYXV0aWZ5KGNzc19zb3VyY2VfdGV4dCwge1xuICAgICAgJ2luZGVudF9zaXplJzogMSxcbiAgICAgICdpbmRlbnRfY2hhcic6ICdcXHQnLFxuICAgICAgJ3NlbGVjdG9yX3NlcGFyYXRvcic6ICcgJyxcbiAgICAgICdlbmRfd2l0aF9uZXdsaW5lJzogZmFsc2UsXG4gICAgICAnbmV3bGluZV9iZXR3ZWVuX3J1bGVzJzogdHJ1ZSxcbiAgICAgICdzcGFjZV9hcm91bmRfc2VsZWN0b3Jfc2VwYXJhdG9yJzogdHJ1ZVxuICAgIH0pO1xuKi9cblxuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI3Rva2VuaXphdGlvblxuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zeW50YXgvXG5cbihmdW5jdGlvbigpIHtcblxuICAgIGZ1bmN0aW9uIG1lcmdlT3B0cyhhbGxPcHRpb25zLCB0YXJnZXRUeXBlKSB7XG4gICAgICAgIHZhciBmaW5hbE9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgZm9yIChuYW1lIGluIGFsbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSB0YXJnZXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzW25hbWVdID0gYWxsT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy9tZXJnZSBpbiB0aGUgcGVyIHR5cGUgc2V0dGluZ3MgZm9yIHRoZSB0YXJnZXRUeXBlXG4gICAgICAgIGlmICh0YXJnZXRUeXBlIGluIGFsbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBhbGxPcHRpb25zW3RhcmdldFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzW25hbWVdID0gYWxsT3B0aW9uc1t0YXJnZXRUeXBlXVtuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmluYWxPcHRzO1xuICAgIH1cblxuICAgIHZhciBsaW5lQnJlYWsgPSAvXFxyXFxufFtcXG5cXHJcXHUyMDI4XFx1MjAyOV0vO1xuICAgIHZhciBhbGxMaW5lQnJlYWtzID0gbmV3IFJlZ0V4cChsaW5lQnJlYWsuc291cmNlLCAnZycpO1xuXG4gICAgZnVuY3Rpb24gY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIEFsbG93IHRoZSBzZXR0aW5nIG9mIGxhbmd1YWdlL2ZpbGUtdHlwZSBzcGVjaWZpYyBvcHRpb25zXG4gICAgICAgIC8vIHdpdGggaW5oZXJpdGFuY2Ugb2Ygb3ZlcmFsbCBzZXR0aW5nc1xuICAgICAgICBvcHRpb25zID0gbWVyZ2VPcHRzKG9wdGlvbnMsICdjc3MnKTtcblxuICAgICAgICBzb3VyY2VfdGV4dCA9IHNvdXJjZV90ZXh0IHx8ICcnO1xuXG4gICAgICAgIHZhciBuZXdsaW5lc0Zyb21MYXN0V1NFYXQgPSAwO1xuICAgICAgICB2YXIgaW5kZW50U2l6ZSA9IG9wdGlvbnMuaW5kZW50X3NpemUgPyBwYXJzZUludChvcHRpb25zLmluZGVudF9zaXplLCAxMCkgOiA0O1xuICAgICAgICB2YXIgaW5kZW50Q2hhcmFjdGVyID0gb3B0aW9ucy5pbmRlbnRfY2hhciB8fCAnICc7XG4gICAgICAgIHZhciBwcmVzZXJ2ZV9uZXdsaW5lcyA9IChvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICB2YXIgc2VsZWN0b3JTZXBhcmF0b3JOZXdsaW5lID0gKG9wdGlvbnMuc2VsZWN0b3Jfc2VwYXJhdG9yX25ld2xpbmUgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5zZWxlY3Rvcl9zZXBhcmF0b3JfbmV3bGluZTtcbiAgICAgICAgdmFyIGVuZF93aXRoX25ld2xpbmUgPSAob3B0aW9ucy5lbmRfd2l0aF9uZXdsaW5lID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmVuZF93aXRoX25ld2xpbmU7XG4gICAgICAgIHZhciBuZXdsaW5lX2JldHdlZW5fcnVsZXMgPSAob3B0aW9ucy5uZXdsaW5lX2JldHdlZW5fcnVsZXMgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5uZXdsaW5lX2JldHdlZW5fcnVsZXM7XG4gICAgICAgIHZhciBzcGFjZV9hcm91bmRfY29tYmluYXRvciA9IChvcHRpb25zLnNwYWNlX2Fyb3VuZF9jb21iaW5hdG9yID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnNwYWNlX2Fyb3VuZF9jb21iaW5hdG9yO1xuICAgICAgICBzcGFjZV9hcm91bmRfY29tYmluYXRvciA9IHNwYWNlX2Fyb3VuZF9jb21iaW5hdG9yIHx8ICgob3B0aW9ucy5zcGFjZV9hcm91bmRfc2VsZWN0b3Jfc2VwYXJhdG9yID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnNwYWNlX2Fyb3VuZF9zZWxlY3Rvcl9zZXBhcmF0b3IpO1xuICAgICAgICB2YXIgZW9sID0gb3B0aW9ucy5lb2wgPyBvcHRpb25zLmVvbCA6ICdhdXRvJztcblxuICAgICAgICBpZiAob3B0aW9ucy5pbmRlbnRfd2l0aF90YWJzKSB7XG4gICAgICAgICAgICBpbmRlbnRDaGFyYWN0ZXIgPSAnXFx0JztcbiAgICAgICAgICAgIGluZGVudFNpemUgPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVvbCA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgICBlb2wgPSAnXFxuJztcbiAgICAgICAgICAgIGlmIChzb3VyY2VfdGV4dCAmJiBsaW5lQnJlYWsudGVzdChzb3VyY2VfdGV4dCB8fCAnJykpIHtcbiAgICAgICAgICAgICAgICBlb2wgPSBzb3VyY2VfdGV4dC5tYXRjaChsaW5lQnJlYWspWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZW9sID0gZW9sLnJlcGxhY2UoL1xcXFxyLywgJ1xccicpLnJlcGxhY2UoL1xcXFxuLywgJ1xcbicpO1xuXG4gICAgICAgIC8vIEhBQ0s6IG5ld2xpbmUgcGFyc2luZyBpbmNvbnNpc3RlbnQuIFRoaXMgYnJ1dGUgZm9yY2Ugbm9ybWFsaXplcyB0aGUgaW5wdXQuXG4gICAgICAgIHNvdXJjZV90ZXh0ID0gc291cmNlX3RleHQucmVwbGFjZShhbGxMaW5lQnJlYWtzLCAnXFxuJyk7XG5cbiAgICAgICAgLy8gdG9rZW5pemVyXG4gICAgICAgIHZhciB3aGl0ZVJlID0gL15cXHMrJC87XG5cbiAgICAgICAgdmFyIHBvcyA9IC0xLFxuICAgICAgICAgICAgY2g7XG4gICAgICAgIHZhciBwYXJlbkxldmVsID0gMDtcblxuICAgICAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VfdGV4dC5jaGFyQXQoKytwb3MpO1xuICAgICAgICAgICAgcmV0dXJuIGNoIHx8ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGVlayhza2lwV2hpdGVzcGFjZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgdmFyIHByZXZfcG9zID0gcG9zO1xuICAgICAgICAgICAgaWYgKHNraXBXaGl0ZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gc291cmNlX3RleHQuY2hhckF0KHBvcyArIDEpIHx8ICcnO1xuICAgICAgICAgICAgcG9zID0gcHJldl9wb3MgLSAxO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVhdFN0cmluZyhlbmRDaGFycykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gcG9zO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSkge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5kQ2hhcnMuaW5kZXhPZihjaCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZV90ZXh0LnN1YnN0cmluZyhzdGFydCwgcG9zICsgMSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwZWVrU3RyaW5nKGVuZENoYXIpIHtcbiAgICAgICAgICAgIHZhciBwcmV2X3BvcyA9IHBvcztcbiAgICAgICAgICAgIHZhciBzdHIgPSBlYXRTdHJpbmcoZW5kQ2hhcik7XG4gICAgICAgICAgICBwb3MgPSBwcmV2X3BvcyAtIDE7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZWF0V2hpdGVzcGFjZShwcmVzZXJ2ZV9uZXdsaW5lc19sb2NhbCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAod2hpdGVSZS50ZXN0KHBlZWsoKSkpIHtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxuJyAmJiBwcmVzZXJ2ZV9uZXdsaW5lc19sb2NhbCAmJiBwcmVzZXJ2ZV9uZXdsaW5lcykge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdsaW5lc0Zyb21MYXN0V1NFYXQgPSByZXN1bHQ7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2tpcFdoaXRlc3BhY2UoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICAgICAgICBpZiAoY2ggJiYgd2hpdGVSZS50ZXN0KGNoKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKHdoaXRlUmUudGVzdChuZXh0KCkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVhdENvbW1lbnQoc2luZ2xlTGluZSkge1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gcG9zO1xuICAgICAgICAgICAgc2luZ2xlTGluZSA9IHBlZWsoKSA9PT0gXCIvXCI7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB3aGlsZSAobmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaW5nbGVMaW5lICYmIGNoID09PSBcIipcIiAmJiBwZWVrKCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaW5nbGVMaW5lICYmIGNoID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc291cmNlX3RleHQuc3Vic3RyaW5nKHN0YXJ0LCBwb3MpICsgY2g7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGxvb2tCYWNrKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZV90ZXh0LnN1YnN0cmluZyhwb3MgLSBzdHIubGVuZ3RoLCBwb3MpLnRvTG93ZXJDYXNlKCkgPT09XG4gICAgICAgICAgICAgICAgc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTmVzdGVkIHBzZXVkby1jbGFzcyBpZiB3ZSBhcmUgaW5zaWRlUnVsZVxuICAgICAgICAvLyBhbmQgdGhlIG5leHQgc3BlY2lhbCBjaGFyYWN0ZXIgZm91bmQgb3BlbnNcbiAgICAgICAgLy8gYSBuZXcgYmxvY2tcbiAgICAgICAgZnVuY3Rpb24gZm91bmROZXN0ZWRQc2V1ZG9DbGFzcygpIHtcbiAgICAgICAgICAgIHZhciBvcGVuUGFyZW4gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBvcyArIDE7IGkgPCBzb3VyY2VfdGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaCA9IHNvdXJjZV90ZXh0LmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IFwie1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcoJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBwc2V1ZG9jbGFzc2VzIGNhbiBjb250YWluICgpXG4gICAgICAgICAgICAgICAgICAgIG9wZW5QYXJlbiArPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3BlblBhcmVuID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3BlblBhcmVuIC09IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCI7XCIgfHwgY2ggPT09IFwifVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwcmludGVyXG4gICAgICAgIHZhciBiYXNlYmFzZUluZGVudFN0cmluZyA9IHNvdXJjZV90ZXh0Lm1hdGNoKC9eW1xcdCBdKi8pWzBdO1xuICAgICAgICB2YXIgc2luZ2xlSW5kZW50ID0gbmV3IEFycmF5KGluZGVudFNpemUgKyAxKS5qb2luKGluZGVudENoYXJhY3Rlcik7XG4gICAgICAgIHZhciBpbmRlbnRMZXZlbCA9IDA7XG4gICAgICAgIHZhciBuZXN0ZWRMZXZlbCA9IDA7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5kZW50KCkge1xuICAgICAgICAgICAgaW5kZW50TGV2ZWwrKztcbiAgICAgICAgICAgIGJhc2ViYXNlSW5kZW50U3RyaW5nICs9IHNpbmdsZUluZGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG91dGRlbnQoKSB7XG4gICAgICAgICAgICBpbmRlbnRMZXZlbC0tO1xuICAgICAgICAgICAgYmFzZWJhc2VJbmRlbnRTdHJpbmcgPSBiYXNlYmFzZUluZGVudFN0cmluZy5zbGljZSgwLCAtaW5kZW50U2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJpbnQgPSB7fTtcbiAgICAgICAgcHJpbnRbXCJ7XCJdID0gZnVuY3Rpb24oY2gpIHtcbiAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICBpZiAoIWVhdFdoaXRlc3BhY2UodHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHByaW50W1wifVwiXSA9IGZ1bmN0aW9uKG5ld2xpbmUpIHtcbiAgICAgICAgICAgIGlmIChuZXdsaW5lKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0cHV0LnB1c2goJ30nKTtcbiAgICAgICAgICAgIGlmICghZWF0V2hpdGVzcGFjZSh0cnVlKSkge1xuICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC5fbGFzdENoYXJXaGl0ZXNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gd2hpdGVSZS50ZXN0KG91dHB1dFtvdXRwdXQubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByaW50Lm5ld0xpbmUgPSBmdW5jdGlvbihrZWVwV2hpdGVzcGFjZSkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWtlZXBXaGl0ZXNwYWNlICYmIG91dHB1dFtvdXRwdXQubGVuZ3RoIC0gMV0gIT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dFtvdXRwdXQubGVuZ3RoIC0gMV0gPT09IGJhc2ViYXNlSW5kZW50U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goJ1xcbicpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGJhc2ViYXNlSW5kZW50U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGJhc2ViYXNlSW5kZW50U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHByaW50LnNpbmdsZVNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0Lmxlbmd0aCAmJiAhcHJpbnQuX2xhc3RDaGFyV2hpdGVzcGFjZSgpKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goJyAnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC5wcmVzZXJ2ZVNpbmdsZVNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoaXNBZnRlclNwYWNlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC50cmltID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aGlsZSAocHJpbnQuX2xhc3RDaGFyV2hpdGVzcGFjZSgpKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAvKl9fX19fX19fX19fX19fX19fX19fXy0tLS0tLS0tLS0tLS0tLS0tLS0tX19fX19fX19fX19fX19fX19fX19fKi9cblxuICAgICAgICB2YXIgaW5zaWRlUnVsZSA9IGZhbHNlO1xuICAgICAgICB2YXIgaW5zaWRlUHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgZW50ZXJpbmdDb25kaXRpb25hbEdyb3VwID0gZmFsc2U7XG4gICAgICAgIHZhciB0b3BfY2ggPSAnJztcbiAgICAgICAgdmFyIGxhc3RfdG9wX2NoID0gJyc7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciB3aGl0ZXNwYWNlID0gc2tpcFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgIHZhciBpc0FmdGVyU3BhY2UgPSB3aGl0ZXNwYWNlICE9PSAnJztcbiAgICAgICAgICAgIHZhciBpc0FmdGVyTmV3bGluZSA9IHdoaXRlc3BhY2UuaW5kZXhPZignXFxuJykgIT09IC0xO1xuICAgICAgICAgICAgbGFzdF90b3BfY2ggPSB0b3BfY2g7XG4gICAgICAgICAgICB0b3BfY2ggPSBjaDtcblxuICAgICAgICAgICAgaWYgKCFjaCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJy8nICYmIHBlZWsoKSA9PT0gJyonKSB7IC8qIGNzcyBjb21tZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIGhlYWRlciA9IGluZGVudExldmVsID09PSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzQWZ0ZXJOZXdsaW5lIHx8IGhlYWRlcikge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZWF0Q29tbWVudCgpKTtcbiAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICAgICAgaWYgKGhlYWRlcikge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcvJyAmJiBwZWVrKCkgPT09ICcvJykgeyAvLyBzaW5nbGUgbGluZSBjb21tZW50XG4gICAgICAgICAgICAgICAgaWYgKCFpc0FmdGVyTmV3bGluZSAmJiBsYXN0X3RvcF9jaCAhPT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRDb21tZW50KCkpO1xuICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdAJykge1xuICAgICAgICAgICAgICAgIHByaW50LnByZXNlcnZlU2luZ2xlU3BhY2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBsZXNzIHByb3BlcnkgbWl4aW5zIEB7Li4ufVxuICAgICAgICAgICAgICAgIGlmIChwZWVrKCkgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoJ30nKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0cmlwIHRyYWlsaW5nIHNwYWNlLCBpZiBwcmVzZW50LCBmb3IgaGFzaCBwcm9wZXJ0eSBjaGVja3NcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmlhYmxlT3JSdWxlID0gcGVla1N0cmluZyhcIjogLDt7fSgpW10vPSdcXFwiXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZU9yUnVsZS5tYXRjaCgvWyA6XSQvKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHZhcmlhYmxlIG9yIHBzZXVkby1jbGFzcywgYWRkIGl0IGFuZCBpbnNlcnQgb25lIHNwYWNlIGJlZm9yZSBjb250aW51aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZU9yUnVsZSA9IGVhdFN0cmluZyhcIjogXCIpLnJlcGxhY2UoL1xccyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaCh2YXJpYWJsZU9yUnVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVPclJ1bGUgPSB2YXJpYWJsZU9yUnVsZS5yZXBsYWNlKC9cXHMkLywgJycpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG1pZ2h0IGJlIGEgbmVzdGluZyBhdC1ydWxlXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZU9yUnVsZSBpbiBjc3NfYmVhdXRpZnkuTkVTVEVEX0FUX1JVTEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lc3RlZExldmVsICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVPclJ1bGUgaW4gY3NzX2JlYXV0aWZ5LkNPTkRJVElPTkFMX0dST1VQX1JVTEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmluZ0NvbmRpdGlvbmFsR3JvdXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJyMnICYmIHBlZWsoKSA9PT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQucHJlc2VydmVTaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGVhdFN0cmluZygnfScpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICd7Jykge1xuICAgICAgICAgICAgICAgIGlmIChwZWVrKHRydWUpID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwie1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRbJ30nXShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdsaW5lc0Zyb21MYXN0V1NFYXQgPCAyICYmIG5ld2xpbmVfYmV0d2Vlbl9ydWxlcyAmJiBpbmRlbnRMZXZlbCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBwcmludFtcIntcIl0oY2gpO1xuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIGVudGVyaW5nIGNvbmRpdGlvbmFsIGdyb3Vwcywgb25seSBydWxlc2V0cyBhcmUgYWxsb3dlZFxuICAgICAgICAgICAgICAgICAgICBpZiAoZW50ZXJpbmdDb25kaXRpb25hbEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmluZ0NvbmRpdGlvbmFsR3JvdXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZVJ1bGUgPSAoaW5kZW50TGV2ZWwgPiBuZXN0ZWRMZXZlbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UsIGRlY2xhcmF0aW9ucyBhcmUgYWxzbyBhbGxvd2VkXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNpZGVSdWxlID0gKGluZGVudExldmVsID49IG5lc3RlZExldmVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICd9Jykge1xuICAgICAgICAgICAgICAgIG91dGRlbnQoKTtcbiAgICAgICAgICAgICAgICBwcmludFtcIn1cIl0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgaW5zaWRlUnVsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGluc2lkZVByb3BlcnR5VmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAobmVzdGVkTGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbmVzdGVkTGV2ZWwtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5ld2xpbmVzRnJvbUxhc3RXU0VhdCA8IDIgJiYgbmV3bGluZV9iZXR3ZWVuX3J1bGVzICYmIGluZGVudExldmVsID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKChpbnNpZGVSdWxlIHx8IGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIShsb29rQmFjayhcIiZcIikgfHwgZm91bmROZXN0ZWRQc2V1ZG9DbGFzcygpKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbG9va0JhY2soXCIoXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICdwcm9wZXJ0eTogdmFsdWUnIGRlbGltaXRlclxuICAgICAgICAgICAgICAgICAgICAvLyB3aGljaCBjb3VsZCBiZSBpbiBhIGNvbmRpdGlvbmFsIGdyb3VwIHF1ZXJ5XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCc6Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5zaWRlUHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlUHJvcGVydHlWYWx1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2Fzcy9sZXNzIHBhcmVudCByZWZlcmVuY2UgZG9uJ3QgdXNlIGEgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FzcyBuZXN0ZWQgcHNldWRvLWNsYXNzIGRvbid0IHVzZSBhIHNwYWNlXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gcHJlc2VydmUgc3BhY2UgYmVmb3JlIHBzZXVkb2NsYXNzZXMvcHNldWRvZWxlbWVudHMsIGFzIGl0IG1lYW5zIFwiaW4gYW55IGNoaWxkXCJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvb2tCYWNrKFwiIFwiKSAmJiBvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdICE9PSBcIiBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwc2V1ZG8tZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goXCI6OlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBzZXVkby1jbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goJzonKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcIicgfHwgY2ggPT09ICdcXCcnKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQucHJlc2VydmVTaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGVhdFN0cmluZyhjaCkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJzsnKSB7XG4gICAgICAgICAgICAgICAgaW5zaWRlUHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWVhdFdoaXRlc3BhY2UodHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcoJykgeyAvLyBtYXkgYmUgYSB1cmxcbiAgICAgICAgICAgICAgICBpZiAobG9va0JhY2soXCJ1cmxcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCAhPT0gJyknICYmIGNoICE9PSAnXCInICYmIGNoICE9PSAnXFwnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGVhdFN0cmluZygnKScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLS07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbkxldmVsKys7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnByZXNlcnZlU2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJyknKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgIHBhcmVuTGV2ZWwtLTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcsJykge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWVhdFdoaXRlc3BhY2UodHJ1ZSkgJiYgc2VsZWN0b3JTZXBhcmF0b3JOZXdsaW5lICYmICFpbnNpZGVQcm9wZXJ0eVZhbHVlICYmIHBhcmVuTGV2ZWwgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKGNoID09PSAnPicgfHwgY2ggPT09ICcrJyB8fCBjaCA9PT0gJ34nKSAmJlxuICAgICAgICAgICAgICAgICFpbnNpZGVQcm9wZXJ0eVZhbHVlICYmIHBhcmVuTGV2ZWwgPCAxKSB7XG4gICAgICAgICAgICAgICAgLy9oYW5kbGUgY29tYmluYXRvciBzcGFjaW5nXG4gICAgICAgICAgICAgICAgaWYgKHNwYWNlX2Fyb3VuZF9jb21iaW5hdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICAgICAgICAgIGVhdFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3F1YXNoIGV4dHJhIHdoaXRlc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICYmIHdoaXRlUmUudGVzdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXScpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICBwcmludC5wcmVzZXJ2ZVNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJz0nKSB7IC8vIG5vIHdoaXRlc3BhY2UgYmVmb3JlIG9yIGFmdGVyXG4gICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCc9Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlUmUudGVzdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2ggPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByaW50LnByZXNlcnZlU2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBzd2VldENvZGUgPSAnJztcbiAgICAgICAgaWYgKGJhc2ViYXNlSW5kZW50U3RyaW5nKSB7XG4gICAgICAgICAgICBzd2VldENvZGUgKz0gYmFzZWJhc2VJbmRlbnRTdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBzd2VldENvZGUgKz0gb3V0cHV0LmpvaW4oJycpLnJlcGxhY2UoL1tcXHJcXG5cXHQgXSskLywgJycpO1xuXG4gICAgICAgIC8vIGVzdGFibGlzaCBlbmRfd2l0aF9uZXdsaW5lXG4gICAgICAgIGlmIChlbmRfd2l0aF9uZXdsaW5lKSB7XG4gICAgICAgICAgICBzd2VldENvZGUgKz0gJ1xcbic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZW9sICE9PSAnXFxuJykge1xuICAgICAgICAgICAgc3dlZXRDb2RlID0gc3dlZXRDb2RlLnJlcGxhY2UoL1tcXG5dL2csIGVvbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3dlZXRDb2RlO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9BdC1ydWxlXG4gICAgY3NzX2JlYXV0aWZ5Lk5FU1RFRF9BVF9SVUxFID0ge1xuICAgICAgICBcIkBwYWdlXCI6IHRydWUsXG4gICAgICAgIFwiQGZvbnQtZmFjZVwiOiB0cnVlLFxuICAgICAgICBcIkBrZXlmcmFtZXNcIjogdHJ1ZSxcbiAgICAgICAgLy8gYWxzbyBpbiBDT05ESVRJT05BTF9HUk9VUF9SVUxFIGJlbG93XG4gICAgICAgIFwiQG1lZGlhXCI6IHRydWUsXG4gICAgICAgIFwiQHN1cHBvcnRzXCI6IHRydWUsXG4gICAgICAgIFwiQGRvY3VtZW50XCI6IHRydWVcbiAgICB9O1xuICAgIGNzc19iZWF1dGlmeS5DT05ESVRJT05BTF9HUk9VUF9SVUxFID0ge1xuICAgICAgICBcIkBtZWRpYVwiOiB0cnVlLFxuICAgICAgICBcIkBzdXBwb3J0c1wiOiB0cnVlLFxuICAgICAgICBcIkBkb2N1bWVudFwiOiB0cnVlXG4gICAgfTtcblxuICAgIC8qZ2xvYmFsIGRlZmluZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY3NzX2JlYXV0aWZ5OiBjc3NfYmVhdXRpZnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gQWRkIHN1cHBvcnQgZm9yIENvbW1vbkpTLiBKdXN0IHB1dCB0aGlzIGZpbGUgc29tZXdoZXJlIG9uIHlvdXIgcmVxdWlyZS5wYXRoc1xuICAgICAgICAvLyBhbmQgeW91IHdpbGwgYmUgYWJsZSB0byBgdmFyIGh0bWxfYmVhdXRpZnkgPSByZXF1aXJlKFwiYmVhdXRpZnlcIikuaHRtbF9iZWF1dGlmeWAuXG4gICAgICAgIGV4cG9ydHMuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSdyZSBydW5uaW5nIGEgd2ViIHBhZ2UgYW5kIGRvbid0IGhhdmUgZWl0aGVyIG9mIHRoZSBhYm92ZSwgYWRkIG91ciBvbmUgZ2xvYmFsXG4gICAgICAgIHdpbmRvdy5jc3NfYmVhdXRpZnkgPSBjc3NfYmVhdXRpZnk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGV2ZW4gaGF2ZSB3aW5kb3csIHRyeSBnbG9iYWwuXG4gICAgICAgIGdsb2JhbC5jc3NfYmVhdXRpZnkgPSBjc3NfYmVhdXRpZnk7XG4gICAgfVxuXG59KCkpOyIsIi8qanNoaW50IGN1cmx5OnRydWUsIGVxZXFlcTp0cnVlLCBsYXhicmVhazp0cnVlLCBub2VtcHR5OmZhbHNlICovXG4vKlxuXG4gIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gIENvcHlyaWdodCAoYykgMjAwNy0yMDE3IEVpbmFyIExpZWxtYW5pcywgTGlhbSBOZXdtYW4sIGFuZCBjb250cmlidXRvcnMuXG5cbiAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cbiAgb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXNcbiAgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLFxuICBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLFxuICBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLFxuICBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiAgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSU1xuICBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbiAgQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICBTT0ZUV0FSRS5cblxuXG4gU3R5bGUgSFRNTFxuLS0tLS0tLS0tLS0tLS0tXG5cbiAgV3JpdHRlbiBieSBOb2NodW0gU29zc29ua28sIChuc29zc29ua29AaG90bWFpbC5jb20pXG5cbiAgQmFzZWQgb24gY29kZSBpbml0aWFsbHkgZGV2ZWxvcGVkIGJ5OiBFaW5hciBMaWVsbWFuaXMsIDxlaW5hckBqc2JlYXV0aWZpZXIub3JnPlxuICAgIGh0dHA6Ly9qc2JlYXV0aWZpZXIub3JnL1xuXG4gIFVzYWdlOlxuICAgIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UpO1xuXG4gICAgc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucyk7XG5cbiAgVGhlIG9wdGlvbnMgYXJlOlxuICAgIGluZGVudF9pbm5lcl9odG1sIChkZWZhdWx0IGZhbHNlKSAg4oCUIGluZGVudCA8aGVhZD4gYW5kIDxib2R5PiBzZWN0aW9ucyxcbiAgICBpbmRlbnRfc2l6ZSAoZGVmYXVsdCA0KSAgICAgICAgICDigJQgaW5kZW50YXRpb24gc2l6ZSxcbiAgICBpbmRlbnRfY2hhciAoZGVmYXVsdCBzcGFjZSkgICAgICDigJQgY2hhcmFjdGVyIHRvIGluZGVudCB3aXRoLFxuICAgIHdyYXBfbGluZV9sZW5ndGggKGRlZmF1bHQgMjUwKSAgICAgICAgICAgIC0gIG1heGltdW0gYW1vdW50IG9mIGNoYXJhY3RlcnMgcGVyIGxpbmUgKDAgPSBkaXNhYmxlKVxuICAgIGJyYWNlX3N0eWxlIChkZWZhdWx0IFwiY29sbGFwc2VcIikgLSBcImNvbGxhcHNlXCIgfCBcImV4cGFuZFwiIHwgXCJlbmQtZXhwYW5kXCIgfCBcIm5vbmVcIlxuICAgICAgICAgICAgcHV0IGJyYWNlcyBvbiB0aGUgc2FtZSBsaW5lIGFzIGNvbnRyb2wgc3RhdGVtZW50cyAoZGVmYXVsdCksIG9yIHB1dCBicmFjZXMgb24gb3duIGxpbmUgKEFsbG1hbiAvIEFOU0kgc3R5bGUpLCBvciBqdXN0IHB1dCBlbmQgYnJhY2VzIG9uIG93biBsaW5lLCBvciBhdHRlbXB0IHRvIGtlZXAgdGhlbSB3aGVyZSB0aGV5IGFyZS5cbiAgICB1bmZvcm1hdHRlZCAoZGVmYXVsdHMgdG8gaW5saW5lIHRhZ3MpIC0gbGlzdCBvZiB0YWdzLCB0aGF0IHNob3VsZG4ndCBiZSByZWZvcm1hdHRlZFxuICAgIGNvbnRlbnRfdW5mb3JtYXR0ZWQgKGRlZmF1bHRzIHRvIHByZSB0YWcpIC0gbGlzdCBvZiB0YWdzLCB0aGF0IGl0cyBjb250ZW50IHNob3VsZG4ndCBiZSByZWZvcm1hdHRlZFxuICAgIGluZGVudF9zY3JpcHRzIChkZWZhdWx0IG5vcm1hbCkgIC0gXCJrZWVwXCJ8XCJzZXBhcmF0ZVwifFwibm9ybWFsXCJcbiAgICBwcmVzZXJ2ZV9uZXdsaW5lcyAoZGVmYXVsdCB0cnVlKSAtIHdoZXRoZXIgZXhpc3RpbmcgbGluZSBicmVha3MgYmVmb3JlIGVsZW1lbnRzIHNob3VsZCBiZSBwcmVzZXJ2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPbmx5IHdvcmtzIGJlZm9yZSBlbGVtZW50cywgbm90IGluc2lkZSB0YWdzIG9yIGZvciB0ZXh0LlxuICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyAoZGVmYXVsdCB1bmxpbWl0ZWQpIC0gbWF4aW11bSBudW1iZXIgb2YgbGluZSBicmVha3MgdG8gYmUgcHJlc2VydmVkIGluIG9uZSBjaHVua1xuICAgIGluZGVudF9oYW5kbGViYXJzIChkZWZhdWx0IGZhbHNlKSAtIGZvcm1hdCBhbmQgaW5kZW50IHt7I2Zvb319IGFuZCB7ey9mb299fVxuICAgIGVuZF93aXRoX25ld2xpbmUgKGZhbHNlKSAgICAgICAgICAtIGVuZCB3aXRoIGEgbmV3bGluZVxuICAgIGV4dHJhX2xpbmVycyAoZGVmYXVsdCBbaGVhZCxib2R5LC9odG1sXSkgLUxpc3Qgb2YgdGFncyB0aGF0IHNob3VsZCBoYXZlIGFuIGV4dHJhIG5ld2xpbmUgYmVmb3JlIHRoZW0uXG5cbiAgICBlLmcuXG5cbiAgICBzdHlsZV9odG1sKGh0bWxfc291cmNlLCB7XG4gICAgICAnaW5kZW50X2lubmVyX2h0bWwnOiBmYWxzZSxcbiAgICAgICdpbmRlbnRfc2l6ZSc6IDIsXG4gICAgICAnaW5kZW50X2NoYXInOiAnICcsXG4gICAgICAnd3JhcF9saW5lX2xlbmd0aCc6IDc4LFxuICAgICAgJ2JyYWNlX3N0eWxlJzogJ2V4cGFuZCcsXG4gICAgICAncHJlc2VydmVfbmV3bGluZXMnOiB0cnVlLFxuICAgICAgJ21heF9wcmVzZXJ2ZV9uZXdsaW5lcyc6IDUsXG4gICAgICAnaW5kZW50X2hhbmRsZWJhcnMnOiBmYWxzZSxcbiAgICAgICdleHRyYV9saW5lcnMnOiBbJy9odG1sJ11cbiAgICB9KTtcbiovXG5cbihmdW5jdGlvbigpIHtcblxuICAgIC8vIGZ1bmN0aW9uIHRyaW0ocykge1xuICAgIC8vICAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgLy8gfVxuXG4gICAgZnVuY3Rpb24gbHRyaW0ocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzKy9nLCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnRyaW0ocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXHMrJC9nLCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VPcHRzKGFsbE9wdGlvbnMsIHRhcmdldFR5cGUpIHtcbiAgICAgICAgdmFyIGZpbmFsT3B0cyA9IHt9O1xuICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICBmb3IgKG5hbWUgaW4gYWxsT3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09IHRhcmdldFR5cGUpIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9wdHNbbmFtZV0gPSBhbGxPcHRpb25zW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9tZXJnZSBpbiB0aGUgcGVyIHR5cGUgc2V0dGluZ3MgZm9yIHRoZSB0YXJnZXRUeXBlXG4gICAgICAgIGlmICh0YXJnZXRUeXBlIGluIGFsbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBhbGxPcHRpb25zW3RhcmdldFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzW25hbWVdID0gYWxsT3B0aW9uc1t0YXJnZXRUeXBlXVtuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmluYWxPcHRzO1xuICAgIH1cblxuICAgIHZhciBsaW5lQnJlYWsgPSAvXFxyXFxufFtcXG5cXHJcXHUyMDI4XFx1MjAyOV0vO1xuICAgIHZhciBhbGxMaW5lQnJlYWtzID0gbmV3IFJlZ0V4cChsaW5lQnJlYWsuc291cmNlLCAnZycpO1xuXG4gICAgZnVuY3Rpb24gc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucywganNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSkge1xuICAgICAgICAvL1dyYXBwZXIgZnVuY3Rpb24gdG8gaW52b2tlIGFsbCB0aGUgbmVjZXNzYXJ5IGNvbnN0cnVjdG9ycyBhbmQgZGVhbCB3aXRoIHRoZSBvdXRwdXQuXG5cbiAgICAgICAgdmFyIG11bHRpX3BhcnNlcixcbiAgICAgICAgICAgIGluZGVudF9pbm5lcl9odG1sLFxuICAgICAgICAgICAgaW5kZW50X2JvZHlfaW5uZXJfaHRtbCxcbiAgICAgICAgICAgIGluZGVudF9oZWFkX2lubmVyX2h0bWwsXG4gICAgICAgICAgICBpbmRlbnRfc2l6ZSxcbiAgICAgICAgICAgIGluZGVudF9jaGFyYWN0ZXIsXG4gICAgICAgICAgICB3cmFwX2xpbmVfbGVuZ3RoLFxuICAgICAgICAgICAgYnJhY2Vfc3R5bGUsXG4gICAgICAgICAgICB1bmZvcm1hdHRlZCxcbiAgICAgICAgICAgIGNvbnRlbnRfdW5mb3JtYXR0ZWQsXG4gICAgICAgICAgICBwcmVzZXJ2ZV9uZXdsaW5lcyxcbiAgICAgICAgICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyxcbiAgICAgICAgICAgIGluZGVudF9oYW5kbGViYXJzLFxuICAgICAgICAgICAgd3JhcF9hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgd3JhcF9hdHRyaWJ1dGVzX2luZGVudF9zaXplLFxuICAgICAgICAgICAgaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlLFxuICAgICAgICAgICAgaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlX2V4cGFuZF9tdWx0aWxpbmUsXG4gICAgICAgICAgICBpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2VfYWxpZ25lZCxcbiAgICAgICAgICAgIGVuZF93aXRoX25ld2xpbmUsXG4gICAgICAgICAgICBleHRyYV9saW5lcnMsXG4gICAgICAgICAgICBlb2w7XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgLy8gQWxsb3cgdGhlIHNldHRpbmcgb2YgbGFuZ3VhZ2UvZmlsZS10eXBlIHNwZWNpZmljIG9wdGlvbnNcbiAgICAgICAgLy8gd2l0aCBpbmhlcml0YW5jZSBvZiBvdmVyYWxsIHNldHRpbmdzXG4gICAgICAgIG9wdGlvbnMgPSBtZXJnZU9wdHMob3B0aW9ucywgJ2h0bWwnKTtcblxuICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB0byAxLjMuNFxuICAgICAgICBpZiAoKG9wdGlvbnMud3JhcF9saW5lX2xlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IHBhcnNlSW50KG9wdGlvbnMud3JhcF9saW5lX2xlbmd0aCwgMTApID09PSAwKSAmJlxuICAgICAgICAgICAgKG9wdGlvbnMubWF4X2NoYXIgIT09IHVuZGVmaW5lZCAmJiBwYXJzZUludChvcHRpb25zLm1heF9jaGFyLCAxMCkgIT09IDApKSB7XG4gICAgICAgICAgICBvcHRpb25zLndyYXBfbGluZV9sZW5ndGggPSBvcHRpb25zLm1heF9jaGFyO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5kZW50X2lubmVyX2h0bWwgPSAob3B0aW9ucy5pbmRlbnRfaW5uZXJfaHRtbCA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5pbmRlbnRfaW5uZXJfaHRtbDtcbiAgICAgICAgaW5kZW50X2JvZHlfaW5uZXJfaHRtbCA9IChvcHRpb25zLmluZGVudF9ib2R5X2lubmVyX2h0bWwgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5pbmRlbnRfYm9keV9pbm5lcl9odG1sO1xuICAgICAgICBpbmRlbnRfaGVhZF9pbm5lcl9odG1sID0gKG9wdGlvbnMuaW5kZW50X2hlYWRfaW5uZXJfaHRtbCA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLmluZGVudF9oZWFkX2lubmVyX2h0bWw7XG4gICAgICAgIGluZGVudF9zaXplID0gKG9wdGlvbnMuaW5kZW50X3NpemUgPT09IHVuZGVmaW5lZCkgPyA0IDogcGFyc2VJbnQob3B0aW9ucy5pbmRlbnRfc2l6ZSwgMTApO1xuICAgICAgICBpbmRlbnRfY2hhcmFjdGVyID0gKG9wdGlvbnMuaW5kZW50X2NoYXIgPT09IHVuZGVmaW5lZCkgPyAnICcgOiBvcHRpb25zLmluZGVudF9jaGFyO1xuICAgICAgICBicmFjZV9zdHlsZSA9IChvcHRpb25zLmJyYWNlX3N0eWxlID09PSB1bmRlZmluZWQpID8gJ2NvbGxhcHNlJyA6IG9wdGlvbnMuYnJhY2Vfc3R5bGU7XG4gICAgICAgIHdyYXBfbGluZV9sZW5ndGggPSBwYXJzZUludChvcHRpb25zLndyYXBfbGluZV9sZW5ndGgsIDEwKSA9PT0gMCA/IDMyNzg2IDogcGFyc2VJbnQob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoIHx8IDI1MCwgMTApO1xuICAgICAgICB1bmZvcm1hdHRlZCA9IG9wdGlvbnMudW5mb3JtYXR0ZWQgfHwgW1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2RvbS5odG1sI3BocmFzaW5nLWNvbnRlbnRcbiAgICAgICAgICAgICdhJywgJ2FiYnInLCAnYXJlYScsICdhdWRpbycsICdiJywgJ2JkaScsICdiZG8nLCAnYnInLCAnYnV0dG9uJywgJ2NhbnZhcycsICdjaXRlJyxcbiAgICAgICAgICAgICdjb2RlJywgJ2RhdGEnLCAnZGF0YWxpc3QnLCAnZGVsJywgJ2RmbicsICdlbScsICdlbWJlZCcsICdpJywgJ2lmcmFtZScsICdpbWcnLFxuICAgICAgICAgICAgJ2lucHV0JywgJ2lucycsICdrYmQnLCAna2V5Z2VuJywgJ2xhYmVsJywgJ21hcCcsICdtYXJrJywgJ21hdGgnLCAnbWV0ZXInLCAnbm9zY3JpcHQnLFxuICAgICAgICAgICAgJ29iamVjdCcsICdvdXRwdXQnLCAncHJvZ3Jlc3MnLCAncScsICdydWJ5JywgJ3MnLCAnc2FtcCcsIC8qICdzY3JpcHQnLCAqLyAnc2VsZWN0JywgJ3NtYWxsJyxcbiAgICAgICAgICAgICdzcGFuJywgJ3N0cm9uZycsICdzdWInLCAnc3VwJywgJ3N2ZycsICd0ZW1wbGF0ZScsICd0ZXh0YXJlYScsICd0aW1lJywgJ3UnLCAndmFyJyxcbiAgICAgICAgICAgICd2aWRlbycsICd3YnInLCAndGV4dCcsXG4gICAgICAgICAgICAvLyBwcmV4aXN0aW5nIC0gbm90IHN1cmUgb2YgZnVsbCBlZmZlY3Qgb2YgcmVtb3ZpbmcsIGxlYXZpbmcgaW5cbiAgICAgICAgICAgICdhY3JvbnltJywgJ2FkZHJlc3MnLCAnYmlnJywgJ2R0JywgJ2lucycsICdzdHJpa2UnLCAndHQnLFxuICAgICAgICBdO1xuICAgICAgICBjb250ZW50X3VuZm9ybWF0dGVkID0gb3B0aW9ucy5jb250ZW50X3VuZm9ybWF0dGVkIHx8IFtcbiAgICAgICAgICAgICdwcmUnLFxuICAgICAgICBdO1xuICAgICAgICBwcmVzZXJ2ZV9uZXdsaW5lcyA9IChvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzID09PSB1bmRlZmluZWQpID8gdHJ1ZSA6IG9wdGlvbnMucHJlc2VydmVfbmV3bGluZXM7XG4gICAgICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyA9IHByZXNlcnZlX25ld2xpbmVzID9cbiAgICAgICAgICAgIChpc05hTihwYXJzZUludChvcHRpb25zLm1heF9wcmVzZXJ2ZV9uZXdsaW5lcywgMTApKSA/IDMyNzg2IDogcGFyc2VJbnQob3B0aW9ucy5tYXhfcHJlc2VydmVfbmV3bGluZXMsIDEwKSkgOlxuICAgICAgICAgICAgMDtcbiAgICAgICAgaW5kZW50X2hhbmRsZWJhcnMgPSAob3B0aW9ucy5pbmRlbnRfaGFuZGxlYmFycyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5pbmRlbnRfaGFuZGxlYmFycztcbiAgICAgICAgd3JhcF9hdHRyaWJ1dGVzID0gKG9wdGlvbnMud3JhcF9hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpID8gJ2F1dG8nIDogb3B0aW9ucy53cmFwX2F0dHJpYnV0ZXM7XG4gICAgICAgIHdyYXBfYXR0cmlidXRlc19pbmRlbnRfc2l6ZSA9IChpc05hTihwYXJzZUludChvcHRpb25zLndyYXBfYXR0cmlidXRlc19pbmRlbnRfc2l6ZSwgMTApKSkgPyBpbmRlbnRfc2l6ZSA6IHBhcnNlSW50KG9wdGlvbnMud3JhcF9hdHRyaWJ1dGVzX2luZGVudF9zaXplLCAxMCk7XG4gICAgICAgIGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZSA9IHdyYXBfYXR0cmlidXRlcy5zdWJzdHIoMCwgJ2ZvcmNlJy5sZW5ndGgpID09PSAnZm9yY2UnO1xuICAgICAgICBpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2VfZXhwYW5kX211bHRpbGluZSA9ICh3cmFwX2F0dHJpYnV0ZXMgPT09ICdmb3JjZS1leHBhbmQtbXVsdGlsaW5lJyk7XG4gICAgICAgIGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZV9hbGlnbmVkID0gKHdyYXBfYXR0cmlidXRlcyA9PT0gJ2ZvcmNlLWFsaWduZWQnKTtcbiAgICAgICAgZW5kX3dpdGhfbmV3bGluZSA9IChvcHRpb25zLmVuZF93aXRoX25ld2xpbmUgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuZW5kX3dpdGhfbmV3bGluZTtcbiAgICAgICAgZXh0cmFfbGluZXJzID0gKHR5cGVvZiBvcHRpb25zLmV4dHJhX2xpbmVycyA9PT0gJ29iamVjdCcpICYmIG9wdGlvbnMuZXh0cmFfbGluZXJzID9cbiAgICAgICAgICAgIG9wdGlvbnMuZXh0cmFfbGluZXJzLmNvbmNhdCgpIDogKHR5cGVvZiBvcHRpb25zLmV4dHJhX2xpbmVycyA9PT0gJ3N0cmluZycpID9cbiAgICAgICAgICAgIG9wdGlvbnMuZXh0cmFfbGluZXJzLnNwbGl0KCcsJykgOiAnaGVhZCxib2R5LC9odG1sJy5zcGxpdCgnLCcpO1xuICAgICAgICBlb2wgPSBvcHRpb25zLmVvbCA/IG9wdGlvbnMuZW9sIDogJ2F1dG8nO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmluZGVudF93aXRoX3RhYnMpIHtcbiAgICAgICAgICAgIGluZGVudF9jaGFyYWN0ZXIgPSAnXFx0JztcbiAgICAgICAgICAgIGluZGVudF9zaXplID0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlb2wgPT09ICdhdXRvJykge1xuICAgICAgICAgICAgZW9sID0gJ1xcbic7XG4gICAgICAgICAgICBpZiAoaHRtbF9zb3VyY2UgJiYgbGluZUJyZWFrLnRlc3QoaHRtbF9zb3VyY2UgfHwgJycpKSB7XG4gICAgICAgICAgICAgICAgZW9sID0gaHRtbF9zb3VyY2UubWF0Y2gobGluZUJyZWFrKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVvbCA9IGVvbC5yZXBsYWNlKC9cXFxcci8sICdcXHInKS5yZXBsYWNlKC9cXFxcbi8sICdcXG4nKTtcblxuICAgICAgICAvLyBIQUNLOiBuZXdsaW5lIHBhcnNpbmcgaW5jb25zaXN0ZW50LiBUaGlzIGJydXRlIGZvcmNlIG5vcm1hbGl6ZXMgdGhlIGlucHV0LlxuICAgICAgICBodG1sX3NvdXJjZSA9IGh0bWxfc291cmNlLnJlcGxhY2UoYWxsTGluZUJyZWFrcywgJ1xcbicpO1xuXG4gICAgICAgIGZ1bmN0aW9uIFBhcnNlcigpIHtcblxuICAgICAgICAgICAgdGhpcy5wb3MgPSAwOyAvL1BhcnNlciBwb3NpdGlvblxuICAgICAgICAgICAgdGhpcy50b2tlbiA9ICcnO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50X21vZGUgPSAnQ09OVEVOVCc7IC8vcmVmbGVjdHMgdGhlIGN1cnJlbnQgUGFyc2VyIG1vZGU6IFRBRy9DT05URU5UXG4gICAgICAgICAgICB0aGlzLnRhZ3MgPSB7IC8vQW4gb2JqZWN0IHRvIGhvbGQgdGFncywgdGhlaXIgcG9zaXRpb24sIGFuZCB0aGVpciBwYXJlbnQtdGFncywgaW5pdGlhdGVkIHdpdGggZGVmYXVsdCB2YWx1ZXNcbiAgICAgICAgICAgICAgICBwYXJlbnQ6ICdwYXJlbnQxJyxcbiAgICAgICAgICAgICAgICBwYXJlbnRjb3VudDogMSxcbiAgICAgICAgICAgICAgICBwYXJlbnQxOiAnJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnJztcbiAgICAgICAgICAgIHRoaXMudG9rZW5fdGV4dCA9IHRoaXMubGFzdF90b2tlbiA9IHRoaXMubGFzdF90ZXh0ID0gdGhpcy50b2tlbl90eXBlID0gJyc7XG4gICAgICAgICAgICB0aGlzLm5ld2xpbmVzID0gMDtcbiAgICAgICAgICAgIHRoaXMuaW5kZW50X2NvbnRlbnQgPSBpbmRlbnRfaW5uZXJfaHRtbDtcbiAgICAgICAgICAgIHRoaXMuaW5kZW50X2JvZHlfaW5uZXJfaHRtbCA9IGluZGVudF9ib2R5X2lubmVyX2h0bWw7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9oZWFkX2lubmVyX2h0bWwgPSBpbmRlbnRfaGVhZF9pbm5lcl9odG1sO1xuXG4gICAgICAgICAgICB0aGlzLlV0aWxzID0geyAvL1VpbGl0aWVzIG1hZGUgYXZhaWxhYmxlIHRvIHRoZSB2YXJpb3VzIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIHdoaXRlc3BhY2U6IFwiXFxuXFxyXFx0IFwiLnNwbGl0KCcnKSxcblxuICAgICAgICAgICAgICAgIHNpbmdsZV90b2tlbjogb3B0aW9ucy52b2lkX2VsZW1lbnRzIHx8IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gSFRMTSB2b2lkIGVsZW1lbnRzIC0gYWthIHNlbGYtY2xvc2luZyB0YWdzIC0gYWthIHNpbmdsZXRvbnNcbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly93d3cudzMub3JnL2h0bWwvd2cvZHJhZnRzL2h0bWwvbWFzdGVyL3N5bnRheC5odG1sI3ZvaWQtZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgJ2FyZWEnLCAnYmFzZScsICdicicsICdjb2wnLCAnZW1iZWQnLCAnaHInLCAnaW1nJywgJ2lucHV0JywgJ2tleWdlbicsXG4gICAgICAgICAgICAgICAgICAgICdsaW5rJywgJ21lbnVpdGVtJywgJ21ldGEnLCAncGFyYW0nLCAnc291cmNlJywgJ3RyYWNrJywgJ3dicicsXG4gICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IE9wdGlvbmFsIHRhZ3MgLSBhcmUgbm90IHVuZGVyc3Rvb2QuXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9zeW50YXguaHRtbCNvcHRpb25hbC10YWdzXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBydWxlcyBmb3Igb3B0aW9uYWwgdGFncyBhcmUgdG9vIGNvbXBsZXggZm9yIGEgc2ltcGxlIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgLy8gQWxzbywgdGhlIGNvbnRlbnQgb2YgdGhlc2UgdGFncyBzaG91bGQgc3RpbGwgYmUgaW5kZW50ZWQgaW4gbWFueSBjYXNlcy5cbiAgICAgICAgICAgICAgICAgICAgLy8gJ2xpJyBpcyBhIGdvb2QgZXhtcGxlLlxuXG4gICAgICAgICAgICAgICAgICAgIC8vIERvY3R5cGUgYW5kIHhtbCBlbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAnIWRvY3R5cGUnLCAnP3htbCcsXG4gICAgICAgICAgICAgICAgICAgIC8vID9waHAgdGFnXG4gICAgICAgICAgICAgICAgICAgICc/cGhwJyxcbiAgICAgICAgICAgICAgICAgICAgLy8gb3RoZXIgdGFncyB0aGF0IHdlcmUgaW4gdGhpcyBsaXN0LCBrZWVwaW5nIGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgICAgICAgICAnYmFzZWZvbnQnLCAnaXNpbmRleCdcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGV4dHJhX2xpbmVyczogZXh0cmFfbGluZXJzLCAvL2ZvciB0YWdzIHRoYXQgbmVlZCBhIGxpbmUgb2Ygd2hpdGVzcGFjZSBiZWZvcmUgdGhlbVxuICAgICAgICAgICAgICAgIGluX2FycmF5OiBmdW5jdGlvbih3aGF0LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aGF0ID09PSBhcnJbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIHRleHQgaXMgY29tcG9zZWQgZW50aXJlbHkgb2Ygd2hpdGVzcGFjZS5cbiAgICAgICAgICAgIHRoaXMuaXNfd2hpdGVzcGFjZSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRleHQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLlV0aWxzLmluX2FycmF5KHRleHQuY2hhckF0KG4pLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRyYXZlcnNlX3doaXRlc3BhY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRfY2hhciA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheShpbnB1dF9jaGFyLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3bGluZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5VdGlscy5pbl9hcnJheShpbnB1dF9jaGFyLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlc2VydmVfbmV3bGluZXMgJiYgaW5wdXRfY2hhciA9PT0gJ1xcbicgJiYgdGhpcy5uZXdsaW5lcyA8PSBtYXhfcHJlc2VydmVfbmV3bGluZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld2xpbmVzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBBcHBlbmQgYSBzcGFjZSB0byB0aGUgZ2l2ZW4gY29udGVudCAoc3RyaW5nIGFycmF5KSBvciwgaWYgd2UgYXJlXG4gICAgICAgICAgICAvLyBhdCB0aGUgd3JhcF9saW5lX2xlbmd0aCwgYXBwZW5kIGEgbmV3bGluZS9pbmRlbnRhdGlvbi5cbiAgICAgICAgICAgIC8vIHJldHVybiB0cnVlIGlmIGEgbmV3bGluZSB3YXMgYWRkZWQsIGZhbHNlIGlmIGEgc3BhY2Ugd2FzIGFkZGVkXG4gICAgICAgICAgICB0aGlzLnNwYWNlX29yX3dyYXAgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGluZV9jaGFyX2NvdW50ID49IHRoaXMud3JhcF9saW5lX2xlbmd0aCkgeyAvL2luc2VydCBhIGxpbmUgd2hlbiB0aGUgd3JhcF9saW5lX2xlbmd0aCBpcyByZWFjaGVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfbmV3bGluZShmYWxzZSwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfaW5kZW50YXRpb24oY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCgnICcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfY29udGVudCA9IGZ1bmN0aW9uKCkgeyAvL2Z1bmN0aW9uIHRvIGNhcHR1cmUgcmVndWxhciBjb250ZW50IGJldHdlZW4gdGFnc1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dF9jaGFyID0gJycsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlYmFyc1N0YXJ0ZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKSAhPT0gJzwnIHx8IGhhbmRsZWJhcnNTdGFydGVkID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoID8gY29udGVudC5qb2luKCcnKSA6IFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZWJhcnNTdGFydGVkIDwgMiAmJiB0aGlzLnRyYXZlcnNlX3doaXRlc3BhY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zcGFjZV9vcl93cmFwKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRlbnRfaGFuZGxlYmFycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZWJhcnNTdGFydGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZWJhcnNTdGFydGVkIDwgMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZWJhcnNTdGFydGVkID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09ICd9JyAmJiBoYW5kbGViYXJzU3RhcnRlZCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlYmFyc1N0YXJ0ZWQtLSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGViYXJzIHBhcnNpbmcgaXMgY29tcGxpY2F0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB7eyNmb299fSBhbmQge3svZm9vfX0gYXJlIGZvcm1hdHRlZCB0YWdzLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ge3tzb21ldGhpbmd9fSBzaG91bGQgZ2V0IHRyZWF0ZWQgYXMgY29udGVudCwgZXhjZXB0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ge3tlbHNlfX0gc3BlY2lmaWNhbGx5IGJlaGF2ZXMgbGlrZSB7eyNpZn19IGFuZCB7ey9pZn19XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGVlazMgPSB0aGlzLmlucHV0LnN1YnN0cih0aGlzLnBvcywgMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVlazMgPT09ICd7eyMnIHx8IHBlZWszID09PSAne3svJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIGFyZSB0YWdzIGFuZCBub3QgY29udGVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGVlazMgPT09ICd7eyEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmdldF90YWcoKSwgJ1RLX1RBR19IQU5ETEVCQVJTX0NPTU1FTlQnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5zdWJzdHIodGhpcy5wb3MsIDIpID09PSAne3snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0X3RhZyh0cnVlKSA9PT0gJ3t7ZWxzZX19Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goaW5wdXRfY2hhcik7IC8vbGV0dGVyIGF0LWEtdGltZSAob3Igc3RyaW5nKSBpbnNlcnRlZCB0byBhbiBhcnJheVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudC5sZW5ndGggPyBjb250ZW50LmpvaW4oJycpIDogJyc7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF9jb250ZW50c190byA9IGZ1bmN0aW9uKG5hbWUpIHsgLy9nZXQgdGhlIGZ1bGwgY29udGVudCBvZiBhIHNjcmlwdCBvciBzdHlsZSB0byBwYXNzIHRvIGpzX2JlYXV0aWZ5XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucG9zID09PSB0aGlzLmlucHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWycnLCAnVEtfRU9GJ107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ19tYXRjaCA9IG5ldyBSZWdFeHAoJzwvJyArIG5hbWUgKyAnXFxcXHMqPicsICdpZ20nKTtcbiAgICAgICAgICAgICAgICByZWdfbWF0Y2gubGFzdEluZGV4ID0gdGhpcy5wb3M7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ19hcnJheSA9IHJlZ19tYXRjaC5leGVjKHRoaXMuaW5wdXQpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRfc2NyaXB0ID0gcmVnX2FycmF5ID8gcmVnX2FycmF5LmluZGV4IDogdGhpcy5pbnB1dC5sZW5ndGg7IC8vYWJzb2x1dGUgZW5kIG9mIHNjcmlwdFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBvcyA8IGVuZF9zY3JpcHQpIHsgLy9nZXQgZXZlcnl0aGluZyBpbiBiZXR3ZWVuIHRoZSBzY3JpcHQgdGFnc1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gdGhpcy5pbnB1dC5zdWJzdHJpbmcodGhpcy5wb3MsIGVuZF9zY3JpcHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IGVuZF9zY3JpcHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5yZWNvcmRfdGFnID0gZnVuY3Rpb24odGFnKSB7IC8vZnVuY3Rpb24gdG8gcmVjb3JkIGEgdGFnIGFuZCBpdHMgcGFyZW50IGluIHRoaXMudGFncyBPYmplY3RcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50YWdzW3RhZyArICdjb3VudCddKSB7IC8vY2hlY2sgZm9yIHRoZSBleGlzdGVuY2Ugb2YgdGhpcyB0YWcgdHlwZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10rKztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV0gPSB0aGlzLmluZGVudF9sZXZlbDsgLy9hbmQgcmVjb3JkIHRoZSBwcmVzZW50IGluZGVudCBsZXZlbFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vb3RoZXJ3aXNlIGluaXRpYWxpemUgdGhpcyB0YWcgdHlwZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10gPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddXSA9IHRoaXMuaW5kZW50X2xldmVsOyAvL2FuZCByZWNvcmQgdGhlIHByZXNlbnQgaW5kZW50IGxldmVsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10gKyAncGFyZW50J10gPSB0aGlzLnRhZ3MucGFyZW50OyAvL3NldCB0aGUgcGFyZW50IChpLmUuIGluIHRoZSBjYXNlIG9mIGEgZGl2IHRoaXMudGFncy5kaXYxcGFyZW50KVxuICAgICAgICAgICAgICAgIHRoaXMudGFncy5wYXJlbnQgPSB0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J107IC8vYW5kIG1ha2UgdGhpcyB0aGUgY3VycmVudCBwYXJlbnQgKGkuZS4gaW4gdGhlIGNhc2Ugb2YgYSBkaXYgJ2RpdjEnKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5yZXRyaWV2ZV90YWcgPSBmdW5jdGlvbih0YWcpIHsgLy9mdW5jdGlvbiB0byByZXRyaWV2ZSB0aGUgb3BlbmluZyB0YWcgdG8gdGhlIGNvcnJlc3BvbmRpbmcgY2xvc2VyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSkgeyAvL2lmIHRoZSBvcGVuZW5lciBpcyBub3QgaW4gdGhlIE9iamVjdCB3ZSBpZ25vcmUgaXRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzLnBhcmVudDsgLy9jaGVjayB0byBzZWUgaWYgaXQncyBhIGNsb3NhYmxlIHRhZy5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRlbXBfcGFyZW50KSB7IC8vdGlsbCB3ZSByZWFjaCAnJyAodGhlIGluaXRpYWwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSA9PT0gdGVtcF9wYXJlbnQpIHsgLy9pZiB0aGlzIGlzIGl0IHVzZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcF9wYXJlbnQgPSB0aGlzLnRhZ3NbdGVtcF9wYXJlbnQgKyAncGFyZW50J107IC8vb3RoZXJ3aXNlIGtlZXAgb24gY2xpbWJpbmcgdXAgdGhlIERPTSBUcmVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBfcGFyZW50KSB7IC8vaWYgd2UgY2F1Z2h0IHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwgPSB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddXTsgLy9zZXQgdGhlIGluZGVudF9sZXZlbCBhY2NvcmRpbmdseVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzLnBhcmVudCA9IHRoaXMudGFnc1t0ZW1wX3BhcmVudCArICdwYXJlbnQnXTsgLy9hbmQgc2V0IHRoZSBjdXJyZW50IHBhcmVudFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddICsgJ3BhcmVudCddOyAvL2RlbGV0ZSB0aGUgY2xvc2VkIHRhZ3MgcGFyZW50IHJlZmVyZW5jZS4uLlxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV07IC8vLi4uYW5kIHRoZSB0YWcgaXRzZWxmXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J107XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10tLTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuaW5kZW50X3RvX3RhZyA9IGZ1bmN0aW9uKHRhZykge1xuICAgICAgICAgICAgICAgIC8vIE1hdGNoIHRoZSBpbmRlbnRhdGlvbiBsZXZlbCB0byB0aGUgbGFzdCB1c2Ugb2YgdGhpcyB0YWcsIGJ1dCBkb24ndCByZW1vdmUgaXQuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdGVtcF9wYXJlbnQgPSB0aGlzLnRhZ3MucGFyZW50O1xuICAgICAgICAgICAgICAgIHdoaWxlICh0ZW1wX3BhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddID09PSB0ZW1wX3BhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGVtcF9wYXJlbnQgPSB0aGlzLnRhZ3NbdGVtcF9wYXJlbnQgKyAncGFyZW50J107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ZW1wX3BhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9sZXZlbCA9IHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J11dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X3RhZyA9IGZ1bmN0aW9uKHBlZWspIHsgLy9mdW5jdGlvbiB0byBnZXQgYSBmdWxsIHRhZyBhbmQgcGFyc2UgaXRzIHR5cGVcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRfY2hhciA9ICcnLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfYXR0ciA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGhhc193cmFwcGVkX2F0dHJzID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCwgdGFnX2VuZCxcbiAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0X2NoYXIsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdfcG9zID0gdGhpcy5wb3MsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdfbGluZV9jaGFyX2NvdW50ID0gdGhpcy5saW5lX2NoYXJfY291bnQsXG4gICAgICAgICAgICAgICAgICAgIGlzX3RhZ19jbG9zZWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdGFpbDtcblxuICAgICAgICAgICAgICAgIHBlZWsgPSBwZWVrICE9PSB1bmRlZmluZWQgPyBwZWVrIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IG9yaWdfcG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gb3JpZ19saW5lX2NoYXJfY291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudC5sZW5ndGggPyBjb250ZW50LmpvaW4oJycpIDogWycnLCAnVEtfRU9GJ107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLlV0aWxzLmluX2FycmF5KGlucHV0X2NoYXIsIHRoaXMuVXRpbHMud2hpdGVzcGFjZSkpIHsgLy9kb24ndCB3YW50IHRvIGluc2VydCB1bm5lY2Vzc2FyeSBzcGFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfY2hhciA9PT0gXCInXCIgfHwgaW5wdXRfY2hhciA9PT0gJ1wiJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciArPSB0aGlzLmdldF91bmZvcm1hdHRlZChpbnB1dF9jaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnPScpIHsgLy9ubyBzcGFjZSBiZWZvcmUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0YWlsID0gdGhpcy5pbnB1dC5zdWJzdHIodGhpcy5wb3MgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZV9leHBhbmRfbXVsdGlsaW5lICYmIGhhc193cmFwcGVkX2F0dHJzICYmICFpc190YWdfY2xvc2VkICYmIChpbnB1dF9jaGFyID09PSAnPicgfHwgaW5wdXRfY2hhciA9PT0gJy8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhaWwubWF0Y2goL15cXC8/XFxzKj4vKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNfdGFnX2Nsb3NlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lKGZhbHNlLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICc9JyAmJiBpbnB1dF9jaGFyICE9PSAnPicgJiYgc3BhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbm8gc3BhY2UgYWZ0ZXIgPSBvciBiZWZvcmUgPlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdyYXBwZWQgPSB0aGlzLnNwYWNlX29yX3dyYXAoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZW50QXR0cnMgPSB3cmFwcGVkICYmIGlucHV0X2NoYXIgIT09ICcvJyAmJiAhaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZSAmJiBpbnB1dF9jaGFyICE9PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm9yY2VfZmlyc3RfYXR0cl93cmFwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZV9leHBhbmRfbXVsdGlsaW5lICYmIGZpcnN0X2F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzX29ubHlfYXR0cmlidXRlID0gdGFpbC5tYXRjaCgvXlxcUyooPVwiKFteXCJdfFxcXFxcIikqXCIpP1xccypcXC8/XFxzKj4vKSAhPT0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VfZmlyc3RfYXR0cl93cmFwID0gIWlzX29ubHlfYXR0cmlidXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0X2F0dHIgfHwgZm9yY2VfZmlyc3RfYXR0cl93cmFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfbmV3bGluZShmYWxzZSwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfaW5kZW50YXRpb24oY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudEF0dHJzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50QXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNfd3JhcHBlZF9hdHRycyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2luZGVudCBhdHRyaWJ1dGVzIGFuIGF1dG8sIGZvcmNlZCwgb3IgZm9yY2VkLWFsaWduIGxpbmUtd3JhcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbGlnbm1lbnRfc2l6ZSA9IHdyYXBfYXR0cmlidXRlc19pbmRlbnRfc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlX2FsaWduZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25tZW50X3NpemUgPSBjb250ZW50LmluZGV4T2YoJyAnKSArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgY291bnQgPSAwOyBjb3VudCA8IGFsaWdubWVudF9zaXplOyBjb3VudCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgZXZlciBmdXJ0aGVyIGluZGVudCB3aXRoIHNwYWNlcyBzaW5jZSB3ZSdyZSB0cnlpbmcgdG8gYWxpZ24gY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RfYXR0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudFtpXSA9PT0gJyAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdF9hdHRyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRlbnRfaGFuZGxlYmFycyAmJiB0YWdfc3RhcnRfY2hhciA9PT0gJzwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIGluc2lkZSBhbiBhbmdsZS1icmFja2V0IHRhZywgcHV0IHNwYWNlcyBhcm91bmRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZWJhcnMgbm90IGluc2lkZSBvZiBzdHJpbmdzLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChpbnB1dF9jaGFyICsgdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpKSA9PT0gJ3t7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgKz0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoJ319Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQubGVuZ3RoICYmIGNvbnRlbnRbY29udGVudC5sZW5ndGggLSAxXSAhPT0gJyAnICYmIGNvbnRlbnRbY29udGVudC5sZW5ndGggLSAxXSAhPT0gJzwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgPSAnICcgKyBpbnB1dF9jaGFyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfY2hhciA9PT0gJzwnICYmICF0YWdfc3RhcnRfY2hhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0ID0gdGhpcy5wb3MgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0X2NoYXIgPSAnPCc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgIXRhZ19zdGFydF9jaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudC5sZW5ndGggPj0gMiAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gPT09ICd7JyAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMl0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnIycgfHwgaW5wdXRfY2hhciA9PT0gJy8nIHx8IGlucHV0X2NoYXIgPT09ICchJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdfc3RhcnQgPSB0aGlzLnBvcyAtIDM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0ID0gdGhpcy5wb3MgLSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdfc3RhcnRfY2hhciA9ICd7JztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaChpbnB1dF9jaGFyKTsgLy9pbnNlcnRzIGNoYXJhY3RlciBhdC1hLXRpbWUgKG9yIHN0cmluZylcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudFsxXSAmJiAoY29udGVudFsxXSA9PT0gJyEnIHx8IGNvbnRlbnRbMV0gPT09ICc/JyB8fCBjb250ZW50WzFdID09PSAnJScpKSB7IC8vaWYgd2UncmUgaW4gYSBjb21tZW50LCBkbyBzb21ldGhpbmcgc3BlY2lhbFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgdHJlYXQgYWxsIGNvbW1lbnRzIGFzIGxpdGVyYWxzLCBldmVuIG1vcmUgdGhhbiBwcmVmb3JtYXR0ZWQgdGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UganVzdCBsb29rIGZvciB0aGUgYXBwcm9wcmlhdGUgY2xvc2UgdGFnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gW3RoaXMuZ2V0X2NvbW1lbnQodGFnX3N0YXJ0KV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRlbnRfaGFuZGxlYmFycyAmJiBjb250ZW50WzFdICYmIGNvbnRlbnRbMV0gPT09ICd7JyAmJiBjb250ZW50WzJdICYmIGNvbnRlbnRbMl0gPT09ICchJykgeyAvL2lmIHdlJ3JlIGluIGEgY29tbWVudCwgZG8gc29tZXRoaW5nIHNwZWNpYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHRyZWF0IGFsbCBjb21tZW50cyBhcyBsaXRlcmFscywgZXZlbiBtb3JlIHRoYW4gcHJlZm9ybWF0dGVkIHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGp1c3QgbG9vayBmb3IgdGhlIGFwcHJvcHJpYXRlIGNsb3NlIHRhZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFt0aGlzLmdldF9jb21tZW50KHRhZ19zdGFydCldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX3N0YXJ0X2NoYXIgPT09ICd7JyAmJiBjb250ZW50Lmxlbmd0aCA+IDIgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDJdID09PSAnfScgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoaW5wdXRfY2hhciAhPT0gJz4nKTtcblxuICAgICAgICAgICAgICAgIHZhciB0YWdfY29tcGxldGUgPSBjb250ZW50LmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIHZhciB0YWdfaW5kZXg7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ19vZmZzZXQ7XG5cbiAgICAgICAgICAgICAgICAvLyBtdXN0IGNoZWNrIGZvciBzcGFjZSBmaXJzdCBvdGhlcndpc2UgdGhlIHRhZyBjb3VsZCBoYXZlIHRoZSBmaXJzdCBhdHRyaWJ1dGUgaW5jbHVkZWQsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHRoZW4gbm90IHVuLWluZGVudCBjb3JyZWN0bHlcbiAgICAgICAgICAgICAgICBpZiAodGFnX2NvbXBsZXRlLmluZGV4T2YoJyAnKSAhPT0gLTEpIHsgLy9pZiB0aGVyZSdzIHdoaXRlc3BhY2UsIHRoYXRzIHdoZXJlIHRoZSB0YWcgbmFtZSBlbmRzXG4gICAgICAgICAgICAgICAgICAgIHRhZ19pbmRleCA9IHRhZ19jb21wbGV0ZS5pbmRleE9mKCcgJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY29tcGxldGUuaW5kZXhPZignXFxuJykgIT09IC0xKSB7IC8vaWYgdGhlcmUncyBhIGxpbmUgYnJlYWssIHRoYXRzIHdoZXJlIHRoZSB0YWcgbmFtZSBlbmRzXG4gICAgICAgICAgICAgICAgICAgIHRhZ19pbmRleCA9IHRhZ19jb21wbGV0ZS5pbmRleE9mKCdcXG4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ19jb21wbGV0ZS5jaGFyQXQoMCkgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICB0YWdfaW5kZXggPSB0YWdfY29tcGxldGUuaW5kZXhPZignfScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vb3RoZXJ3aXNlIGdvIHdpdGggdGhlIHRhZyBlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgdGFnX2luZGV4ID0gdGFnX2NvbXBsZXRlLmluZGV4T2YoJz4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jb21wbGV0ZS5jaGFyQXQoMCkgPT09ICc8JyB8fCAhaW5kZW50X2hhbmRsZWJhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnX29mZnNldCA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnX29mZnNldCA9IHRhZ19jb21wbGV0ZS5jaGFyQXQoMikgPT09ICcjJyA/IDMgOiAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdGFnX2NoZWNrID0gdGFnX2NvbXBsZXRlLnN1YnN0cmluZyh0YWdfb2Zmc2V0LCB0YWdfaW5kZXgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jb21wbGV0ZS5jaGFyQXQodGFnX2NvbXBsZXRlLmxlbmd0aCAtIDIpID09PSAnLycgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2ssIHRoaXMuVXRpbHMuc2luZ2xlX3Rva2VuKSkgeyAvL2lmIHRoaXMgdGFnIG5hbWUgaXMgYSBzaW5nbGUgdGFnIHR5cGUgKGVpdGhlciBpbiB0aGUgbGlzdCBvciBoYXMgYSBjbG9zaW5nIC8pXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICdTSU5HTEUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRlbnRfaGFuZGxlYmFycyAmJiB0YWdfY29tcGxldGUuY2hhckF0KDApID09PSAneycgJiYgdGFnX2NoZWNrID09PSAnZWxzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF90b190YWcoJ2lmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ0hBTkRMRUJBUlNfRUxTRSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9jb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhdmVyc2Vfd2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzX3VuZm9ybWF0dGVkKHRhZ19jaGVjaywgdW5mb3JtYXR0ZWQpIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNfdW5mb3JtYXR0ZWQodGFnX2NoZWNrLCBjb250ZW50X3VuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3QgcmVmb3JtYXQgdGhlIFwidW5mb3JtYXR0ZWRcIiBvciBcImNvbnRlbnRfdW5mb3JtYXR0ZWRcIiB0YWdzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSB0aGlzLmdldF91bmZvcm1hdHRlZCgnPC8nICsgdGFnX2NoZWNrICsgJz4nLCB0YWdfY29tcGxldGUpOyAvLy4uLmRlbGVnYXRlIHRvIGdldF91bmZvcm1hdHRlZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goY29tbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHRhZ19lbmQgPSB0aGlzLnBvcyAtIDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0lOR0xFJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ19jaGVjayA9PT0gJ3NjcmlwdCcgJiZcbiAgICAgICAgICAgICAgICAgICAgKHRhZ19jb21wbGV0ZS5zZWFyY2goJ3R5cGUnKSA9PT0gLTEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0YWdfY29tcGxldGUuc2VhcmNoKCd0eXBlJykgPiAtMSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19jb21wbGV0ZS5zZWFyY2goL1xcYih0ZXh0fGFwcGxpY2F0aW9ufGRvam8pXFwvKHgtKT8oamF2YXNjcmlwdHxlY21hc2NyaXB0fGpzY3JpcHR8bGl2ZXNjcmlwdHwobGRcXCspP2pzb258bWV0aG9kfGFzcGVjdCkvKSA+IC0xKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZF90YWcodGFnX2NoZWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0NSSVBUJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnX2NoZWNrID09PSAnc3R5bGUnICYmXG4gICAgICAgICAgICAgICAgICAgICh0YWdfY29tcGxldGUuc2VhcmNoKCd0eXBlJykgPT09IC0xIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAodGFnX2NvbXBsZXRlLnNlYXJjaCgndHlwZScpID4gLTEgJiYgdGFnX2NvbXBsZXRlLnNlYXJjaCgndGV4dC9jc3MnKSA+IC0xKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZF90YWcodGFnX2NoZWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU1RZTEUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY2hlY2suY2hhckF0KDApID09PSAnIScpIHsgLy9wZWVrIGZvciA8ISBjb21tZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBjb21tZW50cyBjb250ZW50IGlzIGFscmVhZHkgY29ycmVjdC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NJTkdMRSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYXZlcnNlX3doaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ19jaGVjay5jaGFyQXQoMCkgPT09ICcvJykgeyAvL3RoaXMgdGFnIGlzIGEgZG91YmxlIHRhZyBzbyBjaGVjayBmb3IgdGFnLWVuZGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXRyaWV2ZV90YWcodGFnX2NoZWNrLnN1YnN0cmluZygxKSk7IC8vcmVtb3ZlIGl0IGFuZCBhbGwgYW5jZXN0b3JzXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ0VORCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vb3RoZXJ3aXNlIGl0J3MgYSBzdGFydC10YWdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb3JkX3RhZyh0YWdfY2hlY2spOyAvL3B1c2ggaXQgb24gdGhlIHRhZyBzdGFja1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ19jaGVjay50b0xvd2VyQ2FzZSgpICE9PSAnaHRtbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9jb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU1RBUlQnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQWxsb3cgcHJlc2VydmluZyBvZiBuZXdsaW5lcyBhZnRlciBhIHN0YXJ0IG9yIGVuZCB0YWdcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhdmVyc2Vfd2hpdGVzcGFjZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwYWNlX29yX3dyYXAoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2ssIHRoaXMuVXRpbHMuZXh0cmFfbGluZXJzKSkgeyAvL2NoZWNrIGlmIHRoaXMgZG91YmxlIG5lZWRzIGFuIGV4dHJhIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfbmV3bGluZShmYWxzZSwgdGhpcy5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCAmJiB0aGlzLm91dHB1dFt0aGlzLm91dHB1dC5sZW5ndGggLSAyXSAhPT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUodHJ1ZSwgdGhpcy5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBvcmlnX3BvcztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQgPSBvcmlnX2xpbmVfY2hhcl9jb3VudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudC5qb2luKCcnKTsgLy9yZXR1cm5zIGZ1bGx5IGZvcm1hdHRlZCB0YWdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2NvbW1lbnQgPSBmdW5jdGlvbihzdGFydF9wb3MpIHsgLy9mdW5jdGlvbiB0byByZXR1cm4gY29tbWVudCBjb250ZW50IGluIGl0cyBlbnRpcmV0eVxuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgd2lsbCBoYXZlIHZlcnkgcG9vciBwZXJmLCBidXQgd2lsbCB3b3JrIGZvciBub3cuXG4gICAgICAgICAgICAgICAgdmFyIGNvbW1lbnQgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJz4nLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IHN0YXJ0X3BvcztcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMucG9zIDw9IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gaW5wdXRfY2hhcjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IG5lZWQgdG8gY2hlY2sgZm9yIHRoZSBkZWxpbWl0ZXIgaWYgdGhlIGxhc3QgY2hhcnMgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQuY2hhckF0KGNvbW1lbnQubGVuZ3RoIC0gMSkgPT09IGRlbGltaXRlci5jaGFyQXQoZGVsaW1pdGVyLmxlbmd0aCAtIDEpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50LmluZGV4T2YoZGVsaW1pdGVyKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSBuZWVkIHRvIHNlYXJjaCBmb3IgY3VzdG9tIGRlbGltaXRlciBmb3IgdGhlIGZpcnN0IGZldyBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWF0Y2hlZCAmJiBjb21tZW50Lmxlbmd0aCA8IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWVudC5pbmRleE9mKCc8IVtpZicpID09PSAwKSB7IC8vcGVlayBmb3IgPCFbaWYgY29uZGl0aW9uYWwgY29tbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICc8IVtlbmRpZl0+JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWVudC5pbmRleE9mKCc8IVtjZGF0YVsnKSA9PT0gMCkgeyAvL2lmIGl0J3MgYSA8W2NkYXRhWyBjb21tZW50Li4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJ11dPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZignPCFbJykgPT09IDApIHsgLy8gc29tZSBvdGhlciAhWyBjb21tZW50PyAuLi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnXT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJzwhLS0nKSA9PT0gMCkgeyAvLyA8IS0tIGNvbW1lbnQgLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJy0tPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZigne3shLS0nKSA9PT0gMCkgeyAvLyB7eyEtLSBoYW5kbGViYXJzIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnLS19fSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZigne3shJykgPT09IDApIHsgLy8ge3shIGhhbmRsZWJhcnMgY29tbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21tZW50Lmxlbmd0aCA9PT0gNSAmJiBjb21tZW50LmluZGV4T2YoJ3t7IS0tJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICd9fSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWVudC5pbmRleE9mKCc8PycpID09PSAwKSB7IC8vIHt7ISBoYW5kbGViYXJzIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnPz4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJzwlJykgPT09IDApIHsgLy8ge3shIGhhbmRsZWJhcnMgY29tbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICclPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb21tZW50O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdG9rZW5NYXRjaGVyKGRlbGltaXRlcikge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9ICcnO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFkZCA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3VG9rZW4gPSB0b2tlbiArIHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IG5ld1Rva2VuLmxlbmd0aCA8PSBkZWxpbWl0ZXIubGVuZ3RoID8gbmV3VG9rZW4gOiBuZXdUb2tlbi5zdWJzdHIobmV3VG9rZW4ubGVuZ3RoIC0gZGVsaW1pdGVyLmxlbmd0aCwgZGVsaW1pdGVyLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBkb2VzTm90TWF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLmluZGV4T2YoZGVsaW1pdGVyKSA9PT0gLTE7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGFkZDogYWRkLFxuICAgICAgICAgICAgICAgICAgICBkb2VzTm90TWF0Y2g6IGRvZXNOb3RNYXRjaFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X3VuZm9ybWF0dGVkID0gZnVuY3Rpb24oZGVsaW1pdGVyLCBvcmlnX3RhZykgeyAvL2Z1bmN0aW9uIHRvIHJldHVybiB1bmZvcm1hdHRlZCBjb250ZW50IGluIGl0cyBlbnRpcmV0eVxuICAgICAgICAgICAgICAgIGlmIChvcmlnX3RhZyAmJiBvcmlnX3RhZy50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZGVsaW1pdGVyKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRfY2hhciA9ICcnO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHZhciBkZWxpbWl0ZXJNYXRjaGVyID0gdG9rZW5NYXRjaGVyKGRlbGltaXRlcik7XG5cbiAgICAgICAgICAgICAgICBkbyB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgPSB0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuVXRpbHMuaW5fYXJyYXkoaW5wdXRfY2hhciwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzcGFjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50LS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfY2hhciA9PT0gJ1xcbicgfHwgaW5wdXRfY2hhciA9PT0gJ1xccicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICBEb24ndCBjaGFuZ2UgdGFiIGluZGVudGlvbiBmb3IgdW5mb3JtYXR0ZWQgYmxvY2tzLiAgSWYgdXNpbmcgY29kZSBmb3IgaHRtbCBlZGl0aW5nLCB0aGlzIHdpbGwgZ3JlYXRseSBhZmZlY3QgPHByZT4gdGFncyBpZiB0aGV5IGFyZSBzcGVjaWZpZWQgaW4gdGhlICd1bmZvcm1hdHRlZCBhcnJheSdcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5pbmRlbnRfbGV2ZWw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgY29udGVudCArPSB0aGlzLmluZGVudF9zdHJpbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2U7IC8vLi4uYW5kIG1ha2Ugc3VyZSBvdGhlciBpbmRlbnRhdGlvbiBpcyBlcmFzZWRcbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ICs9IGlucHV0X2NoYXI7XG4gICAgICAgICAgICAgICAgICAgIGRlbGltaXRlck1hdGNoZXIuYWRkKGlucHV0X2NoYXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudF9oYW5kbGViYXJzICYmIGlucHV0X2NoYXIgPT09ICd7JyAmJiBjb250ZW50Lmxlbmd0aCAmJiBjb250ZW50LmNoYXJBdChjb250ZW50Lmxlbmd0aCAtIDIpID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZWJhcnMgZXhwcmVzc2lvbnMgaW4gc3RyaW5ncyBzaG91bGQgYWxzbyBiZSB1bmZvcm1hdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgKz0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoJ319Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBjb25zaWRlciB3aGVuIHN0b3BwaW5nIGZvciBkZWxpbWl0ZXJzLlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoZGVsaW1pdGVyTWF0Y2hlci5kb2VzTm90TWF0Y2goKSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X3Rva2VuID0gZnVuY3Rpb24oKSB7IC8vaW5pdGlhbCBoYW5kbGVyIGZvciB0b2tlbi1yZXRyaWV2YWxcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW47XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0X3Rva2VuID09PSAnVEtfVEFHX1NDUklQVCcgfHwgdGhpcy5sYXN0X3Rva2VuID09PSAnVEtfVEFHX1NUWUxFJykgeyAvL2NoZWNrIGlmIHdlIG5lZWQgdG8gZm9ybWF0IGphdmFzY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSB0aGlzLmxhc3RfdG9rZW4uc3Vic3RyKDcpO1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRoaXMuZ2V0X2NvbnRlbnRzX3RvKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbdG9rZW4sICdUS18nICsgdHlwZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRfbW9kZSA9PT0gJ0NPTlRFTlQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy5nZXRfY29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt0b2tlbiwgJ1RLX0NPTlRFTlQnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRfbW9kZSA9PT0gJ1RBRycpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmdldF90YWcoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWdfbmFtZV90eXBlID0gJ1RLX1RBR18nICsgdGhpcy50YWdfdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdG9rZW4sIHRhZ19uYW1lX3R5cGVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfZnVsbF9pbmRlbnQgPSBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICAgICAgICAgIGxldmVsID0gdGhpcy5pbmRlbnRfbGV2ZWwgKyBsZXZlbCB8fCAwO1xuICAgICAgICAgICAgICAgIGlmIChsZXZlbCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBBcnJheShsZXZlbCArIDEpLmpvaW4odGhpcy5pbmRlbnRfc3RyaW5nKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuaXNfdW5mb3JtYXR0ZWQgPSBmdW5jdGlvbih0YWdfY2hlY2ssIHVuZm9ybWF0dGVkKSB7XG4gICAgICAgICAgICAgICAgLy9pcyB0aGlzIGFuIEhUTUw1IGJsb2NrLWxldmVsIGxpbms/XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLlV0aWxzLmluX2FycmF5KHRhZ19jaGVjaywgdW5mb3JtYXR0ZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGFnX2NoZWNrLnRvTG93ZXJDYXNlKCkgIT09ICdhJyB8fCAhdGhpcy5VdGlscy5pbl9hcnJheSgnYScsIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL2F0IHRoaXMgcG9pbnQgd2UgaGF2ZSBhbiAgdGFnOyBpcyBpdHMgZmlyc3QgY2hpbGQgc29tZXRoaW5nIHdlIHdhbnQgdG8gcmVtYWluXG4gICAgICAgICAgICAgICAgLy91bmZvcm1hdHRlZD9cbiAgICAgICAgICAgICAgICB2YXIgbmV4dF90YWcgPSB0aGlzLmdldF90YWcodHJ1ZSAvKiBwZWVrLiAqLyApO1xuXG4gICAgICAgICAgICAgICAgLy8gdGVzdCBuZXh0X3RhZyB0byBzZWUgaWYgaXQgaXMganVzdCBodG1sIHRhZyAobm8gZXh0ZXJuYWwgY29udGVudClcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gKG5leHRfdGFnIHx8IFwiXCIpLm1hdGNoKC9eXFxzKjxcXHMqXFwvPyhbYS16XSopXFxzKltePl0qPlxccyokLyk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBuZXh0X3RhZyBjb21lcyBiYWNrIGJ1dCBpcyBub3QgYW4gaXNvbGF0ZWQgdGFnLCB0aGVuXG4gICAgICAgICAgICAgICAgLy8gbGV0J3MgdHJlYXQgdGhlICdhJyB0YWcgYXMgaGF2aW5nIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBhbmQgcmVzcGVjdCB0aGUgdW5mb3JtYXR0ZWQgb3B0aW9uXG4gICAgICAgICAgICAgICAgaWYgKCF0YWcgfHwgdGhpcy5VdGlscy5pbl9hcnJheSh0YWdbMV0sIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wcmludGVyID0gZnVuY3Rpb24oanNfc291cmNlLCBpbmRlbnRfY2hhcmFjdGVyLCBpbmRlbnRfc2l6ZSwgd3JhcF9saW5lX2xlbmd0aCwgYnJhY2Vfc3R5bGUpIHsgLy9oYW5kbGVzIGlucHV0L291dHB1dCBhbmQgc29tZSBvdGhlciBwcmludGluZyBmdW5jdGlvbnNcblxuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXQgPSBqc19zb3VyY2UgfHwgJyc7IC8vZ2V0cyB0aGUgaW5wdXQgZm9yIHRoZSBQYXJzZXJcblxuICAgICAgICAgICAgICAgIC8vIEhBQ0s6IG5ld2xpbmUgcGFyc2luZyBpbmNvbnNpc3RlbnQuIFRoaXMgYnJ1dGUgZm9yY2Ugbm9ybWFsaXplcyB0aGUgaW5wdXQuXG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuaW5wdXQucmVwbGFjZSgvXFxyXFxufFtcXHJcXHUyMDI4XFx1MjAyOV0vZywgJ1xcbicpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9jaGFyYWN0ZXIgPSBpbmRlbnRfY2hhcmFjdGVyO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X3N0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X3NpemUgPSBpbmRlbnRfc2l6ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmJyYWNlX3N0eWxlID0gYnJhY2Vfc3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcF9saW5lX2xlbmd0aCA9IHdyYXBfbGluZV9sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQgPSAwOyAvL2NvdW50IHRvIHNlZSBpZiB3cmFwX2xpbmVfbGVuZ3RoIHdhcyBleGNlZWRlZFxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluZGVudF9zaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfc3RyaW5nICs9IHRoaXMuaW5kZW50X2NoYXJhY3RlcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUgPSBmdW5jdGlvbihmb3JjZSwgYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZm9yY2UgfHwgKGFyclthcnIubGVuZ3RoIC0gMV0gIT09ICdcXG4nKSkgeyAvL3dlIG1pZ2h0IHdhbnQgdGhlIGV4dHJhIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYXJyW2Fyci5sZW5ndGggLSAxXSAhPT0gJ1xcbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyW2Fyci5sZW5ndGggLSAxXSA9IHJ0cmltKGFyclthcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfaW5kZW50YXRpb24gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluZGVudF9sZXZlbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIucHVzaCh0aGlzLmluZGVudF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQgKz0gdGhpcy5pbmRlbnRfc3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X3Rva2VuID0gZnVuY3Rpb24odGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBwcmludGluZyBpbml0aWFsIHdoaXRlc3BhY2UuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzX3doaXRlc3BhY2UodGV4dCkgJiYgIXRoaXMub3V0cHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0IHx8IHRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vdXRwdXQubGVuZ3RoICYmIHRoaXMub3V0cHV0W3RoaXMub3V0cHV0Lmxlbmd0aCAtIDFdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfaW5kZW50YXRpb24odGhpcy5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBsdHJpbSh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X3Rva2VuX3Jhdyh0ZXh0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludF90b2tlbl9yYXcgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGFyZSBnb2luZyB0byBwcmludCBuZXdsaW5lcywgdHJ1bmNhdGUgdHJhaWxpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hpdGVzcGFjZSwgYXMgdGhlIG5ld2xpbmVzIHdpbGwgcmVwcmVzZW50IHRoZSBzcGFjZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV3bGluZXMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gcnRyaW0odGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGV4dCAmJiB0ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMSAmJiB0ZXh0LmNoYXJBdCh0ZXh0Lmxlbmd0aCAtIDEpID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVuZm9ybWF0dGVkIHRhZ3MgY2FuIGdyYWIgbmV3bGluZXMgYXMgdGhlaXIgbGFzdCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5wdXNoKHRleHQuc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdGhpcy5uZXdsaW5lczsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUobiA+IDAsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld2xpbmVzID0gMDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5pbmRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwrKztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy51bmluZGVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbmRlbnRfbGV2ZWwgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9sZXZlbC0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qX19fX19fX19fX19fX19fX19fX19fLS0tLS0tLS0tLS0tLS0tLS0tLS1fX19fX19fX19fX19fX19fX19fX18qL1xuXG4gICAgICAgIG11bHRpX3BhcnNlciA9IG5ldyBQYXJzZXIoKTsgLy93cmFwcGluZyBmdW5jdGlvbnMgUGFyc2VyXG4gICAgICAgIG11bHRpX3BhcnNlci5wcmludGVyKGh0bWxfc291cmNlLCBpbmRlbnRfY2hhcmFjdGVyLCBpbmRlbnRfc2l6ZSwgd3JhcF9saW5lX2xlbmd0aCwgYnJhY2Vfc3R5bGUpOyAvL2luaXRpYWxpemUgc3RhcnRpbmcgdmFsdWVzXG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciB0ID0gbXVsdGlfcGFyc2VyLmdldF90b2tlbigpO1xuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnRva2VuX3RleHQgPSB0WzBdO1xuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPSB0WzFdO1xuXG4gICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPT09ICdUS19FT0YnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfU1RBUlQnOlxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIuaW5kZW50X2NvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobXVsdGlfcGFyc2VyLmluZGVudF9ib2R5X2lubmVyX2h0bWwgfHwgIW11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC88Ym9keSg/Oi4qKT4vKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobXVsdGlfcGFyc2VyLmluZGVudF9oZWFkX2lubmVyX2h0bWwgfHwgIW11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC88aGVhZCg/Oi4qKT4vKSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5pbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmluZGVudF9jb250ZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NUWUxFJzpcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfU0NSSVBUJzpcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfRU5EJzpcbiAgICAgICAgICAgICAgICAgICAgLy9QcmludCBuZXcgbGluZSBvbmx5IGlmIHRoZSB0YWcgaGFzIG5vIGNvbnRlbnQgYW5kIGhhcyBjaGlsZFxuICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLmxhc3RfdG9rZW4gPT09ICdUS19DT05URU5UJyAmJiBtdWx0aV9wYXJzZXIubGFzdF90ZXh0ID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ19uYW1lID0gKG11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC9cXHcrLykgfHwgW10pWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLm91dHB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdfZXh0cmFjdGVkX2Zyb21fbGFzdF9vdXRwdXQgPSBtdWx0aV9wYXJzZXIub3V0cHV0W211bHRpX3BhcnNlci5vdXRwdXQubGVuZ3RoIC0gMV0ubWF0Y2goLyg/Ojx8e3sjKVxccyooXFx3KykvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdfZXh0cmFjdGVkX2Zyb21fbGFzdF9vdXRwdXQgPT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGFnX2V4dHJhY3RlZF9mcm9tX2xhc3Rfb3V0cHV0WzFdICE9PSB0YWdfbmFtZSAmJiAhbXVsdGlfcGFyc2VyLlV0aWxzLmluX2FycmF5KHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dFsxXSwgdW5mb3JtYXR0ZWQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfU0lOR0xFJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGEgbmV3bGluZSBiZWZvcmUgZWxlbWVudHMgdGhhdCBzaG91bGQgcmVtYWluIHVuZm9ybWF0dGVkLlxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFnX2NoZWNrID0gbXVsdGlfcGFyc2VyLnRva2VuX3RleHQubWF0Y2goL15cXHMqPChbYS16LV0rKS9pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWdfY2hlY2sgfHwgIW11bHRpX3BhcnNlci5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2tbMV0sIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnQ09OVEVOVCc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1RLX1RBR19IQU5ETEVCQVJTX0VMU0UnOlxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBhZGQgYSBuZXdsaW5lIGlmIG9wZW5pbmcge3sjaWZ9fSB0YWcgaXMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmRJZk9uQ3VycmVudExpbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbGFzdENoZWNrZWRPdXRwdXQgPSBtdWx0aV9wYXJzZXIub3V0cHV0Lmxlbmd0aCAtIDE7IGxhc3RDaGVja2VkT3V0cHV0ID49IDA7IGxhc3RDaGVja2VkT3V0cHV0LS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIub3V0cHV0W2xhc3RDaGVja2VkT3V0cHV0XSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci5vdXRwdXRbbGFzdENoZWNrZWRPdXRwdXRdLm1hdGNoKC97eyNpZi8pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kSWZPbkN1cnJlbnRMaW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmRJZk9uQ3VycmVudExpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLmluZGVudF9jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuaW5kZW50X2NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfSEFORExFQkFSU19DT01NRU5UJzpcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdUQUcnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19DT05URU5UJzpcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdUQUcnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19TVFlMRSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfU0NSSVBUJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci50b2tlbl90ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSBtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRfaW5kZW50X2xldmVsID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIudG9rZW5fdHlwZSA9PT0gJ1RLX1NDUklQVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllciA9IHR5cGVvZiBqc19iZWF1dGlmeSA9PT0gJ2Z1bmN0aW9uJyAmJiBqc19iZWF1dGlmeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPT09ICdUS19TVFlMRScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllciA9IHR5cGVvZiBjc3NfYmVhdXRpZnkgPT09ICdmdW5jdGlvbicgJiYgY3NzX2JlYXV0aWZ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRlbnRfc2NyaXB0cyA9PT0gXCJrZWVwXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRfaW5kZW50X2xldmVsID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pbmRlbnRfc2NyaXB0cyA9PT0gXCJzZXBhcmF0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0X2luZGVudF9sZXZlbCA9IC1tdWx0aV9wYXJzZXIuaW5kZW50X2xldmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZW50YXRpb24gPSBtdWx0aV9wYXJzZXIuZ2V0X2Z1bGxfaW5kZW50KHNjcmlwdF9pbmRlbnRfbGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9iZWF1dGlmaWVyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHRoZSBCZWF1dGlmaWVyIGlmIGF2YWxpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBDaGlsZF9vcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW9sID0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDaGlsZF9vcHRpb25zLnByb3RvdHlwZSA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkX29wdGlvbnMgPSBuZXcgQ2hpbGRfb3B0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBfYmVhdXRpZmllcih0ZXh0LnJlcGxhY2UoL15cXHMqLywgaW5kZW50YXRpb24pLCBjaGlsZF9vcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2ltcGx5IGluZGVudCB0aGUgc3RyaW5nIG90aGVyd2lzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aGl0ZSA9IHRleHQubWF0Y2goL15cXHMqLylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9sZXZlbCA9IHdoaXRlLm1hdGNoKC9bXlxcblxccl0qJC8pWzBdLnNwbGl0KG11bHRpX3BhcnNlci5pbmRlbnRfc3RyaW5nKS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWluZGVudCA9IG11bHRpX3BhcnNlci5nZXRfZnVsbF9pbmRlbnQoc2NyaXB0X2luZGVudF9sZXZlbCAtIF9sZXZlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxccyovLCBpbmRlbnRhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcclxcbnxcXHJ8XFxuL2csICdcXG4nICsgcmVpbmRlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuX3Jhdyh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZSh0cnVlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ1RBRyc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHNob3VsZCBub3QgYmUgZ2V0dGluZyBoZXJlIGJ1dCB3ZSBkb24ndCB3YW50IHRvIGRyb3AgaW5wdXQgb24gdGhlIGZsb29yXG4gICAgICAgICAgICAgICAgICAgIC8vIEp1c3Qgb3V0cHV0IHRoZSB0ZXh0IGFuZCBtb3ZlIG9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtdWx0aV9wYXJzZXIubGFzdF90b2tlbiA9IG11bHRpX3BhcnNlci50b2tlbl90eXBlO1xuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmxhc3RfdGV4dCA9IG11bHRpX3BhcnNlci50b2tlbl90ZXh0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBzd2VldF9jb2RlID0gbXVsdGlfcGFyc2VyLm91dHB1dC5qb2luKCcnKS5yZXBsYWNlKC9bXFxyXFxuXFx0IF0rJC8sICcnKTtcblxuICAgICAgICAvLyBlc3RhYmxpc2ggZW5kX3dpdGhfbmV3bGluZVxuICAgICAgICBpZiAoZW5kX3dpdGhfbmV3bGluZSkge1xuICAgICAgICAgICAgc3dlZXRfY29kZSArPSAnXFxuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlb2wgIT09ICdcXG4nKSB7XG4gICAgICAgICAgICBzd2VldF9jb2RlID0gc3dlZXRfY29kZS5yZXBsYWNlKC9bXFxuXS9nLCBlb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN3ZWV0X2NvZGU7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKCBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EI2RlZmluZWFtZC1wcm9wZXJ0eS0gKVxuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcIi4vYmVhdXRpZnlcIiwgXCIuL2JlYXV0aWZ5LWNzc1wiXSwgZnVuY3Rpb24ocmVxdWlyZWFtZCkge1xuICAgICAgICAgICAgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZWFtZChcIi4vYmVhdXRpZnlcIik7XG4gICAgICAgICAgICB2YXIgY3NzX2JlYXV0aWZ5ID0gcmVxdWlyZWFtZChcIi4vYmVhdXRpZnktY3NzXCIpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWxfYmVhdXRpZnk6IGZ1bmN0aW9uKGh0bWxfc291cmNlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZV9odG1sKGh0bWxfc291cmNlLCBvcHRpb25zLCBqc19iZWF1dGlmeS5qc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LmNzc19iZWF1dGlmeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQ29tbW9uSlMuIEp1c3QgcHV0IHRoaXMgZmlsZSBzb21ld2hlcmUgb24geW91ciByZXF1aXJlLnBhdGhzXG4gICAgICAgIC8vIGFuZCB5b3Ugd2lsbCBiZSBhYmxlIHRvIGB2YXIgaHRtbF9iZWF1dGlmeSA9IHJlcXVpcmUoXCJiZWF1dGlmeVwiKS5odG1sX2JlYXV0aWZ5YC5cbiAgICAgICAgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZSgnLi9iZWF1dGlmeS5qcycpO1xuICAgICAgICB2YXIgY3NzX2JlYXV0aWZ5ID0gcmVxdWlyZSgnLi9iZWF1dGlmeS1jc3MuanMnKTtcblxuICAgICAgICBleHBvcnRzLmh0bWxfYmVhdXRpZnkgPSBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgcnVubmluZyBhIHdlYiBwYWdlIGFuZCBkb24ndCBoYXZlIGVpdGhlciBvZiB0aGUgYWJvdmUsIGFkZCBvdXIgb25lIGdsb2JhbFxuICAgICAgICB3aW5kb3cuaHRtbF9iZWF1dGlmeSA9IGZ1bmN0aW9uKGh0bWxfc291cmNlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucywgd2luZG93LmpzX2JlYXV0aWZ5LCB3aW5kb3cuY3NzX2JlYXV0aWZ5KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZXZlbiBoYXZlIHdpbmRvdywgdHJ5IGdsb2JhbC5cbiAgICAgICAgZ2xvYmFsLmh0bWxfYmVhdXRpZnkgPSBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGdsb2JhbC5qc19iZWF1dGlmeSwgZ2xvYmFsLmNzc19iZWF1dGlmeSk7XG4gICAgICAgIH07XG4gICAgfVxuXG59KCkpOyIsIi8qanNoaW50IGN1cmx5OnRydWUsIGVxZXFlcTp0cnVlLCBsYXhicmVhazp0cnVlLCBub2VtcHR5OmZhbHNlICovXG4vKlxuXG4gIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gIENvcHlyaWdodCAoYykgMjAwNy0yMDE3IEVpbmFyIExpZWxtYW5pcywgTGlhbSBOZXdtYW4sIGFuZCBjb250cmlidXRvcnMuXG5cbiAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cbiAgb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXNcbiAgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLFxuICBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLFxuICBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLFxuICBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiAgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSU1xuICBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbiAgQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICBTT0ZUV0FSRS5cblxuIEpTIEJlYXV0aWZpZXJcbi0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgV3JpdHRlbiBieSBFaW5hciBMaWVsbWFuaXMsIDxlaW5hckBqc2JlYXV0aWZpZXIub3JnPlxuICAgICAgaHR0cDovL2pzYmVhdXRpZmllci5vcmcvXG5cbiAgT3JpZ2luYWxseSBjb252ZXJ0ZWQgdG8gamF2YXNjcmlwdCBieSBWaXRhbCwgPHZpdGFsNzZAZ21haWwuY29tPlxuICBcIkVuZCBicmFjZXMgb24gb3duIGxpbmVcIiBhZGRlZCBieSBDaHJpcyBKLiBTaHVsbCwgPGNocmlzanNodWxsQGdtYWlsLmNvbT5cbiAgUGFyc2luZyBpbXByb3ZlbWVudHMgZm9yIGJyYWNlLWxlc3Mgc3RhdGVtZW50cyBieSBMaWFtIE5ld21hbiA8Yml0d2lzZW1hbkBnbWFpbC5jb20+XG5cblxuICBVc2FnZTpcbiAgICBqc19iZWF1dGlmeShqc19zb3VyY2VfdGV4dCk7XG4gICAganNfYmVhdXRpZnkoanNfc291cmNlX3RleHQsIG9wdGlvbnMpO1xuXG4gIFRoZSBvcHRpb25zIGFyZTpcbiAgICBpbmRlbnRfc2l6ZSAoZGVmYXVsdCA0KSAgICAgICAgICAtIGluZGVudGF0aW9uIHNpemUsXG4gICAgaW5kZW50X2NoYXIgKGRlZmF1bHQgc3BhY2UpICAgICAgLSBjaGFyYWN0ZXIgdG8gaW5kZW50IHdpdGgsXG4gICAgcHJlc2VydmVfbmV3bGluZXMgKGRlZmF1bHQgdHJ1ZSkgLSB3aGV0aGVyIGV4aXN0aW5nIGxpbmUgYnJlYWtzIHNob3VsZCBiZSBwcmVzZXJ2ZWQsXG4gICAgbWF4X3ByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IHVubGltaXRlZCkgLSBtYXhpbXVtIG51bWJlciBvZiBsaW5lIGJyZWFrcyB0byBiZSBwcmVzZXJ2ZWQgaW4gb25lIGNodW5rLFxuXG4gICAganNsaW50X2hhcHB5IChkZWZhdWx0IGZhbHNlKSAtIGlmIHRydWUsIHRoZW4ganNsaW50LXN0cmljdGVyIG1vZGUgaXMgZW5mb3JjZWQuXG5cbiAgICAgICAgICAgIGpzbGludF9oYXBweSAgICAgICAgIWpzbGludF9oYXBweVxuICAgICAgICAgICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSAgICAgICAgIGZ1bmN0aW9uKClcblxuICAgICAgICAgICAgc3dpdGNoICgpIHsgICAgICAgICBzd2l0Y2goKSB7XG4gICAgICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICBicmVhazsgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgIH1cblxuICAgIHNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24gKGRlZmF1bHQgZmFsc2UpIC0gc2hvdWxkIHRoZSBzcGFjZSBiZWZvcmUgYW4gYW5vbnltb3VzIGZ1bmN0aW9uJ3MgcGFyZW5zIGJlIGFkZGVkLCBcImZ1bmN0aW9uKClcIiB2cyBcImZ1bmN0aW9uICgpXCIsXG4gICAgICAgICAgTk9URTogVGhpcyBvcHRpb24gaXMgb3ZlcnJpZGVuIGJ5IGpzbGludF9oYXBweSAoaS5lLiBpZiBqc2xpbnRfaGFwcHkgaXMgdHJ1ZSwgc3BhY2VfYWZ0ZXJfYW5vbl9mdW5jdGlvbiBpcyB0cnVlIGJ5IGRlc2lnbilcblxuICAgIGJyYWNlX3N0eWxlIChkZWZhdWx0IFwiY29sbGFwc2VcIikgLSBcImNvbGxhcHNlXCIgfCBcImV4cGFuZFwiIHwgXCJlbmQtZXhwYW5kXCIgfCBcIm5vbmVcIiB8IGFueSBvZiB0aGUgZm9ybWVyICsgXCIscHJlc2VydmUtaW5saW5lXCJcbiAgICAgICAgICAgIHB1dCBicmFjZXMgb24gdGhlIHNhbWUgbGluZSBhcyBjb250cm9sIHN0YXRlbWVudHMgKGRlZmF1bHQpLCBvciBwdXQgYnJhY2VzIG9uIG93biBsaW5lIChBbGxtYW4gLyBBTlNJIHN0eWxlKSwgb3IganVzdCBwdXQgZW5kIGJyYWNlcyBvbiBvd24gbGluZSwgb3IgYXR0ZW1wdCB0byBrZWVwIHRoZW0gd2hlcmUgdGhleSBhcmUuXG4gICAgICAgICAgICBwcmVzZXJ2ZS1pbmxpbmUgd2lsbCB0cnkgdG8gcHJlc2VydmUgaW5saW5lIGJsb2NrcyBvZiBjdXJseSBicmFjZXNcblxuICAgIHNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCAoZGVmYXVsdCB0cnVlKSAtIHNob3VsZCB0aGUgc3BhY2UgYmVmb3JlIGNvbmRpdGlvbmFsIHN0YXRlbWVudCBiZSBhZGRlZCwgXCJpZih0cnVlKVwiIHZzIFwiaWYgKHRydWUpXCIsXG5cbiAgICB1bmVzY2FwZV9zdHJpbmdzIChkZWZhdWx0IGZhbHNlKSAtIHNob3VsZCBwcmludGFibGUgY2hhcmFjdGVycyBpbiBzdHJpbmdzIGVuY29kZWQgaW4gXFx4Tk4gbm90YXRpb24gYmUgdW5lc2NhcGVkLCBcImV4YW1wbGVcIiB2cyBcIlxceDY1XFx4NzhcXHg2MVxceDZkXFx4NzBcXHg2Y1xceDY1XCJcblxuICAgIHdyYXBfbGluZV9sZW5ndGggKGRlZmF1bHQgdW5saW1pdGVkKSAtIGxpbmVzIHNob3VsZCB3cmFwIGF0IG5leHQgb3Bwb3J0dW5pdHkgYWZ0ZXIgdGhpcyBudW1iZXIgb2YgY2hhcmFjdGVycy5cbiAgICAgICAgICBOT1RFOiBUaGlzIGlzIG5vdCBhIGhhcmQgbGltaXQuIExpbmVzIHdpbGwgY29udGludWUgdW50aWwgYSBwb2ludCB3aGVyZSBhIG5ld2xpbmUgd291bGRcbiAgICAgICAgICAgICAgICBiZSBwcmVzZXJ2ZWQgaWYgaXQgd2VyZSBwcmVzZW50LlxuXG4gICAgZW5kX3dpdGhfbmV3bGluZSAoZGVmYXVsdCBmYWxzZSkgIC0gZW5kIG91dHB1dCB3aXRoIGEgbmV3bGluZVxuXG5cbiAgICBlLmdcblxuICAgIGpzX2JlYXV0aWZ5KGpzX3NvdXJjZV90ZXh0LCB7XG4gICAgICAnaW5kZW50X3NpemUnOiAxLFxuICAgICAgJ2luZGVudF9jaGFyJzogJ1xcdCdcbiAgICB9KTtcblxuKi9cblxuLy8gT2JqZWN0LnZhbHVlcyBwb2x5ZmlsbCBmb3VuZCBoZXJlOlxuLy8gaHR0cDovL3Rva2VucG9zdHMuYmxvZ3Nwb3QuY29tLmF1LzIwMTIvMDQvamF2YXNjcmlwdC1vYmplY3RrZXlzLWJyb3dzZXIuaHRtbFxuaWYgKCFPYmplY3QudmFsdWVzKSB7XG4gICAgT2JqZWN0LnZhbHVlcyA9IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgaWYgKG8gIT09IE9iamVjdChvKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LnZhbHVlcyBjYWxsZWQgb24gYSBub24tb2JqZWN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGsgPSBbXSxcbiAgICAgICAgICAgIHA7XG4gICAgICAgIGZvciAocCBpbiBvKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSB7XG4gICAgICAgICAgICAgICAgay5wdXNoKG9bcF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrO1xuICAgIH07XG59XG5cbihmdW5jdGlvbigpIHtcblxuICAgIGZ1bmN0aW9uIG1lcmdlT3B0cyhhbGxPcHRpb25zLCB0YXJnZXRUeXBlKSB7XG4gICAgICAgIHZhciBmaW5hbE9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgZm9yIChuYW1lIGluIGFsbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSB0YXJnZXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzW25hbWVdID0gYWxsT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vbWVyZ2UgaW4gdGhlIHBlciB0eXBlIHNldHRpbmdzIGZvciB0aGUgdGFyZ2V0VHlwZVxuICAgICAgICBpZiAodGFyZ2V0VHlwZSBpbiBhbGxPcHRpb25zKSB7XG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gYWxsT3B0aW9uc1t0YXJnZXRUeXBlXSkge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0c1tuYW1lXSA9IGFsbE9wdGlvbnNbdGFyZ2V0VHlwZV1bbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbmFsT3B0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBqc19iZWF1dGlmeShqc19zb3VyY2VfdGV4dCwgb3B0aW9ucykge1xuXG4gICAgICAgIHZhciBhY29ybiA9IHt9O1xuICAgICAgICAoZnVuY3Rpb24oZXhwb3J0cykge1xuICAgICAgICAgICAgLyoganNoaW50IGN1cmx5OiBmYWxzZSAqL1xuICAgICAgICAgICAgLy8gVGhpcyBzZWN0aW9uIG9mIGNvZGUgaXMgdGFrZW4gZnJvbSBhY29ybi5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBY29ybiB3YXMgd3JpdHRlbiBieSBNYXJpam4gSGF2ZXJiZWtlIGFuZCByZWxlYXNlZCB1bmRlciBhbiBNSVRcbiAgICAgICAgICAgIC8vIGxpY2Vuc2UuIFRoZSBVbmljb2RlIHJlZ2V4cHMgKGZvciBpZGVudGlmaWVycyBhbmQgd2hpdGVzcGFjZSkgd2VyZVxuICAgICAgICAgICAgLy8gdGFrZW4gZnJvbSBbRXNwcmltYV0oaHR0cDovL2VzcHJpbWEub3JnKSBieSBBcml5YSBIaWRheWF0LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEdpdCByZXBvc2l0b3JpZXMgZm9yIEFjb3JuIGFyZSBhdmFpbGFibGUgYXRcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgICAgaHR0cDovL21hcmlqbmhhdmVyYmVrZS5ubC9naXQvYWNvcm5cbiAgICAgICAgICAgIC8vICAgICBodHRwczovL2dpdGh1Yi5jb20vbWFyaWpuaC9hY29ybi5naXRcblxuICAgICAgICAgICAgLy8gIyMgQ2hhcmFjdGVyIGNhdGVnb3JpZXNcblxuICAgICAgICAgICAgLy8gQmlnIHVnbHkgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IG1hdGNoIGNoYXJhY3RlcnMgaW4gdGhlXG4gICAgICAgICAgICAvLyB3aGl0ZXNwYWNlLCBpZGVudGlmaWVyLCBhbmQgaWRlbnRpZmllci1zdGFydCBjYXRlZ29yaWVzLiBUaGVzZVxuICAgICAgICAgICAgLy8gYXJlIG9ubHkgYXBwbGllZCB3aGVuIGEgY2hhcmFjdGVyIGlzIGZvdW5kIHRvIGFjdHVhbGx5IGhhdmUgYVxuICAgICAgICAgICAgLy8gY29kZSBwb2ludCBhYm92ZSAxMjguXG5cbiAgICAgICAgICAgIHZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1ZmVmZl0vOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzID0gXCJcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY1wiO1xuICAgICAgICAgICAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzID0gXCJcXHUwMzAwLVxcdTAzNmZcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjIwLVxcdTA2NDlcXHUwNjcyLVxcdTA2ZDNcXHUwNmU3LVxcdTA2ZThcXHUwNmZiLVxcdTA2ZmNcXHUwNzMwLVxcdTA3NGFcXHUwODAwLVxcdTA4MTRcXHUwODFiLVxcdTA4MjNcXHUwODI1LVxcdTA4MjdcXHUwODI5LVxcdTA4MmRcXHUwODQwLVxcdTA4NTdcXHUwOGU0LVxcdTA4ZmVcXHUwOTAwLVxcdTA5MDNcXHUwOTNhLVxcdTA5M2NcXHUwOTNlLVxcdTA5NGZcXHUwOTUxLVxcdTA5NTdcXHUwOTYyLVxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTgxLVxcdTA5ODNcXHUwOWJjXFx1MDliZS1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWQ3XFx1MDlkZi1cXHUwOWUwXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMi1cXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGIwMS1cXHUwYjAzXFx1MGIzY1xcdTBiM2UtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NlxcdTBiNTdcXHUwYjVmLVxcdTBiNjBcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDEtXFx1MGMwM1xcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2Mi1cXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MlxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyLVxcdTBjZTNcXHUwY2U2LVxcdTBjZWZcXHUwZDAyXFx1MGQwM1xcdTBkNDYtXFx1MGQ0OFxcdTBkNTdcXHUwZDYyLVxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgyXFx1MGQ4M1xcdTBkY2FcXHUwZGNmLVxcdTBkZDRcXHUwZGQ2XFx1MGRkOC1cXHUwZGRmXFx1MGRmMlxcdTBkZjNcXHUwZTM0LVxcdTBlM2FcXHUwZTQwLVxcdTBlNDVcXHUwZTUwLVxcdTBlNTlcXHUwZWI0LVxcdTBlYjlcXHUwZWM4LVxcdTBlY2RcXHUwZWQwLVxcdTBlZDlcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmNDEtXFx1MGY0N1xcdTBmNzEtXFx1MGY4NFxcdTBmODYtXFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDAwLVxcdTEwMjlcXHUxMDQwLVxcdTEwNDlcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxNzBlLVxcdTE3MTBcXHUxNzIwLVxcdTE3MzBcXHUxNzQwLVxcdTE3NTBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdiMlxcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODEwLVxcdTE4MTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTUxLVxcdTE5NmRcXHUxOWIwLVxcdTE5YzBcXHUxOWM4LVxcdTE5YzlcXHUxOWQwLVxcdTE5ZDlcXHUxYTAwLVxcdTFhMTVcXHUxYTIwLVxcdTFhNTNcXHUxYTYwLVxcdTFhN2NcXHUxYTdmLVxcdTFhODlcXHUxYTkwLVxcdTFhOTlcXHUxYjQ2LVxcdTFiNGJcXHUxYjUwLVxcdTFiNTlcXHUxYjZiLVxcdTFiNzNcXHUxYmIwLVxcdTFiYjlcXHUxYmU2LVxcdTFiZjNcXHUxYzAwLVxcdTFjMjJcXHUxYzQwLVxcdTFjNDlcXHUxYzViLVxcdTFjN2RcXHUxY2QwLVxcdTFjZDJcXHUxZDAwLVxcdTFkYmVcXHUxZTAxLVxcdTFmMTVcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyZDgxLVxcdTJkOTZcXHUyZGUwLVxcdTJkZmZcXHUzMDIxLVxcdTMwMjhcXHUzMDk5XFx1MzA5YVxcdWE2NDAtXFx1YTY2ZFxcdWE2NzQtXFx1YTY3ZFxcdWE2OWZcXHVhNmYwLVxcdWE2ZjFcXHVhN2Y4LVxcdWE4MDBcXHVhODA2XFx1YTgwYlxcdWE4MjMtXFx1YTgyN1xcdWE4ODAtXFx1YTg4MVxcdWE4YjQtXFx1YThjNFxcdWE4ZDAtXFx1YThkOVxcdWE4ZjMtXFx1YThmN1xcdWE5MDAtXFx1YTkwOVxcdWE5MjYtXFx1YTkyZFxcdWE5MzAtXFx1YTk0NVxcdWE5ODAtXFx1YTk4M1xcdWE5YjMtXFx1YTljMFxcdWFhMDAtXFx1YWEyN1xcdWFhNDAtXFx1YWE0MVxcdWFhNGMtXFx1YWE0ZFxcdWFhNTAtXFx1YWE1OVxcdWFhN2JcXHVhYWUwLVxcdWFhZTlcXHVhYWYyLVxcdWFhZjNcXHVhYmMwLVxcdWFiZTFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMjAtXFx1ZmIyOFxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmYxMC1cXHVmZjE5XFx1ZmYzZlwiO1xuICAgICAgICAgICAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0ID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBcIl1cIik7XG4gICAgICAgICAgICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBub25BU0NJSWlkZW50aWZpZXJDaGFycyArIFwiXVwiKTtcblxuICAgICAgICAgICAgLy8gV2hldGhlciBhIHNpbmdsZSBjaGFyYWN0ZXIgZGVub3RlcyBhIG5ld2xpbmUuXG5cbiAgICAgICAgICAgIGV4cG9ydHMubmV3bGluZSA9IC9bXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcblxuICAgICAgICAgICAgLy8gTWF0Y2hlcyBhIHdob2xlIGxpbmUgYnJlYWsgKHdoZXJlIENSTEYgaXMgY29uc2lkZXJlZCBhIHNpbmdsZVxuICAgICAgICAgICAgLy8gbGluZSBicmVhaykuIFVzZWQgdG8gY291bnQgbGluZXMuXG5cbiAgICAgICAgICAgIC8vIGluIGphdmFzY3JpcHQsIHRoZXNlIHR3byBkaWZmZXJcbiAgICAgICAgICAgIC8vIGluIHB5dGhvbiB0aGV5IGFyZSB0aGUgc2FtZSwgZGlmZmVyZW50IG1ldGhvZHMgYXJlIGNhbGxlZCBvbiB0aGVtXG4gICAgICAgICAgICBleHBvcnRzLmxpbmVCcmVhayA9IG5ldyBSZWdFeHAoJ1xcclxcbnwnICsgZXhwb3J0cy5uZXdsaW5lLnNvdXJjZSk7XG4gICAgICAgICAgICBleHBvcnRzLmFsbExpbmVCcmVha3MgPSBuZXcgUmVnRXhwKGV4cG9ydHMubGluZUJyZWFrLnNvdXJjZSwgJ2cnKTtcblxuXG4gICAgICAgICAgICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgY29kZSBzdGFydHMgYW4gaWRlbnRpZmllci5cblxuICAgICAgICAgICAgZXhwb3J0cy5pc0lkZW50aWZpZXJTdGFydCA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBwZXJtaXQgJCAoMzYpIGFuZCBAICg2NCkuIEAgaXMgdXNlZCBpbiBFUzcgZGVjb3JhdG9ycy5cbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gY29kZSA9PT0gMzYgfHwgY29kZSA9PT0gNjQ7XG4gICAgICAgICAgICAgICAgLy8gNjUgdGhyb3VnaCA5MSBhcmUgdXBwZXJjYXNlIGxldHRlcnMuXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgLy8gcGVybWl0IF8gKDk1KS5cbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgICAgICAgICAgICAgLy8gOTcgdGhyb3VnaCAxMjMgYXJlIGxvd2VyY2FzZSBsZXR0ZXJzLlxuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgMTIzKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgaXMgcGFydCBvZiBhbiBpZGVudGlmaWVyLlxuXG4gICAgICAgICAgICBleHBvcnRzLmlzSWRlbnRpZmllckNoYXIgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA0OCkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgNTgpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCAxMjMpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShhY29ybik7XG4gICAgICAgIC8qIGpzaGludCBjdXJseTogdHJ1ZSAqL1xuXG4gICAgICAgIGZ1bmN0aW9uIGluX2FycmF5KHdoYXQsIGFycikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyW2ldID09PSB3aGF0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRyaW0ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbHRyaW0ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccysvZywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZnVuY3Rpb24gcnRyaW0ocykge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxzKyQvZywgJycpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2FuaXRpemVPcGVyYXRvclBvc2l0aW9uKG9wUG9zaXRpb24pIHtcbiAgICAgICAgICAgIG9wUG9zaXRpb24gPSBvcFBvc2l0aW9uIHx8IE9QRVJBVE9SX1BPU0lUSU9OLmJlZm9yZV9uZXdsaW5lO1xuXG4gICAgICAgICAgICB2YXIgdmFsaWRQb3NpdGlvblZhbHVlcyA9IE9iamVjdC52YWx1ZXMoT1BFUkFUT1JfUE9TSVRJT04pO1xuXG4gICAgICAgICAgICBpZiAoIWluX2FycmF5KG9wUG9zaXRpb24sIHZhbGlkUG9zaXRpb25WYWx1ZXMpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBPcHRpb24gVmFsdWU6IFRoZSBvcHRpb24gJ29wZXJhdG9yX3Bvc2l0aW9uJyBtdXN0IGJlIG9uZSBvZiB0aGUgZm9sbG93aW5nIHZhbHVlc1xcblwiICtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRQb3NpdGlvblZhbHVlcyArXG4gICAgICAgICAgICAgICAgICAgIFwiXFxuWW91IHBhc3NlZCBpbjogJ1wiICsgb3BQb3NpdGlvbiArIFwiJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG9wUG9zaXRpb247XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgT1BFUkFUT1JfUE9TSVRJT04gPSB7XG4gICAgICAgICAgICBiZWZvcmVfbmV3bGluZTogJ2JlZm9yZS1uZXdsaW5lJyxcbiAgICAgICAgICAgIGFmdGVyX25ld2xpbmU6ICdhZnRlci1uZXdsaW5lJyxcbiAgICAgICAgICAgIHByZXNlcnZlX25ld2xpbmU6ICdwcmVzZXJ2ZS1uZXdsaW5lJyxcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgT1BFUkFUT1JfUE9TSVRJT05fQkVGT1JFX09SX1BSRVNFUlZFID0gW09QRVJBVE9SX1BPU0lUSU9OLmJlZm9yZV9uZXdsaW5lLCBPUEVSQVRPUl9QT1NJVElPTi5wcmVzZXJ2ZV9uZXdsaW5lXTtcblxuICAgICAgICB2YXIgTU9ERSA9IHtcbiAgICAgICAgICAgIEJsb2NrU3RhdGVtZW50OiAnQmxvY2tTdGF0ZW1lbnQnLCAvLyAnQkxPQ0snXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6ICdTdGF0ZW1lbnQnLCAvLyAnU1RBVEVNRU5UJ1xuICAgICAgICAgICAgT2JqZWN0TGl0ZXJhbDogJ09iamVjdExpdGVyYWwnLCAvLyAnT0JKRUNUJyxcbiAgICAgICAgICAgIEFycmF5TGl0ZXJhbDogJ0FycmF5TGl0ZXJhbCcsIC8vJ1tFWFBSRVNTSU9OXScsXG4gICAgICAgICAgICBGb3JJbml0aWFsaXplcjogJ0ZvckluaXRpYWxpemVyJywgLy8nKEZPUi1FWFBSRVNTSU9OKScsXG4gICAgICAgICAgICBDb25kaXRpb25hbDogJ0NvbmRpdGlvbmFsJywgLy8nKENPTkQtRVhQUkVTU0lPTiknLFxuICAgICAgICAgICAgRXhwcmVzc2lvbjogJ0V4cHJlc3Npb24nIC8vJyhFWFBSRVNTSU9OKSdcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBCZWF1dGlmaWVyKGpzX3NvdXJjZV90ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgICAgIHZhciBvdXRwdXQ7XG4gICAgICAgICAgICB2YXIgdG9rZW5zID0gW10sXG4gICAgICAgICAgICAgICAgdG9rZW5fcG9zO1xuICAgICAgICAgICAgdmFyIFRva2VuaXplcjtcbiAgICAgICAgICAgIHZhciBjdXJyZW50X3Rva2VuO1xuICAgICAgICAgICAgdmFyIGxhc3RfdHlwZSwgbGFzdF9sYXN0X3RleHQsIGluZGVudF9zdHJpbmc7XG4gICAgICAgICAgICB2YXIgZmxhZ3MsIHByZXZpb3VzX2ZsYWdzLCBmbGFnX3N0b3JlO1xuICAgICAgICAgICAgdmFyIHByZWZpeDtcblxuICAgICAgICAgICAgdmFyIGhhbmRsZXJzLCBvcHQ7XG4gICAgICAgICAgICB2YXIgYmFzZUluZGVudFN0cmluZyA9ICcnO1xuXG4gICAgICAgICAgICBoYW5kbGVycyA9IHtcbiAgICAgICAgICAgICAgICAnVEtfU1RBUlRfRVhQUic6IGhhbmRsZV9zdGFydF9leHByLFxuICAgICAgICAgICAgICAgICdUS19FTkRfRVhQUic6IGhhbmRsZV9lbmRfZXhwcixcbiAgICAgICAgICAgICAgICAnVEtfU1RBUlRfQkxPQ0snOiBoYW5kbGVfc3RhcnRfYmxvY2ssXG4gICAgICAgICAgICAgICAgJ1RLX0VORF9CTE9DSyc6IGhhbmRsZV9lbmRfYmxvY2ssXG4gICAgICAgICAgICAgICAgJ1RLX1dPUkQnOiBoYW5kbGVfd29yZCxcbiAgICAgICAgICAgICAgICAnVEtfUkVTRVJWRUQnOiBoYW5kbGVfd29yZCxcbiAgICAgICAgICAgICAgICAnVEtfU0VNSUNPTE9OJzogaGFuZGxlX3NlbWljb2xvbixcbiAgICAgICAgICAgICAgICAnVEtfU1RSSU5HJzogaGFuZGxlX3N0cmluZyxcbiAgICAgICAgICAgICAgICAnVEtfRVFVQUxTJzogaGFuZGxlX2VxdWFscyxcbiAgICAgICAgICAgICAgICAnVEtfT1BFUkFUT1InOiBoYW5kbGVfb3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgJ1RLX0NPTU1BJzogaGFuZGxlX2NvbW1hLFxuICAgICAgICAgICAgICAgICdUS19CTE9DS19DT01NRU5UJzogaGFuZGxlX2Jsb2NrX2NvbW1lbnQsXG4gICAgICAgICAgICAgICAgJ1RLX0NPTU1FTlQnOiBoYW5kbGVfY29tbWVudCxcbiAgICAgICAgICAgICAgICAnVEtfRE9UJzogaGFuZGxlX2RvdCxcbiAgICAgICAgICAgICAgICAnVEtfVU5LTk9XTic6IGhhbmRsZV91bmtub3duLFxuICAgICAgICAgICAgICAgICdUS19FT0YnOiBoYW5kbGVfZW9mXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVfZmxhZ3MoZmxhZ3NfYmFzZSwgbW9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0X2luZGVudF9sZXZlbCA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzX2Jhc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9pbmRlbnRfbGV2ZWwgPSBmbGFnc19iYXNlLmluZGVudGF0aW9uX2xldmVsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW91dHB1dC5qdXN0X2FkZGVkX25ld2xpbmUoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3NfYmFzZS5saW5lX2luZGVudF9sZXZlbCA+IG5leHRfaW5kZW50X2xldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0X2luZGVudF9sZXZlbCA9IGZsYWdzX2Jhc2UubGluZV9pbmRlbnRfbGV2ZWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbmV4dF9mbGFncyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogbW9kZSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBmbGFnc19iYXNlLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X3RleHQ6IGZsYWdzX2Jhc2UgPyBmbGFnc19iYXNlLmxhc3RfdGV4dCA6ICcnLCAvLyBsYXN0IHRva2VuIHRleHRcbiAgICAgICAgICAgICAgICAgICAgbGFzdF93b3JkOiBmbGFnc19iYXNlID8gZmxhZ3NfYmFzZS5sYXN0X3dvcmQgOiAnJywgLy8gbGFzdCAnVEtfV09SRCcgcGFzc2VkXG4gICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uX3N0YXRlbWVudDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uX2Fzc2lnbm1lbnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtdWx0aWxpbmVfZnJhbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpbmxpbmVfZnJhbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBpZl9ibG9jazogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVsc2VfYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkb19ibG9jazogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRvX3doaWxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0X2Jsb2NrOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5fY2FzZV9zdGF0ZW1lbnQ6IGZhbHNlLCAvLyBzd2l0Y2goLi4peyBJTlNJREUgSEVSRSB9XG4gICAgICAgICAgICAgICAgICAgIGluX2Nhc2U6IGZhbHNlLCAvLyB3ZSdyZSBvbiB0aGUgZXhhY3QgbGluZSB3aXRoIFwiY2FzZSAwOlwiXG4gICAgICAgICAgICAgICAgICAgIGNhc2VfYm9keTogZmFsc2UsIC8vIHRoZSBpbmRlbnRlZCBjYXNlLWFjdGlvbiBibG9ja1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnRhdGlvbl9sZXZlbDogbmV4dF9pbmRlbnRfbGV2ZWwsXG4gICAgICAgICAgICAgICAgICAgIGxpbmVfaW5kZW50X2xldmVsOiBmbGFnc19iYXNlID8gZmxhZ3NfYmFzZS5saW5lX2luZGVudF9sZXZlbCA6IG5leHRfaW5kZW50X2xldmVsLFxuICAgICAgICAgICAgICAgICAgICBzdGFydF9saW5lX2luZGV4OiBvdXRwdXQuZ2V0X2xpbmVfbnVtYmVyKCksXG4gICAgICAgICAgICAgICAgICAgIHRlcm5hcnlfZGVwdGg6IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0X2ZsYWdzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTb21lIGludGVycHJldGVycyBoYXZlIHVuZXhwZWN0ZWQgcmVzdWx0cyB3aXRoIGZvbyA9IGJheiB8fCBiYXI7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcblxuICAgICAgICAgICAgLy8gQWxsb3cgdGhlIHNldHRpbmcgb2YgbGFuZ3VhZ2UvZmlsZS10eXBlIHNwZWNpZmljIG9wdGlvbnNcbiAgICAgICAgICAgIC8vIHdpdGggaW5oZXJpdGFuY2Ugb2Ygb3ZlcmFsbCBzZXR0aW5nc1xuICAgICAgICAgICAgb3B0aW9ucyA9IG1lcmdlT3B0cyhvcHRpb25zLCAnanMnKTtcblxuICAgICAgICAgICAgb3B0ID0ge307XG5cbiAgICAgICAgICAgIC8vIGNvbXBhdGliaWxpdHksIHJlXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmQtc3RyaWN0XCIpIHsgLy9ncmFjZWZ1bCBoYW5kbGluZyBvZiBkZXByZWNhdGVkIG9wdGlvblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYnJhY2Vfc3R5bGUgPSBcImV4cGFuZFwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmJyYWNlX3N0eWxlID09PSBcImNvbGxhcHNlLXByZXNlcnZlLWlubGluZVwiKSB7IC8vZ3JhY2VmdWwgaGFuZGxpbmcgb2YgZGVwcmVjYXRlZCBvcHRpb25cbiAgICAgICAgICAgICAgICBvcHRpb25zLmJyYWNlX3N0eWxlID0gXCJjb2xsYXBzZSxwcmVzZXJ2ZS1pbmxpbmVcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5icmFjZXNfb25fb3duX2xpbmUgIT09IHVuZGVmaW5lZCkgeyAvL2dyYWNlZnVsIGhhbmRsaW5nIG9mIGRlcHJlY2F0ZWQgb3B0aW9uXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFjZV9zdHlsZSA9IG9wdGlvbnMuYnJhY2VzX29uX293bl9saW5lID8gXCJleHBhbmRcIiA6IFwiY29sbGFwc2VcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuYnJhY2Vfc3R5bGUpIC8vTm90aGluZyBleGlzdHMgdG8gc2V0IGl0XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFjZV9zdHlsZSA9IFwiY29sbGFwc2VcIjtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB2YXIgYnJhY2Vfc3R5bGVfc3BsaXQgPSBvcHRpb25zLmJyYWNlX3N0eWxlLnNwbGl0KC9bXmEtekEtWjAtOV9cXC1dKy8pO1xuICAgICAgICAgICAgb3B0LmJyYWNlX3N0eWxlID0gYnJhY2Vfc3R5bGVfc3BsaXRbMF07XG4gICAgICAgICAgICBvcHQuYnJhY2VfcHJlc2VydmVfaW5saW5lID0gYnJhY2Vfc3R5bGVfc3BsaXRbMV0gPyBicmFjZV9zdHlsZV9zcGxpdFsxXSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBvcHQuaW5kZW50X3NpemUgPSBvcHRpb25zLmluZGVudF9zaXplID8gcGFyc2VJbnQob3B0aW9ucy5pbmRlbnRfc2l6ZSwgMTApIDogNDtcbiAgICAgICAgICAgIG9wdC5pbmRlbnRfY2hhciA9IG9wdGlvbnMuaW5kZW50X2NoYXIgPyBvcHRpb25zLmluZGVudF9jaGFyIDogJyAnO1xuICAgICAgICAgICAgb3B0LmVvbCA9IG9wdGlvbnMuZW9sID8gb3B0aW9ucy5lb2wgOiAnYXV0byc7XG4gICAgICAgICAgICBvcHQucHJlc2VydmVfbmV3bGluZXMgPSAob3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcyA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICAgICAgb3B0LmJyZWFrX2NoYWluZWRfbWV0aG9kcyA9IChvcHRpb25zLmJyZWFrX2NoYWluZWRfbWV0aG9kcyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5icmVha19jaGFpbmVkX21ldGhvZHM7XG4gICAgICAgICAgICBvcHQubWF4X3ByZXNlcnZlX25ld2xpbmVzID0gKG9wdGlvbnMubWF4X3ByZXNlcnZlX25ld2xpbmVzID09PSB1bmRlZmluZWQpID8gMCA6IHBhcnNlSW50KG9wdGlvbnMubWF4X3ByZXNlcnZlX25ld2xpbmVzLCAxMCk7XG4gICAgICAgICAgICBvcHQuc3BhY2VfaW5fcGFyZW4gPSAob3B0aW9ucy5zcGFjZV9pbl9wYXJlbiA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5zcGFjZV9pbl9wYXJlbjtcbiAgICAgICAgICAgIG9wdC5zcGFjZV9pbl9lbXB0eV9wYXJlbiA9IChvcHRpb25zLnNwYWNlX2luX2VtcHR5X3BhcmVuID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnNwYWNlX2luX2VtcHR5X3BhcmVuO1xuICAgICAgICAgICAgb3B0LmpzbGludF9oYXBweSA9IChvcHRpb25zLmpzbGludF9oYXBweSA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5qc2xpbnRfaGFwcHk7XG4gICAgICAgICAgICBvcHQuc3BhY2VfYWZ0ZXJfYW5vbl9mdW5jdGlvbiA9IChvcHRpb25zLnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24gPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuc3BhY2VfYWZ0ZXJfYW5vbl9mdW5jdGlvbjtcbiAgICAgICAgICAgIG9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uID0gKG9wdGlvbnMua2VlcF9hcnJheV9pbmRlbnRhdGlvbiA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5rZWVwX2FycmF5X2luZGVudGF0aW9uO1xuICAgICAgICAgICAgb3B0LnNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCA9IChvcHRpb25zLnNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnNwYWNlX2JlZm9yZV9jb25kaXRpb25hbDtcbiAgICAgICAgICAgIG9wdC51bmVzY2FwZV9zdHJpbmdzID0gKG9wdGlvbnMudW5lc2NhcGVfc3RyaW5ncyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy51bmVzY2FwZV9zdHJpbmdzO1xuICAgICAgICAgICAgb3B0LndyYXBfbGluZV9sZW5ndGggPSAob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoID09PSB1bmRlZmluZWQpID8gMCA6IHBhcnNlSW50KG9wdGlvbnMud3JhcF9saW5lX2xlbmd0aCwgMTApO1xuICAgICAgICAgICAgb3B0LmU0eCA9IChvcHRpb25zLmU0eCA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5lNHg7XG4gICAgICAgICAgICBvcHQuZW5kX3dpdGhfbmV3bGluZSA9IChvcHRpb25zLmVuZF93aXRoX25ld2xpbmUgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuZW5kX3dpdGhfbmV3bGluZTtcbiAgICAgICAgICAgIG9wdC5jb21tYV9maXJzdCA9IChvcHRpb25zLmNvbW1hX2ZpcnN0ID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmNvbW1hX2ZpcnN0O1xuICAgICAgICAgICAgb3B0Lm9wZXJhdG9yX3Bvc2l0aW9uID0gc2FuaXRpemVPcGVyYXRvclBvc2l0aW9uKG9wdGlvbnMub3BlcmF0b3JfcG9zaXRpb24pO1xuXG4gICAgICAgICAgICAvLyBGb3IgdGVzdGluZyBvZiBiZWF1dGlmeSBpZ25vcmU6c3RhcnQgZGlyZWN0aXZlXG4gICAgICAgICAgICBvcHQudGVzdF9vdXRwdXRfcmF3ID0gKG9wdGlvbnMudGVzdF9vdXRwdXRfcmF3ID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnRlc3Rfb3V0cHV0X3JhdztcblxuICAgICAgICAgICAgLy8gZm9yY2Ugb3B0LnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24gdG8gdHJ1ZSBpZiBvcHQuanNsaW50X2hhcHB5XG4gICAgICAgICAgICBpZiAob3B0LmpzbGludF9oYXBweSkge1xuICAgICAgICAgICAgICAgIG9wdC5zcGFjZV9hZnRlcl9hbm9uX2Z1bmN0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZW50X3dpdGhfdGFicykge1xuICAgICAgICAgICAgICAgIG9wdC5pbmRlbnRfY2hhciA9ICdcXHQnO1xuICAgICAgICAgICAgICAgIG9wdC5pbmRlbnRfc2l6ZSA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHQuZW9sID09PSAnYXV0bycpIHtcbiAgICAgICAgICAgICAgICBvcHQuZW9sID0gJ1xcbic7XG4gICAgICAgICAgICAgICAgaWYgKGpzX3NvdXJjZV90ZXh0ICYmIGFjb3JuLmxpbmVCcmVhay50ZXN0KGpzX3NvdXJjZV90ZXh0IHx8ICcnKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHQuZW9sID0ganNfc291cmNlX3RleHQubWF0Y2goYWNvcm4ubGluZUJyZWFrKVswXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdC5lb2wgPSBvcHQuZW9sLnJlcGxhY2UoL1xcXFxyLywgJ1xccicpLnJlcGxhY2UoL1xcXFxuLywgJ1xcbicpO1xuXG4gICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIGluZGVudF9zdHJpbmcgPSAnJztcbiAgICAgICAgICAgIHdoaWxlIChvcHQuaW5kZW50X3NpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgaW5kZW50X3N0cmluZyArPSBvcHQuaW5kZW50X2NoYXI7XG4gICAgICAgICAgICAgICAgb3B0LmluZGVudF9zaXplIC09IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcmVpbmRlbnRfaW5kZXggPSAwO1xuICAgICAgICAgICAgaWYgKGpzX3NvdXJjZV90ZXh0ICYmIGpzX3NvdXJjZV90ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHdoaWxlICgoanNfc291cmNlX3RleHQuY2hhckF0KHByZWluZGVudF9pbmRleCkgPT09ICcgJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAganNfc291cmNlX3RleHQuY2hhckF0KHByZWluZGVudF9pbmRleCkgPT09ICdcXHQnKSkge1xuICAgICAgICAgICAgICAgICAgICBiYXNlSW5kZW50U3RyaW5nICs9IGpzX3NvdXJjZV90ZXh0LmNoYXJBdChwcmVpbmRlbnRfaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBwcmVpbmRlbnRfaW5kZXggKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganNfc291cmNlX3RleHQgPSBqc19zb3VyY2VfdGV4dC5zdWJzdHJpbmcocHJlaW5kZW50X2luZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGFzdF90eXBlID0gJ1RLX1NUQVJUX0JMT0NLJzsgLy8gbGFzdCB0b2tlbiB0eXBlXG4gICAgICAgICAgICBsYXN0X2xhc3RfdGV4dCA9ICcnOyAvLyBwcmUtbGFzdCB0b2tlbiB0ZXh0XG4gICAgICAgICAgICBvdXRwdXQgPSBuZXcgT3V0cHV0KGluZGVudF9zdHJpbmcsIGJhc2VJbmRlbnRTdHJpbmcpO1xuXG4gICAgICAgICAgICAvLyBJZiB0ZXN0aW5nIHRoZSBpZ25vcmUgZGlyZWN0aXZlLCBzdGFydCB3aXRoIG91dHB1dCBkaXNhYmxlIHNldCB0byB0cnVlXG4gICAgICAgICAgICBvdXRwdXQucmF3ID0gb3B0LnRlc3Rfb3V0cHV0X3JhdztcblxuXG4gICAgICAgICAgICAvLyBTdGFjayBvZiBwYXJzaW5nL2Zvcm1hdHRpbmcgc3RhdGVzLCBpbmNsdWRpbmcgTU9ERS5cbiAgICAgICAgICAgIC8vIFdlIHRva2VuaXplLCBwYXJzZSwgYW5kIG91dHB1dCBpbiBhbiBhbG1vc3QgcHVyZWx5IGEgZm9yd2FyZC1vbmx5IHN0cmVhbSBvZiB0b2tlbiBpbnB1dFxuICAgICAgICAgICAgLy8gYW5kIGZvcm1hdHRlZCBvdXRwdXQuICBUaGlzIG1ha2VzIHRoZSBiZWF1dGlmaWVyIGxlc3MgYWNjdXJhdGUgdGhhbiBmdWxsIHBhcnNlcnNcbiAgICAgICAgICAgIC8vIGJ1dCBhbHNvIGZhciBtb3JlIHRvbGVyYW50IG9mIHN5bnRheCBlcnJvcnMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGUsIHRoZSBkZWZhdWx0IG1vZGUgaXMgTU9ERS5CbG9ja1N0YXRlbWVudC4gSWYgd2Ugc2VlIGEgJ3snIHdlIHB1c2ggYSBuZXcgZnJhbWUgb2YgdHlwZVxuICAgICAgICAgICAgLy8gTU9ERS5CbG9ja1N0YXRlbWVudCBvbiB0aGUgdGhlIHN0YWNrLCBldmVuIHRob3VnaCBpdCBjb3VsZCBiZSBvYmplY3QgbGl0ZXJhbC4gIElmIHdlIGxhdGVyXG4gICAgICAgICAgICAvLyBlbmNvdW50ZXIgYSBcIjpcIiwgd2UnbGwgc3dpdGNoIHRvIHRvIE1PREUuT2JqZWN0TGl0ZXJhbC4gIElmIHdlIHRoZW4gc2VlIGEgXCI7XCIsXG4gICAgICAgICAgICAvLyBtb3N0IGZ1bGwgcGFyc2VycyB3b3VsZCBkaWUsIGJ1dCB0aGUgYmVhdXRpZmllciBncmFjZWZ1bGx5IGZhbGxzIGJhY2sgdG9cbiAgICAgICAgICAgIC8vIE1PREUuQmxvY2tTdGF0ZW1lbnQgYW5kIGNvbnRpbnVlcyBvbi5cbiAgICAgICAgICAgIGZsYWdfc3RvcmUgPSBbXTtcbiAgICAgICAgICAgIHNldF9tb2RlKE1PREUuQmxvY2tTdGF0ZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmJlYXV0aWZ5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAvKmpzaGludCBvbmV2YXI6dHJ1ZSAqL1xuICAgICAgICAgICAgICAgIHZhciBzd2VldF9jb2RlO1xuICAgICAgICAgICAgICAgIFRva2VuaXplciA9IG5ldyB0b2tlbml6ZXIoanNfc291cmNlX3RleHQsIG9wdCwgaW5kZW50X3N0cmluZyk7XG4gICAgICAgICAgICAgICAgdG9rZW5zID0gVG9rZW5pemVyLnRva2VuaXplKCk7XG4gICAgICAgICAgICAgICAgdG9rZW5fcG9zID0gMDtcblxuICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4gPSBnZXRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoY3VycmVudF90b2tlbikge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyc1tjdXJyZW50X3Rva2VuLnR5cGVdKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9sYXN0X3RleHQgPSBmbGFncy5sYXN0X3RleHQ7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfdHlwZSA9IGN1cnJlbnRfdG9rZW4udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MubGFzdF90ZXh0ID0gY3VycmVudF90b2tlbi50ZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgIHRva2VuX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuID0gZ2V0X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dlZXRfY29kZSA9IG91dHB1dC5nZXRfY29kZSgpO1xuICAgICAgICAgICAgICAgIGlmIChvcHQuZW5kX3dpdGhfbmV3bGluZSkge1xuICAgICAgICAgICAgICAgICAgICBzd2VldF9jb2RlICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHQuZW9sICE9PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICBzd2VldF9jb2RlID0gc3dlZXRfY29kZS5yZXBsYWNlKC9bXFxuXS9nLCBvcHQuZW9sKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc3dlZXRfY29kZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhsb2NhbF90b2tlbiwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld2xpbmVzID0gbG9jYWxfdG9rZW4ubmV3bGluZXM7XG4gICAgICAgICAgICAgICAgdmFyIGtlZXBfd2hpdGVzcGFjZSA9IG9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uICYmIGlzX2FycmF5KGZsYWdzLm1vZGUpO1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wX3Rva2VuID0gY3VycmVudF90b2tlbjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGggPSAwOyBoIDwgbG9jYWxfdG9rZW4uY29tbWVudHNfYmVmb3JlLmxlbmd0aDsgaCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjbGVhbmVzdCBoYW5kbGluZyBvZiBpbmxpbmUgY29tbWVudHMgaXMgdG8gdHJlYXQgdGhlbSBhcyB0aG91Z2ggdGhleSBhcmVuJ3QgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIC8vIEp1c3QgY29udGludWUgZm9ybWF0dGluZyBhbmQgdGhlIGJlaGF2aW9yIHNob3VsZCBiZSBsb2dpY2FsLlxuICAgICAgICAgICAgICAgICAgICAvLyBBbHNvIGlnbm9yZSB1bmtub3duIHRva2Vucy4gIEFnYWluLCB0aGlzIHNob3VsZCByZXN1bHQgaW4gYmV0dGVyIGJlaGF2aW9yLlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuID0gbG9jYWxfdG9rZW4uY29tbWVudHNfYmVmb3JlW2hdO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbiwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnNbY3VycmVudF90b2tlbi50eXBlXShwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuID0gdGVtcF90b2tlbjtcblxuICAgICAgICAgICAgICAgIGlmIChrZWVwX3doaXRlc3BhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdsaW5lczsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGkgPiAwLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5tYXhfcHJlc2VydmVfbmV3bGluZXMgJiYgbmV3bGluZXMgPiBvcHQubWF4X3ByZXNlcnZlX25ld2xpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdsaW5lcyA9IG9wdC5tYXhfcHJlc2VydmVfbmV3bGluZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0LnByZXNlcnZlX25ld2xpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxfdG9rZW4ubmV3bGluZXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IG5ld2xpbmVzOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSh0cnVlLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3ZSBjb3VsZCB1c2UganVzdCBzdHJpbmcuc3BsaXQsIGJ1dFxuICAgICAgICAgICAgLy8gSUUgZG9lc24ndCBsaWtlIHJldHVybmluZyBlbXB0eSBzdHJpbmdzXG4gICAgICAgICAgICBmdW5jdGlvbiBzcGxpdF9saW5lYnJlYWtzKHMpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzLnNwbGl0KC9cXHgwZFxceDBhfFxceDBhLyk7XG5cbiAgICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKGFjb3JuLmFsbExpbmVCcmVha3MsICdcXG4nKTtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHMuaW5kZXhPZihcIlxcblwiKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChzLnN1YnN0cmluZygwLCBpZHgpKTtcbiAgICAgICAgICAgICAgICAgICAgcyA9IHMuc3Vic3RyaW5nKGlkeCArIDEpO1xuICAgICAgICAgICAgICAgICAgICBpZHggPSBzLmluZGV4T2YoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG5ld2xpbmVfcmVzdHJpY3RlZF90b2tlbnMgPSBbJ2JyZWFrJywgJ2NvbnRpbnVlJywgJ3JldHVybicsICd0aHJvdyddO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKGZvcmNlX2xpbmV3cmFwKSB7XG4gICAgICAgICAgICAgICAgZm9yY2VfbGluZXdyYXAgPSAoZm9yY2VfbGluZXdyYXAgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IGZvcmNlX2xpbmV3cmFwO1xuXG4gICAgICAgICAgICAgICAgLy8gTmV2ZXIgd3JhcCB0aGUgZmlyc3QgdG9rZW4gb24gYSBsaW5lXG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dC5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNob3VsZFByZXNlcnZlT3JGb3JjZSA9IChvcHQucHJlc2VydmVfbmV3bGluZXMgJiYgY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSkgfHwgZm9yY2VfbGluZXdyYXA7XG4gICAgICAgICAgICAgICAgdmFyIG9wZXJhdG9yTG9naWNBcHBsaWVzID0gaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBUb2tlbml6ZXIucG9zaXRpb25hYmxlX29wZXJhdG9ycykgfHwgaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBUb2tlbml6ZXIucG9zaXRpb25hYmxlX29wZXJhdG9ycyk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3BlcmF0b3JMb2dpY0FwcGxpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNob3VsZFByaW50T3BlcmF0b3JOZXdsaW5lID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgVG9rZW5pemVyLnBvc2l0aW9uYWJsZV9vcGVyYXRvcnMpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5fYXJyYXkob3B0Lm9wZXJhdG9yX3Bvc2l0aW9uLCBPUEVSQVRPUl9QT1NJVElPTl9CRUZPUkVfT1JfUFJFU0VSVkUpXG4gICAgICAgICAgICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFRva2VuaXplci5wb3NpdGlvbmFibGVfb3BlcmF0b3JzKTtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkUHJlc2VydmVPckZvcmNlID0gc2hvdWxkUHJlc2VydmVPckZvcmNlICYmIHNob3VsZFByaW50T3BlcmF0b3JOZXdsaW5lO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmVzZXJ2ZU9yRm9yY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHQud3JhcF9saW5lX2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgbmV3bGluZV9yZXN0cmljdGVkX3Rva2VucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIHRva2VucyBzaG91bGQgbmV2ZXIgaGF2ZSBhIG5ld2xpbmUgaW5zZXJ0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJldHdlZW4gdGhlbSBhbmQgdGhlIGZvbGxvd2luZyBleHByZXNzaW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wb3NlZF9saW5lX2xlbmd0aCA9IG91dHB1dC5jdXJyZW50X2xpbmUuZ2V0X2NoYXJhY3Rlcl9jb3VudCgpICsgY3VycmVudF90b2tlbi50ZXh0Lmxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAgICAgICAob3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA/IDEgOiAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3Bvc2VkX2xpbmVfbGVuZ3RoID49IG9wdC53cmFwX2xpbmVfbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJpbnRfbmV3bGluZShmb3JjZV9uZXdsaW5lLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubGFzdF90ZXh0ICE9PSAnOycgJiYgZmxhZ3MubGFzdF90ZXh0ICE9PSAnLCcgJiYgZmxhZ3MubGFzdF90ZXh0ICE9PSAnPScgJiYgbGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dF90b2tlbiA9IGdldF90b2tlbigxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEoZmxhZ3MuaWZfYmxvY2sgJiYgbmV4dF90b2tlbiAmJiBuZXh0X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgbmV4dF90b2tlbi50ZXh0ID09PSAnZWxzZScpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIWZsYWdzLmRvX2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0LmFkZF9uZXdfbGluZShmb3JjZV9uZXdsaW5lKSkge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5tdWx0aWxpbmVfZnJhbWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJpbnRfdG9rZW5fbGluZV9pbmRlbnRhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0Lmp1c3RfYWRkZWRfbmV3bGluZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiAmJiBpc19hcnJheShmbGFncy5tb2RlKSAmJiBjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuY3VycmVudF9saW5lLnB1c2goY3VycmVudF90b2tlbi53aGl0ZXNwYWNlX2JlZm9yZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0LnNldF9pbmRlbnQoZmxhZ3MuaW5kZW50YXRpb25fbGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5saW5lX2luZGVudF9sZXZlbCA9IGZsYWdzLmluZGVudGF0aW9uX2xldmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmludF90b2tlbihwcmludGFibGVfdG9rZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0LnJhdykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuYWRkX3Jhd190b2tlbihjdXJyZW50X3Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHQuY29tbWFfZmlyc3QgJiYgbGFzdF90eXBlID09PSAnVEtfQ09NTUEnICYmXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0LnByZXZpb3VzX2xpbmUubGFzdCgpID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3BwZWQgPSBvdXRwdXQucHJldmlvdXNfbGluZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBjb21tYSB3YXMgYWxyZWFkeSBhdCB0aGUgc3RhcnQgb2YgdGhlIGxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwdWxsIGJhY2sgb250byB0aGF0IGxpbmUgYW5kIHJlcHJpbnQgdGhlIGluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0LnByZXZpb3VzX2xpbmUuaXNfZW1wdHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wcmV2aW91c19saW5lLnB1c2gocG9wcGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQudHJpbSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuY3VycmVudF9saW5lLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgY29tbWEgaW4gZnJvbnQgb2YgdGhlIG5leHQgdG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuX2xpbmVfaW5kZW50YXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5hZGRfdG9rZW4oJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJpbnRhYmxlX3Rva2VuID0gcHJpbnRhYmxlX3Rva2VuIHx8IGN1cnJlbnRfdG9rZW4udGV4dDtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbl9saW5lX2luZGVudGF0aW9uKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LmFkZF90b2tlbihwcmludGFibGVfdG9rZW4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpbmRlbnQoKSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MuaW5kZW50YXRpb25fbGV2ZWwgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZGVpbmRlbnQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmluZGVudGF0aW9uX2xldmVsID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAoKCFmbGFncy5wYXJlbnQpIHx8IGZsYWdzLmluZGVudGF0aW9uX2xldmVsID4gZmxhZ3MucGFyZW50LmluZGVudGF0aW9uX2xldmVsKSkge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5pbmRlbnRhdGlvbl9sZXZlbCAtPSAxO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzZXRfbW9kZShtb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdfc3RvcmUucHVzaChmbGFncyk7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzX2ZsYWdzID0gZmxhZ3M7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNfZmxhZ3MgPSBjcmVhdGVfZmxhZ3MobnVsbCwgbW9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmxhZ3MgPSBjcmVhdGVfZmxhZ3MocHJldmlvdXNfZmxhZ3MsIG1vZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc19hcnJheShtb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGUgPT09IE1PREUuQXJyYXlMaXRlcmFsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc19leHByZXNzaW9uKG1vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5fYXJyYXkobW9kZSwgW01PREUuRXhwcmVzc2lvbiwgTU9ERS5Gb3JJbml0aWFsaXplciwgTU9ERS5Db25kaXRpb25hbF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXN0b3JlX21vZGUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdfc3RvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncyA9IGZsYWdzO1xuICAgICAgICAgICAgICAgICAgICBmbGFncyA9IGZsYWdfc3RvcmUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c19mbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnJlbW92ZV9yZWR1bmRhbnRfaW5kZW50YXRpb24ocHJldmlvdXNfZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzdGFydF9vZl9vYmplY3RfcHJvcGVydHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZsYWdzLnBhcmVudC5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwgJiYgZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAoZmxhZ3MubGFzdF90ZXh0ID09PSAnOicgJiYgZmxhZ3MudGVybmFyeV9kZXB0aCA9PT0gMCkgfHwgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnZ2V0JywgJ3NldCddKSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzdGFydF9vZl9zdGF0ZW1lbnQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWyd2YXInLCAnbGV0JywgJ2NvbnN0J10pICYmIGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1dPUkQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2RvJykgfHxcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsncmV0dXJuJywgJ3Rocm93J10pICYmICFjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2Vsc2UnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBjdXJyZW50X3Rva2VuLnRleHQgPT09ICdpZicgJiYgIWN1cnJlbnRfdG9rZW4uY29tbWVudHNfYmVmb3JlLmxlbmd0aCkpIHx8XG4gICAgICAgICAgICAgICAgICAgIChsYXN0X3R5cGUgPT09ICdUS19FTkRfRVhQUicgJiYgKHByZXZpb3VzX2ZsYWdzLm1vZGUgPT09IE1PREUuRm9ySW5pdGlhbGl6ZXIgfHwgcHJldmlvdXNfZmxhZ3MubW9kZSA9PT0gTU9ERS5Db25kaXRpb25hbCkpIHx8XG4gICAgICAgICAgICAgICAgICAgIChsYXN0X3R5cGUgPT09ICdUS19XT1JEJyAmJiBmbGFncy5tb2RlID09PSBNT0RFLkJsb2NrU3RhdGVtZW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhZmxhZ3MuaW5fY2FzZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIShjdXJyZW50X3Rva2VuLnRleHQgPT09ICctLScgfHwgY3VycmVudF90b2tlbi50ZXh0ID09PSAnKysnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9sYXN0X3RleHQgIT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4udHlwZSAhPT0gJ1RLX1dPUkQnICYmIGN1cnJlbnRfdG9rZW4udHlwZSAhPT0gJ1RLX1JFU0VSVkVEJykgfHxcbiAgICAgICAgICAgICAgICAgICAgKGZsYWdzLm1vZGUgPT09IE1PREUuT2JqZWN0TGl0ZXJhbCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAoZmxhZ3MubGFzdF90ZXh0ID09PSAnOicgJiYgZmxhZ3MudGVybmFyeV9kZXB0aCA9PT0gMCkgfHwgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnZ2V0JywgJ3NldCddKSkpKVxuICAgICAgICAgICAgICAgICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNldF9tb2RlKE1PREUuU3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4sIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElzc3VlICMyNzY6XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHN0YXJ0aW5nIGEgbmV3IHN0YXRlbWVudCB3aXRoIFtpZiwgZm9yLCB3aGlsZSwgZG9dLCBwdXNoIHRvIGEgbmV3IGxpbmUuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChhKSBpZiAoYikgaWYoYykgZCgpOyBlbHNlIGUoKTsgZWxzZSBmKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RhcnRfb2Zfb2JqZWN0X3Byb3BlcnR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWydkbycsICdmb3InLCAnaWYnLCAnd2hpbGUnXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYWxsX2xpbmVzX3N0YXJ0X3dpdGgobGluZXMsIGMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lID0gdHJpbShsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lLmNoYXJBdCgwKSAhPT0gYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBlYWNoX2xpbmVfbWF0Y2hlc19pbmRlbnQobGluZXMsIGluZGVudCkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gbGluZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBsaW5lO1xuICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAvLyBhbGxvdyBlbXB0eSBsaW5lcyB0byBwYXNzIHRocm91Z2hcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUgJiYgbGluZS5pbmRleE9mKGluZGVudCkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNfc3BlY2lhbF93b3JkKHdvcmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5fYXJyYXkod29yZCwgWydjYXNlJywgJ3JldHVybicsICdkbycsICdpZicsICd0aHJvdycsICdlbHNlJ10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRfdG9rZW4ob2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdG9rZW5fcG9zICsgKG9mZnNldCB8fCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0b2tlbnMubGVuZ3RoKSA/IG51bGwgOiB0b2tlbnNbaW5kZXhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc3RhcnRfZXhwcigpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgaWYgKCFzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5leHRfbW9kZSA9IE1PREUuRXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnWycpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfV09SRCcgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgYXJyYXkgaW5kZXggc3BlY2lmaWVyLCBicmVhayBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYVt4XSwgZm4oKVt4XVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFRva2VuaXplci5saW5lX3N0YXJ0ZXJzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0X21vZGUobmV4dF9tb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHQuc3BhY2VfaW5fcGFyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG5leHRfbW9kZSA9IE1PREUuQXJyYXlMaXRlcmFsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNfYXJyYXkoZmxhZ3MubW9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5sYXN0X3RleHQgPT09ICdbJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmbGFncy5sYXN0X3RleHQgPT09ICcsJyAmJiAobGFzdF9sYXN0X3RleHQgPT09ICddJyB8fCBsYXN0X2xhc3RfdGV4dCA9PT0gJ30nKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBdLCBbIGdvZXMgdG8gbmV3IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9LCBbIGdvZXMgdG8gbmV3IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgZmxhZ3MubGFzdF90ZXh0ID09PSAnZm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dF9tb2RlID0gTU9ERS5Gb3JJbml0aWFsaXplcjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ2lmJywgJ3doaWxlJ10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0X21vZGUgPSBNT0RFLkNvbmRpdGlvbmFsO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dF9tb2RlID0gTU9ERS5FeHByZXNzaW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJzsnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJykge1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfRVhQUicgfHwgbGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgfHwgbGFzdF90eXBlID09PSAnVEtfRU5EX0JMT0NLJyB8fCBmbGFncy5sYXN0X3RleHQgPT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciB3aGV0aGVyIGZvcmNpbmcgdGhpcyBpcyByZXF1aXJlZC4gIFJldmlldyBmYWlsaW5nIHRlc3RzIHdoZW4gcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZyBvbiAoKCBhbmQgKSggYW5kIF1bIGFuZCBdKCBhbmQgLihcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJygnKSAmJiBsYXN0X3R5cGUgIT09ICdUS19XT1JEJyAmJiBsYXN0X3R5cGUgIT09ICdUS19PUEVSQVRPUicpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIChmbGFncy5sYXN0X3dvcmQgPT09ICdmdW5jdGlvbicgfHwgZmxhZ3MubGFzdF93b3JkID09PSAndHlwZW9mJykpIHx8XG4gICAgICAgICAgICAgICAgICAgIChmbGFncy5sYXN0X3RleHQgPT09ICcqJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KGxhc3RfbGFzdF90ZXh0LCBbJ2Z1bmN0aW9uJywgJ3lpZWxkJ10pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZsYWdzLm1vZGUgPT09IE1PREUuT2JqZWN0TGl0ZXJhbCAmJiBpbl9hcnJheShsYXN0X2xhc3RfdGV4dCwgWyd7JywgJywnXSkpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZnVuY3Rpb24oKSB2cyBmdW5jdGlvbiAoKVxuICAgICAgICAgICAgICAgICAgICAvLyB5aWVsZCooKSB2cyB5aWVsZCogKClcbiAgICAgICAgICAgICAgICAgICAgLy8gZnVuY3Rpb24qKCkgdnMgZnVuY3Rpb24qICgpXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHQuc3BhY2VfYWZ0ZXJfYW5vbl9mdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiAoaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBUb2tlbml6ZXIubGluZV9zdGFydGVycykgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnY2F0Y2gnKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTaG91bGQgYmUgYSBzcGFjZSBiZXR3ZWVuIGF3YWl0IGFuZCBhbiBJSUZFXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJygnICYmIGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBmbGFncy5sYXN0X3dvcmQgPT09ICdhd2FpdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBvZiB0aGlzIGtpbmQgb2YgbmV3bGluZSBwcmVzZXJ2YXRpb24uXG4gICAgICAgICAgICAgICAgLy8gYSA9IChiICYmXG4gICAgICAgICAgICAgICAgLy8gICAgIChjIHx8IGQpKTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnKCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0VRVUFMUycgfHwgbGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0X29mX29iamVjdF9wcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBwcmVzZXJ2aW5nIHdyYXBwZWQgYXJyb3cgZnVuY3Rpb24gZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAvLyBhLmIoJ2MnLFxuICAgICAgICAgICAgICAgIC8vICAgICAoKSA9PiBkLmVcbiAgICAgICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJygnICYmIGxhc3RfdHlwZSAhPT0gJ1RLX1dPUkQnICYmIGxhc3RfdHlwZSAhPT0gJ1RLX1JFU0VSVkVEJykge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2V0X21vZGUobmV4dF9tb2RlKTtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIGlmIChvcHQuc3BhY2VfaW5fcGFyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gYWxsIGNhc2VzLCBpZiB3ZSBuZXdsaW5lIHdoaWxlIGluc2lkZSBhbiBleHByZXNzaW9uIGl0IHNob3VsZCBiZSBpbmRlbnRlZC5cbiAgICAgICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX2VuZF9leHByKCkge1xuICAgICAgICAgICAgICAgIC8vIHN0YXRlbWVudHMgaW5zaWRlIGV4cHJlc3Npb25zIGFyZSBub3QgdmFsaWQgc3ludGF4LCBidXQuLi5cbiAgICAgICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIG11c3QgYWxsIGJlIGNsb3NlZCB3aGVuIHRoZWlyIGNvbnRhaW5lciBjbG9zZXNcbiAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLm11bHRpbGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ10nICYmIGlzX2FycmF5KGZsYWdzLm1vZGUpICYmICFvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdC5zcGFjZV9pbl9wYXJlbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgJiYgIW9wdC5zcGFjZV9pbl9lbXB0eV9wYXJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKCkgW10gbm8gaW5uZXIgc3BhY2UgaW4gZW1wdHkgcGFyZW5zIGxpa2UgdGhlc2UsIGV2ZXIsIHJlZiAjMzIwXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ10nICYmIG9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQucmVtb3ZlX3JlZHVuZGFudF9pbmRlbnRhdGlvbihwcmV2aW91c19mbGFncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBkbyB7fSB3aGlsZSAoKSAvLyBubyBzdGF0ZW1lbnQgcmVxdWlyZWQgYWZ0ZXJcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuZG9fd2hpbGUgJiYgcHJldmlvdXNfZmxhZ3MubW9kZSA9PT0gTU9ERS5Db25kaXRpb25hbCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncy5tb2RlID0gTU9ERS5FeHByZXNzaW9uO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5kb19ibG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5kb193aGlsZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc3RhcnRfYmxvY2soKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBzaG91bGQgYmUgdHJlYXRlZCBhcyBhIE9iamVjdExpdGVyYWxcbiAgICAgICAgICAgICAgICB2YXIgbmV4dF90b2tlbiA9IGdldF90b2tlbigxKTtcbiAgICAgICAgICAgICAgICB2YXIgc2Vjb25kX3Rva2VuID0gZ2V0X3Rva2VuKDIpO1xuICAgICAgICAgICAgICAgIGlmIChzZWNvbmRfdG9rZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KHNlY29uZF90b2tlbi50ZXh0LCBbJzonLCAnLCddKSAmJiBpbl9hcnJheShuZXh0X3Rva2VuLnR5cGUsIFsnVEtfU1RSSU5HJywgJ1RLX1dPUkQnLCAnVEtfUkVTRVJWRUQnXSkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoaW5fYXJyYXkobmV4dF90b2tlbi50ZXh0LCBbJ2dldCcsICdzZXQnLCAnLi4uJ10pICYmIGluX2FycmF5KHNlY29uZF90b2tlbi50eXBlLCBbJ1RLX1dPUkQnLCAnVEtfUkVTRVJWRUQnXSkpXG4gICAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3Qgc3VwcG9ydCBUeXBlU2NyaXB0LGJ1dCB3ZSBkaWRuJ3QgYnJlYWsgaXQgZm9yIGEgdmVyeSBsb25nIHRpbWUuXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlJ2xsIHRyeSB0byBrZWVwIG5vdCBicmVha2luZyBpdC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbl9hcnJheShsYXN0X2xhc3RfdGV4dCwgWydjbGFzcycsICdpbnRlcmZhY2UnXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldF9tb2RlKE1PREUuT2JqZWN0TGl0ZXJhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJz0+Jykge1xuICAgICAgICAgICAgICAgICAgICAvLyBhcnJvdyBmdW5jdGlvbjogKHBhcmFtMSwgcGFyYW1OKSA9PiB7IHN0YXRlbWVudHMgfVxuICAgICAgICAgICAgICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluX2FycmF5KGxhc3RfdHlwZSwgWydUS19FUVVBTFMnLCAnVEtfU1RBUlRfRVhQUicsICdUS19DT01NQScsICdUS19PUEVSQVRPUiddKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWydyZXR1cm4nLCAndGhyb3cnLCAnaW1wb3J0JywgJ2RlZmF1bHQnXSkpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyBzaG9ydGhhbmQgZnVuY3Rpb24gc3ludGF4IGlzIGRpZmZpY3VsdCBieSBzY2FubmluZyBmb3J3YXJkLFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgc28gY2hlY2sgdGhlIHN1cnJvdW5kaW5nIGNvbnRleHQuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBibG9jayBpcyBiZWluZyByZXR1cm5lZCwgaW1wb3J0ZWQsIGV4cG9ydCBkZWZhdWx0LCBwYXNzZWQgYXMgYXJnLFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYXNzaWduZWQgd2l0aCA9IG9yIGFzc2lnbmVkIGluIGEgbmVzdGVkIG9iamVjdCwgdHJlYXQgYXMgYW4gT2JqZWN0TGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgc2V0X21vZGUoTU9ERS5PYmplY3RMaXRlcmFsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZW1wdHlfYnJhY2VzID0gIW5leHRfdG9rZW4uY29tbWVudHNfYmVmb3JlLmxlbmd0aCAmJiBuZXh0X3Rva2VuLnRleHQgPT09ICd9JztcbiAgICAgICAgICAgICAgICB2YXIgZW1wdHlfYW5vbnltb3VzX2Z1bmN0aW9uID0gZW1wdHlfYnJhY2VzICYmIGZsYWdzLmxhc3Rfd29yZCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICAgICAgICAgICBsYXN0X3R5cGUgPT09ICdUS19FTkRfRVhQUic7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0LmJyYWNlX3ByZXNlcnZlX2lubGluZSkgLy8gY2hlY2sgZm9yIGlubGluZSwgc2V0IGlubGluZV9mcmFtZSBpZiBzb1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIGZvcndhcmQgZm9yIGEgbmV3bGluZSB3YW50ZWQgaW5zaWRlIHRoaXMgYmxvY2tcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrX3Rva2VuID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW5saW5lX2ZyYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX3Rva2VuID0gZ2V0X3Rva2VuKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGVja190b2tlbi53YW50ZWRfbmV3bGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmlubGluZV9mcmFtZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChjaGVja190b2tlbi50eXBlICE9PSAnVEtfRU9GJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIShjaGVja190b2tlbi50eXBlID09PSAnVEtfRU5EX0JMT0NLJyAmJiBjaGVja190b2tlbi5vcGVuZWQgPT09IGN1cnJlbnRfdG9rZW4pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmRcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJub25lXCIgJiYgY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSkpICYmXG4gICAgICAgICAgICAgICAgICAgICFmbGFncy5pbmxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSAhPT0gJ1RLX09QRVJBVE9SJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGVtcHR5X2Fub255bW91c19mdW5jdGlvbiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RfdHlwZSA9PT0gJ1RLX0VRVUFMUycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGlzX3NwZWNpYWxfd29yZChmbGFncy5sYXN0X3RleHQpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJ2Vsc2UnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBjb2xsYXBzZSB8fCBpbmxpbmVfZnJhbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzX2FycmF5KHByZXZpb3VzX2ZsYWdzLm1vZGUpICYmIChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9FWFBSJyB8fCBsYXN0X3R5cGUgPT09ICdUS19DT01NQScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfQ09NTUEnIHx8IG9wdC5zcGFjZV9pbl9wYXJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfQ09NTUEnIHx8IChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9FWFBSJyAmJiBmbGFncy5pbmxpbmVfZnJhbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzX2ZsYWdzLm11bHRpbGluZV9mcmFtZSA9IHByZXZpb3VzX2ZsYWdzLm11bHRpbGluZV9mcmFtZSB8fCBmbGFncy5tdWx0aWxpbmVfZnJhbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MubXVsdGlsaW5lX2ZyYW1lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSAhPT0gJ1RLX09QRVJBVE9SJyAmJiBsYXN0X3R5cGUgIT09ICdUS19TVEFSVF9FWFBSJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJyAmJiAhZmxhZ3MuaW5saW5lX2ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIGluZGVudCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfZW5kX2Jsb2NrKCkge1xuICAgICAgICAgICAgICAgIC8vIHN0YXRlbWVudHMgbXVzdCBhbGwgYmUgY2xvc2VkIHdoZW4gdGhlaXIgY29udGFpbmVyIGNsb3Nlc1xuICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZW1wdHlfYnJhY2VzID0gbGFzdF90eXBlID09PSAnVEtfU1RBUlRfQkxPQ0snO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmlubGluZV9mcmFtZSAmJiAhZW1wdHlfYnJhY2VzKSB7IC8vIHRyeSBpbmxpbmVfZnJhbWUgKG9ubHkgc2V0IGlmIG9wdC5icmFjZXMtcHJlc2VydmUtaW5saW5lKSBmaXJzdFxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmRcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWVtcHR5X2JyYWNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCB7fVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWVtcHR5X2JyYWNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzX2FycmF5KGZsYWdzLm1vZGUpICYmIG9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UgUkVBTExZIG5lZWQgYSBuZXdsaW5lIGhlcmUsIGJ1dCBuZXdsaW5lciB3b3VsZCBza2lwIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV93b3JkKCkge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWydzZXQnLCAnZ2V0J10pICYmIGZsYWdzLm1vZGUgIT09IE1PREUuT2JqZWN0TGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF90b2tlbi50eXBlID0gJ1RLX1dPUkQnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWydhcycsICdmcm9tJ10pICYmICFmbGFncy5pbXBvcnRfYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4udHlwZSA9ICdUS19XT1JEJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbGFncy5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0X3Rva2VuID0gZ2V0X3Rva2VuKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRfdG9rZW4udGV4dCA9PT0gJzonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF90b2tlbi50eXBlID0gJ1RLX1dPUkQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCddKSAmJiBjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19XT1JEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZGVjbGFyYXRpb25fc3RhdGVtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSAmJiAhaXNfZXhwcmVzc2lvbihmbGFncy5tb2RlKSAmJlxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InIHx8IChmbGFncy5sYXN0X3RleHQgPT09ICctLScgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnKysnKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgbGFzdF90eXBlICE9PSAnVEtfRVFVQUxTJyAmJlxuICAgICAgICAgICAgICAgICAgICAob3B0LnByZXNlcnZlX25ld2xpbmVzIHx8ICEobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWyd2YXInLCAnbGV0JywgJ2NvbnN0JywgJ3NldCcsICdnZXQnXSkpKSkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmRvX2Jsb2NrICYmICFmbGFncy5kb193aGlsZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ3doaWxlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG8ge30gIyMgd2hpbGUgKClcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZG9fd2hpbGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG8ge30gc2hvdWxkIGFsd2F5cyBoYXZlIHdoaWxlIGFzIHRoZSBuZXh0IHdvcmQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBkb24ndCBzZWUgdGhlIGV4cGVjdGVkIHdoaWxlLCByZWNvdmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5kb19ibG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaWYgbWF5IGJlIGZvbGxvd2VkIGJ5IGVsc2UsIG9yIG5vdFxuICAgICAgICAgICAgICAgIC8vIEJhcmUvaW5saW5lIGlmcyBhcmUgdHJpY2t5XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byB1bndpbmQgdGhlIG1vZGVzIGNvcnJlY3RseTogaWYgKGEpIGlmIChiKSBjKCk7IGVsc2UgZCgpOyBlbHNlIGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuaWZfYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFncy5lbHNlX2Jsb2NrICYmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgY3VycmVudF90b2tlbi50ZXh0ID09PSAnZWxzZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5lbHNlX2Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaWZfYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmVsc2VfYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ2Nhc2UnIHx8IChjdXJyZW50X3Rva2VuLnRleHQgPT09ICdkZWZhdWx0JyAmJiBmbGFncy5pbl9jYXNlX3N0YXRlbWVudCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsYWdzLmNhc2VfYm9keSB8fCBvcHQuanNsaW50X2hhcHB5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzd2l0Y2ggY2FzZXMgZm9sbG93aW5nIG9uZSBhbm90aGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWluZGVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuY2FzZV9ib2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW5fY2FzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmluX2Nhc2Vfc3RhdGVtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19DT01NQScgfHwgbGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgfHwgbGFzdF90eXBlID09PSAnVEtfRVFVQUxTJyB8fCBsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGFydF9vZl9vYmplY3RfcHJvcGVydHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBjdXJyZW50X3Rva2VuLnRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWyd9JywgJzsnXSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChvdXRwdXQuanVzdF9hZGRlZF9uZXdsaW5lKCkgJiYgIShpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnKCcsICdbJywgJ3snLCAnOicsICc9JywgJywnXSkgfHwgbGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBpcyBhIG5pY2UgY2xlYW4gc3BhY2Ugb2YgYXQgbGVhc3Qgb25lIGJsYW5rIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJlZm9yZSBhIG5ldyBmdW5jdGlvbiBkZWZpbml0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW91dHB1dC5qdXN0X2FkZGVkX2JsYW5rbGluZSgpICYmICFjdXJyZW50X3Rva2VuLmNvbW1lbnRzX2JlZm9yZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1dPUkQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWydnZXQnLCAnc2V0JywgJ25ldycsICdyZXR1cm4nLCAnZXhwb3J0JywgJ2FzeW5jJ10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICdkZWZhdWx0JyAmJiBsYXN0X2xhc3RfdGV4dCA9PT0gJ2V4cG9ydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJyB8fCBmbGFncy5sYXN0X3RleHQgPT09ICc9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9vID0gZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFmbGFncy5tdWx0aWxpbmVfZnJhbWUgJiYgKGlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkgfHwgaXNfYXJyYXkoZmxhZ3MubW9kZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAoZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmxhc3Rfd29yZCA9IGN1cnJlbnRfdG9rZW4udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdOT05FJztcblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfQkxPQ0snKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzX2ZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnZWxzZScsICdjYXRjaCcsICdmaW5hbGx5JywgJ2Zyb20nXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0LmJyYWNlX3N0eWxlID09PSBcImV4cGFuZFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmJyYWNlX3N0eWxlID09PSBcImVuZC1leHBhbmRcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvcHQuYnJhY2Vfc3R5bGUgPT09IFwibm9uZVwiICYmIGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnU1BBQ0UnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TRU1JQ09MT04nICYmIGZsYWdzLm1vZGUgPT09IE1PREUuQmxvY2tTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogU2hvdWxkIHRoaXMgYmUgZm9yIFNUQVRFTUVOVCBhcyB3ZWxsP1xuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TRU1JQ09MT04nICYmIGlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1NUUklORycpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1dPUkQnIHx8XG4gICAgICAgICAgICAgICAgICAgIChmbGFncy5sYXN0X3RleHQgPT09ICcqJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KGxhc3RfbGFzdF90ZXh0LCBbJ2Z1bmN0aW9uJywgJ3lpZWxkJ10pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZsYWdzLm1vZGUgPT09IE1PREUuT2JqZWN0TGl0ZXJhbCAmJiBpbl9hcnJheShsYXN0X2xhc3RfdGV4dCwgWyd7JywgJywnXSkpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuaW5saW5lX2ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnU1BBQ0UnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfRVhQUicpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgVG9rZW5pemVyLmxpbmVfc3RhcnRlcnMpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5pbmxpbmVfZnJhbWUgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnZWxzZScgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnZXhwb3J0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnZWxzZScsICdjYXRjaCcsICdmaW5hbGx5J10pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoIShsYXN0X3R5cGUgPT09ICdUS19FTkRfQkxPQ0snICYmIHByZXZpb3VzX2ZsYWdzLm1vZGUgPT09IE1PREUuQmxvY2tTdGF0ZW1lbnQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmJyYWNlX3N0eWxlID09PSBcImV4cGFuZFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmJyYWNlX3N0eWxlID09PSBcImVuZC1leHBhbmRcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvcHQuYnJhY2Vfc3R5bGUgPT09IFwibm9uZVwiICYmIGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIWZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnRyaW0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IG91dHB1dC5jdXJyZW50X2xpbmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSB0cmltbWVkIGFuZCB0aGVyZSdzIHNvbWV0aGluZyBvdGhlciB0aGFuIGEgY2xvc2UgYmxvY2sgYmVmb3JlIHVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwdXQgYSBuZXdsaW5lIGJhY2sgaW4uICBIYW5kbGVzICd9IC8vIGNvbW1lbnQnIHNjZW5hcmlvLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUubGFzdCgpICE9PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJlZml4ID09PSAnTkVXTElORScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpc19zcGVjaWFsX3dvcmQoZmxhZ3MubGFzdF90ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbmV3bGluZSBiZXR3ZWVuICdyZXR1cm4gbm5uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlICE9PSAnVEtfRU5EX0VYUFInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGxhc3RfdHlwZSAhPT0gJ1RLX1NUQVJUX0VYUFInIHx8ICEoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWyd2YXInLCAnbGV0JywgJ2NvbnN0J10pKSkgJiYgZmxhZ3MubGFzdF90ZXh0ICE9PSAnOicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBuZWVkIHRvIGZvcmNlIG5ld2xpbmUgb24gJ3Zhcic6IGZvciAodmFyIHggPSAwLi4uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgY3VycmVudF90b2tlbi50ZXh0ID09PSAnaWYnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2Vsc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG5ld2xpbmUgZm9yIH0gZWxzZSBpZiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgVG9rZW5pemVyLmxpbmVfc3RhcnRlcnMpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZsYWdzLm11bHRpbGluZV9mcmFtZSAmJiBpc19hcnJheShmbGFncy5tb2RlKSAmJiBmbGFncy5sYXN0X3RleHQgPT09ICcsJyAmJiBsYXN0X2xhc3RfdGV4dCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTsgLy8gfSwgaW4gbGlzdHMgZ2V0IGEgbmV3bGluZSB0cmVhdG1lbnRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZWZpeCA9PT0gJ1NQQUNFJykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBmbGFncy5sYXN0X3dvcmQgPSBjdXJyZW50X3Rva2VuLnRleHQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICdkbycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmRvX2Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICdpZicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmlmX2Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICdpbXBvcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5pbXBvcnRfYmxvY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZsYWdzLmltcG9ydF9ibG9jayAmJiBjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgY3VycmVudF90b2tlbi50ZXh0ID09PSAnZnJvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmltcG9ydF9ibG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc2VtaWNvbG9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNlbWljb2xvbiBjYW4gYmUgdGhlIHN0YXJ0IChhbmQgZW5kKSBvZiBhIHN0YXRlbWVudFxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBuZXh0X3Rva2VuID0gZ2V0X3Rva2VuKDEpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAhKGZsYWdzLmlmX2Jsb2NrICYmIG5leHRfdG9rZW4gJiYgbmV4dF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIG5leHRfdG9rZW4udGV4dCA9PT0gJ2Vsc2UnKSAmJlxuICAgICAgICAgICAgICAgICAgICAhZmxhZ3MuZG9fYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaGFja3kgYnV0IGVmZmVjdGl2ZSBmb3IgdGhlIG1vbWVudFxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5pbXBvcnRfYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW1wb3J0X2Jsb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9zdHJpbmcoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gT25lIGRpZmZlcmVuY2UgLSBzdHJpbmdzIHdhbnQgYXQgbGVhc3QgYSBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1dPUkQnIHx8IGZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfQ09NTUEnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX0VRVUFMUycgfHwgbGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0X29mX29iamVjdF9wcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9lcXVhbHMoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmRlY2xhcmF0aW9uX3N0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IGdvdCBhbiAnPScgaW4gYSB2YXItbGluZSwgZGlmZmVyZW50IGZvcm1hdHRpbmcvbGluZS1icmVha2luZywgZXRjIHdpbGwgbm93IGJlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZGVjbGFyYXRpb25fYXNzaWdubWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9jb21tYSgpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbiwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChmbGFncy5kZWNsYXJhdGlvbl9zdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzX2V4cHJlc3Npb24oZmxhZ3MucGFyZW50Lm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3QgYnJlYWsgb24gY29tbWEsIGZvcih2YXIgYSA9IDEsIGIgPSAyKVxuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZGVjbGFyYXRpb25fYXNzaWdubWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsYWdzLmRlY2xhcmF0aW9uX2Fzc2lnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmRlY2xhcmF0aW9uX2Fzc2lnbm1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdC5jb21tYV9maXJzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGNvbW1hLWZpcnN0LCB3ZSB3YW50IHRvIGFsbG93IGEgbmV3bGluZSBiZWZvcmUgdGhlIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB0dXJuIGludG8gYSBuZXdsaW5lIGFmdGVyIHRoZSBjb21tYSwgd2hpY2ggd2Ugd2lsbCBmaXh1cCBsYXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbGFncy5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwgfHxcbiAgICAgICAgICAgICAgICAgICAgKGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50ICYmIGZsYWdzLnBhcmVudC5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHQuY29tbWFfZmlyc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRVhQUiBvciBET19CTE9DS1xuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgY29tbWEtZmlyc3QsIHdlIHdhbnQgdG8gYWxsb3cgYSBuZXdsaW5lIGJlZm9yZSB0aGUgY29tbWFcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gdHVybiBpbnRvIGEgbmV3bGluZSBhZnRlciB0aGUgY29tbWEsIHdoaWNoIHdlIHdpbGwgZml4dXAgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX29wZXJhdG9yKCkge1xuICAgICAgICAgICAgICAgIHZhciBpc0dlbmVyYXRvckFzdGVyaXNrID0gY3VycmVudF90b2tlbi50ZXh0ID09PSAnKicgJiZcbiAgICAgICAgICAgICAgICAgICAgKChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ2Z1bmN0aW9uJywgJ3lpZWxkJ10pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KGxhc3RfdHlwZSwgWydUS19TVEFSVF9CTE9DSycsICdUS19DT01NQScsICdUS19FTkRfQkxPQ0snLCAnVEtfU0VNSUNPTE9OJ10pKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHZhciBpc1VuYXJ5ID0gaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBbJy0nLCAnKyddKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgIGluX2FycmF5KGxhc3RfdHlwZSwgWydUS19TVEFSVF9CTE9DSycsICdUS19TVEFSVF9FWFBSJywgJ1RLX0VRVUFMUycsICdUS19PUEVSQVRPUiddKSB8fFxuICAgICAgICAgICAgICAgICAgICBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFRva2VuaXplci5saW5lX3N0YXJ0ZXJzKSB8fFxuICAgICAgICAgICAgICAgICAgICBmbGFncy5sYXN0X3RleHQgPT09ICcsJ1xuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRfb2Zfc3RhdGVtZW50KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNvbmRpdGlvbmFsIHN0YXJ0cyB0aGUgc3RhdGVtZW50IGlmIGFwcHJvcHJpYXRlLlxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MgPSAhaXNHZW5lcmF0b3JBc3RlcmlzaztcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4sIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpc19zcGVjaWFsX3dvcmQoZmxhZ3MubGFzdF90ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBcInJldHVyblwiIGhhZCBhIHNwZWNpYWwgaGFuZGxpbmcgaW4gVEtfV09SRC4gTm93IHdlIG5lZWQgdG8gcmV0dXJuIHRoZSBmYXZvclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGhhY2sgZm9yIGFjdGlvbnNjcmlwdCdzIGltcG9ydCAuKjtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnKicgJiYgbGFzdF90eXBlID09PSAnVEtfRE9UJykge1xuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJzo6Jykge1xuICAgICAgICAgICAgICAgICAgICAvLyBubyBzcGFjZXMgYXJvdW5kIGV4b3RpYyBuYW1lc3BhY2luZyBzeW50YXggb3BlcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFsbG93IGxpbmUgd3JhcHBpbmcgYmV0d2VlbiBvcGVyYXRvcnMgd2hlbiBvcGVyYXRvcl9wb3NpdGlvbiBpc1xuICAgICAgICAgICAgICAgIC8vICAgc2V0IHRvIGJlZm9yZSBvciBwcmVzZXJ2ZVxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicgJiYgaW5fYXJyYXkob3B0Lm9wZXJhdG9yX3Bvc2l0aW9uLCBPUEVSQVRPUl9QT1NJVElPTl9CRUZPUkVfT1JfUFJFU0VSVkUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnOicgJiYgZmxhZ3MuaW5fY2FzZSkge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5jYXNlX2JvZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5pbl9jYXNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VfYmVmb3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VfYWZ0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHZhciBpbl90ZXJuYXJ5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJzonKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy50ZXJuYXJ5X2RlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvbiBpcyBpbnZhbGlkIGphdmFzY3JpcHQgb3V0c2lkZSBvZiB0ZXJuYXJ5IGFuZCBvYmplY3QsIGJ1dCBkbyBvdXIgYmVzdCB0byBndWVzcyB3aGF0IHdhcyBtZWFudC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MudGVybmFyeV9kZXB0aCAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5fdGVybmFyeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJz8nKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLnRlcm5hcnlfZGVwdGggKz0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBsZXQncyBoYW5kbGUgdGhlIG9wZXJhdG9yX3Bvc2l0aW9uIG9wdGlvbiBwcmlvciB0byBhbnkgY29uZmxpY3RpbmcgbG9naWNcbiAgICAgICAgICAgICAgICBpZiAoIWlzVW5hcnkgJiYgIWlzR2VuZXJhdG9yQXN0ZXJpc2sgJiYgb3B0LnByZXNlcnZlX25ld2xpbmVzICYmIGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgVG9rZW5pemVyLnBvc2l0aW9uYWJsZV9vcGVyYXRvcnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0NvbG9uID0gY3VycmVudF90b2tlbi50ZXh0ID09PSAnOic7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc1Rlcm5hcnlDb2xvbiA9IChpc0NvbG9uICYmIGluX3Rlcm5hcnkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNPdGhlckNvbG9uID0gKGlzQ29sb24gJiYgIWluX3Rlcm5hcnkpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAob3B0Lm9wZXJhdG9yX3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIE9QRVJBVE9SX1BPU0lUSU9OLmJlZm9yZV9uZXdsaW5lOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBjdXJyZW50IHRva2VuIGlzIDogYW5kIGl0J3Mgbm90IGEgdGVybmFyeSBzdGF0ZW1lbnQgdGhlbiB3ZSBzZXQgc3BhY2VfYmVmb3JlIHRvIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9ICFpc090aGVyQ29sb247XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0NvbG9uIHx8IGlzVGVybmFyeUNvbG9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgT1BFUkFUT1JfUE9TSVRJT04uYWZ0ZXJfbmV3bGluZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgY3VycmVudCB0b2tlbiBpcyBhbnl0aGluZyBidXQgY29sb24sIG9yICh2aWEgZGVkdWN0aW9uKSBpdCdzIGEgY29sb24gYW5kIGluIGEgdGVybmFyeSBzdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB0aGVuIHByaW50IGEgbmV3bGluZS5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0NvbG9uIHx8IGlzVGVybmFyeUNvbG9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRfdG9rZW4oMSkud2FudGVkX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgT1BFUkFUT1JfUE9TSVRJT04ucHJlc2VydmVfbmV3bGluZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzT3RoZXJDb2xvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UganVzdCBhZGRlZCBhIG5ld2xpbmUsIG9yIHRoZSBjdXJyZW50IHRva2VuIGlzIDogYW5kIGl0J3Mgbm90IGEgdGVybmFyeSBzdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB0aGVuIHdlIHNldCBzcGFjZV9iZWZvcmUgdG8gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSAhKG91dHB1dC5qdXN0X2FkZGVkX25ld2xpbmUoKSB8fCBpc090aGVyQ29sb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHNwYWNlX2JlZm9yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc0dlbmVyYXRvckFzdGVyaXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0X3Rva2VuID0gZ2V0X3Rva2VuKDEpO1xuICAgICAgICAgICAgICAgICAgICBzcGFjZV9hZnRlciA9IG5leHRfdG9rZW4gJiYgaW5fYXJyYXkobmV4dF90b2tlbi50eXBlLCBbJ1RLX1dPUkQnLCAnVEtfUkVTRVJWRUQnXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICcuLi4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gbGFzdF90eXBlID09PSAnVEtfU1RBUlRfQkxPQ0snO1xuICAgICAgICAgICAgICAgICAgICBzcGFjZV9hZnRlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBbJy0tJywgJysrJywgJyEnLCAnfiddKSB8fCBpc1VuYXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVuYXJ5IG9wZXJhdG9ycyAoYW5kIGJpbmFyeSArLy0gcHJldGVuZGluZyB0byBiZSB1bmFyeSkgc3BlY2lhbCBjYXNlc1xuXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzcGFjZV9hZnRlciA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi81LjEvI3NlYy03LjkuMVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIG5ld2xpbmUgYmV0d2VlbiAtLSBvciArKyBhbmQgYW55dGhpbmcgZWxzZSB3ZSBzaG91bGQgcHJlc2VydmUgaXQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lICYmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICctLScgfHwgY3VycmVudF90b2tlbi50ZXh0ID09PSAnKysnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubGFzdF90ZXh0ID09PSAnOycgJiYgaXNfZXhwcmVzc2lvbihmbGFncy5tb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yICg7OyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgXl5eXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfRVhQUicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9ICEoZmxhZ3MubGFzdF90ZXh0ID09PSAnXScgJiYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJy0tJyB8fCBjdXJyZW50X3Rva2VuLnRleHQgPT09ICcrKycpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGErKyArICsrYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgLSAtYlxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBbJy0tJywgJy0nLCAnKysnLCAnKyddKSAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnLS0nLCAnLScsICcrKycsICcrJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKyBhbmQgLSBhcmUgbm90IHVuYXJ5IHdoZW4gcHJlY2VlZGVkIGJ5IC0tIG9yICsrIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhLS0gKyBiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhICogK2JcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgLSAtYlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWycrJywgJy0nXSkgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJy0tJywgJysrJ10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VfYWZ0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICBpZiAoKChmbGFncy5tb2RlID09PSBNT0RFLkJsb2NrU3RhdGVtZW50ICYmICFmbGFncy5pbmxpbmVfZnJhbWUpIHx8IGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50KSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJ3snIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJzsnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8geyBmb287IC0taSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb28oKTsgLS1iYXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiB8fCBzcGFjZV9iZWZvcmU7XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gc3BhY2VfYWZ0ZXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9ibG9ja19jb21tZW50KHByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQucmF3KSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5hZGRfcmF3X3Rva2VuKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi5kaXJlY3RpdmVzICYmIGN1cnJlbnRfdG9rZW4uZGlyZWN0aXZlcy5wcmVzZXJ2ZSA9PT0gJ2VuZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlJ3JlIHRlc3RpbmcgdGhlIHJhdyBvdXRwdXQgYmVoYXZpb3IsIGRvIG5vdCBhbGxvdyBhIGRpcmVjdGl2ZSB0byB0dXJuIGl0IG9mZi5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5yYXcgPSBvcHQudGVzdF9vdXRwdXRfcmF3O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi5kaXJlY3RpdmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLmRpcmVjdGl2ZXMucHJlc2VydmUgPT09ICdzdGFydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5yYXcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaW5saW5lIGJsb2NrXG4gICAgICAgICAgICAgICAgaWYgKCFhY29ybi5uZXdsaW5lLnRlc3QoY3VycmVudF90b2tlbi50ZXh0KSAmJiAhY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbGluZXMgPSBzcGxpdF9saW5lYnJlYWtzKGN1cnJlbnRfdG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgICAgdmFyIGo7IC8vIGl0ZXJhdG9yIGZvciB0aGlzIGNhc2VcbiAgICAgICAgICAgICAgICB2YXIgamF2YWRvYyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBzdGFybGVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBsYXN0SW5kZW50ID0gY3VycmVudF90b2tlbi53aGl0ZXNwYWNlX2JlZm9yZTtcbiAgICAgICAgICAgICAgICB2YXIgbGFzdEluZGVudExlbmd0aCA9IGxhc3RJbmRlbnQubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgLy8gYmxvY2sgY29tbWVudCBzdGFydHMgd2l0aCBhIG5ldyBsaW5lXG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBqYXZhZG9jID0gYWxsX2xpbmVzX3N0YXJ0X3dpdGgobGluZXMuc2xpY2UoMSksICcqJyk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJsZXNzID0gZWFjaF9saW5lX21hdGNoZXNfaW5kZW50KGxpbmVzLnNsaWNlKDEpLCBsYXN0SW5kZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBmaXJzdCBsaW5lIGFsd2F5cyBpbmRlbnRlZFxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAxOyBqIDwgbGluZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChqYXZhZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBqYXZhZG9jOiByZWZvcm1hdCBhbmQgcmUtaW5kZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbignICcgKyBsdHJpbShsaW5lc1tqXSkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJsZXNzICYmIGxpbmVzW2pdLmxlbmd0aCA+IGxhc3RJbmRlbnRMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0YXJsZXNzOiByZS1pbmRlbnQgbm9uLWVtcHR5IGNvbnRlbnQsIGF2b2lkaW5nIHRyaW1cbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKGxpbmVzW2pdLnN1YnN0cmluZyhsYXN0SW5kZW50TGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3JtYWwgY29tbWVudHMgb3V0cHV0IHJhd1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmFkZF90b2tlbihsaW5lc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBmb3IgY29tbWVudHMgb2YgbW9yZSB0aGFuIG9uZSBsaW5lLCBtYWtlIHN1cmUgdGhlcmUncyBhIG5ldyBsaW5lIGFmdGVyXG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX2NvbW1lbnQocHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQudHJpbSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9kb3QoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpc19zcGVjaWFsX3dvcmQoZmxhZ3MubGFzdF90ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbGxvdyBwcmVzZXJ2ZWQgbmV3bGluZXMgYmVmb3JlIGRvdHMgaW4gZ2VuZXJhbFxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JjZSBuZXdsaW5lcyBvbiBkb3RzIGFmdGVyIGNsb3NlIHBhcmVuIHdoZW4gYnJlYWtfY2hhaW5lZCAtIGZvciBiYXIoKS5iYXooKVxuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKGZsYWdzLmxhc3RfdGV4dCA9PT0gJyknICYmIG9wdC5icmVha19jaGFpbmVkX21ldGhvZHMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV91bmtub3duKHByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0W2N1cnJlbnRfdG9rZW4udGV4dC5sZW5ndGggLSAxXSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9lb2YoKSB7XG4gICAgICAgICAgICAgICAgLy8gVW53aW5kIGFueSBvcGVuIHN0YXRlbWVudHNcbiAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gT3V0cHV0TGluZShwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBfY2hhcmFjdGVyX2NvdW50ID0gMDtcbiAgICAgICAgICAgIC8vIHVzZSBpbmRlbnRfY291bnQgYXMgYSBtYXJrZXIgZm9yIGxpbmVzIHRoYXQgaGF2ZSBwcmVzZXJ2ZWQgaW5kZW50YXRpb25cbiAgICAgICAgICAgIHZhciBfaW5kZW50X2NvdW50ID0gLTE7XG5cbiAgICAgICAgICAgIHZhciBfaXRlbXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBfZW1wdHkgPSB0cnVlO1xuXG4gICAgICAgICAgICB0aGlzLnNldF9pbmRlbnQgPSBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICAgICAgICAgIF9jaGFyYWN0ZXJfY291bnQgPSBwYXJlbnQuYmFzZUluZGVudExlbmd0aCArIGxldmVsICogcGFyZW50LmluZGVudF9sZW5ndGg7XG4gICAgICAgICAgICAgICAgX2luZGVudF9jb3VudCA9IGxldmVsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfY2hhcmFjdGVyX2NvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jaGFyYWN0ZXJfY291bnQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmlzX2VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9lbXB0eTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMubGFzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9pdGVtc1tfaXRlbXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wdXNoID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBfaXRlbXMucHVzaChpbnB1dCk7XG4gICAgICAgICAgICAgICAgX2NoYXJhY3Rlcl9jb3VudCArPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgX2VtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIV9lbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gX2l0ZW1zLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfY2hhcmFjdGVyX2NvdW50IC09IGl0ZW0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBfZW1wdHkgPSBfaXRlbXMubGVuZ3RoID09PSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlX2luZGVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChfaW5kZW50X2NvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBfaW5kZW50X2NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICAgIF9jaGFyYWN0ZXJfY291bnQgLT0gcGFyZW50LmluZGVudF9sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50cmltID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMubGFzdCgpID09PSAnICcpIHtcbiAgICAgICAgICAgICAgICAgICAgX2l0ZW1zLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfY2hhcmFjdGVyX2NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9lbXB0eSA9IF9pdGVtcy5sZW5ndGggPT09IDA7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pbmRlbnRfY291bnQgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50LmluZGVudF9jYWNoZVtfaW5kZW50X2NvdW50XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gX2l0ZW1zLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIE91dHB1dChpbmRlbnRfc3RyaW5nLCBiYXNlSW5kZW50U3RyaW5nKSB7XG4gICAgICAgICAgICBiYXNlSW5kZW50U3RyaW5nID0gYmFzZUluZGVudFN0cmluZyB8fCAnJztcbiAgICAgICAgICAgIHRoaXMuaW5kZW50X2NhY2hlID0gW2Jhc2VJbmRlbnRTdHJpbmddO1xuICAgICAgICAgICAgdGhpcy5iYXNlSW5kZW50TGVuZ3RoID0gYmFzZUluZGVudFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9sZW5ndGggPSBpbmRlbnRfc3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMucmF3ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHZhciBsaW5lcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5iYXNlSW5kZW50U3RyaW5nID0gYmFzZUluZGVudFN0cmluZztcbiAgICAgICAgICAgIHRoaXMuaW5kZW50X3N0cmluZyA9IGluZGVudF9zdHJpbmc7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzX2xpbmUgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5zcGFjZV9iZWZvcmVfdG9rZW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5hZGRfb3V0cHV0bGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNfbGluZSA9IHRoaXMuY3VycmVudF9saW5lO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lID0gbmV3IE91dHB1dExpbmUodGhpcyk7XG4gICAgICAgICAgICAgICAgbGluZXMucHVzaCh0aGlzLmN1cnJlbnRfbGluZSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBpbml0aWFsaXplXG4gICAgICAgICAgICB0aGlzLmFkZF9vdXRwdXRsaW5lKCk7XG5cblxuICAgICAgICAgICAgdGhpcy5nZXRfbGluZV9udW1iZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZXMubGVuZ3RoO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gVXNpbmcgb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nIHRvIGFsbG93IGZvciBsYXRlciBleHBhbnNpb24gb2YgaW5mbyBhYm91dCBlYWNoIGxpbmVcbiAgICAgICAgICAgIHRoaXMuYWRkX25ld19saW5lID0gZnVuY3Rpb24oZm9yY2VfbmV3bGluZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldF9saW5lX251bWJlcigpID09PSAxICYmIHRoaXMuanVzdF9hZGRlZF9uZXdsaW5lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBubyBuZXdsaW5lIG9uIHN0YXJ0IG9mIGZpbGVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VfbmV3bGluZSB8fCAhdGhpcy5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmF3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZF9vdXRwdXRsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfY29kZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzd2VldF9jb2RlID0gbGluZXMuam9pbignXFxuJykucmVwbGFjZSgvW1xcclxcblxcdCBdKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN3ZWV0X2NvZGU7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnNldF9pbmRlbnQgPSBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICAgICAgICAgIC8vIE5ldmVyIGluZGVudCB5b3VyIGZpcnN0IG91dHB1dCBpbmRlbnQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBmaWxlXG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGxldmVsID49IHRoaXMuaW5kZW50X2NhY2hlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfY2FjaGUucHVzaCh0aGlzLmluZGVudF9jYWNoZVt0aGlzLmluZGVudF9jYWNoZS5sZW5ndGggLSAxXSArIHRoaXMuaW5kZW50X3N0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5zZXRfaW5kZW50KGxldmVsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lLnNldF9pbmRlbnQoMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5hZGRfcmF3X3Rva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRva2VuLm5ld2xpbmVzOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRfb3V0cHV0bGluZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5wdXNoKHRva2VuLndoaXRlc3BhY2VfYmVmb3JlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5wdXNoKHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmFkZF90b2tlbiA9IGZ1bmN0aW9uKHByaW50YWJsZV90b2tlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkX3NwYWNlX2JlZm9yZV90b2tlbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lLnB1c2gocHJpbnRhYmxlX3Rva2VuKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuYWRkX3NwYWNlX2JlZm9yZV90b2tlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNwYWNlX2JlZm9yZV90b2tlbiAmJiAhdGhpcy5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5wdXNoKCcgJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnJlbW92ZV9yZWR1bmRhbnRfaW5kZW50YXRpb24gPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgZWZmZWN0aXZlIGJ1dCBoYXMgc29tZSBpc3N1ZXM6XG4gICAgICAgICAgICAgICAgLy8gICAgIC0gY2FuIGNhdXNlIGxpbmUgd3JhcCB0byBoYXBwZW4gdG9vIHNvb24gZHVlIHRvIGluZGVudCByZW1vdmFsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgIGFmdGVyIHdyYXAgcG9pbnRzIGFyZSBjYWxjdWxhdGVkXG4gICAgICAgICAgICAgICAgLy8gVGhlc2UgaXNzdWVzIGFyZSBtaW5vciBjb21wYXJlZCB0byB1Z2x5IGluZGVudGF0aW9uLlxuXG4gICAgICAgICAgICAgICAgaWYgKGZyYW1lLm11bHRpbGluZV9mcmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICBmcmFtZS5tb2RlID09PSBNT0RFLkZvckluaXRpYWxpemVyIHx8XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lLm1vZGUgPT09IE1PREUuQ29uZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBvbmUgaW5kZW50IGZyb20gZWFjaCBsaW5lIGluc2lkZSB0aGlzIHNlY3Rpb25cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBmcmFtZS5zdGFydF9saW5lX2luZGV4O1xuXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dF9sZW5ndGggPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgb3V0cHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBsaW5lc1tpbmRleF0ucmVtb3ZlX2luZGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMudHJpbSA9IGZ1bmN0aW9uKGVhdF9uZXdsaW5lcykge1xuICAgICAgICAgICAgICAgIGVhdF9uZXdsaW5lcyA9IChlYXRfbmV3bGluZXMgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IGVhdF9uZXdsaW5lcztcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lLnRyaW0oaW5kZW50X3N0cmluZywgYmFzZUluZGVudFN0cmluZyk7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZWF0X25ld2xpbmVzICYmIGxpbmVzLmxlbmd0aCA+IDEgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUuaXNfZW1wdHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUudHJpbSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNfbGluZSA9IGxpbmVzLmxlbmd0aCA+IDEgPyBsaW5lc1tsaW5lcy5sZW5ndGggLSAyXSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmp1c3RfYWRkZWRfbmV3bGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRfbGluZS5pc19lbXB0eSgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5qdXN0X2FkZGVkX2JsYW5rbGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmp1c3RfYWRkZWRfbmV3bGluZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzdGFydCBvZiB0aGUgZmlsZSBhbmQgbmV3bGluZSA9IGJsYW5rXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGluZS5pc19lbXB0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIElucHV0U2Nhbm5lciA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgX2lucHV0ID0gaW5wdXQ7XG4gICAgICAgICAgICB2YXIgX2lucHV0X2xlbmd0aCA9IF9pbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgX3Bvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgdGhpcy5iYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgX3Bvc2l0aW9uIC09IDE7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmhhc05leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3Bvc2l0aW9uIDwgX2lucHV0X2xlbmd0aDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBfaW5wdXQuY2hhckF0KF9wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIF9wb3NpdGlvbiArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wZWVrID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gX3Bvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgX2lucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBfaW5wdXQuY2hhckF0KGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucGVla0NoYXJDb2RlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gMDtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gX3Bvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgX2lucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBfaW5wdXQuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRlc3QgPSBmdW5jdGlvbihwYXR0ZXJuLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggfHwgMDtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IF9wb3NpdGlvbiArIGluZGV4O1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuLnRlc3QoX2lucHV0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMudGVzdENoYXIgPSBmdW5jdGlvbihwYXR0ZXJuLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLnBlZWsoaW5kZXgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgIT09IG51bGwgJiYgcGF0dGVybi50ZXN0KHZhbCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLm1hdGNoID0gZnVuY3Rpb24ocGF0dGVybikge1xuICAgICAgICAgICAgICAgIHBhdHRlcm4ubGFzdEluZGV4ID0gX3Bvc2l0aW9uO1xuICAgICAgICAgICAgICAgIHZhciBwYXR0ZXJuX21hdGNoID0gcGF0dGVybi5leGVjKF9pbnB1dCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdHRlcm5fbWF0Y2ggJiYgcGF0dGVybl9tYXRjaC5pbmRleCA9PT0gX3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIF9wb3NpdGlvbiArPSBwYXR0ZXJuX21hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuX21hdGNoID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdHRlcm5fbWF0Y2g7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBUb2tlbiA9IGZ1bmN0aW9uKHR5cGUsIHRleHQsIG5ld2xpbmVzLCB3aGl0ZXNwYWNlX2JlZm9yZSwgcGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcblxuICAgICAgICAgICAgLy8gY29tbWVudHNfYmVmb3JlIGFyZVxuICAgICAgICAgICAgLy8gY29tbWVudHMgdGhhdCBoYXZlIGEgbmV3IGxpbmUgYmVmb3JlIHRoZW1cbiAgICAgICAgICAgIC8vIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIGEgbmV3bGluZSBhZnRlclxuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIHNldCBvZiBjb21tZW50cyBiZWZvcmVcbiAgICAgICAgICAgIHRoaXMuY29tbWVudHNfYmVmb3JlID0gLyogaW5saW5lIGNvbW1lbnQqLyBbXTtcblxuXG4gICAgICAgICAgICB0aGlzLmNvbW1lbnRzX2FmdGVyID0gW107IC8vIG5vIG5ldyBsaW5lIGJlZm9yZSBhbmQgbmV3bGluZSBhZnRlclxuICAgICAgICAgICAgdGhpcy5uZXdsaW5lcyA9IG5ld2xpbmVzIHx8IDA7XG4gICAgICAgICAgICB0aGlzLndhbnRlZF9uZXdsaW5lID0gbmV3bGluZXMgPiAwO1xuICAgICAgICAgICAgdGhpcy53aGl0ZXNwYWNlX2JlZm9yZSA9IHdoaXRlc3BhY2VfYmVmb3JlIHx8ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcbiAgICAgICAgICAgIHRoaXMub3BlbmVkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aXZlcyA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gdG9rZW5pemVyKGlucHV0X3N0cmluZywgb3B0cykge1xuXG4gICAgICAgICAgICB2YXIgd2hpdGVzcGFjZSA9IFwiXFxuXFxyXFx0IFwiLnNwbGl0KCcnKTtcbiAgICAgICAgICAgIHZhciBkaWdpdCA9IC9bMC05XS87XG4gICAgICAgICAgICB2YXIgZGlnaXRfYmluID0gL1swMV0vO1xuICAgICAgICAgICAgdmFyIGRpZ2l0X29jdCA9IC9bMDEyMzQ1NjddLztcbiAgICAgICAgICAgIHZhciBkaWdpdF9oZXggPSAvWzAxMjM0NTY3ODlhYmNkZWZBQkNERUZdLztcblxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbmFibGVfb3BlcmF0b3JzID0gJyE9ICE9PSAlICYgJiYgKiAqKiArIC0gLyA6IDwgPDwgPD0gPT0gPT09ID4gPj0gPj4gPj4+ID8gXiB8IHx8Jy5zcGxpdCgnICcpO1xuICAgICAgICAgICAgdmFyIHB1bmN0ID0gdGhpcy5wb3NpdGlvbmFibGVfb3BlcmF0b3JzLmNvbmNhdChcbiAgICAgICAgICAgICAgICAvLyBub24tcG9zaXRpb25hYmxlIG9wZXJhdG9ycyAtIHRoZXNlIGRvIG5vdCBmb2xsb3cgb3BlcmF0b3IgcG9zaXRpb24gc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAnISAlPSAmPSAqPSAqKj0gKysgKz0gLCAtLSAtPSAvPSA6OiA8PD0gPSA9PiA+Pj0gPj4+PSBePSB8PSB+IC4uLicuc3BsaXQoJyAnKSk7XG5cbiAgICAgICAgICAgIC8vIHdvcmRzIHdoaWNoIHNob3VsZCBhbHdheXMgc3RhcnQgb24gbmV3IGxpbmUuXG4gICAgICAgICAgICB0aGlzLmxpbmVfc3RhcnRlcnMgPSAnY29udGludWUsdHJ5LHRocm93LHJldHVybix2YXIsbGV0LGNvbnN0LGlmLHN3aXRjaCxjYXNlLGRlZmF1bHQsZm9yLHdoaWxlLGJyZWFrLGZ1bmN0aW9uLGltcG9ydCxleHBvcnQnLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICB2YXIgcmVzZXJ2ZWRfd29yZHMgPSB0aGlzLmxpbmVfc3RhcnRlcnMuY29uY2F0KFsnZG8nLCAnaW4nLCAnb2YnLCAnZWxzZScsICdnZXQnLCAnc2V0JywgJ25ldycsICdjYXRjaCcsICdmaW5hbGx5JywgJ3R5cGVvZicsICd5aWVsZCcsICdhc3luYycsICdhd2FpdCcsICdmcm9tJywgJ2FzJ10pO1xuXG4gICAgICAgICAgICAvLyAgLyogLi4uICovIGNvbW1lbnQgZW5kcyB3aXRoIG5lYXJlc3QgKi8gb3IgZW5kIG9mIGZpbGVcbiAgICAgICAgICAgIHZhciBibG9ja19jb21tZW50X3BhdHRlcm4gPSAvKFtcXHNcXFNdKj8pKCg/OlxcKlxcLyl8JCkvZztcblxuICAgICAgICAgICAgLy8gY29tbWVudCBlbmRzIGp1c3QgYmVmb3JlIG5lYXJlc3QgbGluZWZlZWQgb3IgZW5kIG9mIGZpbGVcbiAgICAgICAgICAgIHZhciBjb21tZW50X3BhdHRlcm4gPSAvKFteXFxuXFxyXFx1MjAyOFxcdTIwMjldKikvZztcblxuICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZXNfYmxvY2tfcGF0dGVybiA9IC9cXC9cXCogYmVhdXRpZnkoIFxcdytbOl1cXHcrKSsgXFwqXFwvL2c7XG4gICAgICAgICAgICB2YXIgZGlyZWN0aXZlX3BhdHRlcm4gPSAvIChcXHcrKVs6XShcXHcrKS9nO1xuICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZXNfZW5kX2lnbm9yZV9wYXR0ZXJuID0gLyhbXFxzXFxTXSo/KSgoPzpcXC9cXCpcXHNiZWF1dGlmeVxcc2lnbm9yZTplbmRcXHNcXCpcXC8pfCQpL2c7XG5cbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZV9wYXR0ZXJuID0gLygoPFxcP3BocHw8XFw/PSlbXFxzXFxTXSo/XFw/Pil8KDwlW1xcc1xcU10qPyU+KS9nO1xuXG4gICAgICAgICAgICB2YXIgbl9uZXdsaW5lcywgd2hpdGVzcGFjZV9iZWZvcmVfdG9rZW4sIGluX2h0bWxfY29tbWVudCwgdG9rZW5zO1xuICAgICAgICAgICAgdmFyIGlucHV0O1xuXG4gICAgICAgICAgICB0aGlzLnRva2VuaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBuZXcgSW5wdXRTY2FubmVyKGlucHV0X3N0cmluZyk7XG4gICAgICAgICAgICAgICAgaW5faHRtbF9jb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdG9rZW5zID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgbmV4dCwgbGFzdDtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5fdmFsdWVzO1xuICAgICAgICAgICAgICAgIHZhciBvcGVuID0gbnVsbDtcbiAgICAgICAgICAgICAgICB2YXIgb3Blbl9zdGFjayA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKCEobGFzdCAmJiBsYXN0LnR5cGUgPT09ICdUS19FT0YnKSkge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbl92YWx1ZXMgPSB0b2tlbml6ZV9uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIG5leHQgPSBuZXcgVG9rZW4odG9rZW5fdmFsdWVzWzFdLCB0b2tlbl92YWx1ZXNbMF0sIG5fbmV3bGluZXMsIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG5leHQudHlwZSA9PT0gJ1RLX0NPTU1FTlQnIHx8IG5leHQudHlwZSA9PT0gJ1RLX0JMT0NLX0NPTU1FTlQnIHx8IG5leHQudHlwZSA9PT0gJ1RLX1VOS05PV04nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dC50eXBlID09PSAnVEtfQkxPQ0tfQ09NTUVOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0LmRpcmVjdGl2ZXMgPSB0b2tlbl92YWx1ZXNbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50cy5wdXNoKG5leHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5fdmFsdWVzID0gdG9rZW5pemVfbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IG5ldyBUb2tlbih0b2tlbl92YWx1ZXNbMV0sIHRva2VuX3ZhbHVlc1swXSwgbl9uZXdsaW5lcywgd2hpdGVzcGFjZV9iZWZvcmVfdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jb21tZW50c19iZWZvcmUgPSBjb21tZW50cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dC50eXBlID09PSAnVEtfU1RBUlRfQkxPQ0snIHx8IG5leHQudHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0LnBhcmVudCA9IGxhc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuX3N0YWNrLnB1c2gob3Blbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gbmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgobmV4dC50eXBlID09PSAnVEtfRU5EX0JMT0NLJyB8fCBuZXh0LnR5cGUgPT09ICdUS19FTkRfRVhQUicpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAob3BlbiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5leHQudGV4dCA9PT0gJ10nICYmIG9wZW4udGV4dCA9PT0gJ1snKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuZXh0LnRleHQgPT09ICcpJyAmJiBvcGVuLnRleHQgPT09ICcoJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmV4dC50ZXh0ID09PSAnfScgJiYgb3Blbi50ZXh0ID09PSAneycpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQucGFyZW50ID0gb3Blbi5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0Lm9wZW5lZCA9IG9wZW47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSBvcGVuX3N0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnB1c2gobmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGxhc3QgPSBuZXh0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRfZGlyZWN0aXZlcyh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0ZXh0Lm1hdGNoKGRpcmVjdGl2ZXNfYmxvY2tfcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZXMgPSB7fTtcbiAgICAgICAgICAgICAgICBkaXJlY3RpdmVfcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHZhciBkaXJlY3RpdmVfbWF0Y2ggPSBkaXJlY3RpdmVfcGF0dGVybi5leGVjKHRleHQpO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGRpcmVjdGl2ZV9tYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVzW2RpcmVjdGl2ZV9tYXRjaFsxXV0gPSBkaXJlY3RpdmVfbWF0Y2hbMl07XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZV9tYXRjaCA9IGRpcmVjdGl2ZV9wYXR0ZXJuLmV4ZWModGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGl2ZXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRva2VuaXplX25leHQoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdGluZ19zdHJpbmc7XG4gICAgICAgICAgICAgICAgdmFyIHdoaXRlc3BhY2Vfb25fdGhpc19saW5lID0gW107XG5cbiAgICAgICAgICAgICAgICBuX25ld2xpbmVzID0gMDtcbiAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlX2JlZm9yZV90b2tlbiA9ICcnO1xuXG4gICAgICAgICAgICAgICAgdmFyIGMgPSBpbnB1dC5uZXh0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWycnLCAnVEtfRU9GJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxhc3RfdG9rZW47XG4gICAgICAgICAgICAgICAgaWYgKHRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdF90b2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIHRoZSBzYWtlIG9mIHRva2VuaXppbmcgd2UgY2FuIHByZXRlbmQgdGhhdCB0aGVyZSB3YXMgb24gb3BlbiBicmFjZSB0byBzdGFydFxuICAgICAgICAgICAgICAgICAgICBsYXN0X3Rva2VuID0gbmV3IFRva2VuKCdUS19TVEFSVF9CTE9DSycsICd7Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGluX2FycmF5KGMsIHdoaXRlc3BhY2UpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjb3JuLm5ld2xpbmUudGVzdChjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoYyA9PT0gJ1xcbicgJiYgaW5wdXQucGVlaygtMikgPT09ICdcXHInKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5fbmV3bGluZXMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlX29uX3RoaXNfbGluZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVzcGFjZV9vbl90aGlzX2xpbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5uZXh0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbJycsICdUS19FT0YnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh3aGl0ZXNwYWNlX29uX3RoaXNfbGluZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpdGVzcGFjZV9iZWZvcmVfdG9rZW4gPSB3aGl0ZXNwYWNlX29uX3RoaXNfbGluZS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZGlnaXQudGVzdChjKSB8fCAoYyA9PT0gJy4nICYmIGlucHV0LnRlc3RDaGFyKGRpZ2l0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsbG93X2RlY2ltYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWxsb3dfZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2NhbF9kaWdpdCA9IGRpZ2l0O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjID09PSAnMCcgJiYgaW5wdXQudGVzdENoYXIoL1tYeE9vQmJdLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3aXRjaCB0byBoZXgvb2N0L2JpbiBudW1iZXIsIG5vIGRlY2ltYWwgb3IgZSwganVzdCBoZXgvb2N0L2JpbiBkaWdpdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2RlY2ltYWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC50ZXN0Q2hhcigvW0JiXS8pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxfZGlnaXQgPSBkaWdpdF9iaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LnRlc3RDaGFyKC9bT29dLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbF9kaWdpdCA9IGRpZ2l0X29jdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxfZGlnaXQgPSBkaWdpdF9oZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIGRlY2ltYWwgZm9yIHRoaXMgbGl0ZXJhbCwgZG9uJ3QgYWxsb3cgYW5vdGhlclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfZGVjaW1hbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2Uga25vdyB0aGlzIGZpcnN0IGxvb3Agd2lsbCBydW4uICBJdCBrZWVwcyB0aGUgbG9naWMgc2ltcGxlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGMgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgZGlnaXRzXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC50ZXN0Q2hhcihsb2NhbF9kaWdpdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxsb3dfZGVjaW1hbCAmJiBpbnB1dC5wZWVrKCkgPT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2RlY2ltYWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSA9IDEuZS03IGlzIHZhbGlkLCBzbyB3ZSB0ZXN0IGZvciAuIHRoZW4gZSBpbiBvbmUgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsbG93X2UgJiYgaW5wdXQudGVzdENoYXIoL1tFZV0vKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnRlc3RDaGFyKC9bKy1dLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2RlY2ltYWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX1dPUkQnXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWNvcm4uaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQucGVla0NoYXJDb2RlKC0xKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Lmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFjb3JuLmlzSWRlbnRpZmllckNoYXIoaW5wdXQucGVla0NoYXJDb2RlKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnB1dC5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEobGFzdF90b2tlbi50eXBlID09PSAnVEtfRE9UJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsYXN0X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkobGFzdF90b2tlbi50ZXh0LCBbJ3NldCcsICdnZXQnXSkpKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5fYXJyYXkoYywgcmVzZXJ2ZWRfd29yZHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJ2luJyB8fCBjID09PSAnb2YnKSB7IC8vIGhhY2sgZm9yICdpbicgYW5kICdvZicgb3BlcmF0b3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfT1BFUkFUT1InXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX1JFU0VSVkVEJ107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19XT1JEJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcoJyB8fCBjID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfU1RBUlRfRVhQUiddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnKScgfHwgYyA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0VORF9FWFBSJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19TVEFSVF9CTE9DSyddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfRU5EX0JMT0NLJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICc7Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19TRU1JQ09MT04nXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21tZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21tZW50X21hdGNoO1xuICAgICAgICAgICAgICAgICAgICAvLyBwZWVrIGZvciBjb21tZW50IC8qIC4uLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQucGVlaygpID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRfbWF0Y2ggPSBpbnB1dC5tYXRjaChibG9ja19jb21tZW50X3BhdHRlcm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9ICcvKicgKyBjb21tZW50X21hdGNoWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZXMgPSBnZXRfZGlyZWN0aXZlcyhjb21tZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3RpdmVzICYmIGRpcmVjdGl2ZXMuaWdub3JlID09PSAnc3RhcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudF9tYXRjaCA9IGlucHV0Lm1hdGNoKGRpcmVjdGl2ZXNfZW5kX2lnbm9yZV9wYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9IGNvbW1lbnRfbWF0Y2hbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudC5yZXBsYWNlKGFjb3JuLmFsbExpbmVCcmVha3MsICdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbY29tbWVudCwgJ1RLX0JMT0NLX0NPTU1FTlQnLCBkaXJlY3RpdmVzXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBwZWVrIGZvciBjb21tZW50IC8vIC4uLlxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQucGVlaygpID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRfbWF0Y2ggPSBpbnB1dC5tYXRjaChjb21tZW50X3BhdHRlcm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9ICcvLycgKyBjb21tZW50X21hdGNoWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjb21tZW50LCAnVEtfQ09NTUVOVCddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRYbWxSZWdFeHAgPSAvPCgpKFstYS16QS1aOjAtOV8uXSt8e1tcXHNcXFNdKz99fCFcXFtDREFUQVxcW1tcXHNcXFNdKj9cXF1cXF0pKFxccyt7W1xcc1xcU10rP318XFxzK1stYS16QS1aOjAtOV8uXSt8XFxzK1stYS16QS1aOjAtOV8uXStcXHMqPVxccyooJ1teJ10qJ3xcIlteXCJdKlwifHtbXFxzXFxTXSs/fSkpKlxccyooXFwvPylcXHMqPi9nO1xuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICdgJyB8fCBjID09PSBcIidcIiB8fCBjID09PSAnXCInIHx8IC8vIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgICAoYyA9PT0gJy8nKSB8fCAvLyByZWdleHBcbiAgICAgICAgICAgICAgICAgICAgICAgIChvcHRzLmU0eCAmJiBjID09PSBcIjxcIiAmJiBpbnB1dC50ZXN0KHN0YXJ0WG1sUmVnRXhwLCAtMSkpIC8vIHhtbFxuICAgICAgICAgICAgICAgICAgICApICYmICggLy8gcmVnZXggYW5kIHhtbCBjYW4gb25seSBhcHBlYXIgaW4gc3BlY2lmaWMgbG9jYXRpb25zIGR1cmluZyBwYXJzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAobGFzdF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGxhc3RfdG9rZW4udGV4dCwgWydyZXR1cm4nLCAnY2FzZScsICd0aHJvdycsICdlbHNlJywgJ2RvJywgJ3R5cGVvZicsICd5aWVsZCddKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChsYXN0X3Rva2VuLnR5cGUgPT09ICdUS19FTkRfRVhQUicgJiYgbGFzdF90b2tlbi50ZXh0ID09PSAnKScgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0X3Rva2VuLnBhcmVudCAmJiBsYXN0X3Rva2VuLnBhcmVudC50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGxhc3RfdG9rZW4ucGFyZW50LnRleHQsIFsnaWYnLCAnd2hpbGUnLCAnZm9yJ10pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KGxhc3RfdG9rZW4udHlwZSwgWydUS19DT01NRU5UJywgJ1RLX1NUQVJUX0VYUFInLCAnVEtfU1RBUlRfQkxPQ0snLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdUS19FTkRfQkxPQ0snLCAnVEtfT1BFUkFUT1InLCAnVEtfRVFVQUxTJywgJ1RLX0VPRicsICdUS19TRU1JQ09MT04nLCAnVEtfQ09NTUEnXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSlcbiAgICAgICAgICAgICAgICAgICAgKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXAgPSBjLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXNjID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNfY2hhcl9lc2NhcGVzID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyA9IGM7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlcCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxlIHJlZ2V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbl9jaGFyX2NsYXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXQuaGFzTmV4dCgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKChlc2MgfHwgaW5fY2hhcl9jbGFzcyB8fCBpbnB1dC5wZWVrKCkgIT09IHNlcCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWlucHV0LnRlc3RDaGFyKGFjb3JuLm5ld2xpbmUpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gaW5wdXQucGVlaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGlucHV0LnBlZWsoKSA9PT0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQucGVlaygpID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluX2NoYXJfY2xhc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LnBlZWsoKSA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbl9jaGFyX2NsYXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc2MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdHMuZTR4ICYmIHNlcCA9PT0gJzwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxlIGU0eCB4bWwgbGl0ZXJhbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4bWxSZWdFeHAgPSAvW1xcc1xcU10qPzwoXFwvPykoWy1hLXpBLVo6MC05Xy5dK3x7W1xcc1xcU10rP318IVxcW0NEQVRBXFxbW1xcc1xcU10qP1xcXVxcXSkoXFxzK3tbXFxzXFxTXSs/fXxcXHMrWy1hLXpBLVo6MC05Xy5dK3xcXHMrWy1hLXpBLVo6MC05Xy5dK1xccyo9XFxzKignW14nXSonfFwiW15cIl0qXCJ8e1tcXHNcXFNdKz99KSkqXFxzKihcXC8/KVxccyo+L2c7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5iYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeG1sU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBpbnB1dC5tYXRjaChzdGFydFhtbFJlZ0V4cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmltIHJvb3QgdGFnIHRvIGF0dGVtcHQgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm9vdFRhZyA9IG1hdGNoWzJdLnJlcGxhY2UoL157XFxzKy8sICd7JykucmVwbGFjZSgvXFxzK30kLywgJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNDdXJseVJvb3QgPSByb290VGFnLmluZGV4T2YoJ3snKSA9PT0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVwdGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNFbmRUYWcgPSAhIW1hdGNoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IG1hdGNoWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNTaW5nbGV0b25UYWcgPSAoISFtYXRjaFttYXRjaC5sZW5ndGggLSAxXSkgfHwgKHRhZ05hbWUuc2xpY2UoMCwgOCkgPT09IFwiIVtDREFUQVtcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNTaW5nbGV0b25UYWcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0YWdOYW1lID09PSByb290VGFnIHx8IChpc0N1cmx5Um9vdCAmJiB0YWdOYW1lLnJlcGxhY2UoL157XFxzKy8sICd7JykucmVwbGFjZSgvXFxzK30kLywgJ30nKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNFbmRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLWRlcHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2RlcHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhtbFN0ciArPSBtYXRjaFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlcHRoIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gaW5wdXQubWF0Y2goeG1sUmVnRXhwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgZGlkbid0IGNsb3NlIGNvcnJlY3RseSwga2VlcCB1bmZvcm1hdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhtbFN0ciArPSBpbnB1dC5tYXRjaCgvW1xcc1xcU10qL2cpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxTdHIgPSB4bWxTdHIucmVwbGFjZShhY29ybi5hbGxMaW5lQnJlYWtzLCAnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt4bWxTdHIsIFwiVEtfU1RSSU5HXCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2Vfc3RyaW5nID0gZnVuY3Rpb24oZGVsaW1pdGVyLCBhbGxvd191bmVzY2FwZWRfbmV3bGluZXMsIHN0YXJ0X3N1Yikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlbXBsYXRlIHN0cmluZ3MgY2FuIHRyYXZlcnMgbGluZXMgd2l0aG91dCBlc2NhcGUgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlciBzdHJpbmdzIGNhbm5vdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50X2NoYXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlucHV0Lmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXIgPSBpbnB1dC5wZWVrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGVzYyB8fCAoY3VycmVudF9jaGFyICE9PSBkZWxpbWl0ZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYWxsb3dfdW5lc2NhcGVkX25ld2xpbmVzIHx8ICFhY29ybi5uZXdsaW5lLnRlc3QoY3VycmVudF9jaGFyKSkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgXFxyXFxuIGxpbmVicmVha3MgYWZ0ZXIgZXNjYXBlcyBvciBpbiB0ZW1wbGF0ZSBzdHJpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZXNjIHx8IGFsbG93X3VuZXNjYXBlZF9uZXdsaW5lcykgJiYgYWNvcm4ubmV3bGluZS50ZXN0KGN1cnJlbnRfY2hhcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X2NoYXIgPT09ICdcXHInICYmIGlucHV0LnBlZWsoMSkgPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhciA9IGlucHV0LnBlZWsoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9IGN1cnJlbnRfY2hhcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlc2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X2NoYXIgPT09ICd4JyB8fCBjdXJyZW50X2NoYXIgPT09ICd1Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc19jaGFyX2VzY2FwZXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXNjID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc2MgPSBjdXJyZW50X2NoYXIgPT09ICdcXFxcJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRfc3ViICYmIHJlc3VsdGluZ19zdHJpbmcuaW5kZXhPZihzdGFydF9zdWIsIHJlc3VsdGluZ19zdHJpbmcubGVuZ3RoIC0gc3RhcnRfc3ViLmxlbmd0aCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVsaW1pdGVyID09PSAnYCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9zdHJpbmcoJ30nLCBhbGxvd191bmVzY2FwZWRfbmV3bGluZXMsICdgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlX3N0cmluZygnYCcsIGFsbG93X3VuZXNjYXBlZF9uZXdsaW5lcywgJyR7Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXAgPT09ICdgJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlX3N0cmluZygnYCcsIHRydWUsICckeycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9zdHJpbmcoc2VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNfY2hhcl9lc2NhcGVzICYmIG9wdHMudW5lc2NhcGVfc3RyaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyA9IHVuZXNjYXBlX3N0cmluZyhyZXN1bHRpbmdfc3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5wZWVrKCkgPT09IHNlcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBzZXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXAgPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZ2V4cHMgbWF5IGhhdmUgbW9kaWZpZXJzIC9yZWdleHAvTU9EICwgc28gZmV0Y2ggdGhvc2UsIHRvb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgW2dpbV0gYXJlIHZhbGlkLCBidXQgaWYgdGhlIHVzZXIgcHV0cyBpbiBnYXJiYWdlLCBkbyB3aGF0IHdlIGNhbiB0byB0YWtlIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC5oYXNOZXh0KCkgJiYgYWNvcm4uaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQucGVla0NoYXJDb2RlKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Jlc3VsdGluZ19zdHJpbmcsICdUS19TVFJJTkcnXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJyMnKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2Vucy5sZW5ndGggPT09IDAgJiYgaW5wdXQucGVlaygpID09PSAnIScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNoZWJhbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlucHV0Lmhhc05leHQoKSAmJiBjICE9PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt0cmltKHJlc3VsdGluZ19zdHJpbmcpICsgJ1xcbicsICdUS19VTktOT1dOJ107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU3BpZGVybW9ua2V5LXNwZWNpZmljIHNoYXJwIHZhcmlhYmxlcyBmb3IgY2lyY3VsYXIgcmVmZXJlbmNlc1xuICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9Fbi9TaGFycF92YXJpYWJsZXNfaW5fSmF2YVNjcmlwdFxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vbXhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9zb3VyY2UvanMvc3JjL2pzc2Nhbi5jcHAgYXJvdW5kIGxpbmUgMTkzNVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2hhcnAgPSAnIyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5oYXNOZXh0KCkgJiYgaW5wdXQudGVzdENoYXIoZGlnaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYyA9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFycCArPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoaW5wdXQuaGFzTmV4dCgpICYmIGMgIT09ICcjJyAmJiBjICE9PSAnPScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09ICcjJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LnBlZWsoKSA9PT0gJ1snICYmIGlucHV0LnBlZWsoMSkgPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXJwICs9ICdbXSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5wdXQucGVlaygpID09PSAneycgJiYgaW5wdXQucGVlaygxKSA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcnAgKz0gJ3t9JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtzaGFycCwgJ1RLX1dPUkQnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnPCcgJiYgKGlucHV0LnBlZWsoKSA9PT0gJz8nIHx8IGlucHV0LnBlZWsoKSA9PT0gJyUnKSkge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5iYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZV9tYXRjaCA9IGlucHV0Lm1hdGNoKHRlbXBsYXRlX3BhdHRlcm4pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgPSB0ZW1wbGF0ZV9tYXRjaFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgPSBjLnJlcGxhY2UoYWNvcm4uYWxsTGluZUJyZWFrcywgJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfU1RSSU5HJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJzwnICYmIGlucHV0Lm1hdGNoKC9cXCEtLS9nKSkge1xuICAgICAgICAgICAgICAgICAgICBjID0gJzwhLS0nO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXQuaGFzTmV4dCgpICYmICFpbnB1dC50ZXN0Q2hhcihhY29ybi5uZXdsaW5lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW5faHRtbF9jb21tZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfQ09NTUVOVCddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnLScgJiYgaW5faHRtbF9jb21tZW50ICYmIGlucHV0Lm1hdGNoKC8tPi9nKSkge1xuICAgICAgICAgICAgICAgICAgICBpbl9odG1sX2NvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnLS0+JywgJ1RLX0NPTU1FTlQnXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5wZWVrKCkgPT09ICcuJyAmJiBpbnB1dC5wZWVrKDEpID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpICsgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfT1BFUkFUT1InXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19ET1QnXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5fYXJyYXkoYywgcHVuY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC5oYXNOZXh0KCkgJiYgaW5fYXJyYXkoYyArIGlucHV0LnBlZWsoKSwgcHVuY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXQuaGFzTmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJywnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19DT01NQSddO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGMgPT09ICc9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfRVFVQUxTJ107XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19PUEVSQVRPUiddO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfVU5LTk9XTiddO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHVuZXNjYXBlX3N0cmluZyhzKSB7XG4gICAgICAgICAgICAgICAgLy8gWW91IHRoaW5rIHRoYXQgYSByZWdleCB3b3VsZCB3b3JrIGZvciB0aGlzXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHMucmVwbGFjZSgvXFxcXHgoWzAtOWEtZl17Mn0pL2dpLCBmdW5jdGlvbihtYXRjaCwgdmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludCh2YWwsIDE2KSk7XG4gICAgICAgICAgICAgICAgLy8gICAgIH0pXG4gICAgICAgICAgICAgICAgLy8gSG93ZXZlciwgZGVhbGluZyB3aXRoICdcXHhmZicsICdcXFxceGZmJywgJ1xcXFxcXHhmZicgbWFrZXMgdGhpcyBtb3JlIGZ1bi5cbiAgICAgICAgICAgICAgICB2YXIgb3V0ID0gJycsXG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X3NjYW4gPSBuZXcgSW5wdXRTY2FubmVyKHMpO1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaGVkID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dF9zY2FuLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBLZWVwIGFueSB3aGl0ZXNwYWNlLCBub24tc2xhc2ggY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGtlZXAgc2xhc2ggcGFpcnMuXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBpbnB1dF9zY2FuLm1hdGNoKC8oW1xcc118W15cXFxcXXxcXFxcXFxcXCkrL2cpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gbWF0Y2hlZFswXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9zY2FuLnBlZWsoKSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9zY2FuLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9zY2FuLnBlZWsoKSA9PT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IGlucHV0X3NjYW4ubWF0Y2goL3goWzAtOUEtRmEtZl17Mn0pL2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnB1dF9zY2FuLnBlZWsoKSA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IGlucHV0X3NjYW4ubWF0Y2goL3UoWzAtOUEtRmEtZl17NH0pL2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9zY2FuLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gaW5wdXRfc2Nhbi5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIHNvbWUgZXJyb3IgZGVjb2RpbmcsIHJldHVybiB0aGUgb3JpZ2luYWwgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZXNjYXBlZCA9IHBhcnNlSW50KG1hdGNoZWRbMV0sIDE2KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVzY2FwZWQgPiAweDdlICYmIGVzY2FwZWQgPD0gMHhmZiAmJiBtYXRjaGVkWzBdLmluZGV4T2YoJ3gnKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGJhaWwgb3V0IG9uIFxceDdmLi5cXHhmZixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZWF2aW5nIHdob2xlIHN0cmluZyBlc2NhcGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIGl0J3MgcHJvYmFibHkgY29tcGxldGVseSBiaW5hcnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXNjYXBlZCA+PSAweDAwICYmIGVzY2FwZWQgPCAweDIwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGVhdmUgMHgwMC4uLjB4MWYgZXNjYXBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dCArPSAnXFxcXCcgKyBtYXRjaGVkWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlc2NhcGVkID09PSAweDIyIHx8IGVzY2FwZWQgPT09IDB4MjcgfHwgZXNjYXBlZCA9PT0gMHg1Yykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZS1xdW90ZSwgYXBvc3Ryb3BoZSwgYmFja3NsYXNoIC0gZXNjYXBlIHRoZXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0ICs9ICdcXFxcJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoZXNjYXBlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGVzY2FwZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWF1dGlmaWVyID0gbmV3IEJlYXV0aWZpZXIoanNfc291cmNlX3RleHQsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gYmVhdXRpZmllci5iZWF1dGlmeSgpO1xuXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKCBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EI2RlZmluZWFtZC1wcm9wZXJ0eS0gKVxuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHsganNfYmVhdXRpZnk6IGpzX2JlYXV0aWZ5IH07XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gQWRkIHN1cHBvcnQgZm9yIENvbW1vbkpTLiBKdXN0IHB1dCB0aGlzIGZpbGUgc29tZXdoZXJlIG9uIHlvdXIgcmVxdWlyZS5wYXRoc1xuICAgICAgICAvLyBhbmQgeW91IHdpbGwgYmUgYWJsZSB0byBgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZShcImJlYXV0aWZ5XCIpLmpzX2JlYXV0aWZ5YC5cbiAgICAgICAgZXhwb3J0cy5qc19iZWF1dGlmeSA9IGpzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSdyZSBydW5uaW5nIGEgd2ViIHBhZ2UgYW5kIGRvbid0IGhhdmUgZWl0aGVyIG9mIHRoZSBhYm92ZSwgYWRkIG91ciBvbmUgZ2xvYmFsXG4gICAgICAgIHdpbmRvdy5qc19iZWF1dGlmeSA9IGpzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBldmVuIGhhdmUgd2luZG93LCB0cnkgZ2xvYmFsLlxuICAgICAgICBnbG9iYWwuanNfYmVhdXRpZnkgPSBqc19iZWF1dGlmeTtcbiAgICB9XG5cbn0oKSk7IiwicmlvdC50YWcyKCdkZWJ1Z2dlcicsICc8YiBpZD1cInN0aWNrXCIgb25jbGljaz1cIntzdGlja1RvZ2dsZX1cIiBpZj1cIntvcGVufVwiPntzdGlja0luZGljYXRvcn08L2I+PHNlbGVjdCBvbmNoYW5nZT1cIntjaGFuZ2VQb3N9XCIgaWY9XCJ7b3Blbn1cIj48b3B0aW9uPnRvcC1yaWdodDwvb3B0aW9uPjxvcHRpb24+dG9wLWxlZnQ8L29wdGlvbj48b3B0aW9uIHNlbGVjdGVkPVwiXCI+Ym90dG9tLXJpZ2h0PC9vcHRpb24+PG9wdGlvbj5ib3R0b20tbGVmdDwvb3B0aW9uPjwvc2VsZWN0PjxiIGlkPVwiY2xlYXJcIiBvbmNsaWNrPVwie2NsZWFyfVwiIGlmPVwie29wZW59XCI+Y2xlYXI8L2I+PGgzIG9uY2xpY2s9XCJ7dG9nZ2xlfVwiPjxiIGlkPVwidG9nZ2xlXCI+e3RvZ2dsZUluZGljYXRvcn08L2I+IERlYnVnZ2VyIDwvaDM+PHNlY3Rpb24gaWQ9XCJhY3Rpb25zXCI+PGRlYnVnaXRlbSBlYWNoPVwie2FjdGlvbnN9XCI+PC9kZWJ1Z2l0ZW0+PHAgY2xhc3M9XCJtZXNzYWdlXCIgb25jbGljaz1cIntjaGFuZ2VOdW1BY3Rpb25zfVwiPiBTaG93aW5nIGxhc3Qge251bUFjdGlvbnN9IGFjdGlvbnMuLi4gPC9wPjwvc2VjdGlvbj4nLCAnZGVidWdnZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXXsgcG9zaXRpb246IGZpeGVkOyB6LWluZGV4OiA5OTk5OyBib3R0b206IDEwcHg7IHJpZ2h0OiAtMzAwcHg7IG9wYWNpdHk6IDAuMjU7IHdpZHRoOiA0MDBweDsgaGVpZ2h0OiA2MDBweDsgYmFja2dyb3VuZDogI2VlZTsgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsgZm9udC1zaXplOiAxMXB4OyB9IGRlYnVnZ2VyLnRvcC1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQsZGVidWdnZXIudG9wLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0eyB0b3A6IDEwcHg7IH0gZGVidWdnZXIuYm90dG9tLWxlZnQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tbGVmdCxkZWJ1Z2dlci5ib3R0b20tcmlnaHQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tcmlnaHR7IGJvdHRvbTogMTBweDsgfSBkZWJ1Z2dlci50b3AtbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0LGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnR7IGxlZnQ6IC0zMDBweDsgfSBkZWJ1Z2dlci50b3AtcmlnaHQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtcmlnaHQsZGVidWdnZXIuYm90dG9tLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0eyByaWdodDogLTMwMHB4OyB9IGRlYnVnZ2VyLnRvcC1sZWZ0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQ6aG92ZXIsZGVidWdnZXIudG9wLWxlZnQuc3RpY2ssW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtbGVmdC5zdGljayxkZWJ1Z2dlci5ib3R0b20tbGVmdDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0OmhvdmVyLGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnQuc3RpY2t7IGxlZnQ6IDEwcHg7IG9wYWNpdHk6IDE7IH0gZGVidWdnZXIudG9wLXJpZ2h0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0OmhvdmVyLGRlYnVnZ2VyLnRvcC1yaWdodC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodC5zdGljayxkZWJ1Z2dlci5ib3R0b20tcmlnaHQ6aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tcmlnaHQ6aG92ZXIsZGVidWdnZXIuYm90dG9tLXJpZ2h0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0LnN0aWNreyByaWdodDogMTBweDsgb3BhY2l0eTogMTsgfSBkZWJ1Z2dlci5jbG9zZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmNsb3NleyBoZWlnaHQ6IDE1cHg7IH0gZGVidWdnZXIgI3RvZ2dsZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICN0b2dnbGUsZGVidWdnZXIgI3N0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI3N0aWNrLGRlYnVnZ2VyIGgzLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gaDMsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBjdXJzb3I6IHBvaW50ZXI7IH0gZGVidWdnZXIgI3N0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI3N0aWNrLGRlYnVnZ2VyIHNlbGVjdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdIHNlbGVjdCxkZWJ1Z2dlciAjY2xlYXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjY2xlYXJ7IGZsb2F0OiByaWdodDsgfSBkZWJ1Z2dlciBzZWxlY3QsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBzZWxlY3QsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBtYXJnaW4tcmlnaHQ6IDIwcHg7IH0gZGVidWdnZXIgaDMsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBoM3sgbWFyZ2luOiAwOyBmb250LXNpemU6IDE1cHg7IGxpbmUtaGVpZ2h0OiAxNXB4OyBwYWRkaW5nOiAwOyB9IGRlYnVnZ2VyICNhY3Rpb25zLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnN7IGRpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogNTBweDsgbGVmdDogMTBweDsgcmlnaHQ6IDEwcHg7IGJvdHRvbTogMTBweDsgb3ZlcmZsb3c6IGF1dG87IH0gZGVidWdnZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSxkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0sW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW17IGRpc3BsYXk6IGJsb2NrOyBwYWRkaW5nOiAxMHB4OyBtYXJnaW4tYm90dG9tOiAxMHB4OyBib3JkZXI6IDFweCBzb2xpZCAjYWFhOyB0cmFuc2l0aW9uOiBhbGwgMjUwbXMgY3ViaWMtYmV6aWVyKDAuMjIsIDAuNjEsIDAuMzYsIDEpOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbXsgYmFja2dyb3VuZDogI2ZmZjsgcG9zaXRpb246IHJlbGF0aXZlOyBib3gtc2hhZG93OiAwOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbTpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbTpob3ZlcnsgYm9yZGVyLWNvbG9yOiAjZjcwOyBib3gtc2hhZG93OiAwcHggMTBweCA1cHggLThweCByZ2JhKDAsMCwwLDAuMjUpOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSBjb2RlLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtIGNvZGV7IGJhY2tncm91bmQ6ICNlZWU7IHBhZGRpbmc6IDIuNXB4IDVweDsgbGluZS1oZWlnaHQ6IDExcHg7IH0gZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtIGkjbnVtLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtIGkjbnVteyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTBweDsgcmlnaHQ6IDEwcHg7IH0gZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtICN0aW1lLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtICN0aW1leyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTBweDsgcmlnaHQ6IDYwcHg7IG9wYWNpdHk6IDAuMjU7IH0gZGVidWdnZXIgI2FjdGlvbnMgLm1lc3NhZ2UsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyAubWVzc2FnZXsgY3Vyc29yOiBwb2ludGVyOyB0ZXh0LWFsaWduOiBjZW50ZXI7IG9wYWNpdHk6IDAuMjU7IH0nLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmFjdGlvbnMgPSBbXTtcbiAgICAgICAgc2VsZi5pID0gMDtcbiAgICAgICAgc2VsZi50b2dnbGVJbmRpY2F0b3IgPSAnLSc7XG4gICAgICAgIHNlbGYuc3RpY2tJbmRpY2F0b3IgPSAnc3RpY2snO1xuICAgICAgICBzZWxmLm9wZW4gPSB0cnVlO1xuICAgICAgICBzZWxmLnN0aWNrID0gZmFsc2U7XG5cbiAgICAgICAgc2VsZi50b2dnbGUgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYub3BlbiA9ICFzZWxmLm9wZW47XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0W3NlbGYub3BlbiA/ICdyZW1vdmUnIDogJ2FkZCddKCdjbG9zZScpO1xuICAgICAgICAgICAgc2VsZi50b2dnbGVJbmRpY2F0b3IgPSBzZWxmLm9wZW4gPyAnLScgOiAnKyc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnN0aWNrVG9nZ2xlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLnN0aWNrID0gIXNlbGYuc3RpY2s7XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0W3NlbGYuc3RpY2sgPyAnYWRkJyA6ICdyZW1vdmUnXSgnc3RpY2snKTtcbiAgICAgICAgICAgIHNlbGYuc3RpY2tJbmRpY2F0b3IgPSBzZWxmLnN0aWNrID8gJ2ZhZGUnIDogJ3N0aWNrJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuY2xlYXIgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYuYWN0aW9ucyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5jaGFuZ2VQb3MgPSAoZXZlbnQpID0+IHtcblxuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdC5yZW1vdmUoJ3RvcC1yaWdodCcsICd0b3AtbGVmdCcsICdib3R0b20tcmlnaHQnLCAnYm90dG9tLWxlZnQnKTtcbiAgICAgICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QuYWRkKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLm51bUFjdGlvbnMgPSAyMDtcbiAgICAgICAgc2VsZi5jaGFuZ2VOdW1BY3Rpb25zID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBjb25zdCBhc2sgPSBwcm9tcHQoJ051bWJlciBvZiBhY3Rpb25zIHRvIHNob3c/Jyk7XG5cbiAgICAgICAgICAgIGlmIChhc2spIHtcblxuICAgICAgICAgICAgICAgIHNlbGYubnVtQWN0aW9ucyA9IHBhcnNlSW50KGFzay5yZXBsYWNlKC9bYS16XSsvaWcsICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLm9uKCdzdGF0ZScsIChvYmosIGZuLCBhY3Rpb24sIGFyZ3MpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgdGltZSA9ICtuZXcgRGF0ZTtcblxuICAgICAgICAgICAgc2VsZi5pKys7XG4gICAgICAgICAgICBjb25zdCBpID0gc2VsZi5pO1xuICAgICAgICAgICAgc2VsZi5hY3Rpb25zLnVuc2hpZnQoeyBvYmosIGZuLCBhY3Rpb24sIGFyZ3MsIHRpbWUsIGkgfSk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmFjdGlvbnMubGVuZ3RoID4gc2VsZi5udW1BY3Rpb25zKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLmFjdGlvbnMucG9wKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYudXBkYXRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QuYWRkKCdib3R0b20tcmlnaHQnKTtcblxuICAgICAgICBhcHAuZGVidWdnZXIgPSBzZWxmO1xufSk7XG5cblxucmlvdC50YWcyKCdkZWJ1Z2l0ZW0nLCAnPHNwYW4gY2xhc3M9XCJuYW1lXCIgaWY9XCJ7b2JqICYmIG9iai5uYW1lfVwiPiB7b2JqLm5hbWV9IDwvc3Bhbj48Yj57Zm59PC9iPiAmbWRhc2g7IDxpPnthY3Rpb259PC9pPjxzcGFuIGlkPVwidGltZVwiPnt0aW1lfTwvc3Bhbj48aSBpZD1cIm51bVwiPntpfTwvaT48YnI+PHA+QXJndW1lbnRzPC9wPjxkaXYgZWFjaD1cInthcmcgaW4gYXJnc31cIj48aT57YXJnLmNvbnN0cnVjdG9yLm5hbWV9PC9pPiAmbWRhc2g7IDxzcGFuIGlmPVwie1tcXCdvYmplY3RcXCcsIFxcJ2Z1bmN0aW9uXFwnXS5pbmRleE9mKHR5cGVvZiBhcmcpID09PSAtMX1cIj57YXJnfTwvc3Bhbj48Y29kZSBpZj1cInt0eXBlb2YgYXJnID09PSBcXCdvYmplY3RcXCd9XCI+e0pTT04uc3RyaW5naWZ5KGFyZyl9PC9jb2RlPjxjb2RlIGlmPVwie3R5cGVvZiBhcmcgPT09IFxcJ2Z1bmN0aW9uXFwnfVwiPnthcmd9PC9jb2RlPjwvZGl2PicsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xufSk7XG5cblxucmlvdC50YWcyKCdpY29uJywgJzxpIGNsYXNzPVwiZmEge2ljb259XCI+PC9pPicsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgdGhpcy5pY29uID0gT2JqZWN0LmtleXModGhpcy5vcHRzKS5tYXAoaSA9PiBgZmEtJHtpfWApLmpvaW4oJyAnKVxufSk7XG5cbnJpb3QudGFnMigncHJldHR5LWNvZGUnLCAnPHByZT48Y29kZSByZWY9XCJjb2RlXCI+PC9jb2RlPjwvcHJlPicsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBkZWZhdWx0T3B0cyA9IHtcblxuICAgICAgICAgICAgXCJpbmRlbnRfc2l6ZVwiOiA0LFxuICAgICAgICAgICAgXCJpbmRlbnRfY2hhclwiOiBcIiBcIlxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IFJpb3RVdGlscy5CZWF1dGlmeS5iZWZvcmU7XG4gICAgICAgIGNvbnN0IGFmdGVyID0gUmlvdFV0aWxzLkJlYXV0aWZ5LmFmdGVyO1xuXG4gICAgICAgIGNvbnN0IHR5cGUgPSBzZWxmLm9wdHMudHlwZSB8fCAnanMnO1xuICAgICAgICBjb25zdCBkZWNvZGUgPSBzZWxmLm9wdHMuZGVjb2RlICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGJlYXV0aWZ5T3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRzLCBzZWxmLm9wdHMpO1xuXG4gICAgICAgIGxldCByYXcgPSBzZWxmLl9fLmlubmVySFRNTDtcblxuICAgICAgICB0aGlzLm9uKCdtb3VudCcsICgpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgcHJldHRpZmllZCA9IFJpb3RVdGlscy5CZWF1dGlmeVt0eXBlXShyYXcsIGJlYXV0aWZ5T3B0cyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByZXR0aWZ5ID0geyBwcmV0dGlmaWVkLCByYXcgfVxuXG4gICAgICAgICAgICBpZiAoYmVmb3JlICYmIGJlZm9yZS5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcblxuICAgICAgICAgICAgICAgIGJlZm9yZShwcmV0dGlmeSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkZWNvZGUgJiYgdHlwZSA9PT0gJ2h0bWwnKSB7XG5cbiAgICAgICAgICAgICAgICBwcmV0dGlmeS5wcmV0dGlmaWVkID0gUmlvdFV0aWxzLkJlYXV0aWZ5LmVzY2FwZUhUTUwocHJldHRpZnkucHJldHRpZmllZClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5yZWZzLmNvZGUuaW5uZXJIVE1MID0gcHJldHRpZnkucHJldHRpZmllZDtcblxuICAgICAgICAgICAgaWYgKGFmdGVyICYmIGFmdGVyLmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbikge1xuXG4gICAgICAgICAgICAgICAgYWZ0ZXIocHJldHRpZnkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBSaW90VXRpbHMuQmVhdXRpZnkudHJpZ2dlcigncHJldHRpZmllZCcsIHByZXR0aWZ5KTtcbiAgICAgICAgfSlcbn0pO1xuXG4iXX0=
