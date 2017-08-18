(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _jsBeautify = require('js-beautify');

var Beautify = _interopRequireWildcard(_jsBeautify);

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

},{"./lib/action-forms":4,"./lib/observer":6,"./tags":11,"js-beautify":7}],2:[function(require,module,exports){
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

console.log(_utils.config.elements);

function bind(form) {

    console.log(form);

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

            (0, _bindField.bindField)(field, validations);
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

function Observer(obj, props) {

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
            writable: false
        };
    });

    // Define properties in `props`
    props && Object.keys(props).map(function (key) {

        properties[key] = props[key];
    });

    Object.defineProperties(obj, properties);
}

Observer.configure = function (obj) {

    Object.assign(opts, obj);
};

},{}],7:[function(require,module,exports){
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
},{"./lib/beautify":10,"./lib/beautify-css":8,"./lib/beautify-html":9}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./beautify-css.js":8,"./beautify.js":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

riot.tag2('pretty-code', '', '', '', function (opts) {

    var self = this;
    var defaultOpts = {

        "indent_size": 4,
        "indent_char": " "
    };

    var type = self.opts.type || 'js';
    var beautifyOpts = Object.assign({}, defaultOpts, self.opts);

    this.on('mount', function () {

        RiotUtils.Beautify[type];
    });
});

riot.tag2('raw', '', '', '', function (opts) {
    this.root.innerHTML = this.opts.content;
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1maWVsZC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1mb3JtLmpzIiwibGliL2FjdGlvbi1mb3Jtcy9pbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvdXRpbHMuanMiLCJsaWIvb2JzZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvanMtYmVhdXRpZnkvanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanMtYmVhdXRpZnkvanMvbGliL2JlYXV0aWZ5LWNzcy5qcyIsIm5vZGVfbW9kdWxlcy9qcy1iZWF1dGlmeS9qcy9saWIvYmVhdXRpZnktaHRtbC5qcyIsIm5vZGVfbW9kdWxlcy9qcy1iZWF1dGlmeS9qcy9saWIvYmVhdXRpZnkuanMiLCJ0YWdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBOztJQUFZLFE7O0FBRVo7O0FBQ0E7O0lBQVksVzs7QUFDWjs7OztBQUVBLElBQU0sWUFBWTs7QUFFZCxnQ0FGYztBQUdkLDRCQUhjO0FBSWQ7QUFKYyxDQUFsQjs7QUFPQSxPQUFPLFNBQVAsR0FBbUIsU0FBbkI7Ozs7Ozs7Ozs7UUNEZ0IsUyxHQUFBLFM7O0FBZGhCOztBQUNBOztBQUVBLElBQU0sVUFBVSxjQUFPLE9BQXZCOztBQUVBOzs7Ozs7Ozs7QUFTTyxTQUFTLFNBQVQsQ0FBb0IsS0FBcEIsRUFBMkIsV0FBM0IsRUFBd0M7O0FBRTNDLFFBQU0sU0FBUywrQkFBbUIsS0FBbkIsRUFBMEIsUUFBUSxTQUFSLElBQXFCLFFBQS9DLENBQWY7O0FBRUEsUUFBTSxPQUFPLE1BQU0sWUFBTixDQUFtQixNQUFuQixDQUFiO0FBQ0EsUUFBTSxPQUFPLE1BQU0sWUFBTixDQUFtQixNQUFuQixDQUFiO0FBQ0EsUUFBTSxXQUFXLE1BQU0sWUFBTixDQUFtQixVQUFuQixNQUFtQyxTQUFwRDs7QUFFQTtBQUNBLFFBQU0sU0FBUyxNQUFNLFlBQU4sQ0FBbUIsUUFBbkIsQ0FBZjs7QUFFQTtBQUNBO0FBQ0EsUUFBTSxXQUFXLE1BQU0sWUFBTixDQUFtQixVQUFuQixDQUFqQjs7QUFFQTtBQUNBO0FBQ0EsUUFBTSxTQUFTLE1BQU0sWUFBTixDQUFtQixRQUFuQixDQUFmOztBQUVBO0FBQ0EsUUFBTSxRQUFRLE1BQU0sWUFBTixDQUFtQixPQUFuQixDQUFkOztBQUVBO0FBQ0EsUUFBTSxLQUFLLE1BQU0sWUFBTixDQUFtQixJQUFuQixLQUE0QixRQUF2Qzs7QUFFQTtBQUNBLFFBQU0sYUFBYSxFQUFuQjs7QUFFQSxRQUFJLFVBQVUsS0FBZDs7QUFFQSxRQUFJLE1BQU0sWUFBTixDQUFtQixVQUFuQixLQUFrQyxTQUFTLFFBQS9DLEVBQXlEOztBQUVyRDtBQUNIOztBQUVELDRCQUFTLEtBQVQ7O0FBRUE7QUFDQSxnQkFBWSxJQUFaLElBQW9CLE9BQXBCOztBQUVBLFFBQUksTUFBSixFQUFZOztBQUVSLGdDQUFZLE1BQVosRUFBb0IsS0FBcEI7QUFDSDs7QUFFRCxRQUFNLGFBQWEsU0FBYixVQUFhLENBQVMsQ0FBVCxFQUFZOztBQUUzQixZQUFNLFVBQVcsT0FBTyxLQUFSLEdBQWlCLEVBQUUsS0FBbkIsR0FBMkIsRUFBRSxPQUE3QztBQUNBLFlBQU0sU0FBUyxFQUFFLElBQUYsS0FBVSxNQUF6QjtBQUNBLFlBQU0sUUFBUSxNQUFNLEtBQXBCO0FBQ0EsWUFBTSxRQUFRLENBQUMsTUFBTSxNQUFyQjs7QUFFQTtBQUNBLFlBQUksUUFBSixFQUFjOztBQUVWLHVCQUFXLFFBQVgsR0FBc0IsQ0FBQyxDQUFDLEtBQXhCOztBQUVBLGdCQUFJLFNBQVMsVUFBYixFQUF5Qjs7QUFFckIsMkJBQVcsT0FBWCxHQUFxQixNQUFNLE9BQTNCO0FBQ0g7QUFFSjs7QUFFRDtBQUNBLFlBQUksUUFBSixFQUFjOztBQUVWLHVCQUFXLFFBQVgsR0FBc0IsMEJBQWMsS0FBZCxFQUFxQixRQUFyQixDQUF0QjtBQUNIOztBQUVEO0FBQ0EsWUFBSSxLQUFKLEVBQVc7O0FBRVAsZ0JBQU0sTUFBTSxJQUFJLE1BQUosQ0FBVyxLQUFYLENBQVo7QUFDQSx1QkFBVyxLQUFYLEdBQW1CLElBQUksSUFBSixDQUFTLEtBQVQsQ0FBbkI7QUFDSDs7QUFFRDtBQUNBLFlBQUksTUFBSixFQUFZOztBQUVSLGdCQUFNLGdCQUFnQixNQUFNLElBQU4sQ0FBVyxhQUFYLENBQXlCLE1BQXpCLENBQXRCOztBQUVBLHVCQUFXLE1BQVgsR0FBb0IsVUFBVSxjQUFjLEtBQTVDOztBQUVBLGdCQUFJLENBQUMsY0FBYyxPQUFuQixFQUE0Qjs7QUFFeEIsOEJBQWMsT0FBZCxDQUFzQixVQUF0QixFQUFrQyxFQUFsQztBQUNIO0FBQ0o7O0FBR0Q7QUFDQSxrQkFBVSw4QkFBa0IsVUFBbEIsQ0FBVjs7QUFFQTtBQUNBLFlBQUksQ0FBQyxPQUFELElBQVksQ0FBQyxRQUFiLElBQXlCLENBQUMsS0FBMUIsSUFBbUMsTUFBdkMsRUFBK0M7O0FBRTNDLHNCQUFVLElBQVY7QUFDSDs7QUFFRCxrQkFBVSxPQUFWO0FBQ0EsZUFBTyxPQUFQO0FBRUgsS0ExREQ7O0FBNERBLFFBQU0sWUFBWSxTQUFaLFNBQVksQ0FBUyxPQUFULEVBQWtCOztBQUVoQztBQUNBLFlBQUksWUFBWSxLQUFaLElBQXFCLE1BQXJCLElBQStCLFFBQW5DLEVBQTZDOztBQUV6Qyx3QkFBWSxJQUFaLElBQW9CLE9BQXBCO0FBQ0g7O0FBRUQ7QUFDQSxjQUFNLE9BQU4sR0FBZ0IsT0FBaEI7O0FBRUE7QUFDQTtBQUNBLFlBQUksT0FBSixFQUFhOztBQUVULG1CQUFPLFNBQVAsQ0FBaUIsTUFBakIsQ0FBd0IsUUFBUSxLQUFoQztBQUNBLG1CQUFPLFNBQVAsQ0FBaUIsR0FBakIsQ0FBcUIsUUFBUSxPQUE3Qjs7QUFFQSxtQkFBTyxhQUFQLE9BQXlCLFFBQVEsSUFBakMsRUFBeUMsU0FBekMsQ0FBbUQsR0FBbkQsQ0FBdUQsUUFBUSxJQUEvRDtBQUNILFNBTkQsTUFPSzs7QUFFRCxtQkFBTyxTQUFQLENBQWlCLEdBQWpCLENBQXFCLFFBQVEsS0FBN0I7QUFDQSxtQkFBTyxTQUFQLENBQWlCLE1BQWpCLENBQXdCLFFBQVEsT0FBaEM7O0FBRUEsbUJBQU8sYUFBUCxPQUF5QixRQUFRLElBQWpDLEVBQXlDLFNBQXpDLENBQW1ELE1BQW5ELENBQTBELFFBQVEsSUFBbEU7QUFDSDs7QUFFRDtBQUNBLFlBQUksWUFBWSxJQUFoQixFQUFzQjs7QUFFbEIsa0JBQU0sUUFBTjtBQUNIOztBQUVELGNBQU0sT0FBTixDQUFjLFdBQWQ7QUFDSCxLQW5DRDs7QUFxQ0E7QUFDQSxPQUFHLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxDQUFrQjtBQUFBLGVBQUssYUFBVyxDQUFYLElBQWtCLFVBQXZCO0FBQUEsS0FBbEI7O0FBRUEsVUFBTSxFQUFOLENBQVMsVUFBVCxFQUFxQixVQUFyQjs7QUFFQSxRQUFNLFdBQVcsU0FBWCxRQUFXLEdBQU07O0FBRW5CLGVBQU8sU0FBUCxDQUFpQixNQUFqQixDQUF3QixRQUFRLE9BQWhDLEVBQXlDLFFBQVEsS0FBakQsRUFBd0QsUUFBUSxPQUFoRSxFQUF5RSxRQUFRLElBQWpGO0FBQ0EsZUFBTyxhQUFQLE9BQXlCLFFBQVEsSUFBakMsRUFBeUMsU0FBekMsQ0FBbUQsR0FBbkQsQ0FBdUQsUUFBUSxJQUEvRDtBQUNILEtBSkQ7QUFLSDs7Ozs7Ozs7UUNoS2UsSSxHQUFBLEk7O0FBTmhCOztBQUNBOztBQUNBOztBQUVBLFFBQVEsR0FBUixDQUFZLGNBQU8sUUFBbkI7O0FBRU8sU0FBUyxJQUFULENBQWMsSUFBZCxFQUFvQjs7QUFFdkIsWUFBUSxHQUFSLENBQVksSUFBWjs7QUFFQSxRQUFJLFNBQVMsS0FBSyxnQkFBTCxDQUFzQixjQUFPLFFBQTdCLENBQWI7QUFDQSxRQUFNLFNBQVMsS0FBSyxhQUFMLENBQW1CLGVBQW5CLENBQWY7QUFDQSxRQUFNLGNBQWMsRUFBcEI7O0FBRUEsU0FBSyxXQUFMLEdBQW1CLFdBQW5CO0FBQ0EsU0FBSyxPQUFMLEdBQWUsS0FBZjtBQUNBLFNBQUssVUFBTCxHQUFrQixJQUFsQjs7QUFFQSw0QkFBUyxJQUFUOztBQUVBLFFBQU0sV0FBVyxTQUFYLFFBQVcsR0FBVzs7QUFFeEIsYUFBSyxPQUFMLEdBQWUsOEJBQWtCLFdBQWxCLENBQWY7QUFDQSxlQUFPLEtBQUssT0FBWjtBQUNILEtBSkQ7O0FBTUEsUUFBTSxjQUFjLFNBQWQsV0FBYyxHQUFXOztBQUUzQixlQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7O0FBRXBDLHFCQUFTLFlBQVQsR0FBd0I7O0FBRXBCO0FBQ0Esb0JBQUksVUFBSixFQUFnQjs7QUFFWjtBQUNILGlCQUhELE1BSUs7O0FBRUQ7QUFDSDtBQUNKOztBQUVELG1CQUFPLE9BQVAsQ0FBZSxVQUFDLEtBQUQsRUFBUSxDQUFSLEVBQWM7O0FBRXpCLG9CQUFJLE1BQU8sT0FBTyxNQUFQLEdBQWMsQ0FBekIsRUFBNkI7O0FBRXpCLDBCQUFNLEdBQU4sQ0FBVSxXQUFWLEVBQXVCLFlBQU07O0FBRXpCO0FBQ0gscUJBSEQ7QUFJSDs7QUFFRCxzQkFBTSxPQUFOLENBQWMsVUFBZCxFQUEwQixFQUExQjtBQUNILGFBWEQ7QUFZSCxTQTNCTSxDQUFQO0FBNEJILEtBOUJEOztBQWdDQSxTQUFLLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLFlBQVc7O0FBRTNCLHNCQUFjLElBQWQsQ0FBbUIsWUFBVzs7QUFFMUIsaUJBQUssT0FBTCxDQUFhLFdBQWI7QUFDSCxTQUhEO0FBSUgsS0FORDs7QUFRQSxTQUFLLEVBQUwsQ0FBUSxXQUFSLEVBQXFCLFlBQVk7O0FBRTdCLFlBQUksS0FBSyxPQUFULEVBQWtCOztBQUVkLGlCQUFLLE9BQUwsQ0FBYSxXQUFiO0FBQ0g7QUFDSixLQU5EOztBQVFBO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLFVBQVMsQ0FBVCxFQUFZOztBQUV4QixVQUFFLGNBQUY7O0FBRUEsWUFBSSxDQUFDLEtBQUssT0FBVixFQUFtQjs7QUFFZixpQkFBSyxPQUFMLENBQWEsVUFBYjtBQUNILFNBSEQsTUFJSzs7QUFFRCxpQkFBSyxPQUFMLENBQWEsV0FBYjtBQUNBLGlCQUFLLE9BQUwsQ0FBYSxXQUFiO0FBQ0g7QUFDSixLQWJEOztBQWdCQTtBQUNBLGFBQVMsVUFBVCxHQUFzQjs7QUFFbEIsZUFBTyxPQUFQLENBQWUsVUFBUyxLQUFULEVBQWdCOztBQUUzQixzQ0FBVSxLQUFWLEVBQWlCLFdBQWpCO0FBQ0gsU0FIRDtBQUlIOztBQUVEOztBQUVBO0FBQ0EsUUFBSSxDQUFDLEtBQUssTUFBVixFQUFrQjs7QUFFZCxhQUFLLE1BQUwsR0FBYyxZQUFXOztBQUVyQixxQkFBUyxLQUFLLElBQUwsQ0FBVSxjQUFPLFFBQWpCLENBQVQ7QUFDQTtBQUNILFNBSkQ7O0FBTUEsYUFBSyxFQUFMLENBQVEsUUFBUixFQUFrQixLQUFLLE1BQXZCO0FBQ0g7O0FBRUQsU0FBSyxFQUFMLENBQVEsT0FBUixFQUFpQixZQUFXOztBQUV4QixhQUFLLEtBQUw7QUFDQSxhQUFLLE9BQUwsR0FBZSxLQUFmOztBQUVBLGVBQU8sT0FBUCxDQUFlLFVBQVMsS0FBVCxFQUFnQjs7QUFFM0Isa0JBQU0sUUFBTjtBQUNILFNBSEQ7QUFJSCxLQVREO0FBVUg7Ozs7Ozs7Ozs7Ozs7O3FCQzVIUSxJOzs7Ozs7QUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7Ozs7O1FDeUNnQixXLEdBQUEsVztRQVdBLFMsR0FBQSxTO1FBeUJBLGEsR0FBQSxhO1FBNEJBLGlCLEdBQUEsaUI7UUEwQkEsa0IsR0FBQSxrQjtBQXBJVCxJQUFNLDBCQUFTOztBQUVsQjtBQUNBLGNBQVUsaUVBSFE7O0FBS2xCO0FBQ0EsYUFBUzs7QUFFTCxrQkFBVSxjQUZMO0FBR0wsdUJBQWUsZ0JBSFY7QUFJTCxjQUFNLG1CQUpEO0FBS0wsa0JBQVUsd0NBTEw7QUFNTCxjQUFNLDBDQU5EO0FBT0wsYUFBSyxlQVBBO0FBUUwsZUFBTyxvREFSRjtBQVNMLGVBQU87QUFURixLQU5TOztBQWtCbEI7QUFDQSxhQUFTOztBQUVMLG1CQUFXLE9BRk47QUFHTCxlQUFPLE9BSEY7QUFJTCxjQUFNLE1BSkQ7QUFLTCxjQUFNLE1BTEQ7QUFNTCxjQUFNLE1BTkQ7QUFPTCxpQkFBUyxTQVBKO0FBUUwsaUJBQVM7QUFSSixLQW5CUzs7QUE4QmxCO0FBQ0EsWUFBUTtBQUNKLFlBQUksY0FBWSxDQUFFO0FBRGQ7O0FBS1o7Ozs7OztBQXBDc0IsQ0FBZixDQTBDQSxTQUFTLFdBQVQsQ0FBcUIsUUFBckIsRUFBK0IsS0FBL0IsRUFBc0M7O0FBRXpDLFFBQUksT0FBTyxPQUFPLE1BQVAsQ0FBYyxRQUFkLENBQVAsS0FBbUMsVUFBdkMsRUFBbUQ7O0FBRS9DLGNBQU0sVUFBYSxRQUFiLDBDQUFOO0FBQ0g7O0FBRUQsVUFBTSxLQUFOLEdBQWMsT0FBTyxNQUFQLENBQWMsUUFBZCxFQUF3QixNQUFNLEtBQTlCLENBQWQ7QUFDSDs7QUFFRDtBQUNPLFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5Qjs7QUFFNUIsU0FBSyxHQUFMLElBQVksSUFBWixFQUFrQjs7QUFFZCxZQUFJLE9BQU8sR0FBUCxFQUFZLFdBQVosS0FBNEIsTUFBaEMsRUFBd0M7O0FBRXBDLG1CQUFPLEdBQVAsSUFBYyxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLE9BQU8sR0FBUCxDQUFsQixFQUErQixLQUFLLEdBQUwsQ0FBL0IsQ0FBZDtBQUNILFNBSEQsTUFJSzs7QUFFRCxtQkFBTyxHQUFQLElBQWMsS0FBSyxHQUFMLENBQWQ7QUFDSDtBQUNKO0FBQ0o7O0FBR0Q7Ozs7Ozs7OztBQVNPLFNBQVMsYUFBVCxDQUF1QixLQUF2QixFQUE4QixHQUE5QixFQUFtQzs7QUFFdEM7QUFDQSxRQUFJLElBQUksV0FBSixLQUFvQixNQUF4QixFQUFnQzs7QUFFNUIsZUFBTyxJQUFJLElBQUosQ0FBUyxLQUFULENBQVA7QUFDSDs7QUFFRDtBQUNBO0FBQ0EsUUFBSSxPQUFPLEdBQVAsS0FBZSxRQUFmLElBQTJCLE9BQU8sT0FBUCxDQUFlLEdBQWYsTUFBd0IsU0FBdkQsRUFBa0U7O0FBRTlELGVBQU8sT0FBTyxPQUFQLENBQWUsR0FBZixFQUFvQixJQUFwQixDQUF5QixLQUF6QixDQUFQO0FBQ0g7O0FBRUQ7QUFDQSxVQUFNLE1BQU0sNkZBQU4sQ0FBTjtBQUVIOztBQUdEOzs7Ozs7O0FBT08sU0FBUyxpQkFBVCxDQUEyQixHQUEzQixFQUFnQzs7QUFFbkM7QUFDQSxTQUFLLElBQUksQ0FBVCxJQUFjLEdBQWQsRUFBbUI7O0FBRWY7QUFDQSxZQUFJLElBQUksQ0FBSixNQUFXLEtBQWYsRUFBc0I7O0FBRWxCLG1CQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELFdBQU8sSUFBUDtBQUNIOztBQUdEOzs7Ozs7Ozs7O0FBVU8sU0FBUyxrQkFBVCxDQUE2QixLQUE3QixFQUFvQyxjQUFwQyxFQUFvRDs7QUFFdkQsUUFBSSxVQUFVLFNBQVMsSUFBdkIsRUFBNkI7O0FBRXpCLGNBQU0sSUFBSSxLQUFKLGtCQUF5QixNQUFNLElBQS9CLHNDQUFOO0FBQ0g7O0FBRUQsUUFBSSxTQUFTLE1BQU0sYUFBbkI7O0FBRUEsUUFBSSxDQUFDLE9BQU8sU0FBUCxDQUFpQixRQUFqQixDQUEwQixjQUExQixDQUFMLEVBQWdEOztBQUU1QyxpQkFBUyxtQkFBbUIsTUFBbkIsRUFBMkIsY0FBM0IsQ0FBVDtBQUNIOztBQUVELFdBQU8sTUFBUDtBQUNIOzs7Ozs7OztRQzVJZSxRLEdBQUEsUTtBQVBoQixJQUFNLGFBQWEsS0FBSyxVQUF4Qjs7QUFFQSxJQUFNLE9BQU87QUFDVCxXQUFPLEtBREU7QUFFVCxhQUFTO0FBRkEsQ0FBYjs7QUFLTyxTQUFTLFFBQVQsQ0FBbUIsR0FBbkIsRUFBd0IsS0FBeEIsRUFBK0I7O0FBRWxDLFFBQU0sT0FBTyxJQUFiOztBQUVBO0FBQ0EsUUFBTSxXQUFXLFlBQWpCOztBQUVBO0FBQ0EsUUFBTSxhQUFhLEVBQW5COztBQUVBO0FBQ0EsS0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLEtBQWQsRUFBcUIsU0FBckIsRUFBZ0MsT0FBaEMsQ0FBd0MsVUFBQyxFQUFELEVBQVE7O0FBRTVDO0FBQ0EsWUFBSSxTQUFTLFNBQVMsRUFBVCxDQUFiOztBQUVBO0FBQ0EsWUFBSSxLQUFLLEtBQVQsRUFBZ0I7O0FBRVoscUJBQVMsa0JBQVk7O0FBRWpCLHlCQUFTLEVBQVQsRUFBYSxLQUFiLENBQW1CLFNBQVMsRUFBVCxDQUFuQixFQUFpQyxTQUFqQzs7QUFFQTtBQUNBLG9CQUFJLEtBQUssT0FBTCxJQUFnQixPQUFPLEtBQUssT0FBWixLQUF3QixVQUE1QyxFQUF3RDs7QUFFcEQsd0JBQU0sT0FBTyxNQUFNLFNBQU4sQ0FBZ0IsS0FBaEIsQ0FBc0IsS0FBdEIsQ0FBNEIsU0FBNUIsQ0FBYjtBQUNBLHdCQUFNLFNBQVMsS0FBSyxLQUFMLEVBQWY7O0FBRUEseUJBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsRUFBbkIsRUFBdUIsQ0FBQyxHQUFELEVBQU0sRUFBTixFQUFVLE1BQVYsRUFBa0IsSUFBbEIsQ0FBdkI7QUFDSDtBQUNKLGFBWkQ7QUFhSDs7QUFFRDtBQUNBLG1CQUFXLEVBQVgsSUFBaUI7QUFDYixtQkFBTyxNQURNO0FBRWIsc0JBQVU7QUFGRyxTQUFqQjtBQUlILEtBNUJEOztBQThCQTtBQUNBLGFBQVMsT0FBTyxJQUFQLENBQVksS0FBWixFQUFtQixHQUFuQixDQUF1QixVQUFDLEdBQUQsRUFBUzs7QUFFckMsbUJBQVcsR0FBWCxJQUFrQixNQUFNLEdBQU4sQ0FBbEI7QUFDSCxLQUhRLENBQVQ7O0FBS0EsV0FBTyxnQkFBUCxDQUF3QixHQUF4QixFQUE2QixVQUE3QjtBQUNIOztBQUVELFNBQVMsU0FBVCxHQUFxQixVQUFDLEdBQUQsRUFBUzs7QUFFMUIsV0FBTyxNQUFQLENBQWMsSUFBZCxFQUFvQixHQUFwQjtBQUNILENBSEQ7OztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2bUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDaDdFQSxLQUFLLElBQUwsQ0FBVSxVQUFWLEVBQXNCLHFoQkFBdEIsRUFBNmlCLG8rRkFBN2lCLEVBQW1oSCxFQUFuaEgsRUFBdWhILFVBQVMsSUFBVCxFQUFlOztBQUU5aEgsUUFBTSxPQUFPLElBQWI7QUFDQSxTQUFLLE9BQUwsR0FBZSxFQUFmO0FBQ0EsU0FBSyxDQUFMLEdBQVMsQ0FBVDtBQUNBLFNBQUssZUFBTCxHQUF1QixHQUF2QjtBQUNBLFNBQUssY0FBTCxHQUFzQixPQUF0QjtBQUNBLFNBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxTQUFLLEtBQUwsR0FBYSxLQUFiOztBQUVBLFNBQUssTUFBTCxHQUFjLFlBQU07O0FBRWhCLGFBQUssSUFBTCxHQUFZLENBQUMsS0FBSyxJQUFsQjtBQUNBLGFBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsS0FBSyxJQUFMLEdBQVksUUFBWixHQUF1QixLQUEzQyxFQUFrRCxPQUFsRDtBQUNBLGFBQUssZUFBTCxHQUF1QixLQUFLLElBQUwsR0FBWSxHQUFaLEdBQWtCLEdBQXpDO0FBQ0gsS0FMRDs7QUFPQSxTQUFLLFdBQUwsR0FBbUIsWUFBTTs7QUFFckIsYUFBSyxLQUFMLEdBQWEsQ0FBQyxLQUFLLEtBQW5CO0FBQ0EsYUFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixLQUFLLEtBQUwsR0FBYSxLQUFiLEdBQXFCLFFBQXpDLEVBQW1ELE9BQW5EO0FBQ0EsYUFBSyxjQUFMLEdBQXNCLEtBQUssS0FBTCxHQUFhLE1BQWIsR0FBc0IsT0FBNUM7QUFDSCxLQUxEOztBQU9BLFNBQUssS0FBTCxHQUFhLFlBQU07O0FBRWYsYUFBSyxPQUFMLEdBQWUsRUFBZjtBQUNILEtBSEQ7O0FBS0EsU0FBSyxTQUFMLEdBQWlCLFVBQUMsS0FBRCxFQUFXOztBQUV4QixhQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLE1BQXBCLENBQTJCLFdBQTNCLEVBQXdDLFVBQXhDLEVBQW9ELGNBQXBELEVBQW9FLGFBQXBFO0FBQ0EsYUFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixNQUFNLE1BQU4sQ0FBYSxLQUFyQztBQUNILEtBSkQ7O0FBTUEsU0FBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsU0FBSyxnQkFBTCxHQUF3QixZQUFNOztBQUUxQixZQUFNLE1BQU0sT0FBTyw0QkFBUCxDQUFaOztBQUVBLFlBQUksR0FBSixFQUFTOztBQUVMLGlCQUFLLFVBQUwsR0FBa0IsU0FBUyxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQXdCLEVBQXhCLENBQVQsQ0FBbEI7QUFDSDtBQUNKLEtBUkQ7O0FBVUEsU0FBSyxFQUFMLENBQVEsT0FBUixFQUFpQixVQUFDLEdBQUQsRUFBTSxFQUFOLEVBQVUsTUFBVixFQUFrQixJQUFsQixFQUEyQjs7QUFFeEMsWUFBTSxPQUFPLENBQUMsSUFBSSxJQUFKLEVBQWQ7O0FBRUEsYUFBSyxDQUFMO0FBQ0EsWUFBTSxJQUFJLEtBQUssQ0FBZjtBQUNBLGFBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsRUFBRSxRQUFGLEVBQU8sTUFBUCxFQUFXLGNBQVgsRUFBbUIsVUFBbkIsRUFBeUIsVUFBekIsRUFBK0IsSUFBL0IsRUFBckI7O0FBRUEsWUFBSSxLQUFLLE9BQUwsQ0FBYSxNQUFiLEdBQXNCLEtBQUssVUFBL0IsRUFBMkM7O0FBRXZDLGlCQUFLLE9BQUwsQ0FBYSxHQUFiO0FBQ0g7O0FBRUQsYUFBSyxNQUFMO0FBQ0gsS0FkRDs7QUFnQkEsU0FBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixjQUF4Qjs7QUFFQSxRQUFJLFFBQUosR0FBZSxJQUFmO0FBQ1AsQ0FqRUQ7O0FBb0VBLEtBQUssSUFBTCxDQUFVLFdBQVYsRUFBdUIsbWJBQXZCLEVBQTRjLEVBQTVjLEVBQWdkLEVBQWhkLEVBQW9kLFVBQVMsSUFBVCxFQUFlLENBQ2xlLENBREQ7O0FBSUEsS0FBSyxJQUFMLENBQVUsTUFBVixFQUFrQiwyQkFBbEIsRUFBK0MsRUFBL0MsRUFBbUQsRUFBbkQsRUFBdUQsVUFBUyxJQUFULEVBQWU7O0FBRWxFLFNBQUssSUFBTCxHQUFZLE9BQU8sSUFBUCxDQUFZLEtBQUssSUFBakIsRUFBdUIsR0FBdkIsQ0FBMkI7QUFBQSx1QkFBVyxDQUFYO0FBQUEsS0FBM0IsRUFBMkMsSUFBM0MsQ0FBZ0QsR0FBaEQsQ0FBWjtBQUNILENBSEQ7O0FBS0EsS0FBSyxJQUFMLENBQVUsYUFBVixFQUF5QixFQUF6QixFQUE2QixFQUE3QixFQUFpQyxFQUFqQyxFQUFxQyxVQUFTLElBQVQsRUFBZTs7QUFFNUMsUUFBTSxPQUFPLElBQWI7QUFDQSxRQUFNLGNBQWM7O0FBRWhCLHVCQUFlLENBRkM7QUFHaEIsdUJBQWU7QUFIQyxLQUFwQjs7QUFNQSxRQUFNLE9BQU8sS0FBSyxJQUFMLENBQVUsSUFBVixJQUFrQixJQUEvQjtBQUNBLFFBQU0sZUFBZSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLFdBQWxCLEVBQStCLEtBQUssSUFBcEMsQ0FBckI7O0FBRUEsU0FBSyxFQUFMLENBQVEsT0FBUixFQUFpQixZQUFNOztBQUVuQixrQkFBVSxRQUFWLENBQW1CLElBQW5CO0FBQ0gsS0FIRDtBQUlQLENBaEJEOztBQWtCQSxLQUFLLElBQUwsQ0FBVSxLQUFWLEVBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLEVBQXlCLEVBQXpCLEVBQTZCLFVBQVMsSUFBVCxFQUFlO0FBQ3hDLFNBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsS0FBSyxJQUFMLENBQVUsT0FBaEM7QUFDSCxDQUZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgQmVhdXRpZnkgZnJvbSAnanMtYmVhdXRpZnknO1xuXG5pbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4vbGliL29ic2VydmVyJztcbmltcG9ydCAqIGFzIEFjdGlvbkZvcm1zIGZyb20gJy4vbGliL2FjdGlvbi1mb3Jtcyc7XG5pbXBvcnQgJy4vdGFncyc7XG5cbmNvbnN0IFJpb3RVdGlscyA9IHtcblxuICAgIE9ic2VydmVyLFxuICAgIEFjdGlvbkZvcm1zLFxuICAgIEJlYXV0aWZ5XG59XG5cbmdsb2JhbC5SaW90VXRpbHMgPSBSaW90VXRpbHM7XG4iLCJpbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4uL29ic2VydmVyJztcbmltcG9ydCB7IHZhbGlkYXRlUmVnZXgsIGNvbmZpcm1WYWxpZGF0aW9uLCBmaW5kRmllbGRDb250YWluZXIsIGZvcm1hdFZhbHVlLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgY2xhc3NlcyA9IGNvbmZpZy5jbGFzc2VzO1xuXG4vKipcbiAqIEFkZHMgdmFsaWRhdGlvbiBmdW5jdGlvbmFsaXR5IHRvIGZvcm0gZmllbGRzXG4gKiB0byBkaXNwbGF5IGVycm9ycyBhbmQgaGVscCBmaWVsZHMuIEJpbmRzIGZpZWxkIHdpdGhcbiAqIFJpb3QgT2JzZXJ2YWJsZSBhbmQgZ2l2ZXMgZWxlbWVudHMgZXZlbnQgZmVhdHVyZXMuXG4gKlxuICogQHBhcmFtIHsgSFRNTEZvcm1FbGVtZW50IH0gZmllbGQgLSBGaWVsZCB3aG9zZSBwYXJlbnQgd2Ugd2lsbCByZXR1cm5cbiAqIEBwYXJhbSB7IE9iamVjdCB9IHZhbGlkYXRpb25zIC0gUGFyZW50IGZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kRmllbGQgKGZpZWxkLCB2YWxpZGF0aW9ucykge1xuXG4gICAgY29uc3QgcGFyZW50ID0gZmluZEZpZWxkQ29udGFpbmVyKGZpZWxkLCBjbGFzc2VzLmNvbnRhaW5lciB8fCAnLmZpZWxkJyApO1xuXG4gICAgY29uc3QgbmFtZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnbmFtZScpO1xuICAgIGNvbnN0IHR5cGUgPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKTtcbiAgICBjb25zdCByZXF1aXJlZCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVxdWlyZWQnKSAhPT0gdW5kZWZpbmVkO1xuXG4gICAgLy8gRm9ybWF0dGluZyBmdW5jdGlvblxuICAgIGNvbnN0IGZvcm1hdCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnZm9ybWF0Jyk7XG5cbiAgICAvLyBWYWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgLy8gaW5wdXRbZGF0YS12YWxpZGF0ZV0gc2hvdWxkIGJlIGEgZnVuY3Rpb24gaW5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgndmFsaWRhdGUnKTtcblxuICAgIC8vIE1hdGNoIHZhbHVlIGFnYWluc3QgYW5vdGhlciBlbGVtZW50XG4gICAgLy8gU2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yXG4gICAgY29uc3QgZXF1YWxzID0gZmllbGQuZ2V0QXR0cmlidXRlKCdlcXVhbHMnKTtcblxuICAgIC8vIEN1c3RvbSByZWd1bGFyIGV4cHJlc3Npb25cbiAgICBjb25zdCByZWdleCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVnZXgnKTtcblxuICAgIC8vIEV2ZW50cyB0byBiaW5kIHRvXG4gICAgY29uc3Qgb24gPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ29uJykgfHwgJ2NoYW5nZSc7XG5cbiAgICAvLyBJbnB1dCB2YWxpZGF0aW9uIG9iamVjdCB0byBoYW5kbGUgbXVsdGlwbGUgbWV0aG9kc1xuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB7fTtcblxuICAgIGxldCBpc1ZhbGlkID0gZmFsc2U7XG5cbiAgICBpZiAoZmllbGQuZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpIHx8IHR5cGUgPT09ICdoaWRkZW4nKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9ic2VydmVyKGZpZWxkKTtcblxuICAgIC8vIEZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG5cbiAgICBpZiAoZm9ybWF0KSB7XG5cbiAgICAgICAgZm9ybWF0VmFsdWUoZm9ybWF0LCBmaWVsZCk7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGVGbiA9IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBjb25zdCBrZXlDb2RlID0gKHdpbmRvdy5ldmVudCkgPyBlLndoaWNoIDogZS5rZXlDb2RlO1xuICAgICAgICBjb25zdCBpc0JsdXIgPSBlLnR5cGUgPT09J2JsdXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGZpZWxkLnZhbHVlO1xuICAgICAgICBjb25zdCBlbXB0eSA9ICF2YWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gSWYgaXQncyByZXF1aXJlZCwgaXQgY2FuJ3QgYmUgZW1wdHlcbiAgICAgICAgaWYgKHJlcXVpcmVkKSB7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVxdWlyZWQgPSAhIXZhbHVlO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvbi5jaGVja2VkID0gZmllbGQuY2hlY2tlZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBleGlzdGluZyB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgICAgIGlmICh2YWxpZGF0ZSkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnZhbGlkYXRlID0gdmFsaWRhdGVSZWdleCh2YWx1ZSwgdmFsaWRhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzZXJ0IGFnYWluc3QgY3VzdG9tIHJlZ2V4XG4gICAgICAgIGlmIChyZWdleCkge1xuXG4gICAgICAgICAgICBjb25zdCByZ3ggPSBuZXcgUmVnRXhwKHJlZ2V4KTtcbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVnZXggPSByZ3gudGVzdCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBhbm90aGVyIGZpZWxkJ3MgdmFsdWVcbiAgICAgICAgaWYgKGVxdWFscykge1xuXG4gICAgICAgICAgICBjb25zdCBlcXVhbHNFbGVtZW50ID0gZmllbGQuZm9ybS5xdWVyeVNlbGVjdG9yKGVxdWFscyk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24uZXF1YWxzID0gdmFsdWUgPT09IGVxdWFsc0VsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgICAgIGlmICghZXF1YWxzRWxlbWVudC5pc1ZhbGlkKSB7XG5cbiAgICAgICAgICAgICAgICBlcXVhbHNFbGVtZW50LnRyaWdnZXIoJ3ZhbGlkYXRlJywge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBDaGVjayBpbnB1dCB2YWxpZGF0aW9uXG4gICAgICAgIGlzVmFsaWQgPSBjb25maXJtVmFsaWRhdGlvbih2YWxpZGF0aW9uKTtcblxuICAgICAgICAvLyBJbnB1dCBpcyBub3QgcmVxdWlyZWQgYW5kIGlzIGVtcHR5XG4gICAgICAgIGlmICghaXNWYWxpZCAmJiAhcmVxdWlyZWQgJiYgIXZhbHVlICYmIGlzQmx1cikge1xuXG4gICAgICAgICAgICBpc1ZhbGlkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbGlkYXRlZChpc1ZhbGlkKTtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XG5cbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVkID0gZnVuY3Rpb24oaXNWYWxpZCkge1xuXG4gICAgICAgIC8vIEJpbmQgdG8gdmFsaWRhdGlvbiBvYmplY3QgZm9yIGZvcm0gY2hlY2tcbiAgICAgICAgaWYgKHZhbGlkYXRlIHx8IHJlZ2V4IHx8IGVxdWFscyB8fCByZXF1aXJlZCkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kIHZhbGlkaXR5IHRvIGh0bWwgZWxlbWVudFxuICAgICAgICBmaWVsZC5pc1ZhbGlkID0gaXNWYWxpZDtcblxuICAgICAgICAvLyBJZiBpdCdzIHZhbGlkLCByZW1vdmUgZXJyb3IgY2xhc3NlcyBhbmQgaGlkZSB0aGUgaGVscCBibG9jay5cbiAgICAgICAgLy8gVGhpcyBpcyBtZWFudCB0byB3b3JrIHdpdGggYm9vdHN0cmFwIGZvcm1zLlxuICAgICAgICBpZiAoaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWxsb3cgZmllbGRzIHRoYXQgYXJlIG5vdCByZXF1aXJlZFxuICAgICAgICBpZiAoaXNWYWxpZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICBmaWVsZC5zZXRCbGFuaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgfTtcblxuICAgIC8vIEJpbmQgZXZlbnRzIHRvIHZhbGlkYXRpb24gZnVuY3Rpb25cbiAgICBvbi5zcGxpdCgnICcpLm1hcChvID0+IGZpZWxkW2BvbiR7b31gXSA9IHZhbGlkYXRlRm4pO1xuXG4gICAgZmllbGQub24oJ3ZhbGlkYXRlJywgdmFsaWRhdGVGbik7XG5cbiAgICBjb25zdCBzZXRCbGFuayA9ICgpID0+IHtcblxuICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLnN1Y2Nlc3MsIGNsYXNzZXMuZXJyb3IsIGNsYXNzZXMud2FybmluZywgY2xhc3Nlcy5pbmZvKTtcbiAgICAgICAgcGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2NsYXNzZXMuaGVscH1gKS5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuaGlkZSk7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IE9ic2VydmVyIH0gZnJvbSAnLi4vb2JzZXJ2ZXInO1xuaW1wb3J0IHsgYmluZEZpZWxkIH0gZnJvbSAnLi9iaW5kLWZpZWxkJztcbmltcG9ydCB7IGNvbmZpcm1WYWxpZGF0aW9uLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc29sZS5sb2coY29uZmlnLmVsZW1lbnRzKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZm9ybSkge1xuXG4gICAgY29uc29sZS5sb2coZm9ybSk7XG5cbiAgICBsZXQgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKGNvbmZpZy5lbGVtZW50cyk7XG4gICAgY29uc3Qgc3VibWl0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgY29uc3QgdmFsaWRhdGlvbnMgPSB7fTtcblxuICAgIGZvcm0udmFsaWRhdGlvbnMgPSB2YWxpZGF0aW9ucztcbiAgICBmb3JtLmlzVmFsaWQgPSBmYWxzZTtcbiAgICBmb3JtLm5vVmFsaWRhdGUgPSB0cnVlO1xuXG4gICAgT2JzZXJ2ZXIoZm9ybSk7XG5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0uaXNWYWxpZCA9IGNvbmZpcm1WYWxpZGF0aW9uKHZhbGlkYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIGZvcm0uaXNWYWxpZDtcbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVBbGwgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhc3Nlc3NTdWJtaXQoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgdmFsaWRcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dHMuZm9yRWFjaCgoZmllbGQsIGkpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpID09PSAoaW5wdXRzLmxlbmd0aC0xKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLm9uZSgndmFsaWRhdGVkJywgKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3Nlc3NTdWJtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGUnLCB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9ybS5vbigndmFsaWRhdGUnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YWxpZGF0ZUFsbCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZm9ybS5vbigndmFsaWRhdGVkJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmIChmb3JtLmlzVmFsaWQpIHtcblxuICAgICAgICAgICAgZm9ybS50cmlnZ2VyKCdzdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGUgZm9ybSBpcyBzdWJtaXR0aW5nLCBpdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBmaWVsZHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICBmb3JtLm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAoIWZvcm0uaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3ZhbGlkYXRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3N1Ym1pdHRlZCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8gQWRkIHZhbGlkYXRpb24gZnVuY3Rpb25hbGl0eSB0byBmb3JtIGVsZW1lbnRzXG4gICAgZnVuY3Rpb24gYmluZEZpZWxkcygpIHtcblxuICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuXG4gICAgICAgICAgICBiaW5kRmllbGQoZmllbGQsIHZhbGlkYXRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmluZEZpZWxkcygpO1xuXG4gICAgLy8gUmViaW5kIHZhbGlkYXRpb25zIGluIGNhc2Ugb2YgbmV3IHJlcXVpcmVkIGZpZWxkc1xuICAgIGlmICghZm9ybS5yZWJpbmQpIHtcblxuICAgICAgICBmb3JtLnJlYmluZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpbnB1dHMgPSBmb3JtLmZpbmQoY29uZmlnLmVsZW1lbnRzKTtcbiAgICAgICAgICAgIGJpbmRGaWVsZHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm0ub24oJ3JlYmluZCcsIGZvcm0ucmViaW5kKTtcbiAgICB9XG5cbiAgICBmb3JtLm9uKCdyZXNldCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0ucmVzZXQoKTtcbiAgICAgICAgZm9ybS5pc1ZhbGlkID0gZmFsc2U7XG5cbiAgICAgICAgaW5wdXRzLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcblxuICAgICAgICAgICAgZmllbGQuc2V0QmxhbmsoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuIiwiZXhwb3J0IHsgYmluZCB9IGZyb20gJy4vYmluZC1mb3JtJztcbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMnO1xuIiwiZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcblxuICAgIC8vIEVsZW1lbnRzIHRvIGJlIHNlbGVjdGVkIGZvciB2YWxpZGF0aW9uXG4gICAgZWxlbWVudHM6ICdbcmVxdWlyZWRdLFtkYXRhLXZhbGlkYXRlXSxbZGF0YS1lcXVhbHNdLFtkYXRhLXJlZ2V4XSxbZGF0YS1jY10nLFxuXG4gICAgLy8gUmVndWxhciBleHByZXNzaW9ucyB1c2VkIHRvIHZhbGlkYXRlXG4gICAgcmVnZXhlczoge1xuXG4gICAgICAgIGFscGhhbnVtOiAvXlthLXowLTldKyQvaSxcbiAgICAgICAgYWxwaGFudW1zcGFjZTogL15bYS16MC05XFxzXSskL2ksXG4gICAgICAgIG5hbWU6IC9eW2Etelxcc1xcLVxcLFxcLl0rJC9pLFxuICAgICAgICB1c2VybmFtZTogL15bYS16MC05XVthLXowLTlcXHNcXC1cXF9cXCtcXC5dK1thLXowLTldJC9pLFxuICAgICAgICBmcWRuOiAvXlthLXowLTldW2EtejAtOVxcLVxcX1xcLl0rW2EtejAtOV17MiwyMH0kL2ksXG4gICAgICAgIHRsZDogL15bYS16XXsyLDIwfS9pLFxuICAgICAgICBwaG9uZTogL15cXCg/KFswLTldezN9KVxcKT9bLS4gXT8oWzAtOV17M30pWy0uIF0/KFswLTldezR9KSQvLFxuICAgICAgICBlbWFpbDogLy4rQC4rXFwuLisvaVxuICAgIH0sXG5cbiAgICAvLyBGZWVkYmFjaywgc3RhdGUsIGFuZCBjb250YWluZXIgY2xhc3Nlc1xuICAgIGNsYXNzZXM6IHtcblxuICAgICAgICBjb250YWluZXI6ICdmaWVsZCcsXG4gICAgICAgIGVycm9yOiAnZXJyb3InLFxuICAgICAgICBoZWxwOiAnaGVscCcsXG4gICAgICAgIGhpZGU6ICdoaWRlJyxcbiAgICAgICAgaW5mbzogJ2luZm8nLFxuICAgICAgICBzdWNjZXNzOiAnc3VjY2VzcycsXG4gICAgICAgIHdhcm5pbmc6ICd3YXJuaW5nJ1xuICAgIH0sXG5cbiAgICAvLyBGaWVsZCBmb3JtYXR0aW5nIGZ1bmN0aW9uc1xuICAgIGZvcm1hdDoge1xuICAgICAgICBjYzogZnVuY3Rpb24gKCkge31cbiAgICB9XG59XG5cbi8qXG4gKiBGb3JtYXQgYSBmaWVsZCdzIHZhbHVlIGJhc2VkIG9uIGZ1bmN0aW9ucyBpbiBgY29uZmlnLmZvcm1hdGBcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSBmb3JtYXRGbiAtIE5hbWUgb2YgZnVuY3Rpb24gaW4gYGNvbmZpZy5mb3JtYXRgXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHRvIGZvcm1hdCB2YWx1ZSBvZlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUoZm9ybWF0Rm4sIGZpZWxkKSB7XG5cbiAgICBpZiAodHlwZW9mIGNvbmZpZy5mb3JtYXRbZm9ybWF0Rm5dID09PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGAke2Zvcm1hdEZufSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYSBmdW5jdGlvbmApO1xuICAgIH1cblxuICAgIGZpZWxkLnZhbHVlID0gY29uZmlnLmZvcm1hdFtmb3JtYXRGbl0oZmllbGQudmFsdWUpO1xufVxuXG4vLyBPdmVyd3JpdGUgY29uZmlnXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKG9wdHMpIHtcblxuICAgIGZvciAob3B0IGluIG9wdHMpIHtcblxuICAgICAgICBpZiAoY29uZmlnW29wdF0uY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbmZpZ1tvcHRdLCBvcHRzW29wdF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IG9wdHNbb3B0XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIHZhbHVlIGFuZCByZXR1cm5zIHRydWUgb3IgZmFsc2UuXG4gKiBUaHJvd3MgZXJyb3IgaWYgaXQgY2Fubm90IHZhbGlkYXRlXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gdmFsdWUgLSBWYWx1ZSB0byBiZSB2YWxpZGF0ZWRcbiAqIEBwYXJhbSB7IFN0cmluZyB8IFJlZ0V4cCB9IHJneCAtIFN0cmluZyByZWZlcmVuY2UgdG8gYHJlZ2V4ZXNgIG9yIGEgUmVnRXhwXG4gKlxuICogQHJldHVybnMgeyBCb29sZWFuIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUmVnZXgodmFsdWUsIHJneCkge1xuXG4gICAgLy8gQWNjZXB0cyBSZWdFeHAgYXMgc2Vjb25kIHZhbHVlXG4gICAgaWYgKHJneC5jb25zdHJ1Y3RvciA9PT0gUmVnRXhwKSB7XG5cbiAgICAgICAgcmV0dXJuIHJneC50ZXN0KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBTZWNvbmQgdmFsdWUgaXMgYSBzdHJpbmcsIHNvIGl0IG11c3QgZXhpc3RcbiAgICAvLyBpbnNpZGUgb2YgYGNvbmZpZy5yZWdleGVzYCBvYmplY3RcbiAgICBpZiAodHlwZW9mIHJneCA9PT0gJ3N0cmluZycgJiYgY29uZmlnLnJlZ2V4ZXNbcmd4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZWdleGVzW3JneF0udGVzdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgY29uZGl0aW9ucyBhcmVuJ3QgbWV0LCB0aHJvdyBlcnJvclxuICAgIHRocm93IEVycm9yKCdzZWNvbmQgcGFyYW1ldGVyIGlzIGFuIGludmFsaWQgcmVndWxhciBleHByZXNzaW9uIG9yIGRvZXMgbm90IGV4aXN0IHdpdGhpbiB1dGlsaXRpZXMgb2JqZWN0Jyk7XG5cbn1cblxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW4gb2JqZWN0IGFuZCBjaGVja3MgZm9yIHRydWUgb3IgZmFsc2VcbiAqXG4gKiBAcGFyYW0geyBPYmplY3QgfSBvYmogLSBPYmplY3QgdG8gaXRlcmF0ZVxuICpcbiAqIEByZXR1cm5zIHsgQm9vbGVhbiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25maXJtVmFsaWRhdGlvbihvYmopIHtcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgb2JqZWN0XG4gICAgZm9yICh2YXIgdiBpbiBvYmopIHtcblxuICAgICAgICAvLyBBbmQgcmV0dXJuIGZhbHNlIGlmIGFueSBrZXkgaXMgZmFsc2VcbiAgICAgICAgaWYgKG9ialt2XSA9PT0gZmFsc2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8qKlxuICogQ3Jhd2xzIHVwIHRoZSBET00gc3RhcnRpbmcgZnJvbSB0aGUgYGZpZWxkYCBlbGVtZW50XG4gKiBhbmQgZmluZHMgY29udGFpbmluZyBlbGVtZW50IHdpdGggY2xhc3MgbmFtZXMgc3BlY2lmaWVkXG4gKiBpbiB0aGUgYGNsYXNzZXNgIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHdob3NlIHBhcmVudCB3ZSB3aWxsIHJldHVyblxuICogQHBhcmFtIHsgT2JqZWN0IH0gY29udGFpbmVyQ2xhc3MgLSBOYW1lIG9mIGNsYXNzIHRoZSBjb250YWluZXIgd2lsbCBoYXZlXG4gKlxuICogQHJldHVybnMgeyBIVE1MRWxlbWVudCB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRmllbGRDb250YWluZXIgKGZpZWxkLCBjb250YWluZXJDbGFzcykge1xuXG4gICAgaWYgKGZpZWxkID09PSBkb2N1bWVudC5ib2R5KSB7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWVsZCBuYW1lZCAke2ZpZWxkLm5hbWV9IGlzIG5vdCBpbnNpZGUgYSBmaWVsZCBjb250YWluZXJgKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyZW50ID0gZmllbGQucGFyZW50RWxlbWVudDtcblxuICAgIGlmICghcGFyZW50LmNsYXNzTGlzdC5jb250YWlucyhjb250YWluZXJDbGFzcykpIHtcblxuICAgICAgICBwYXJlbnQgPSBmaW5kRmllbGRDb250YWluZXIocGFyZW50LCBjb250YWluZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudDtcbn1cbiIsImNvbnN0IG9ic2VydmFibGUgPSByaW90Lm9ic2VydmFibGU7XHJcblxyXG5jb25zdCBvcHRzID0ge1xyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgZGVidWdGbjogZmFsc2VcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIE9ic2VydmVyIChvYmosIHByb3BzKSB7XHJcblxyXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLy8gT2JzZXJ2ZXJhYmxlIG9ic2VydmVyIGZvciB0aGlzIGluc3RhbmNlXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG9ic2VydmFibGUoKTtcclxuXHJcbiAgICAvLyBQcm9wZXJ0aWVzIG9iamVjdCB0byByZXdyYXBcclxuICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7fTtcclxuXHJcbiAgICAvLyBSZXdyYXAgb2JzZXJ2ZXIgZnVuY3Rpb25zIGZvciBkZWJ1Z2dpbmdcclxuICAgIFsnb24nLCAnb25lJywgJ29mZicsICd0cmlnZ2VyJ10uZm9yRWFjaCgoZm4pID0+IHtcclxuXHJcbiAgICAgICAgLy8gU2ltcGx5IHBhc3MgYnkgcmVmZXJlbmNlIGluIHByb2R1Y3Rpb25cclxuICAgICAgICBsZXQgZXhlY0ZuID0gb2JzZXJ2ZXJbZm5dO1xyXG5cclxuICAgICAgICAvLyBSZXdyYXAgYW5kIGxvZyBpZiBkZWJ1Z2dpbmdcclxuICAgICAgICBpZiAob3B0cy5kZWJ1Zykge1xyXG5cclxuICAgICAgICAgICAgZXhlY0ZuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIG9ic2VydmVyW2ZuXS5hcHBseShvYnNlcnZlcltmbl0sIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSG9vayBpbnRvIGZ1bmN0aW9uIGZvciBtYWtpbmcgZGVidWdnaW5nIHRvb2xzXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kZWJ1Z0ZuICYmIHR5cGVvZiBvcHRzLmRlYnVnRm4gPT09ICdmdW5jdGlvbicpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGFyZ3Muc2hpZnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWJ1Z0ZuLmFwcGx5KHt9LCBbb2JqLCBmbiwgYWN0aW9uLCBhcmdzXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhvc2UgZnVuY3Rpb25zIGNhbm5vdCBiZSBvdmVyd3JpdHRlblxyXG4gICAgICAgIHByb3BlcnRpZXNbZm5dID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogZXhlY0ZuLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRGVmaW5lIHByb3BlcnRpZXMgaW4gYHByb3BzYFxyXG4gICAgcHJvcHMgJiYgT2JqZWN0LmtleXMocHJvcHMpLm1hcCgoa2V5KSA9PiB7XHJcblxyXG4gICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHByb3BzW2tleV07XHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmosIHByb3BlcnRpZXMpO1xyXG59XHJcblxyXG5PYnNlcnZlci5jb25maWd1cmUgPSAob2JqKSA9PiB7XHJcblxyXG4gICAgT2JqZWN0LmFzc2lnbihvcHRzLCBvYmopO1xyXG59XHJcbiIsIi8qXG4gIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gIENvcHlyaWdodCAoYykgMjAwNy0yMDE3IEVpbmFyIExpZWxtYW5pcywgTGlhbSBOZXdtYW4sIGFuZCBjb250cmlidXRvcnMuXG5cbiAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cbiAgb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXNcbiAgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLFxuICBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLFxuICBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLFxuICBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiAgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSU1xuICBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbiAgQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICBTT0ZUV0FSRS5cblxuKi9cblxuLyoqXG5UaGUgZm9sbG93aW5nIGJhdGNoZXMgYXJlIGVxdWl2YWxlbnQ6XG5cbnZhciBiZWF1dGlmeV9qcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5Jyk7XG52YXIgYmVhdXRpZnlfanMgPSByZXF1aXJlKCdqcy1iZWF1dGlmeScpLmpzO1xudmFyIGJlYXV0aWZ5X2pzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5qc19iZWF1dGlmeTtcblxudmFyIGJlYXV0aWZ5X2NzcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuY3NzO1xudmFyIGJlYXV0aWZ5X2NzcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuY3NzX2JlYXV0aWZ5O1xuXG52YXIgYmVhdXRpZnlfaHRtbCA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuaHRtbDtcbnZhciBiZWF1dGlmeV9odG1sID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5odG1sX2JlYXV0aWZ5O1xuXG5BbGwgbWV0aG9kcyByZXR1cm5lZCBhY2NlcHQgdHdvIGFyZ3VtZW50cywgdGhlIHNvdXJjZSBzdHJpbmcgYW5kIGFuIG9wdGlvbnMgb2JqZWN0LlxuKiovXG5cbmZ1bmN0aW9uIGdldF9iZWF1dGlmeShqc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LCBodG1sX2JlYXV0aWZ5KSB7XG4gICAgLy8gdGhlIGRlZmF1bHQgaXMganNcbiAgICB2YXIgYmVhdXRpZnkgPSBmdW5jdGlvbihzcmMsIGNvbmZpZykge1xuICAgICAgICByZXR1cm4ganNfYmVhdXRpZnkuanNfYmVhdXRpZnkoc3JjLCBjb25maWcpO1xuICAgIH07XG5cbiAgICAvLyBzaG9ydCBhbGlhc2VzXG4gICAgYmVhdXRpZnkuanMgPSBqc19iZWF1dGlmeS5qc19iZWF1dGlmeTtcbiAgICBiZWF1dGlmeS5jc3MgPSBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5O1xuICAgIGJlYXV0aWZ5Lmh0bWwgPSBodG1sX2JlYXV0aWZ5Lmh0bWxfYmVhdXRpZnk7XG5cbiAgICAvLyBsZWdhY3kgYWxpYXNlc1xuICAgIGJlYXV0aWZ5LmpzX2JlYXV0aWZ5ID0ganNfYmVhdXRpZnkuanNfYmVhdXRpZnk7XG4gICAgYmVhdXRpZnkuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5LmNzc19iZWF1dGlmeTtcbiAgICBiZWF1dGlmeS5odG1sX2JlYXV0aWZ5ID0gaHRtbF9iZWF1dGlmeS5odG1sX2JlYXV0aWZ5O1xuXG4gICAgcmV0dXJuIGJlYXV0aWZ5O1xufVxuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICBkZWZpbmUoW1xuICAgICAgICBcIi4vbGliL2JlYXV0aWZ5XCIsXG4gICAgICAgIFwiLi9saWIvYmVhdXRpZnktY3NzXCIsXG4gICAgICAgIFwiLi9saWIvYmVhdXRpZnktaHRtbFwiXG4gICAgXSwgZnVuY3Rpb24oanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSwgaHRtbF9iZWF1dGlmeSkge1xuICAgICAgICByZXR1cm4gZ2V0X2JlYXV0aWZ5KGpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnksIGh0bWxfYmVhdXRpZnkpO1xuICAgIH0pO1xufSBlbHNlIHtcbiAgICAoZnVuY3Rpb24obW9kKSB7XG4gICAgICAgIHZhciBqc19iZWF1dGlmeSA9IHJlcXVpcmUoJy4vbGliL2JlYXV0aWZ5Jyk7XG4gICAgICAgIHZhciBjc3NfYmVhdXRpZnkgPSByZXF1aXJlKCcuL2xpYi9iZWF1dGlmeS1jc3MnKTtcbiAgICAgICAgdmFyIGh0bWxfYmVhdXRpZnkgPSByZXF1aXJlKCcuL2xpYi9iZWF1dGlmeS1odG1sJyk7XG5cbiAgICAgICAgbW9kLmV4cG9ydHMgPSBnZXRfYmVhdXRpZnkoanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSwgaHRtbF9iZWF1dGlmeSk7XG5cbiAgICB9KShtb2R1bGUpO1xufSIsIi8qanNoaW50IGN1cmx5OnRydWUsIGVxZXFlcTp0cnVlLCBsYXhicmVhazp0cnVlLCBub2VtcHR5OmZhbHNlICovXG4vKlxuXG4gIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gIENvcHlyaWdodCAoYykgMjAwNy0yMDE3IEVpbmFyIExpZWxtYW5pcywgTGlhbSBOZXdtYW4sIGFuZCBjb250cmlidXRvcnMuXG5cbiAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cbiAgb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXNcbiAgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLFxuICBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLFxuICBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLFxuICBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiAgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSU1xuICBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbiAgQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICBTT0ZUV0FSRS5cblxuXG4gQ1NTIEJlYXV0aWZpZXJcbi0tLS0tLS0tLS0tLS0tLVxuXG4gICAgV3JpdHRlbiBieSBIYXJ1dHl1biBBbWlyamFueWFuLCAoYW1pcmphbnlhbkBnbWFpbC5jb20pXG5cbiAgICBCYXNlZCBvbiBjb2RlIGluaXRpYWxseSBkZXZlbG9wZWQgYnk6IEVpbmFyIExpZWxtYW5pcywgPGVpbmFyQGpzYmVhdXRpZmllci5vcmc+XG4gICAgICAgIGh0dHA6Ly9qc2JlYXV0aWZpZXIub3JnL1xuXG4gICAgVXNhZ2U6XG4gICAgICAgIGNzc19iZWF1dGlmeShzb3VyY2VfdGV4dCk7XG4gICAgICAgIGNzc19iZWF1dGlmeShzb3VyY2VfdGV4dCwgb3B0aW9ucyk7XG5cbiAgICBUaGUgb3B0aW9ucyBhcmUgKGRlZmF1bHQgaW4gYnJhY2tldHMpOlxuICAgICAgICBpbmRlbnRfc2l6ZSAoNCkgICAgICAgICAgICAgICAgICAgICAgICAg4oCUIGluZGVudGF0aW9uIHNpemUsXG4gICAgICAgIGluZGVudF9jaGFyIChzcGFjZSkgICAgICAgICAgICAgICAgICAgICDigJQgY2hhcmFjdGVyIHRvIGluZGVudCB3aXRoLFxuICAgICAgICBwcmVzZXJ2ZV9uZXdsaW5lcyAoZGVmYXVsdCBmYWxzZSkgICAgICAgLSB3aGV0aGVyIGV4aXN0aW5nIGxpbmUgYnJlYWtzIHNob3VsZCBiZSBwcmVzZXJ2ZWQsXG4gICAgICAgIHNlbGVjdG9yX3NlcGFyYXRvcl9uZXdsaW5lICh0cnVlKSAgICAgICAtIHNlcGFyYXRlIHNlbGVjdG9ycyB3aXRoIG5ld2xpbmUgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IChlLmcuIFwiYSxcXG5iclwiIG9yIFwiYSwgYnJcIilcbiAgICAgICAgZW5kX3dpdGhfbmV3bGluZSAoZmFsc2UpICAgICAgICAgICAgICAgIC0gZW5kIHdpdGggYSBuZXdsaW5lXG4gICAgICAgIG5ld2xpbmVfYmV0d2Vlbl9ydWxlcyAodHJ1ZSkgICAgICAgICAgICAtIGFkZCBhIG5ldyBsaW5lIGFmdGVyIGV2ZXJ5IGNzcyBydWxlXG4gICAgICAgIHNwYWNlX2Fyb3VuZF9zZWxlY3Rvcl9zZXBhcmF0b3IgKGZhbHNlKSAtIGVuc3VyZSBzcGFjZSBhcm91bmQgc2VsZWN0b3Igc2VwYXJhdG9yczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJz4nLCAnKycsICd+JyAoZS5nLiBcImE+YlwiIC0+IFwiYSA+IGJcIilcbiAgICBlLmdcblxuICAgIGNzc19iZWF1dGlmeShjc3Nfc291cmNlX3RleHQsIHtcbiAgICAgICdpbmRlbnRfc2l6ZSc6IDEsXG4gICAgICAnaW5kZW50X2NoYXInOiAnXFx0JyxcbiAgICAgICdzZWxlY3Rvcl9zZXBhcmF0b3InOiAnICcsXG4gICAgICAnZW5kX3dpdGhfbmV3bGluZSc6IGZhbHNlLFxuICAgICAgJ25ld2xpbmVfYmV0d2Vlbl9ydWxlcyc6IHRydWUsXG4gICAgICAnc3BhY2VfYXJvdW5kX3NlbGVjdG9yX3NlcGFyYXRvcic6IHRydWVcbiAgICB9KTtcbiovXG5cbi8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN0b2tlbml6YXRpb25cbi8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtc3ludGF4L1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBtZXJnZU9wdHMoYWxsT3B0aW9ucywgdGFyZ2V0VHlwZSkge1xuICAgICAgICB2YXIgZmluYWxPcHRzID0ge307XG4gICAgICAgIHZhciBuYW1lO1xuXG4gICAgICAgIGZvciAobmFtZSBpbiBhbGxPcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gdGFyZ2V0VHlwZSkge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0c1tuYW1lXSA9IGFsbE9wdGlvbnNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vbWVyZ2UgaW4gdGhlIHBlciB0eXBlIHNldHRpbmdzIGZvciB0aGUgdGFyZ2V0VHlwZVxuICAgICAgICBpZiAodGFyZ2V0VHlwZSBpbiBhbGxPcHRpb25zKSB7XG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gYWxsT3B0aW9uc1t0YXJnZXRUeXBlXSkge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0c1tuYW1lXSA9IGFsbE9wdGlvbnNbdGFyZ2V0VHlwZV1bbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbmFsT3B0cztcbiAgICB9XG5cbiAgICB2YXIgbGluZUJyZWFrID0gL1xcclxcbnxbXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcbiAgICB2YXIgYWxsTGluZUJyZWFrcyA9IG5ldyBSZWdFeHAobGluZUJyZWFrLnNvdXJjZSwgJ2cnKTtcblxuICAgIGZ1bmN0aW9uIGNzc19iZWF1dGlmeShzb3VyY2VfdGV4dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvLyBBbGxvdyB0aGUgc2V0dGluZyBvZiBsYW5ndWFnZS9maWxlLXR5cGUgc3BlY2lmaWMgb3B0aW9uc1xuICAgICAgICAvLyB3aXRoIGluaGVyaXRhbmNlIG9mIG92ZXJhbGwgc2V0dGluZ3NcbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlT3B0cyhvcHRpb25zLCAnY3NzJyk7XG5cbiAgICAgICAgc291cmNlX3RleHQgPSBzb3VyY2VfdGV4dCB8fCAnJztcblxuICAgICAgICB2YXIgbmV3bGluZXNGcm9tTGFzdFdTRWF0ID0gMDtcbiAgICAgICAgdmFyIGluZGVudFNpemUgPSBvcHRpb25zLmluZGVudF9zaXplID8gcGFyc2VJbnQob3B0aW9ucy5pbmRlbnRfc2l6ZSwgMTApIDogNDtcbiAgICAgICAgdmFyIGluZGVudENoYXJhY3RlciA9IG9wdGlvbnMuaW5kZW50X2NoYXIgfHwgJyAnO1xuICAgICAgICB2YXIgcHJlc2VydmVfbmV3bGluZXMgPSAob3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcztcbiAgICAgICAgdmFyIHNlbGVjdG9yU2VwYXJhdG9yTmV3bGluZSA9IChvcHRpb25zLnNlbGVjdG9yX3NlcGFyYXRvcl9uZXdsaW5lID09PSB1bmRlZmluZWQpID8gdHJ1ZSA6IG9wdGlvbnMuc2VsZWN0b3Jfc2VwYXJhdG9yX25ld2xpbmU7XG4gICAgICAgIHZhciBlbmRfd2l0aF9uZXdsaW5lID0gKG9wdGlvbnMuZW5kX3dpdGhfbmV3bGluZSA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5lbmRfd2l0aF9uZXdsaW5lO1xuICAgICAgICB2YXIgbmV3bGluZV9iZXR3ZWVuX3J1bGVzID0gKG9wdGlvbnMubmV3bGluZV9iZXR3ZWVuX3J1bGVzID09PSB1bmRlZmluZWQpID8gdHJ1ZSA6IG9wdGlvbnMubmV3bGluZV9iZXR3ZWVuX3J1bGVzO1xuICAgICAgICB2YXIgc3BhY2VfYXJvdW5kX2NvbWJpbmF0b3IgPSAob3B0aW9ucy5zcGFjZV9hcm91bmRfY29tYmluYXRvciA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5zcGFjZV9hcm91bmRfY29tYmluYXRvcjtcbiAgICAgICAgc3BhY2VfYXJvdW5kX2NvbWJpbmF0b3IgPSBzcGFjZV9hcm91bmRfY29tYmluYXRvciB8fCAoKG9wdGlvbnMuc3BhY2VfYXJvdW5kX3NlbGVjdG9yX3NlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5zcGFjZV9hcm91bmRfc2VsZWN0b3Jfc2VwYXJhdG9yKTtcbiAgICAgICAgdmFyIGVvbCA9IG9wdGlvbnMuZW9sID8gb3B0aW9ucy5lb2wgOiAnYXV0byc7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5kZW50X3dpdGhfdGFicykge1xuICAgICAgICAgICAgaW5kZW50Q2hhcmFjdGVyID0gJ1xcdCc7XG4gICAgICAgICAgICBpbmRlbnRTaXplID0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlb2wgPT09ICdhdXRvJykge1xuICAgICAgICAgICAgZW9sID0gJ1xcbic7XG4gICAgICAgICAgICBpZiAoc291cmNlX3RleHQgJiYgbGluZUJyZWFrLnRlc3Qoc291cmNlX3RleHQgfHwgJycpKSB7XG4gICAgICAgICAgICAgICAgZW9sID0gc291cmNlX3RleHQubWF0Y2gobGluZUJyZWFrKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVvbCA9IGVvbC5yZXBsYWNlKC9cXFxcci8sICdcXHInKS5yZXBsYWNlKC9cXFxcbi8sICdcXG4nKTtcblxuICAgICAgICAvLyBIQUNLOiBuZXdsaW5lIHBhcnNpbmcgaW5jb25zaXN0ZW50LiBUaGlzIGJydXRlIGZvcmNlIG5vcm1hbGl6ZXMgdGhlIGlucHV0LlxuICAgICAgICBzb3VyY2VfdGV4dCA9IHNvdXJjZV90ZXh0LnJlcGxhY2UoYWxsTGluZUJyZWFrcywgJ1xcbicpO1xuXG4gICAgICAgIC8vIHRva2VuaXplclxuICAgICAgICB2YXIgd2hpdGVSZSA9IC9eXFxzKyQvO1xuXG4gICAgICAgIHZhciBwb3MgPSAtMSxcbiAgICAgICAgICAgIGNoO1xuICAgICAgICB2YXIgcGFyZW5MZXZlbCA9IDA7XG5cbiAgICAgICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlX3RleHQuY2hhckF0KCsrcG9zKTtcbiAgICAgICAgICAgIHJldHVybiBjaCB8fCAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBlZWsoc2tpcFdoaXRlc3BhY2UpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgICAgIHZhciBwcmV2X3BvcyA9IHBvcztcbiAgICAgICAgICAgIGlmIChza2lwV2hpdGVzcGFjZSkge1xuICAgICAgICAgICAgICAgIGVhdFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCA9IHNvdXJjZV90ZXh0LmNoYXJBdChwb3MgKyAxKSB8fCAnJztcbiAgICAgICAgICAgIHBvcyA9IHByZXZfcG9zIC0gMTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlYXRTdHJpbmcoZW5kQ2hhcnMpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgICAgIHdoaWxlIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVuZENoYXJzLmluZGV4T2YoY2gpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGVla1N0cmluZyhlbmRDaGFyKSB7XG4gICAgICAgICAgICB2YXIgcHJldl9wb3MgPSBwb3M7XG4gICAgICAgICAgICB2YXIgc3RyID0gZWF0U3RyaW5nKGVuZENoYXIpO1xuICAgICAgICAgICAgcG9zID0gcHJldl9wb3MgLSAxO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVhdFdoaXRlc3BhY2UocHJlc2VydmVfbmV3bGluZXNfbG9jYWwpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKHdoaXRlUmUudGVzdChwZWVrKCkpKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xcbicgJiYgcHJlc2VydmVfbmV3bGluZXNfbG9jYWwgJiYgcHJlc2VydmVfbmV3bGluZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3bGluZXNGcm9tTGFzdFdTRWF0ID0gcmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNraXBXaGl0ZXNwYWNlKCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgaWYgKGNoICYmIHdoaXRlUmUudGVzdChjaCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBjaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlICh3aGl0ZVJlLnRlc3QobmV4dCgpKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlYXRDb21tZW50KHNpbmdsZUxpbmUpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgICAgIHNpbmdsZUxpbmUgPSBwZWVrKCkgPT09IFwiL1wiO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2luZ2xlTGluZSAmJiBjaCA9PT0gXCIqXCIgJiYgcGVlaygpID09PSBcIi9cIikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2luZ2xlTGluZSAmJiBjaCA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlX3RleHQuc3Vic3RyaW5nKHN0YXJ0LCBwb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZV90ZXh0LnN1YnN0cmluZyhzdGFydCwgcG9zKSArIGNoO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBsb29rQmFjayhzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcocG9zIC0gc3RyLmxlbmd0aCwgcG9zKS50b0xvd2VyQ2FzZSgpID09PVxuICAgICAgICAgICAgICAgIHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5lc3RlZCBwc2V1ZG8tY2xhc3MgaWYgd2UgYXJlIGluc2lkZVJ1bGVcbiAgICAgICAgLy8gYW5kIHRoZSBuZXh0IHNwZWNpYWwgY2hhcmFjdGVyIGZvdW5kIG9wZW5zXG4gICAgICAgIC8vIGEgbmV3IGJsb2NrXG4gICAgICAgIGZ1bmN0aW9uIGZvdW5kTmVzdGVkUHNldWRvQ2xhc3MoKSB7XG4gICAgICAgICAgICB2YXIgb3BlblBhcmVuID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBwb3MgKyAxOyBpIDwgc291cmNlX3RleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY2ggPSBzb3VyY2VfdGV4dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSBcIntcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHNldWRvY2xhc3NlcyBjYW4gY29udGFpbiAoKVxuICAgICAgICAgICAgICAgICAgICBvcGVuUGFyZW4gKz0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW5QYXJlbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9wZW5QYXJlbiAtPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiO1wiIHx8IGNoID09PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcHJpbnRlclxuICAgICAgICB2YXIgYmFzZWJhc2VJbmRlbnRTdHJpbmcgPSBzb3VyY2VfdGV4dC5tYXRjaCgvXltcXHQgXSovKVswXTtcbiAgICAgICAgdmFyIHNpbmdsZUluZGVudCA9IG5ldyBBcnJheShpbmRlbnRTaXplICsgMSkuam9pbihpbmRlbnRDaGFyYWN0ZXIpO1xuICAgICAgICB2YXIgaW5kZW50TGV2ZWwgPSAwO1xuICAgICAgICB2YXIgbmVzdGVkTGV2ZWwgPSAwO1xuXG4gICAgICAgIGZ1bmN0aW9uIGluZGVudCgpIHtcbiAgICAgICAgICAgIGluZGVudExldmVsKys7XG4gICAgICAgICAgICBiYXNlYmFzZUluZGVudFN0cmluZyArPSBzaW5nbGVJbmRlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvdXRkZW50KCkge1xuICAgICAgICAgICAgaW5kZW50TGV2ZWwtLTtcbiAgICAgICAgICAgIGJhc2ViYXNlSW5kZW50U3RyaW5nID0gYmFzZWJhc2VJbmRlbnRTdHJpbmcuc2xpY2UoMCwgLWluZGVudFNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByaW50ID0ge307XG4gICAgICAgIHByaW50W1wie1wiXSA9IGZ1bmN0aW9uKGNoKSB7XG4gICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgaWYgKCFlYXRXaGl0ZXNwYWNlKHRydWUpKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwcmludFtcIn1cIl0gPSBmdW5jdGlvbihuZXdsaW5lKSB7XG4gICAgICAgICAgICBpZiAobmV3bGluZSkge1xuICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dHB1dC5wdXNoKCd9Jyk7XG4gICAgICAgICAgICBpZiAoIWVhdFdoaXRlc3BhY2UodHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpbnQuX2xhc3RDaGFyV2hpdGVzcGFjZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdoaXRlUmUudGVzdChvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC5uZXdMaW5lID0gZnVuY3Rpb24oa2VlcFdoaXRlc3BhY2UpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFrZWVwV2hpdGVzcGFjZSAmJiBvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdICE9PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICBwcmludC50cmltKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdID09PSBiYXNlYmFzZUluZGVudFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCdcXG4nKTtcblxuICAgICAgICAgICAgICAgIGlmIChiYXNlYmFzZUluZGVudFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChiYXNlYmFzZUluZGVudFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwcmludC5zaW5nbGVTcGFjZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggJiYgIXByaW50Ll9sYXN0Q2hhcldoaXRlc3BhY2UoKSkge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCcgJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpbnQucHJlc2VydmVTaW5nbGVTcGFjZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGlzQWZ0ZXJTcGFjZSkge1xuICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpbnQudHJpbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2hpbGUgKHByaW50Ll9sYXN0Q2hhcldoaXRlc3BhY2UoKSkge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXG4gICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgLypfX19fX19fX19fX19fX19fX19fX18tLS0tLS0tLS0tLS0tLS0tLS0tLV9fX19fX19fX19fX19fX19fX19fXyovXG5cbiAgICAgICAgdmFyIGluc2lkZVJ1bGUgPSBmYWxzZTtcbiAgICAgICAgdmFyIGluc2lkZVByb3BlcnR5VmFsdWUgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCA9IGZhbHNlO1xuICAgICAgICB2YXIgdG9wX2NoID0gJyc7XG4gICAgICAgIHZhciBsYXN0X3RvcF9jaCA9ICcnO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgd2hpdGVzcGFjZSA9IHNraXBXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICB2YXIgaXNBZnRlclNwYWNlID0gd2hpdGVzcGFjZSAhPT0gJyc7XG4gICAgICAgICAgICB2YXIgaXNBZnRlck5ld2xpbmUgPSB3aGl0ZXNwYWNlLmluZGV4T2YoJ1xcbicpICE9PSAtMTtcbiAgICAgICAgICAgIGxhc3RfdG9wX2NoID0gdG9wX2NoO1xuICAgICAgICAgICAgdG9wX2NoID0gY2g7XG5cbiAgICAgICAgICAgIGlmICghY2gpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcvJyAmJiBwZWVrKCkgPT09ICcqJykgeyAvKiBjc3MgY29tbWVudCAqL1xuICAgICAgICAgICAgICAgIHZhciBoZWFkZXIgPSBpbmRlbnRMZXZlbCA9PT0gMDtcblxuICAgICAgICAgICAgICAgIGlmIChpc0FmdGVyTmV3bGluZSB8fCBoZWFkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGVhdENvbW1lbnQoKSk7XG4gICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgICAgIGlmIChoZWFkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnLycgJiYgcGVlaygpID09PSAnLycpIHsgLy8gc2luZ2xlIGxpbmUgY29tbWVudFxuICAgICAgICAgICAgICAgIGlmICghaXNBZnRlck5ld2xpbmUgJiYgbGFzdF90b3BfY2ggIT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICBwcmludC50cmltKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZWF0Q29tbWVudCgpKTtcbiAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnQCcpIHtcbiAgICAgICAgICAgICAgICBwcmludC5wcmVzZXJ2ZVNpbmdsZVNwYWNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBkZWFsIHdpdGggbGVzcyBwcm9wZXJ5IG1peGlucyBAey4uLn1cbiAgICAgICAgICAgICAgICBpZiAocGVlaygpID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goZWF0U3RyaW5nKCd9JykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdHJpcCB0cmFpbGluZyBzcGFjZSwgaWYgcHJlc2VudCwgZm9yIGhhc2ggcHJvcGVydHkgY2hlY2tzXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YXJpYWJsZU9yUnVsZSA9IHBlZWtTdHJpbmcoXCI6ICw7e30oKVtdLz0nXFxcIlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVPclJ1bGUubWF0Y2goL1sgOl0kLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSB2YXJpYWJsZSBvciBwc2V1ZG8tY2xhc3MsIGFkZCBpdCBhbmQgaW5zZXJ0IG9uZSBzcGFjZSBiZWZvcmUgY29udGludWluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVPclJ1bGUgPSBlYXRTdHJpbmcoXCI6IFwiKS5yZXBsYWNlKC9cXHMkLywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2godmFyaWFibGVPclJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlT3JSdWxlID0gdmFyaWFibGVPclJ1bGUucmVwbGFjZSgvXFxzJC8sICcnKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBtaWdodCBiZSBhIG5lc3RpbmcgYXQtcnVsZVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVPclJ1bGUgaW4gY3NzX2JlYXV0aWZ5Lk5FU1RFRF9BVF9SVUxFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXN0ZWRMZXZlbCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlT3JSdWxlIGluIGNzc19iZWF1dGlmeS5DT05ESVRJT05BTF9HUk9VUF9SVUxFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJpbmdDb25kaXRpb25hbEdyb3VwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcjJyAmJiBwZWVrKCkgPT09ICd7Jykge1xuICAgICAgICAgICAgICAgIHByaW50LnByZXNlcnZlU2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoJ30nKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAneycpIHtcbiAgICAgICAgICAgICAgICBpZiAocGVlayh0cnVlKSA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIGVhdFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChcIntcIik7XG4gICAgICAgICAgICAgICAgICAgIHByaW50Wyd9J10oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3bGluZXNGcm9tTGFzdFdTRWF0IDwgMiAmJiBuZXdsaW5lX2JldHdlZW5fcnVsZXMgJiYgaW5kZW50TGV2ZWwgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRbXCJ7XCJdKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiBlbnRlcmluZyBjb25kaXRpb25hbCBncm91cHMsIG9ubHkgcnVsZXNldHMgYXJlIGFsbG93ZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJpbmdDb25kaXRpb25hbEdyb3VwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNpZGVSdWxlID0gKGluZGVudExldmVsID4gbmVzdGVkTGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBkZWNsYXJhdGlvbnMgYXJlIGFsc28gYWxsb3dlZFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlUnVsZSA9IChpbmRlbnRMZXZlbCA+PSBuZXN0ZWRMZXZlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICBvdXRkZW50KCk7XG4gICAgICAgICAgICAgICAgcHJpbnRbXCJ9XCJdKHRydWUpO1xuICAgICAgICAgICAgICAgIGluc2lkZVJ1bGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpbnNpZGVQcm9wZXJ0eVZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKG5lc3RlZExldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lc3RlZExldmVsLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZXdsaW5lc0Zyb21MYXN0V1NFYXQgPCAyICYmIG5ld2xpbmVfYmV0d2Vlbl9ydWxlcyAmJiBpbmRlbnRMZXZlbCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgIGlmICgoaW5zaWRlUnVsZSB8fCBlbnRlcmluZ0NvbmRpdGlvbmFsR3JvdXApICYmXG4gICAgICAgICAgICAgICAgICAgICEobG9va0JhY2soXCImXCIpIHx8IGZvdW5kTmVzdGVkUHNldWRvQ2xhc3MoKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWxvb2tCYWNrKFwiKFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAncHJvcGVydHk6IHZhbHVlJyBkZWxpbWl0ZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hpY2ggY291bGQgYmUgaW4gYSBjb25kaXRpb25hbCBncm91cCBxdWVyeVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaCgnOicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWluc2lkZVByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZVByb3BlcnR5VmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNhc3MvbGVzcyBwYXJlbnQgcmVmZXJlbmNlIGRvbid0IHVzZSBhIHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhc3MgbmVzdGVkIHBzZXVkby1jbGFzcyBkb24ndCB1c2UgYSBzcGFjZVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHByZXNlcnZlIHNwYWNlIGJlZm9yZSBwc2V1ZG9jbGFzc2VzL3BzZXVkb2VsZW1lbnRzLCBhcyBpdCBtZWFucyBcImluIGFueSBjaGlsZFwiXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb29rQmFjayhcIiBcIikgJiYgb3V0cHV0W291dHB1dC5sZW5ndGggLSAxXSAhPT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocGVlaygpID09PSBcIjpcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHNldWRvLWVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKFwiOjpcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwc2V1ZG8tY2xhc3NcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCc6Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXCInIHx8IGNoID09PSAnXFwnJykge1xuICAgICAgICAgICAgICAgIHByaW50LnByZXNlcnZlU2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoY2gpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICc7Jykge1xuICAgICAgICAgICAgICAgIGluc2lkZVByb3BlcnR5VmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICAgICAgaWYgKCFlYXRXaGl0ZXNwYWNlKHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKCcpIHsgLy8gbWF5IGJlIGEgdXJsXG4gICAgICAgICAgICAgICAgaWYgKGxvb2tCYWNrKFwidXJsXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggIT09ICcpJyAmJiBjaCAhPT0gJ1wiJyAmJiBjaCAhPT0gJ1xcJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoJyknKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW5MZXZlbCsrO1xuICAgICAgICAgICAgICAgICAgICBwcmludC5wcmVzZXJ2ZVNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcpJykge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICBwYXJlbkxldmVsLS07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICAgICAgaWYgKCFlYXRXaGl0ZXNwYWNlKHRydWUpICYmIHNlbGVjdG9yU2VwYXJhdG9yTmV3bGluZSAmJiAhaW5zaWRlUHJvcGVydHlWYWx1ZSAmJiBwYXJlbkxldmVsIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChjaCA9PT0gJz4nIHx8IGNoID09PSAnKycgfHwgY2ggPT09ICd+JykgJiZcbiAgICAgICAgICAgICAgICAhaW5zaWRlUHJvcGVydHlWYWx1ZSAmJiBwYXJlbkxldmVsIDwgMSkge1xuICAgICAgICAgICAgICAgIC8vaGFuZGxlIGNvbWJpbmF0b3Igc3BhY2luZ1xuICAgICAgICAgICAgICAgIGlmIChzcGFjZV9hcm91bmRfY29tYmluYXRvcikge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNxdWFzaCBleHRyYSB3aGl0ZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCAmJiB3aGl0ZVJlLnRlc3QoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgcHJpbnQucHJlc2VydmVTaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICc9JykgeyAvLyBubyB3aGl0ZXNwYWNlIGJlZm9yZSBvciBhZnRlclxuICAgICAgICAgICAgICAgIGVhdFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaCgnPScpO1xuICAgICAgICAgICAgICAgIGlmICh3aGl0ZVJlLnRlc3QoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmludC5wcmVzZXJ2ZVNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc3dlZXRDb2RlID0gJyc7XG4gICAgICAgIGlmIChiYXNlYmFzZUluZGVudFN0cmluZykge1xuICAgICAgICAgICAgc3dlZXRDb2RlICs9IGJhc2ViYXNlSW5kZW50U3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dlZXRDb2RlICs9IG91dHB1dC5qb2luKCcnKS5yZXBsYWNlKC9bXFxyXFxuXFx0IF0rJC8sICcnKTtcblxuICAgICAgICAvLyBlc3RhYmxpc2ggZW5kX3dpdGhfbmV3bGluZVxuICAgICAgICBpZiAoZW5kX3dpdGhfbmV3bGluZSkge1xuICAgICAgICAgICAgc3dlZXRDb2RlICs9ICdcXG4nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVvbCAhPT0gJ1xcbicpIHtcbiAgICAgICAgICAgIHN3ZWV0Q29kZSA9IHN3ZWV0Q29kZS5yZXBsYWNlKC9bXFxuXS9nLCBlb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN3ZWV0Q29kZTtcbiAgICB9XG5cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvQXQtcnVsZVxuICAgIGNzc19iZWF1dGlmeS5ORVNURURfQVRfUlVMRSA9IHtcbiAgICAgICAgXCJAcGFnZVwiOiB0cnVlLFxuICAgICAgICBcIkBmb250LWZhY2VcIjogdHJ1ZSxcbiAgICAgICAgXCJAa2V5ZnJhbWVzXCI6IHRydWUsXG4gICAgICAgIC8vIGFsc28gaW4gQ09ORElUSU9OQUxfR1JPVVBfUlVMRSBiZWxvd1xuICAgICAgICBcIkBtZWRpYVwiOiB0cnVlLFxuICAgICAgICBcIkBzdXBwb3J0c1wiOiB0cnVlLFxuICAgICAgICBcIkBkb2N1bWVudFwiOiB0cnVlXG4gICAgfTtcbiAgICBjc3NfYmVhdXRpZnkuQ09ORElUSU9OQUxfR1JPVVBfUlVMRSA9IHtcbiAgICAgICAgXCJAbWVkaWFcIjogdHJ1ZSxcbiAgICAgICAgXCJAc3VwcG9ydHNcIjogdHJ1ZSxcbiAgICAgICAgXCJAZG9jdW1lbnRcIjogdHJ1ZVxuICAgIH07XG5cbiAgICAvKmdsb2JhbCBkZWZpbmUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQWRkIHN1cHBvcnQgZm9yIEFNRCAoIGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9BTUQjZGVmaW5lYW1kLXByb3BlcnR5LSApXG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNzc19iZWF1dGlmeTogY3NzX2JlYXV0aWZ5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBDb21tb25KUy4gSnVzdCBwdXQgdGhpcyBmaWxlIHNvbWV3aGVyZSBvbiB5b3VyIHJlcXVpcmUucGF0aHNcbiAgICAgICAgLy8gYW5kIHlvdSB3aWxsIGJlIGFibGUgdG8gYHZhciBodG1sX2JlYXV0aWZ5ID0gcmVxdWlyZShcImJlYXV0aWZ5XCIpLmh0bWxfYmVhdXRpZnlgLlxuICAgICAgICBleHBvcnRzLmNzc19iZWF1dGlmeSA9IGNzc19iZWF1dGlmeTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgcnVubmluZyBhIHdlYiBwYWdlIGFuZCBkb24ndCBoYXZlIGVpdGhlciBvZiB0aGUgYWJvdmUsIGFkZCBvdXIgb25lIGdsb2JhbFxuICAgICAgICB3aW5kb3cuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBldmVuIGhhdmUgd2luZG93LCB0cnkgZ2xvYmFsLlxuICAgICAgICBnbG9iYWwuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5O1xuICAgIH1cblxufSgpKTsiLCIvKmpzaGludCBjdXJseTp0cnVlLCBlcWVxZXE6dHJ1ZSwgbGF4YnJlYWs6dHJ1ZSwgbm9lbXB0eTpmYWxzZSAqL1xuLypcblxuICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuICBDb3B5cmlnaHQgKGMpIDIwMDctMjAxNyBFaW5hciBMaWVsbWFuaXMsIExpYW0gTmV3bWFuLCBhbmQgY29udHJpYnV0b3JzLlxuXG4gIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uXG4gIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzXG4gICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbixcbiAgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSxcbiAgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSxcbiAgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcbiAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cbiAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlNcbiAgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4gIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXG4gIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAgU09GVFdBUkUuXG5cblxuIFN0eWxlIEhUTUxcbi0tLS0tLS0tLS0tLS0tLVxuXG4gIFdyaXR0ZW4gYnkgTm9jaHVtIFNvc3NvbmtvLCAobnNvc3NvbmtvQGhvdG1haWwuY29tKVxuXG4gIEJhc2VkIG9uIGNvZGUgaW5pdGlhbGx5IGRldmVsb3BlZCBieTogRWluYXIgTGllbG1hbmlzLCA8ZWluYXJAanNiZWF1dGlmaWVyLm9yZz5cbiAgICBodHRwOi8vanNiZWF1dGlmaWVyLm9yZy9cblxuICBVc2FnZTpcbiAgICBzdHlsZV9odG1sKGh0bWxfc291cmNlKTtcblxuICAgIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMpO1xuXG4gIFRoZSBvcHRpb25zIGFyZTpcbiAgICBpbmRlbnRfaW5uZXJfaHRtbCAoZGVmYXVsdCBmYWxzZSkgIOKAlCBpbmRlbnQgPGhlYWQ+IGFuZCA8Ym9keT4gc2VjdGlvbnMsXG4gICAgaW5kZW50X3NpemUgKGRlZmF1bHQgNCkgICAgICAgICAg4oCUIGluZGVudGF0aW9uIHNpemUsXG4gICAgaW5kZW50X2NoYXIgKGRlZmF1bHQgc3BhY2UpICAgICAg4oCUIGNoYXJhY3RlciB0byBpbmRlbnQgd2l0aCxcbiAgICB3cmFwX2xpbmVfbGVuZ3RoIChkZWZhdWx0IDI1MCkgICAgICAgICAgICAtICBtYXhpbXVtIGFtb3VudCBvZiBjaGFyYWN0ZXJzIHBlciBsaW5lICgwID0gZGlzYWJsZSlcbiAgICBicmFjZV9zdHlsZSAoZGVmYXVsdCBcImNvbGxhcHNlXCIpIC0gXCJjb2xsYXBzZVwiIHwgXCJleHBhbmRcIiB8IFwiZW5kLWV4cGFuZFwiIHwgXCJub25lXCJcbiAgICAgICAgICAgIHB1dCBicmFjZXMgb24gdGhlIHNhbWUgbGluZSBhcyBjb250cm9sIHN0YXRlbWVudHMgKGRlZmF1bHQpLCBvciBwdXQgYnJhY2VzIG9uIG93biBsaW5lIChBbGxtYW4gLyBBTlNJIHN0eWxlKSwgb3IganVzdCBwdXQgZW5kIGJyYWNlcyBvbiBvd24gbGluZSwgb3IgYXR0ZW1wdCB0byBrZWVwIHRoZW0gd2hlcmUgdGhleSBhcmUuXG4gICAgdW5mb3JtYXR0ZWQgKGRlZmF1bHRzIHRvIGlubGluZSB0YWdzKSAtIGxpc3Qgb2YgdGFncywgdGhhdCBzaG91bGRuJ3QgYmUgcmVmb3JtYXR0ZWRcbiAgICBjb250ZW50X3VuZm9ybWF0dGVkIChkZWZhdWx0cyB0byBwcmUgdGFnKSAtIGxpc3Qgb2YgdGFncywgdGhhdCBpdHMgY29udGVudCBzaG91bGRuJ3QgYmUgcmVmb3JtYXR0ZWRcbiAgICBpbmRlbnRfc2NyaXB0cyAoZGVmYXVsdCBub3JtYWwpICAtIFwia2VlcFwifFwic2VwYXJhdGVcInxcIm5vcm1hbFwiXG4gICAgcHJlc2VydmVfbmV3bGluZXMgKGRlZmF1bHQgdHJ1ZSkgLSB3aGV0aGVyIGV4aXN0aW5nIGxpbmUgYnJlYWtzIGJlZm9yZSBlbGVtZW50cyBzaG91bGQgYmUgcHJlc2VydmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT25seSB3b3JrcyBiZWZvcmUgZWxlbWVudHMsIG5vdCBpbnNpZGUgdGFncyBvciBmb3IgdGV4dC5cbiAgICBtYXhfcHJlc2VydmVfbmV3bGluZXMgKGRlZmF1bHQgdW5saW1pdGVkKSAtIG1heGltdW0gbnVtYmVyIG9mIGxpbmUgYnJlYWtzIHRvIGJlIHByZXNlcnZlZCBpbiBvbmUgY2h1bmtcbiAgICBpbmRlbnRfaGFuZGxlYmFycyAoZGVmYXVsdCBmYWxzZSkgLSBmb3JtYXQgYW5kIGluZGVudCB7eyNmb299fSBhbmQge3svZm9vfX1cbiAgICBlbmRfd2l0aF9uZXdsaW5lIChmYWxzZSkgICAgICAgICAgLSBlbmQgd2l0aCBhIG5ld2xpbmVcbiAgICBleHRyYV9saW5lcnMgKGRlZmF1bHQgW2hlYWQsYm9keSwvaHRtbF0pIC1MaXN0IG9mIHRhZ3MgdGhhdCBzaG91bGQgaGF2ZSBhbiBleHRyYSBuZXdsaW5lIGJlZm9yZSB0aGVtLlxuXG4gICAgZS5nLlxuXG4gICAgc3R5bGVfaHRtbChodG1sX3NvdXJjZSwge1xuICAgICAgJ2luZGVudF9pbm5lcl9odG1sJzogZmFsc2UsXG4gICAgICAnaW5kZW50X3NpemUnOiAyLFxuICAgICAgJ2luZGVudF9jaGFyJzogJyAnLFxuICAgICAgJ3dyYXBfbGluZV9sZW5ndGgnOiA3OCxcbiAgICAgICdicmFjZV9zdHlsZSc6ICdleHBhbmQnLFxuICAgICAgJ3ByZXNlcnZlX25ld2xpbmVzJzogdHJ1ZSxcbiAgICAgICdtYXhfcHJlc2VydmVfbmV3bGluZXMnOiA1LFxuICAgICAgJ2luZGVudF9oYW5kbGViYXJzJzogZmFsc2UsXG4gICAgICAnZXh0cmFfbGluZXJzJzogWycvaHRtbCddXG4gICAgfSk7XG4qL1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBmdW5jdGlvbiB0cmltKHMpIHtcbiAgICAvLyAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgIC8vIH1cblxuICAgIGZ1bmN0aW9uIGx0cmltKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccysvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJ0cmltKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxzKyQvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1lcmdlT3B0cyhhbGxPcHRpb25zLCB0YXJnZXRUeXBlKSB7XG4gICAgICAgIHZhciBmaW5hbE9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgZm9yIChuYW1lIGluIGFsbE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSB0YXJnZXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzW25hbWVdID0gYWxsT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vbWVyZ2UgaW4gdGhlIHBlciB0eXBlIHNldHRpbmdzIGZvciB0aGUgdGFyZ2V0VHlwZVxuICAgICAgICBpZiAodGFyZ2V0VHlwZSBpbiBhbGxPcHRpb25zKSB7XG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gYWxsT3B0aW9uc1t0YXJnZXRUeXBlXSkge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0c1tuYW1lXSA9IGFsbE9wdGlvbnNbdGFyZ2V0VHlwZV1bbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbmFsT3B0cztcbiAgICB9XG5cbiAgICB2YXIgbGluZUJyZWFrID0gL1xcclxcbnxbXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcbiAgICB2YXIgYWxsTGluZUJyZWFrcyA9IG5ldyBSZWdFeHAobGluZUJyZWFrLnNvdXJjZSwgJ2cnKTtcblxuICAgIGZ1bmN0aW9uIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnkpIHtcbiAgICAgICAgLy9XcmFwcGVyIGZ1bmN0aW9uIHRvIGludm9rZSBhbGwgdGhlIG5lY2Vzc2FyeSBjb25zdHJ1Y3RvcnMgYW5kIGRlYWwgd2l0aCB0aGUgb3V0cHV0LlxuXG4gICAgICAgIHZhciBtdWx0aV9wYXJzZXIsXG4gICAgICAgICAgICBpbmRlbnRfaW5uZXJfaHRtbCxcbiAgICAgICAgICAgIGluZGVudF9ib2R5X2lubmVyX2h0bWwsXG4gICAgICAgICAgICBpbmRlbnRfaGVhZF9pbm5lcl9odG1sLFxuICAgICAgICAgICAgaW5kZW50X3NpemUsXG4gICAgICAgICAgICBpbmRlbnRfY2hhcmFjdGVyLFxuICAgICAgICAgICAgd3JhcF9saW5lX2xlbmd0aCxcbiAgICAgICAgICAgIGJyYWNlX3N0eWxlLFxuICAgICAgICAgICAgdW5mb3JtYXR0ZWQsXG4gICAgICAgICAgICBjb250ZW50X3VuZm9ybWF0dGVkLFxuICAgICAgICAgICAgcHJlc2VydmVfbmV3bGluZXMsXG4gICAgICAgICAgICBtYXhfcHJlc2VydmVfbmV3bGluZXMsXG4gICAgICAgICAgICBpbmRlbnRfaGFuZGxlYmFycyxcbiAgICAgICAgICAgIHdyYXBfYXR0cmlidXRlcyxcbiAgICAgICAgICAgIHdyYXBfYXR0cmlidXRlc19pbmRlbnRfc2l6ZSxcbiAgICAgICAgICAgIGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZSxcbiAgICAgICAgICAgIGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZV9leHBhbmRfbXVsdGlsaW5lLFxuICAgICAgICAgICAgaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlX2FsaWduZWQsXG4gICAgICAgICAgICBlbmRfd2l0aF9uZXdsaW5lLFxuICAgICAgICAgICAgZXh0cmFfbGluZXJzLFxuICAgICAgICAgICAgZW9sO1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIEFsbG93IHRoZSBzZXR0aW5nIG9mIGxhbmd1YWdlL2ZpbGUtdHlwZSBzcGVjaWZpYyBvcHRpb25zXG4gICAgICAgIC8vIHdpdGggaW5oZXJpdGFuY2Ugb2Ygb3ZlcmFsbCBzZXR0aW5nc1xuICAgICAgICBvcHRpb25zID0gbWVyZ2VPcHRzKG9wdGlvbnMsICdodG1sJyk7XG5cbiAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgdG8gMS4zLjRcbiAgICAgICAgaWYgKChvcHRpb25zLndyYXBfbGluZV9sZW5ndGggPT09IHVuZGVmaW5lZCB8fCBwYXJzZUludChvcHRpb25zLndyYXBfbGluZV9sZW5ndGgsIDEwKSA9PT0gMCkgJiZcbiAgICAgICAgICAgIChvcHRpb25zLm1heF9jaGFyICE9PSB1bmRlZmluZWQgJiYgcGFyc2VJbnQob3B0aW9ucy5tYXhfY2hhciwgMTApICE9PSAwKSkge1xuICAgICAgICAgICAgb3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoID0gb3B0aW9ucy5tYXhfY2hhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZGVudF9pbm5lcl9odG1sID0gKG9wdGlvbnMuaW5kZW50X2lubmVyX2h0bWwgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuaW5kZW50X2lubmVyX2h0bWw7XG4gICAgICAgIGluZGVudF9ib2R5X2lubmVyX2h0bWwgPSAob3B0aW9ucy5pbmRlbnRfYm9keV9pbm5lcl9odG1sID09PSB1bmRlZmluZWQpID8gdHJ1ZSA6IG9wdGlvbnMuaW5kZW50X2JvZHlfaW5uZXJfaHRtbDtcbiAgICAgICAgaW5kZW50X2hlYWRfaW5uZXJfaHRtbCA9IChvcHRpb25zLmluZGVudF9oZWFkX2lubmVyX2h0bWwgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5pbmRlbnRfaGVhZF9pbm5lcl9odG1sO1xuICAgICAgICBpbmRlbnRfc2l6ZSA9IChvcHRpb25zLmluZGVudF9zaXplID09PSB1bmRlZmluZWQpID8gNCA6IHBhcnNlSW50KG9wdGlvbnMuaW5kZW50X3NpemUsIDEwKTtcbiAgICAgICAgaW5kZW50X2NoYXJhY3RlciA9IChvcHRpb25zLmluZGVudF9jaGFyID09PSB1bmRlZmluZWQpID8gJyAnIDogb3B0aW9ucy5pbmRlbnRfY2hhcjtcbiAgICAgICAgYnJhY2Vfc3R5bGUgPSAob3B0aW9ucy5icmFjZV9zdHlsZSA9PT0gdW5kZWZpbmVkKSA/ICdjb2xsYXBzZScgOiBvcHRpb25zLmJyYWNlX3N0eWxlO1xuICAgICAgICB3cmFwX2xpbmVfbGVuZ3RoID0gcGFyc2VJbnQob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoLCAxMCkgPT09IDAgPyAzMjc4NiA6IHBhcnNlSW50KG9wdGlvbnMud3JhcF9saW5lX2xlbmd0aCB8fCAyNTAsIDEwKTtcbiAgICAgICAgdW5mb3JtYXR0ZWQgPSBvcHRpb25zLnVuZm9ybWF0dGVkIHx8IFtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9kb20uaHRtbCNwaHJhc2luZy1jb250ZW50XG4gICAgICAgICAgICAnYScsICdhYmJyJywgJ2FyZWEnLCAnYXVkaW8nLCAnYicsICdiZGknLCAnYmRvJywgJ2JyJywgJ2J1dHRvbicsICdjYW52YXMnLCAnY2l0ZScsXG4gICAgICAgICAgICAnY29kZScsICdkYXRhJywgJ2RhdGFsaXN0JywgJ2RlbCcsICdkZm4nLCAnZW0nLCAnZW1iZWQnLCAnaScsICdpZnJhbWUnLCAnaW1nJyxcbiAgICAgICAgICAgICdpbnB1dCcsICdpbnMnLCAna2JkJywgJ2tleWdlbicsICdsYWJlbCcsICdtYXAnLCAnbWFyaycsICdtYXRoJywgJ21ldGVyJywgJ25vc2NyaXB0JyxcbiAgICAgICAgICAgICdvYmplY3QnLCAnb3V0cHV0JywgJ3Byb2dyZXNzJywgJ3EnLCAncnVieScsICdzJywgJ3NhbXAnLCAvKiAnc2NyaXB0JywgKi8gJ3NlbGVjdCcsICdzbWFsbCcsXG4gICAgICAgICAgICAnc3BhbicsICdzdHJvbmcnLCAnc3ViJywgJ3N1cCcsICdzdmcnLCAndGVtcGxhdGUnLCAndGV4dGFyZWEnLCAndGltZScsICd1JywgJ3ZhcicsXG4gICAgICAgICAgICAndmlkZW8nLCAnd2JyJywgJ3RleHQnLFxuICAgICAgICAgICAgLy8gcHJleGlzdGluZyAtIG5vdCBzdXJlIG9mIGZ1bGwgZWZmZWN0IG9mIHJlbW92aW5nLCBsZWF2aW5nIGluXG4gICAgICAgICAgICAnYWNyb255bScsICdhZGRyZXNzJywgJ2JpZycsICdkdCcsICdpbnMnLCAnc3RyaWtlJywgJ3R0JyxcbiAgICAgICAgXTtcbiAgICAgICAgY29udGVudF91bmZvcm1hdHRlZCA9IG9wdGlvbnMuY29udGVudF91bmZvcm1hdHRlZCB8fCBbXG4gICAgICAgICAgICAncHJlJyxcbiAgICAgICAgXTtcbiAgICAgICAgcHJlc2VydmVfbmV3bGluZXMgPSAob3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcyA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICBtYXhfcHJlc2VydmVfbmV3bGluZXMgPSBwcmVzZXJ2ZV9uZXdsaW5lcyA/XG4gICAgICAgICAgICAoaXNOYU4ocGFyc2VJbnQob3B0aW9ucy5tYXhfcHJlc2VydmVfbmV3bGluZXMsIDEwKSkgPyAzMjc4NiA6IHBhcnNlSW50KG9wdGlvbnMubWF4X3ByZXNlcnZlX25ld2xpbmVzLCAxMCkpIDpcbiAgICAgICAgICAgIDA7XG4gICAgICAgIGluZGVudF9oYW5kbGViYXJzID0gKG9wdGlvbnMuaW5kZW50X2hhbmRsZWJhcnMgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuaW5kZW50X2hhbmRsZWJhcnM7XG4gICAgICAgIHdyYXBfYXR0cmlidXRlcyA9IChvcHRpb25zLndyYXBfYXR0cmlidXRlcyA9PT0gdW5kZWZpbmVkKSA/ICdhdXRvJyA6IG9wdGlvbnMud3JhcF9hdHRyaWJ1dGVzO1xuICAgICAgICB3cmFwX2F0dHJpYnV0ZXNfaW5kZW50X3NpemUgPSAoaXNOYU4ocGFyc2VJbnQob3B0aW9ucy53cmFwX2F0dHJpYnV0ZXNfaW5kZW50X3NpemUsIDEwKSkpID8gaW5kZW50X3NpemUgOiBwYXJzZUludChvcHRpb25zLndyYXBfYXR0cmlidXRlc19pbmRlbnRfc2l6ZSwgMTApO1xuICAgICAgICBpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2UgPSB3cmFwX2F0dHJpYnV0ZXMuc3Vic3RyKDAsICdmb3JjZScubGVuZ3RoKSA9PT0gJ2ZvcmNlJztcbiAgICAgICAgaXNfd3JhcF9hdHRyaWJ1dGVzX2ZvcmNlX2V4cGFuZF9tdWx0aWxpbmUgPSAod3JhcF9hdHRyaWJ1dGVzID09PSAnZm9yY2UtZXhwYW5kLW11bHRpbGluZScpO1xuICAgICAgICBpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2VfYWxpZ25lZCA9ICh3cmFwX2F0dHJpYnV0ZXMgPT09ICdmb3JjZS1hbGlnbmVkJyk7XG4gICAgICAgIGVuZF93aXRoX25ld2xpbmUgPSAob3B0aW9ucy5lbmRfd2l0aF9uZXdsaW5lID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmVuZF93aXRoX25ld2xpbmU7XG4gICAgICAgIGV4dHJhX2xpbmVycyA9ICh0eXBlb2Ygb3B0aW9ucy5leHRyYV9saW5lcnMgPT09ICdvYmplY3QnKSAmJiBvcHRpb25zLmV4dHJhX2xpbmVycyA/XG4gICAgICAgICAgICBvcHRpb25zLmV4dHJhX2xpbmVycy5jb25jYXQoKSA6ICh0eXBlb2Ygb3B0aW9ucy5leHRyYV9saW5lcnMgPT09ICdzdHJpbmcnKSA/XG4gICAgICAgICAgICBvcHRpb25zLmV4dHJhX2xpbmVycy5zcGxpdCgnLCcpIDogJ2hlYWQsYm9keSwvaHRtbCcuc3BsaXQoJywnKTtcbiAgICAgICAgZW9sID0gb3B0aW9ucy5lb2wgPyBvcHRpb25zLmVvbCA6ICdhdXRvJztcblxuICAgICAgICBpZiAob3B0aW9ucy5pbmRlbnRfd2l0aF90YWJzKSB7XG4gICAgICAgICAgICBpbmRlbnRfY2hhcmFjdGVyID0gJ1xcdCc7XG4gICAgICAgICAgICBpbmRlbnRfc2l6ZSA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZW9sID09PSAnYXV0bycpIHtcbiAgICAgICAgICAgIGVvbCA9ICdcXG4nO1xuICAgICAgICAgICAgaWYgKGh0bWxfc291cmNlICYmIGxpbmVCcmVhay50ZXN0KGh0bWxfc291cmNlIHx8ICcnKSkge1xuICAgICAgICAgICAgICAgIGVvbCA9IGh0bWxfc291cmNlLm1hdGNoKGxpbmVCcmVhaylbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlb2wgPSBlb2wucmVwbGFjZSgvXFxcXHIvLCAnXFxyJykucmVwbGFjZSgvXFxcXG4vLCAnXFxuJyk7XG5cbiAgICAgICAgLy8gSEFDSzogbmV3bGluZSBwYXJzaW5nIGluY29uc2lzdGVudC4gVGhpcyBicnV0ZSBmb3JjZSBub3JtYWxpemVzIHRoZSBpbnB1dC5cbiAgICAgICAgaHRtbF9zb3VyY2UgPSBodG1sX3NvdXJjZS5yZXBsYWNlKGFsbExpbmVCcmVha3MsICdcXG4nKTtcblxuICAgICAgICBmdW5jdGlvbiBQYXJzZXIoKSB7XG5cbiAgICAgICAgICAgIHRoaXMucG9zID0gMDsgLy9QYXJzZXIgcG9zaXRpb25cbiAgICAgICAgICAgIHRoaXMudG9rZW4gPSAnJztcbiAgICAgICAgICAgIHRoaXMuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnOyAvL3JlZmxlY3RzIHRoZSBjdXJyZW50IFBhcnNlciBtb2RlOiBUQUcvQ09OVEVOVFxuICAgICAgICAgICAgdGhpcy50YWdzID0geyAvL0FuIG9iamVjdCB0byBob2xkIHRhZ3MsIHRoZWlyIHBvc2l0aW9uLCBhbmQgdGhlaXIgcGFyZW50LXRhZ3MsIGluaXRpYXRlZCB3aXRoIGRlZmF1bHQgdmFsdWVzXG4gICAgICAgICAgICAgICAgcGFyZW50OiAncGFyZW50MScsXG4gICAgICAgICAgICAgICAgcGFyZW50Y291bnQ6IDEsXG4gICAgICAgICAgICAgICAgcGFyZW50MTogJydcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRva2VuX3RleHQgPSB0aGlzLmxhc3RfdG9rZW4gPSB0aGlzLmxhc3RfdGV4dCA9IHRoaXMudG9rZW5fdHlwZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5uZXdsaW5lcyA9IDA7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9jb250ZW50ID0gaW5kZW50X2lubmVyX2h0bWw7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9ib2R5X2lubmVyX2h0bWwgPSBpbmRlbnRfYm9keV9pbm5lcl9odG1sO1xuICAgICAgICAgICAgdGhpcy5pbmRlbnRfaGVhZF9pbm5lcl9odG1sID0gaW5kZW50X2hlYWRfaW5uZXJfaHRtbDtcblxuICAgICAgICAgICAgdGhpcy5VdGlscyA9IHsgLy9VaWxpdGllcyBtYWRlIGF2YWlsYWJsZSB0byB0aGUgdmFyaW91cyBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlOiBcIlxcblxcclxcdCBcIi5zcGxpdCgnJyksXG5cbiAgICAgICAgICAgICAgICBzaW5nbGVfdG9rZW46IG9wdGlvbnMudm9pZF9lbGVtZW50cyB8fCBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEhUTE0gdm9pZCBlbGVtZW50cyAtIGFrYSBzZWxmLWNsb3NpbmcgdGFncyAtIGFrYSBzaW5nbGV0b25zXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vd3d3LnczLm9yZy9odG1sL3dnL2RyYWZ0cy9odG1sL21hc3Rlci9zeW50YXguaHRtbCN2b2lkLWVsZW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICdhcmVhJywgJ2Jhc2UnLCAnYnInLCAnY29sJywgJ2VtYmVkJywgJ2hyJywgJ2ltZycsICdpbnB1dCcsICdrZXlnZW4nLFxuICAgICAgICAgICAgICAgICAgICAnbGluaycsICdtZW51aXRlbScsICdtZXRhJywgJ3BhcmFtJywgJ3NvdXJjZScsICd0cmFjaycsICd3YnInLFxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBPcHRpb25hbCB0YWdzIC0gYXJlIG5vdCB1bmRlcnN0b29kLlxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvc3ludGF4Lmh0bWwjb3B0aW9uYWwtdGFnc1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcnVsZXMgZm9yIG9wdGlvbmFsIHRhZ3MgYXJlIHRvbyBjb21wbGV4IGZvciBhIHNpbXBsZSBsaXN0XG4gICAgICAgICAgICAgICAgICAgIC8vIEFsc28sIHRoZSBjb250ZW50IG9mIHRoZXNlIHRhZ3Mgc2hvdWxkIHN0aWxsIGJlIGluZGVudGVkIGluIG1hbnkgY2FzZXMuXG4gICAgICAgICAgICAgICAgICAgIC8vICdsaScgaXMgYSBnb29kIGV4bXBsZS5cblxuICAgICAgICAgICAgICAgICAgICAvLyBEb2N0eXBlIGFuZCB4bWwgZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgJyFkb2N0eXBlJywgJz94bWwnLFxuICAgICAgICAgICAgICAgICAgICAvLyA/cGhwIHRhZ1xuICAgICAgICAgICAgICAgICAgICAnP3BocCcsXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyIHRhZ3MgdGhhdCB3ZXJlIGluIHRoaXMgbGlzdCwga2VlcGluZyBqdXN0IGluIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgJ2Jhc2Vmb250JywgJ2lzaW5kZXgnXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBleHRyYV9saW5lcnM6IGV4dHJhX2xpbmVycywgLy9mb3IgdGFncyB0aGF0IG5lZWQgYSBsaW5lIG9mIHdoaXRlc3BhY2UgYmVmb3JlIHRoZW1cbiAgICAgICAgICAgICAgICBpbl9hcnJheTogZnVuY3Rpb24od2hhdCwgYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2hhdCA9PT0gYXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiB0ZXh0IGlzIGNvbXBvc2VkIGVudGlyZWx5IG9mIHdoaXRlc3BhY2UuXG4gICAgICAgICAgICB0aGlzLmlzX3doaXRlc3BhY2UgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCB0ZXh0Lmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5VdGlscy5pbl9hcnJheSh0ZXh0LmNoYXJBdChuKSwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJztcblxuICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgPSB0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuVXRpbHMuaW5fYXJyYXkoaW5wdXRfY2hhciwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld2xpbmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuVXRpbHMuaW5fYXJyYXkoaW5wdXRfY2hhciwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXNlcnZlX25ld2xpbmVzICYmIGlucHV0X2NoYXIgPT09ICdcXG4nICYmIHRoaXMubmV3bGluZXMgPD0gbWF4X3ByZXNlcnZlX25ld2xpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdsaW5lcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gQXBwZW5kIGEgc3BhY2UgdG8gdGhlIGdpdmVuIGNvbnRlbnQgKHN0cmluZyBhcnJheSkgb3IsIGlmIHdlIGFyZVxuICAgICAgICAgICAgLy8gYXQgdGhlIHdyYXBfbGluZV9sZW5ndGgsIGFwcGVuZCBhIG5ld2xpbmUvaW5kZW50YXRpb24uXG4gICAgICAgICAgICAvLyByZXR1cm4gdHJ1ZSBpZiBhIG5ld2xpbmUgd2FzIGFkZGVkLCBmYWxzZSBpZiBhIHNwYWNlIHdhcyBhZGRlZFxuICAgICAgICAgICAgdGhpcy5zcGFjZV9vcl93cmFwID0gZnVuY3Rpb24oY29udGVudCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpbmVfY2hhcl9jb3VudCA+PSB0aGlzLndyYXBfbGluZV9sZW5ndGgpIHsgLy9pbnNlcnQgYSBsaW5lIHdoZW4gdGhlIHdyYXBfbGluZV9sZW5ndGggaXMgcmVhY2hlZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2NvbnRlbnQgPSBmdW5jdGlvbigpIHsgLy9mdW5jdGlvbiB0byBjYXB0dXJlIHJlZ3VsYXIgY29udGVudCBiZXR3ZWVuIHRhZ3NcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRfY2hhciA9ICcnLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWJhcnNTdGFydGVkID0gMDtcblxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcykgIT09ICc8JyB8fCBoYW5kbGViYXJzU3RhcnRlZCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50Lmxlbmd0aCA/IGNvbnRlbnQuam9pbignJykgOiBbJycsICdUS19FT0YnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGViYXJzU3RhcnRlZCA8IDIgJiYgdGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3BhY2Vfb3Jfd3JhcChjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGViYXJzU3RhcnRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYW5kbGViYXJzU3RhcnRlZCA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGViYXJzU3RhcnRlZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnfScgJiYgaGFuZGxlYmFyc1N0YXJ0ZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZWJhcnNTdGFydGVkLS0gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlYmFycyBwYXJzaW5nIGlzIGNvbXBsaWNhdGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ge3sjZm9vfX0gYW5kIHt7L2Zvb319IGFyZSBmb3JtYXR0ZWQgdGFncy5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHt7c29tZXRoaW5nfX0gc2hvdWxkIGdldCB0cmVhdGVkIGFzIGNvbnRlbnQsIGV4Y2VwdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHt7ZWxzZX19IHNwZWNpZmljYWxseSBiZWhhdmVzIGxpa2Uge3sjaWZ9fSBhbmQge3svaWZ9fVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBlZWszID0gdGhpcy5pbnB1dC5zdWJzdHIodGhpcy5wb3MsIDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZWszID09PSAne3sjJyB8fCBwZWVrMyA9PT0gJ3t7LycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVzZSBhcmUgdGFncyBhbmQgbm90IGNvbnRlbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBlZWszID09PSAne3shJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5nZXRfdGFnKCksICdUS19UQUdfSEFORExFQkFSU19DT01NRU5UJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQuc3Vic3RyKHRoaXMucG9zLCAyKSA9PT0gJ3t7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldF90YWcodHJ1ZSkgPT09ICd7e2Vsc2V9fScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKGlucHV0X2NoYXIpOyAvL2xldHRlciBhdC1hLXRpbWUgKG9yIHN0cmluZykgaW5zZXJ0ZWQgdG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoID8gY29udGVudC5qb2luKCcnKSA6ICcnO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfY29udGVudHNfdG8gPSBmdW5jdGlvbihuYW1lKSB7IC8vZ2V0IHRoZSBmdWxsIGNvbnRlbnQgb2YgYSBzY3JpcHQgb3Igc3R5bGUgdG8gcGFzcyB0byBqc19iZWF1dGlmeVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBvcyA9PT0gdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9ICcnO1xuICAgICAgICAgICAgICAgIHZhciByZWdfbWF0Y2ggPSBuZXcgUmVnRXhwKCc8LycgKyBuYW1lICsgJ1xcXFxzKj4nLCAnaWdtJyk7XG4gICAgICAgICAgICAgICAgcmVnX21hdGNoLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICAgICAgICAgICAgICAgIHZhciByZWdfYXJyYXkgPSByZWdfbWF0Y2guZXhlYyh0aGlzLmlucHV0KTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kX3NjcmlwdCA9IHJlZ19hcnJheSA/IHJlZ19hcnJheS5pbmRleCA6IHRoaXMuaW5wdXQubGVuZ3RoOyAvL2Fic29sdXRlIGVuZCBvZiBzY3JpcHRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPCBlbmRfc2NyaXB0KSB7IC8vZ2V0IGV2ZXJ5dGhpbmcgaW4gYmV0d2VlbiB0aGUgc2NyaXB0IHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuaW5wdXQuc3Vic3RyaW5nKHRoaXMucG9zLCBlbmRfc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBlbmRfc2NyaXB0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucmVjb3JkX3RhZyA9IGZ1bmN0aW9uKHRhZykgeyAvL2Z1bmN0aW9uIHRvIHJlY29yZCBhIHRhZyBhbmQgaXRzIHBhcmVudCBpbiB0aGlzLnRhZ3MgT2JqZWN0XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSkgeyAvL2NoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIHRoaXMgdGFnIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J11dID0gdGhpcy5pbmRlbnRfbGV2ZWw7IC8vYW5kIHJlY29yZCB0aGUgcHJlc2VudCBpbmRlbnQgbGV2ZWxcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvL290aGVyd2lzZSBpbml0aWFsaXplIHRoaXMgdGFnIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV0gPSB0aGlzLmluZGVudF9sZXZlbDsgLy9hbmQgcmVjb3JkIHRoZSBwcmVzZW50IGluZGVudCBsZXZlbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddICsgJ3BhcmVudCddID0gdGhpcy50YWdzLnBhcmVudDsgLy9zZXQgdGhlIHBhcmVudCAoaS5lLiBpbiB0aGUgY2FzZSBvZiBhIGRpdiB0aGlzLnRhZ3MuZGl2MXBhcmVudClcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ3MucGFyZW50ID0gdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddOyAvL2FuZCBtYWtlIHRoaXMgdGhlIGN1cnJlbnQgcGFyZW50IChpLmUuIGluIHRoZSBjYXNlIG9mIGEgZGl2ICdkaXYxJylcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucmV0cmlldmVfdGFnID0gZnVuY3Rpb24odGFnKSB7IC8vZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIG9wZW5pbmcgdGFnIHRvIHRoZSBjb3JyZXNwb25kaW5nIGNsb3NlclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10pIHsgLy9pZiB0aGUgb3BlbmVuZXIgaXMgbm90IGluIHRoZSBPYmplY3Qgd2UgaWdub3JlIGl0XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wX3BhcmVudCA9IHRoaXMudGFncy5wYXJlbnQ7IC8vY2hlY2sgdG8gc2VlIGlmIGl0J3MgYSBjbG9zYWJsZSB0YWcuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0ZW1wX3BhcmVudCkgeyAvL3RpbGwgd2UgcmVhY2ggJycgKHRoZSBpbml0aWFsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10gPT09IHRlbXBfcGFyZW50KSB7IC8vaWYgdGhpcyBpcyBpdCB1c2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzW3RlbXBfcGFyZW50ICsgJ3BhcmVudCddOyAvL290aGVyd2lzZSBrZWVwIG9uIGNsaW1iaW5nIHVwIHRoZSBET00gVHJlZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wX3BhcmVudCkgeyAvL2lmIHdlIGNhdWdodCBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X2xldmVsID0gdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV07IC8vc2V0IHRoZSBpbmRlbnRfbGV2ZWwgYWNjb3JkaW5nbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFncy5wYXJlbnQgPSB0aGlzLnRhZ3NbdGVtcF9wYXJlbnQgKyAncGFyZW50J107IC8vYW5kIHNldCB0aGUgY3VycmVudCBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSArICdwYXJlbnQnXTsgLy9kZWxldGUgdGhlIGNsb3NlZCB0YWdzIHBhcmVudCByZWZlcmVuY2UuLi5cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J11dOyAvLy4uLmFuZCB0aGUgdGFnIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YWdzW3RhZyArICdjb3VudCddID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWdzW3RhZyArICdjb3VudCddO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddLS07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmluZGVudF90b190YWcgPSBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgICAgICAvLyBNYXRjaCB0aGUgaW5kZW50YXRpb24gbGV2ZWwgdG8gdGhlIGxhc3QgdXNlIG9mIHRoaXMgdGFnLCBidXQgZG9uJ3QgcmVtb3ZlIGl0LlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy50YWdzW3RhZyArICdjb3VudCddKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzLnBhcmVudDtcbiAgICAgICAgICAgICAgICB3aGlsZSAodGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSA9PT0gdGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzW3RlbXBfcGFyZW50ICsgJ3BhcmVudCddO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwgPSB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF90YWcgPSBmdW5jdGlvbihwZWVrKSB7IC8vZnVuY3Rpb24gdG8gZ2V0IGEgZnVsbCB0YWcgYW5kIHBhcnNlIGl0cyB0eXBlXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gJycsXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2F0dHIgPSB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBoYXNfd3JhcHBlZF9hdHRycyA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0YWdfc3RhcnQsIHRhZ19lbmQsXG4gICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydF9jaGFyLFxuICAgICAgICAgICAgICAgICAgICBvcmlnX3BvcyA9IHRoaXMucG9zLFxuICAgICAgICAgICAgICAgICAgICBvcmlnX2xpbmVfY2hhcl9jb3VudCA9IHRoaXMubGluZV9jaGFyX2NvdW50LFxuICAgICAgICAgICAgICAgICAgICBpc190YWdfY2xvc2VkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRhaWw7XG5cbiAgICAgICAgICAgICAgICBwZWVrID0gcGVlayAhPT0gdW5kZWZpbmVkID8gcGVlayA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBvcmlnX3BvcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCA9IG9yaWdfbGluZV9jaGFyX2NvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoID8gY29udGVudC5qb2luKCcnKSA6IFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheShpbnB1dF9jaGFyLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7IC8vZG9uJ3Qgd2FudCB0byBpbnNlcnQgdW5uZWNlc3Nhcnkgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09IFwiJ1wiIHx8IGlucHV0X2NoYXIgPT09ICdcIicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgKz0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoaW5wdXRfY2hhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfY2hhciA9PT0gJz0nKSB7IC8vbm8gc3BhY2UgYmVmb3JlID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGFpbCA9IHRoaXMuaW5wdXQuc3Vic3RyKHRoaXMucG9zIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2VfZXhwYW5kX211bHRpbGluZSAmJiBoYXNfd3JhcHBlZF9hdHRycyAmJiAhaXNfdGFnX2Nsb3NlZCAmJiAoaW5wdXRfY2hhciA9PT0gJz4nIHx8IGlucHV0X2NoYXIgPT09ICcvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWlsLm1hdGNoKC9eXFwvP1xccyo+LykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzX3RhZ19jbG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfbmV3bGluZShmYWxzZSwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9pbmRlbnRhdGlvbihjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudC5sZW5ndGggJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdICE9PSAnPScgJiYgaW5wdXRfY2hhciAhPT0gJz4nICYmIHNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL25vIHNwYWNlIGFmdGVyID0gb3IgYmVmb3JlID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3cmFwcGVkID0gdGhpcy5zcGFjZV9vcl93cmFwKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGVudEF0dHJzID0gd3JhcHBlZCAmJiBpbnB1dF9jaGFyICE9PSAnLycgJiYgIWlzX3dyYXBfYXR0cmlidXRlc19mb3JjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2UgJiYgaW5wdXRfY2hhciAhPT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZvcmNlX2ZpcnN0X2F0dHJfd3JhcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc193cmFwX2F0dHJpYnV0ZXNfZm9yY2VfZXhwYW5kX211bHRpbGluZSAmJiBmaXJzdF9hdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc19vbmx5X2F0dHJpYnV0ZSA9IHRhaWwubWF0Y2goL15cXFMqKD1cIihbXlwiXXxcXFxcXCIpKlwiKT9cXHMqXFwvP1xccyo+LykgIT09IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlX2ZpcnN0X2F0dHJfd3JhcCA9ICFpc19vbmx5X2F0dHJpYnV0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdF9hdHRyIHx8IGZvcmNlX2ZpcnN0X2F0dHJfd3JhcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnRBdHRycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudEF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzX3dyYXBwZWRfYXR0cnMgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pbmRlbnQgYXR0cmlidXRlcyBhbiBhdXRvLCBmb3JjZWQsIG9yIGZvcmNlZC1hbGlnbiBsaW5lLXdyYXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWxpZ25tZW50X3NpemUgPSB3cmFwX2F0dHJpYnV0ZXNfaW5kZW50X3NpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzX3dyYXBfYXR0cmlidXRlc19mb3JjZV9hbGlnbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWdubWVudF9zaXplID0gY29udGVudC5pbmRleE9mKCcgJykgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGNvdW50ID0gMDsgY291bnQgPCBhbGlnbm1lbnRfc2l6ZTsgY291bnQrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IGV2ZXIgZnVydGhlciBpbmRlbnQgd2l0aCBzcGFjZXMgc2luY2Ugd2UncmUgdHJ5aW5nIHRvIGFsaWduIGNoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0X2F0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRbaV0gPT09ICcgJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RfYXR0ciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX3N0YXJ0X2NoYXIgPT09ICc8Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiBpbnNpZGUgYW4gYW5nbGUtYnJhY2tldCB0YWcsIHB1dCBzcGFjZXMgYXJvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGViYXJzIG5vdCBpbnNpZGUgb2Ygc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoaW5wdXRfY2hhciArIHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKSkgPT09ICd7eycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyICs9IHRoaXMuZ2V0X3VuZm9ybWF0dGVkKCd9fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICcgJyAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICc8Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gJyAnICsgaW5wdXRfY2hhcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09ICc8JyAmJiAhdGFnX3N0YXJ0X2NoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCA9IHRoaXMucG9zIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydF9jaGFyID0gJzwnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudF9oYW5kbGViYXJzICYmICF0YWdfc3RhcnRfY2hhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQubGVuZ3RoID49IDIgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdID09PSAneycgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDJdID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfY2hhciA9PT0gJyMnIHx8IGlucHV0X2NoYXIgPT09ICcvJyB8fCBpbnB1dF9jaGFyID09PSAnIScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0ID0gdGhpcy5wb3MgLSAzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCA9IHRoaXMucG9zIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0X2NoYXIgPSAneyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goaW5wdXRfY2hhcik7IC8vaW5zZXJ0cyBjaGFyYWN0ZXIgYXQtYS10aW1lIChvciBzdHJpbmcpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRbMV0gJiYgKGNvbnRlbnRbMV0gPT09ICchJyB8fCBjb250ZW50WzFdID09PSAnPycgfHwgY29udGVudFsxXSA9PT0gJyUnKSkgeyAvL2lmIHdlJ3JlIGluIGEgY29tbWVudCwgZG8gc29tZXRoaW5nIHNwZWNpYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHRyZWF0IGFsbCBjb21tZW50cyBhcyBsaXRlcmFscywgZXZlbiBtb3JlIHRoYW4gcHJlZm9ybWF0dGVkIHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGp1c3QgbG9vayBmb3IgdGhlIGFwcHJvcHJpYXRlIGNsb3NlIHRhZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFt0aGlzLmdldF9jb21tZW50KHRhZ19zdGFydCldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgY29udGVudFsxXSAmJiBjb250ZW50WzFdID09PSAneycgJiYgY29udGVudFsyXSAmJiBjb250ZW50WzJdID09PSAnIScpIHsgLy9pZiB3ZSdyZSBpbiBhIGNvbW1lbnQsIGRvIHNvbWV0aGluZyBzcGVjaWFsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSB0cmVhdCBhbGwgY29tbWVudHMgYXMgbGl0ZXJhbHMsIGV2ZW4gbW9yZSB0aGFuIHByZWZvcm1hdHRlZCB0YWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBqdXN0IGxvb2sgZm9yIHRoZSBhcHByb3ByaWF0ZSBjbG9zZSB0YWdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBbdGhpcy5nZXRfY29tbWVudCh0YWdfc3RhcnQpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudF9oYW5kbGViYXJzICYmIHRhZ19zdGFydF9jaGFyID09PSAneycgJiYgY29udGVudC5sZW5ndGggPiAyICYmIGNvbnRlbnRbY29udGVudC5sZW5ndGggLSAyXSA9PT0gJ30nICYmIGNvbnRlbnRbY29udGVudC5sZW5ndGggLSAxXSA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKGlucHV0X2NoYXIgIT09ICc+Jyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGFnX2NvbXBsZXRlID0gY29udGVudC5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICB2YXIgdGFnX2luZGV4O1xuICAgICAgICAgICAgICAgIHZhciB0YWdfb2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBjaGVjayBmb3Igc3BhY2UgZmlyc3Qgb3RoZXJ3aXNlIHRoZSB0YWcgY291bGQgaGF2ZSB0aGUgZmlyc3QgYXR0cmlidXRlIGluY2x1ZGVkLCBhbmRcbiAgICAgICAgICAgICAgICAvLyB0aGVuIG5vdCB1bi1pbmRlbnQgY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jb21wbGV0ZS5pbmRleE9mKCcgJykgIT09IC0xKSB7IC8vaWYgdGhlcmUncyB3aGl0ZXNwYWNlLCB0aGF0cyB3aGVyZSB0aGUgdGFnIG5hbWUgZW5kc1xuICAgICAgICAgICAgICAgICAgICB0YWdfaW5kZXggPSB0YWdfY29tcGxldGUuaW5kZXhPZignICcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnX2NvbXBsZXRlLmluZGV4T2YoJ1xcbicpICE9PSAtMSkgeyAvL2lmIHRoZXJlJ3MgYSBsaW5lIGJyZWFrLCB0aGF0cyB3aGVyZSB0aGUgdGFnIG5hbWUgZW5kc1xuICAgICAgICAgICAgICAgICAgICB0YWdfaW5kZXggPSB0YWdfY29tcGxldGUuaW5kZXhPZignXFxuJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY29tcGxldGUuY2hhckF0KDApID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnX2luZGV4ID0gdGFnX2NvbXBsZXRlLmluZGV4T2YoJ30nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvL290aGVyd2lzZSBnbyB3aXRoIHRoZSB0YWcgZW5kaW5nXG4gICAgICAgICAgICAgICAgICAgIHRhZ19pbmRleCA9IHRhZ19jb21wbGV0ZS5pbmRleE9mKCc+Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdfY29tcGxldGUuY2hhckF0KDApID09PSAnPCcgfHwgIWluZGVudF9oYW5kbGViYXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ19vZmZzZXQgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ19vZmZzZXQgPSB0YWdfY29tcGxldGUuY2hhckF0KDIpID09PSAnIycgPyAzIDogMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRhZ19jaGVjayA9IHRhZ19jb21wbGV0ZS5zdWJzdHJpbmcodGFnX29mZnNldCwgdGFnX2luZGV4KS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0YWdfY29tcGxldGUuY2hhckF0KHRhZ19jb21wbGV0ZS5sZW5ndGggLSAyKSA9PT0gJy8nIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnX2NoZWNrLCB0aGlzLlV0aWxzLnNpbmdsZV90b2tlbikpIHsgLy9pZiB0aGlzIHRhZyBuYW1lIGlzIGEgc2luZ2xlIHRhZyB0eXBlIChlaXRoZXIgaW4gdGhlIGxpc3Qgb3IgaGFzIGEgY2xvc2luZyAvKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0lOR0xFJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX2NvbXBsZXRlLmNoYXJBdCgwKSA9PT0gJ3snICYmIHRhZ19jaGVjayA9PT0gJ2Vsc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfdG9fdGFnKCdpZicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICdIQU5ETEVCQVJTX0VMU0UnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfY29udGVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYXZlcnNlX3doaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc191bmZvcm1hdHRlZCh0YWdfY2hlY2ssIHVuZm9ybWF0dGVkKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzX3VuZm9ybWF0dGVkKHRhZ19jaGVjaywgY29udGVudF91bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90IHJlZm9ybWF0IHRoZSBcInVuZm9ybWF0dGVkXCIgb3IgXCJjb250ZW50X3VuZm9ybWF0dGVkXCIgdGFnc1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoJzwvJyArIHRhZ19jaGVjayArICc+JywgdGFnX2NvbXBsZXRlKTsgLy8uLi5kZWxlZ2F0ZSB0byBnZXRfdW5mb3JtYXR0ZWQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKGNvbW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB0YWdfZW5kID0gdGhpcy5wb3MgLSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NJTkdMRSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY2hlY2sgPT09ICdzY3JpcHQnICYmXG4gICAgICAgICAgICAgICAgICAgICh0YWdfY29tcGxldGUuc2VhcmNoKCd0eXBlJykgPT09IC0xIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAodGFnX2NvbXBsZXRlLnNlYXJjaCgndHlwZScpID4gLTEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdfY29tcGxldGUuc2VhcmNoKC9cXGIodGV4dHxhcHBsaWNhdGlvbnxkb2pvKVxcLyh4LSk/KGphdmFzY3JpcHR8ZWNtYXNjcmlwdHxqc2NyaXB0fGxpdmVzY3JpcHR8KGxkXFwrKT9qc29ufG1ldGhvZHxhc3BlY3QpLykgPiAtMSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvcmRfdGFnKHRhZ19jaGVjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NDUklQVCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ19jaGVjayA9PT0gJ3N0eWxlJyAmJlxuICAgICAgICAgICAgICAgICAgICAodGFnX2NvbXBsZXRlLnNlYXJjaCgndHlwZScpID09PSAtMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHRhZ19jb21wbGV0ZS5zZWFyY2goJ3R5cGUnKSA+IC0xICYmIHRhZ19jb21wbGV0ZS5zZWFyY2goJ3RleHQvY3NzJykgPiAtMSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvcmRfdGFnKHRhZ19jaGVjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NUWUxFJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnX2NoZWNrLmNoYXJBdCgwKSA9PT0gJyEnKSB7IC8vcGVlayBmb3IgPCEgY29tbWVudFxuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgY29tbWVudHMgY29udGVudCBpcyBhbHJlYWR5IGNvcnJlY3QuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICdTSU5HTEUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWdfY2hlY2suY2hhckF0KDApID09PSAnLycpIHsgLy90aGlzIHRhZyBpcyBhIGRvdWJsZSB0YWcgc28gY2hlY2sgZm9yIHRhZy1lbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV0cmlldmVfdGFnKHRhZ19jaGVjay5zdWJzdHJpbmcoMSkpOyAvL3JlbW92ZSBpdCBhbmQgYWxsIGFuY2VzdG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICdFTkQnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvL290aGVyd2lzZSBpdCdzIGEgc3RhcnQtdGFnXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZF90YWcodGFnX2NoZWNrKTsgLy9wdXNoIGl0IG9uIHRoZSB0YWcgc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdfY2hlY2sudG9Mb3dlckNhc2UoKSAhPT0gJ2h0bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfY29udGVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NUQVJUJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEFsbG93IHByZXNlcnZpbmcgb2YgbmV3bGluZXMgYWZ0ZXIgYSBzdGFydCBvciBlbmQgdGFnXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyYXZlcnNlX3doaXRlc3BhY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zcGFjZV9vcl93cmFwKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnX2NoZWNrLCB0aGlzLlV0aWxzLmV4dHJhX2xpbmVycykpIHsgLy9jaGVjayBpZiB0aGlzIGRvdWJsZSBuZWVkcyBhbiBleHRyYSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dC5sZW5ndGggJiYgdGhpcy5vdXRwdXRbdGhpcy5vdXRwdXQubGVuZ3RoIC0gMl0gIT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lKHRydWUsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zID0gb3JpZ19wb3M7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gb3JpZ19saW5lX2NoYXJfY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQuam9pbignJyk7IC8vcmV0dXJucyBmdWxseSBmb3JtYXR0ZWQgdGFnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF9jb21tZW50ID0gZnVuY3Rpb24oc3RhcnRfcG9zKSB7IC8vZnVuY3Rpb24gdG8gcmV0dXJuIGNvbW1lbnQgY29udGVudCBpbiBpdHMgZW50aXJldHlcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHdpbGwgaGF2ZSB2ZXJ5IHBvb3IgcGVyZiwgYnV0IHdpbGwgd29yayBmb3Igbm93LlxuICAgICAgICAgICAgICAgIHZhciBjb21tZW50ID0gJycsXG4gICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICc+JyxcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBzdGFydF9wb3M7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSB0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcblxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLnBvcyA8PSB0aGlzLmlucHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9IGlucHV0X2NoYXI7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSBuZWVkIHRvIGNoZWNrIGZvciB0aGUgZGVsaW1pdGVyIGlmIHRoZSBsYXN0IGNoYXJzIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21tZW50LmNoYXJBdChjb21tZW50Lmxlbmd0aCAtIDEpID09PSBkZWxpbWl0ZXIuY2hhckF0KGRlbGltaXRlci5sZW5ndGggLSAxKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudC5pbmRleE9mKGRlbGltaXRlcikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgbmVlZCB0byBzZWFyY2ggZm9yIGN1c3RvbSBkZWxpbWl0ZXIgZm9yIHRoZSBmaXJzdCBmZXcgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWQgJiYgY29tbWVudC5sZW5ndGggPCAxMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQuaW5kZXhPZignPCFbaWYnKSA9PT0gMCkgeyAvL3BlZWsgZm9yIDwhW2lmIGNvbmRpdGlvbmFsIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnPCFbZW5kaWZdPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZignPCFbY2RhdGFbJykgPT09IDApIHsgLy9pZiBpdCdzIGEgPFtjZGF0YVsgY29tbWVudC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICddXT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJzwhWycpID09PSAwKSB7IC8vIHNvbWUgb3RoZXIgIVsgY29tbWVudD8gLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJ10+JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWVudC5pbmRleE9mKCc8IS0tJykgPT09IDApIHsgLy8gPCEtLSBjb21tZW50IC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICctLT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJ3t7IS0tJykgPT09IDApIHsgLy8ge3shLS0gaGFuZGxlYmFycyBjb21tZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJy0tfX0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJ3t7IScpID09PSAwKSB7IC8vIHt7ISBoYW5kbGViYXJzIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWVudC5sZW5ndGggPT09IDUgJiYgY29tbWVudC5pbmRleE9mKCd7eyEtLScpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnfX0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZignPD8nKSA9PT0gMCkgeyAvLyB7eyEgaGFuZGxlYmFycyBjb21tZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJz8+JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWVudC5pbmRleE9mKCc8JScpID09PSAwKSB7IC8vIHt7ISBoYW5kbGViYXJzIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnJT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tbWVudDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRva2VuTWF0Y2hlcihkZWxpbWl0ZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW4gPSAnJztcblxuICAgICAgICAgICAgICAgIHZhciBhZGQgPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1Rva2VuID0gdG9rZW4gKyBzdHIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSBuZXdUb2tlbi5sZW5ndGggPD0gZGVsaW1pdGVyLmxlbmd0aCA/IG5ld1Rva2VuIDogbmV3VG9rZW4uc3Vic3RyKG5ld1Rva2VuLmxlbmd0aCAtIGRlbGltaXRlci5sZW5ndGgsIGRlbGltaXRlci5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgZG9lc05vdE1hdGNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbi5pbmRleE9mKGRlbGltaXRlcikgPT09IC0xO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgICAgICAgICAgICAgZG9lc05vdE1hdGNoOiBkb2VzTm90TWF0Y2hcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmdldF91bmZvcm1hdHRlZCA9IGZ1bmN0aW9uKGRlbGltaXRlciwgb3JpZ190YWcpIHsgLy9mdW5jdGlvbiB0byByZXR1cm4gdW5mb3JtYXR0ZWQgY29udGVudCBpbiBpdHMgZW50aXJldHlcbiAgICAgICAgICAgICAgICBpZiAob3JpZ190YWcgJiYgb3JpZ190YWcudG9Mb3dlckNhc2UoKS5pbmRleE9mKGRlbGltaXRlcikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJztcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9ICcnO1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGVsaW1pdGVyTWF0Y2hlciA9IHRva2VuTWF0Y2hlcihkZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICAgICAgZG8ge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmlucHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gdGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLlV0aWxzLmluX2FycmF5KGlucHV0X2NoYXIsIHRoaXMuVXRpbHMud2hpdGVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3BhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09ICdcXG4nIHx8IGlucHV0X2NoYXIgPT09ICdcXHInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCArPSAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAgRG9uJ3QgY2hhbmdlIHRhYiBpbmRlbnRpb24gZm9yIHVuZm9ybWF0dGVkIGJsb2Nrcy4gIElmIHVzaW5nIGNvZGUgZm9yIGh0bWwgZWRpdGluZywgdGhpcyB3aWxsIGdyZWF0bHkgYWZmZWN0IDxwcmU+IHRhZ3MgaWYgdGhleSBhcmUgc3BlY2lmaWVkIGluIHRoZSAndW5mb3JtYXR0ZWQgYXJyYXknXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMuaW5kZW50X2xldmVsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQgKz0gdGhpcy5pbmRlbnRfc3RyaW5nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzcGFjZSA9IGZhbHNlOyAvLy4uLmFuZCBtYWtlIHN1cmUgb3RoZXIgaW5kZW50YXRpb24gaXMgZXJhc2VkXG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGVudCArPSBpbnB1dF9jaGFyO1xuICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXJNYXRjaGVyLmFkZChpbnB1dF9jaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRlbnRfaGFuZGxlYmFycyAmJiBpbnB1dF9jaGFyID09PSAneycgJiYgY29udGVudC5sZW5ndGggJiYgY29udGVudC5jaGFyQXQoY29udGVudC5sZW5ndGggLSAyKSA9PT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGViYXJzIGV4cHJlc3Npb25zIGluIHN0cmluZ3Mgc2hvdWxkIGFsc28gYmUgdW5mb3JtYXR0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ICs9IHRoaXMuZ2V0X3VuZm9ybWF0dGVkKCd9fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc2lkZXIgd2hlbiBzdG9wcGluZyBmb3IgZGVsaW1pdGVycy5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKGRlbGltaXRlck1hdGNoZXIuZG9lc05vdE1hdGNoKCkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF90b2tlbiA9IGZ1bmN0aW9uKCkgeyAvL2luaXRpYWwgaGFuZGxlciBmb3IgdG9rZW4tcmV0cmlldmFsXG4gICAgICAgICAgICAgICAgdmFyIHRva2VuO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdF90b2tlbiA9PT0gJ1RLX1RBR19TQ1JJUFQnIHx8IHRoaXMubGFzdF90b2tlbiA9PT0gJ1RLX1RBR19TVFlMRScpIHsgLy9jaGVjayBpZiB3ZSBuZWVkIHRvIGZvcm1hdCBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gdGhpcy5sYXN0X3Rva2VuLnN1YnN0cig3KTtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmdldF9jb250ZW50c190byh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Rva2VuLCAnVEtfJyArIHR5cGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50X21vZGUgPT09ICdDT05URU5UJykge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRoaXMuZ2V0X2NvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdG9rZW4sICdUS19DT05URU5UJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50X21vZGUgPT09ICdUQUcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy5nZXRfdGFnKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnX25hbWVfdHlwZSA9ICdUS19UQUdfJyArIHRoaXMudGFnX3R5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Rva2VuLCB0YWdfbmFtZV90eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2Z1bGxfaW5kZW50ID0gZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBsZXZlbCA9IHRoaXMuaW5kZW50X2xldmVsICsgbGV2ZWwgfHwgMDtcbiAgICAgICAgICAgICAgICBpZiAobGV2ZWwgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkobGV2ZWwgKyAxKS5qb2luKHRoaXMuaW5kZW50X3N0cmluZyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmlzX3VuZm9ybWF0dGVkID0gZnVuY3Rpb24odGFnX2NoZWNrLCB1bmZvcm1hdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vaXMgdGhpcyBhbiBIVE1MNSBibG9jay1sZXZlbCBsaW5rP1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2ssIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jaGVjay50b0xvd2VyQ2FzZSgpICE9PSAnYScgfHwgIXRoaXMuVXRpbHMuaW5fYXJyYXkoJ2EnLCB1bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9hdCB0aGlzIHBvaW50IHdlIGhhdmUgYW4gIHRhZzsgaXMgaXRzIGZpcnN0IGNoaWxkIHNvbWV0aGluZyB3ZSB3YW50IHRvIHJlbWFpblxuICAgICAgICAgICAgICAgIC8vdW5mb3JtYXR0ZWQ/XG4gICAgICAgICAgICAgICAgdmFyIG5leHRfdGFnID0gdGhpcy5nZXRfdGFnKHRydWUgLyogcGVlay4gKi8gKTtcblxuICAgICAgICAgICAgICAgIC8vIHRlc3QgbmV4dF90YWcgdG8gc2VlIGlmIGl0IGlzIGp1c3QgaHRtbCB0YWcgKG5vIGV4dGVybmFsIGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgdmFyIHRhZyA9IChuZXh0X3RhZyB8fCBcIlwiKS5tYXRjaCgvXlxccyo8XFxzKlxcLz8oW2Etel0qKVxccypbXj5dKj5cXHMqJC8pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgbmV4dF90YWcgY29tZXMgYmFjayBidXQgaXMgbm90IGFuIGlzb2xhdGVkIHRhZywgdGhlblxuICAgICAgICAgICAgICAgIC8vIGxldCdzIHRyZWF0IHRoZSAnYScgdGFnIGFzIGhhdmluZyBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gYW5kIHJlc3BlY3QgdGhlIHVuZm9ybWF0dGVkIG9wdGlvblxuICAgICAgICAgICAgICAgIGlmICghdGFnIHx8IHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnWzFdLCB1bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJpbnRlciA9IGZ1bmN0aW9uKGpzX3NvdXJjZSwgaW5kZW50X2NoYXJhY3RlciwgaW5kZW50X3NpemUsIHdyYXBfbGluZV9sZW5ndGgsIGJyYWNlX3N0eWxlKSB7IC8vaGFuZGxlcyBpbnB1dC9vdXRwdXQgYW5kIHNvbWUgb3RoZXIgcHJpbnRpbmcgZnVuY3Rpb25zXG5cbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0ID0ganNfc291cmNlIHx8ICcnOyAvL2dldHMgdGhlIGlucHV0IGZvciB0aGUgUGFyc2VyXG5cbiAgICAgICAgICAgICAgICAvLyBIQUNLOiBuZXdsaW5lIHBhcnNpbmcgaW5jb25zaXN0ZW50LiBUaGlzIGJydXRlIGZvcmNlIG5vcm1hbGl6ZXMgdGhlIGlucHV0LlxuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXQgPSB0aGlzLmlucHV0LnJlcGxhY2UoL1xcclxcbnxbXFxyXFx1MjAyOFxcdTIwMjldL2csICdcXG4nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfY2hhcmFjdGVyID0gaW5kZW50X2NoYXJhY3RlcjtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9zdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9zaXplID0gaW5kZW50X3NpemU7XG4gICAgICAgICAgICAgICAgdGhpcy5icmFjZV9zdHlsZSA9IGJyYWNlX3N0eWxlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X2xldmVsID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBfbGluZV9sZW5ndGggPSB3cmFwX2xpbmVfbGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gMDsgLy9jb3VudCB0byBzZWUgaWYgd3JhcF9saW5lX2xlbmd0aCB3YXMgZXhjZWVkZWRcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbmRlbnRfc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X3N0cmluZyArPSB0aGlzLmluZGVudF9jaGFyYWN0ZXI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lID0gZnVuY3Rpb24oZm9yY2UsIGFycikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvcmNlIHx8IChhcnJbYXJyLmxlbmd0aCAtIDFdICE9PSAnXFxuJykpIHsgLy93ZSBtaWdodCB3YW50IHRoZSBleHRyYSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGFyclthcnIubGVuZ3RoIC0gMV0gIT09ICdcXG4nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyclthcnIubGVuZ3RoIC0gMV0gPSBydHJpbShhcnJbYXJyLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbmRlbnRfbGV2ZWw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGhpcy5pbmRlbnRfc3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ICs9IHRoaXMuaW5kZW50X3N0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludF90b2tlbiA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgcHJpbnRpbmcgaW5pdGlhbCB3aGl0ZXNwYWNlLlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc193aGl0ZXNwYWNlKHRleHQpICYmICF0aGlzLm91dHB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGV4dCB8fCB0ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCAmJiB0aGlzLm91dHB1dFt0aGlzLm91dHB1dC5sZW5ndGggLSAxXSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uKHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbHRyaW0odGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF90b2tlbl9yYXcodGV4dCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfdG9rZW5fcmF3ID0gZnVuY3Rpb24odGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBhcmUgZ29pbmcgdG8gcHJpbnQgbmV3bGluZXMsIHRydW5jYXRlIHRyYWlsaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIHdoaXRlc3BhY2UsIGFzIHRoZSBuZXdsaW5lcyB3aWxsIHJlcHJlc2VudCB0aGUgc3BhY2UuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5ld2xpbmVzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IHJ0cmltKHRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDEgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1bmZvcm1hdHRlZCB0YWdzIGNhbiBncmFiIG5ld2xpbmVzIGFzIHRoZWlyIGxhc3QgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaCh0ZXh0LnNsaWNlKDAsIC0xKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lKGZhbHNlLCB0aGlzLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2godGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRoaXMubmV3bGluZXM7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lKG4gPiAwLCB0aGlzLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdsaW5lcyA9IDA7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X2xldmVsKys7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMudW5pbmRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZW50X2xldmVsID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwtLTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKl9fX19fX19fX19fX19fX19fX19fXy0tLS0tLS0tLS0tLS0tLS0tLS0tX19fX19fX19fX19fX19fX19fX19fKi9cblxuICAgICAgICBtdWx0aV9wYXJzZXIgPSBuZXcgUGFyc2VyKCk7IC8vd3JhcHBpbmcgZnVuY3Rpb25zIFBhcnNlclxuICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRlcihodG1sX3NvdXJjZSwgaW5kZW50X2NoYXJhY3RlciwgaW5kZW50X3NpemUsIHdyYXBfbGluZV9sZW5ndGgsIGJyYWNlX3N0eWxlKTsgLy9pbml0aWFsaXplIHN0YXJ0aW5nIHZhbHVlc1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgdCA9IG11bHRpX3BhcnNlci5nZXRfdG9rZW4oKTtcbiAgICAgICAgICAgIG11bHRpX3BhcnNlci50b2tlbl90ZXh0ID0gdFswXTtcbiAgICAgICAgICAgIG11bHRpX3BhcnNlci50b2tlbl90eXBlID0gdFsxXTtcblxuICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci50b2tlbl90eXBlID09PSAnVEtfRU9GJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKG11bHRpX3BhcnNlci50b2tlbl90eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NUQVJUJzpcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLmluZGVudF9jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG11bHRpX3BhcnNlci5pbmRlbnRfYm9keV9pbm5lcl9odG1sIHx8ICFtdWx0aV9wYXJzZXIudG9rZW5fdGV4dC5tYXRjaCgvPGJvZHkoPzouKik+LykpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG11bHRpX3BhcnNlci5pbmRlbnRfaGVhZF9pbm5lcl9odG1sIHx8ICFtdWx0aV9wYXJzZXIudG9rZW5fdGV4dC5tYXRjaCgvPGhlYWQoPzouKik+LykpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5pbmRlbnRfY29udGVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnQ09OVEVOVCc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1RLX1RBR19TVFlMRSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NDUklQVCc6XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX0VORCc6XG4gICAgICAgICAgICAgICAgICAgIC8vUHJpbnQgbmV3IGxpbmUgb25seSBpZiB0aGUgdGFnIGhhcyBubyBjb250ZW50IGFuZCBoYXMgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci5sYXN0X3Rva2VuID09PSAnVEtfQ09OVEVOVCcgJiYgbXVsdGlfcGFyc2VyLmxhc3RfdGV4dCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWdfbmFtZSA9IChtdWx0aV9wYXJzZXIudG9rZW5fdGV4dC5tYXRjaCgvXFx3Ky8pIHx8IFtdKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWdfZXh0cmFjdGVkX2Zyb21fbGFzdF9vdXRwdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci5vdXRwdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnX2V4dHJhY3RlZF9mcm9tX2xhc3Rfb3V0cHV0ID0gbXVsdGlfcGFyc2VyLm91dHB1dFttdWx0aV9wYXJzZXIub3V0cHV0Lmxlbmd0aCAtIDFdLm1hdGNoKC8oPzo8fHt7IylcXHMqKFxcdyspLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnX2V4dHJhY3RlZF9mcm9tX2xhc3Rfb3V0cHV0ID09PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dFsxXSAhPT0gdGFnX25hbWUgJiYgIW11bHRpX3BhcnNlci5VdGlscy5pbl9hcnJheSh0YWdfZXh0cmFjdGVkX2Zyb21fbGFzdF9vdXRwdXRbMV0sIHVuZm9ybWF0dGVkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NJTkdMRSc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGFkZCBhIG5ld2xpbmUgYmVmb3JlIGVsZW1lbnRzIHRoYXQgc2hvdWxkIHJlbWFpbiB1bmZvcm1hdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ19jaGVjayA9IG11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC9eXFxzKjwoW2Etei1dKykvaSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGFnX2NoZWNrIHx8ICFtdWx0aV9wYXJzZXIuVXRpbHMuaW5fYXJyYXkodGFnX2NoZWNrWzFdLCB1bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfSEFORExFQkFSU19FTFNFJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGEgbmV3bGluZSBpZiBvcGVuaW5nIHt7I2lmfX0gdGFnIGlzIG9uIHRoZSBjdXJyZW50IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kSWZPbkN1cnJlbnRMaW5lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGxhc3RDaGVja2VkT3V0cHV0ID0gbXVsdGlfcGFyc2VyLm91dHB1dC5sZW5ndGggLSAxOyBsYXN0Q2hlY2tlZE91dHB1dCA+PSAwOyBsYXN0Q2hlY2tlZE91dHB1dC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLm91dHB1dFtsYXN0Q2hlY2tlZE91dHB1dF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIub3V0cHV0W2xhc3RDaGVja2VkT3V0cHV0XS5tYXRjaCgve3sjaWYvKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZElmT25DdXJyZW50TGluZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kSWZPbkN1cnJlbnRMaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci5pbmRlbnRfY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmluZGVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmluZGVudF9jb250ZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX0hBTkRMRUJBUlNfQ09NTUVOVCc6XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnVEFHJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfQ09OVEVOVCc6XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnVEFHJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfU1RZTEUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1RLX1NDUklQVCc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbXVsdGlfcGFyc2VyLnRva2VuX3RleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2JlYXV0aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0X2luZGVudF9sZXZlbCA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPT09ICdUS19TQ1JJUFQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2JlYXV0aWZpZXIgPSB0eXBlb2YganNfYmVhdXRpZnkgPT09ICdmdW5jdGlvbicgJiYganNfYmVhdXRpZnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG11bHRpX3BhcnNlci50b2tlbl90eXBlID09PSAnVEtfU1RZTEUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2JlYXV0aWZpZXIgPSB0eXBlb2YgY3NzX2JlYXV0aWZ5ID09PSAnZnVuY3Rpb24nICYmIGNzc19iZWF1dGlmeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZW50X3NjcmlwdHMgPT09IFwia2VlcFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0X2luZGVudF9sZXZlbCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaW5kZW50X3NjcmlwdHMgPT09IFwic2VwYXJhdGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdF9pbmRlbnRfbGV2ZWwgPSAtbXVsdGlfcGFyc2VyLmluZGVudF9sZXZlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGVudGF0aW9uID0gbXVsdGlfcGFyc2VyLmdldF9mdWxsX2luZGVudChzY3JpcHRfaW5kZW50X2xldmVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfYmVhdXRpZmllcikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgQmVhdXRpZmllciBpZiBhdmFsaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgQ2hpbGRfb3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVvbCA9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hpbGRfb3B0aW9ucy5wcm90b3R5cGUgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZF9vcHRpb25zID0gbmV3IENoaWxkX29wdGlvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gX2JlYXV0aWZpZXIodGV4dC5yZXBsYWNlKC9eXFxzKi8sIGluZGVudGF0aW9uKSwgY2hpbGRfb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbXBseSBpbmRlbnQgdGhlIHN0cmluZyBvdGhlcndpc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2hpdGUgPSB0ZXh0Lm1hdGNoKC9eXFxzKi8pWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbGV2ZWwgPSB3aGl0ZS5tYXRjaCgvW15cXG5cXHJdKiQvKVswXS5zcGxpdChtdWx0aV9wYXJzZXIuaW5kZW50X3N0cmluZykubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVpbmRlbnQgPSBtdWx0aV9wYXJzZXIuZ2V0X2Z1bGxfaW5kZW50KHNjcmlwdF9pbmRlbnRfbGV2ZWwgLSBfbGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15cXHMqLywgaW5kZW50YXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHJcXG58XFxyfFxcbi9nLCAnXFxuJyArIHJlaW5kZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbl9yYXcodGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUodHJ1ZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdUQUcnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBzaG91bGQgbm90IGJlIGdldHRpbmcgaGVyZSBidXQgd2UgZG9uJ3Qgd2FudCB0byBkcm9wIGlucHV0IG9uIHRoZSBmbG9vclxuICAgICAgICAgICAgICAgICAgICAvLyBKdXN0IG91dHB1dCB0aGUgdGV4dCBhbmQgbW92ZSBvblxuICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3RleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmxhc3RfdG9rZW4gPSBtdWx0aV9wYXJzZXIudG9rZW5fdHlwZTtcbiAgICAgICAgICAgIG11bHRpX3BhcnNlci5sYXN0X3RleHQgPSBtdWx0aV9wYXJzZXIudG9rZW5fdGV4dDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3dlZXRfY29kZSA9IG11bHRpX3BhcnNlci5vdXRwdXQuam9pbignJykucmVwbGFjZSgvW1xcclxcblxcdCBdKyQvLCAnJyk7XG5cbiAgICAgICAgLy8gZXN0YWJsaXNoIGVuZF93aXRoX25ld2xpbmVcbiAgICAgICAgaWYgKGVuZF93aXRoX25ld2xpbmUpIHtcbiAgICAgICAgICAgIHN3ZWV0X2NvZGUgKz0gJ1xcbic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZW9sICE9PSAnXFxuJykge1xuICAgICAgICAgICAgc3dlZXRfY29kZSA9IHN3ZWV0X2NvZGUucmVwbGFjZSgvW1xcbl0vZywgZW9sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzd2VldF9jb2RlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCIuL2JlYXV0aWZ5XCIsIFwiLi9iZWF1dGlmeS1jc3NcIl0sIGZ1bmN0aW9uKHJlcXVpcmVhbWQpIHtcbiAgICAgICAgICAgIHZhciBqc19iZWF1dGlmeSA9IHJlcXVpcmVhbWQoXCIuL2JlYXV0aWZ5XCIpO1xuICAgICAgICAgICAgdmFyIGNzc19iZWF1dGlmeSA9IHJlcXVpcmVhbWQoXCIuL2JlYXV0aWZ5LWNzc1wiKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sX2JlYXV0aWZ5OiBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucywganNfYmVhdXRpZnkuanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeS5jc3NfYmVhdXRpZnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gQWRkIHN1cHBvcnQgZm9yIENvbW1vbkpTLiBKdXN0IHB1dCB0aGlzIGZpbGUgc29tZXdoZXJlIG9uIHlvdXIgcmVxdWlyZS5wYXRoc1xuICAgICAgICAvLyBhbmQgeW91IHdpbGwgYmUgYWJsZSB0byBgdmFyIGh0bWxfYmVhdXRpZnkgPSByZXF1aXJlKFwiYmVhdXRpZnlcIikuaHRtbF9iZWF1dGlmeWAuXG4gICAgICAgIHZhciBqc19iZWF1dGlmeSA9IHJlcXVpcmUoJy4vYmVhdXRpZnkuanMnKTtcbiAgICAgICAgdmFyIGNzc19iZWF1dGlmeSA9IHJlcXVpcmUoJy4vYmVhdXRpZnktY3NzLmpzJyk7XG5cbiAgICAgICAgZXhwb3J0cy5odG1sX2JlYXV0aWZ5ID0gZnVuY3Rpb24oaHRtbF9zb3VyY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHlsZV9odG1sKGh0bWxfc291cmNlLCBvcHRpb25zLCBqc19iZWF1dGlmeS5qc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LmNzc19iZWF1dGlmeSk7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIElmIHdlJ3JlIHJ1bm5pbmcgYSB3ZWIgcGFnZSBhbmQgZG9uJ3QgaGF2ZSBlaXRoZXIgb2YgdGhlIGFib3ZlLCBhZGQgb3VyIG9uZSBnbG9iYWxcbiAgICAgICAgd2luZG93Lmh0bWxfYmVhdXRpZnkgPSBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIHdpbmRvdy5qc19iZWF1dGlmeSwgd2luZG93LmNzc19iZWF1dGlmeSk7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGV2ZW4gaGF2ZSB3aW5kb3csIHRyeSBnbG9iYWwuXG4gICAgICAgIGdsb2JhbC5odG1sX2JlYXV0aWZ5ID0gZnVuY3Rpb24oaHRtbF9zb3VyY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHlsZV9odG1sKGh0bWxfc291cmNlLCBvcHRpb25zLCBnbG9iYWwuanNfYmVhdXRpZnksIGdsb2JhbC5jc3NfYmVhdXRpZnkpO1xuICAgICAgICB9O1xuICAgIH1cblxufSgpKTsiLCIvKmpzaGludCBjdXJseTp0cnVlLCBlcWVxZXE6dHJ1ZSwgbGF4YnJlYWs6dHJ1ZSwgbm9lbXB0eTpmYWxzZSAqL1xuLypcblxuICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuICBDb3B5cmlnaHQgKGMpIDIwMDctMjAxNyBFaW5hciBMaWVsbWFuaXMsIExpYW0gTmV3bWFuLCBhbmQgY29udHJpYnV0b3JzLlxuXG4gIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uXG4gIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzXG4gICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbixcbiAgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSxcbiAgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSxcbiAgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcbiAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cbiAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlNcbiAgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4gIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXG4gIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAgU09GVFdBUkUuXG5cbiBKUyBCZWF1dGlmaWVyXG4tLS0tLS0tLS0tLS0tLS1cblxuXG4gIFdyaXR0ZW4gYnkgRWluYXIgTGllbG1hbmlzLCA8ZWluYXJAanNiZWF1dGlmaWVyLm9yZz5cbiAgICAgIGh0dHA6Ly9qc2JlYXV0aWZpZXIub3JnL1xuXG4gIE9yaWdpbmFsbHkgY29udmVydGVkIHRvIGphdmFzY3JpcHQgYnkgVml0YWwsIDx2aXRhbDc2QGdtYWlsLmNvbT5cbiAgXCJFbmQgYnJhY2VzIG9uIG93biBsaW5lXCIgYWRkZWQgYnkgQ2hyaXMgSi4gU2h1bGwsIDxjaHJpc2pzaHVsbEBnbWFpbC5jb20+XG4gIFBhcnNpbmcgaW1wcm92ZW1lbnRzIGZvciBicmFjZS1sZXNzIHN0YXRlbWVudHMgYnkgTGlhbSBOZXdtYW4gPGJpdHdpc2VtYW5AZ21haWwuY29tPlxuXG5cbiAgVXNhZ2U6XG4gICAganNfYmVhdXRpZnkoanNfc291cmNlX3RleHQpO1xuICAgIGpzX2JlYXV0aWZ5KGpzX3NvdXJjZV90ZXh0LCBvcHRpb25zKTtcblxuICBUaGUgb3B0aW9ucyBhcmU6XG4gICAgaW5kZW50X3NpemUgKGRlZmF1bHQgNCkgICAgICAgICAgLSBpbmRlbnRhdGlvbiBzaXplLFxuICAgIGluZGVudF9jaGFyIChkZWZhdWx0IHNwYWNlKSAgICAgIC0gY2hhcmFjdGVyIHRvIGluZGVudCB3aXRoLFxuICAgIHByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IHRydWUpIC0gd2hldGhlciBleGlzdGluZyBsaW5lIGJyZWFrcyBzaG91bGQgYmUgcHJlc2VydmVkLFxuICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyAoZGVmYXVsdCB1bmxpbWl0ZWQpIC0gbWF4aW11bSBudW1iZXIgb2YgbGluZSBicmVha3MgdG8gYmUgcHJlc2VydmVkIGluIG9uZSBjaHVuayxcblxuICAgIGpzbGludF9oYXBweSAoZGVmYXVsdCBmYWxzZSkgLSBpZiB0cnVlLCB0aGVuIGpzbGludC1zdHJpY3RlciBtb2RlIGlzIGVuZm9yY2VkLlxuXG4gICAgICAgICAgICBqc2xpbnRfaGFwcHkgICAgICAgICFqc2xpbnRfaGFwcHlcbiAgICAgICAgICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgZnVuY3Rpb24gKCkgICAgICAgICBmdW5jdGlvbigpXG5cbiAgICAgICAgICAgIHN3aXRjaCAoKSB7ICAgICAgICAgc3dpdGNoKCkge1xuICAgICAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgYnJlYWs7ICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICB9XG5cbiAgICBzcGFjZV9hZnRlcl9hbm9uX2Z1bmN0aW9uIChkZWZhdWx0IGZhbHNlKSAtIHNob3VsZCB0aGUgc3BhY2UgYmVmb3JlIGFuIGFub255bW91cyBmdW5jdGlvbidzIHBhcmVucyBiZSBhZGRlZCwgXCJmdW5jdGlvbigpXCIgdnMgXCJmdW5jdGlvbiAoKVwiLFxuICAgICAgICAgIE5PVEU6IFRoaXMgb3B0aW9uIGlzIG92ZXJyaWRlbiBieSBqc2xpbnRfaGFwcHkgKGkuZS4gaWYganNsaW50X2hhcHB5IGlzIHRydWUsIHNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24gaXMgdHJ1ZSBieSBkZXNpZ24pXG5cbiAgICBicmFjZV9zdHlsZSAoZGVmYXVsdCBcImNvbGxhcHNlXCIpIC0gXCJjb2xsYXBzZVwiIHwgXCJleHBhbmRcIiB8IFwiZW5kLWV4cGFuZFwiIHwgXCJub25lXCIgfCBhbnkgb2YgdGhlIGZvcm1lciArIFwiLHByZXNlcnZlLWlubGluZVwiXG4gICAgICAgICAgICBwdXQgYnJhY2VzIG9uIHRoZSBzYW1lIGxpbmUgYXMgY29udHJvbCBzdGF0ZW1lbnRzIChkZWZhdWx0KSwgb3IgcHV0IGJyYWNlcyBvbiBvd24gbGluZSAoQWxsbWFuIC8gQU5TSSBzdHlsZSksIG9yIGp1c3QgcHV0IGVuZCBicmFjZXMgb24gb3duIGxpbmUsIG9yIGF0dGVtcHQgdG8ga2VlcCB0aGVtIHdoZXJlIHRoZXkgYXJlLlxuICAgICAgICAgICAgcHJlc2VydmUtaW5saW5lIHdpbGwgdHJ5IHRvIHByZXNlcnZlIGlubGluZSBibG9ja3Mgb2YgY3VybHkgYnJhY2VzXG5cbiAgICBzcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwgKGRlZmF1bHQgdHJ1ZSkgLSBzaG91bGQgdGhlIHNwYWNlIGJlZm9yZSBjb25kaXRpb25hbCBzdGF0ZW1lbnQgYmUgYWRkZWQsIFwiaWYodHJ1ZSlcIiB2cyBcImlmICh0cnVlKVwiLFxuXG4gICAgdW5lc2NhcGVfc3RyaW5ncyAoZGVmYXVsdCBmYWxzZSkgLSBzaG91bGQgcHJpbnRhYmxlIGNoYXJhY3RlcnMgaW4gc3RyaW5ncyBlbmNvZGVkIGluIFxceE5OIG5vdGF0aW9uIGJlIHVuZXNjYXBlZCwgXCJleGFtcGxlXCIgdnMgXCJcXHg2NVxceDc4XFx4NjFcXHg2ZFxceDcwXFx4NmNcXHg2NVwiXG5cbiAgICB3cmFwX2xpbmVfbGVuZ3RoIChkZWZhdWx0IHVubGltaXRlZCkgLSBsaW5lcyBzaG91bGQgd3JhcCBhdCBuZXh0IG9wcG9ydHVuaXR5IGFmdGVyIHRoaXMgbnVtYmVyIG9mIGNoYXJhY3RlcnMuXG4gICAgICAgICAgTk9URTogVGhpcyBpcyBub3QgYSBoYXJkIGxpbWl0LiBMaW5lcyB3aWxsIGNvbnRpbnVlIHVudGlsIGEgcG9pbnQgd2hlcmUgYSBuZXdsaW5lIHdvdWxkXG4gICAgICAgICAgICAgICAgYmUgcHJlc2VydmVkIGlmIGl0IHdlcmUgcHJlc2VudC5cblxuICAgIGVuZF93aXRoX25ld2xpbmUgKGRlZmF1bHQgZmFsc2UpICAtIGVuZCBvdXRwdXQgd2l0aCBhIG5ld2xpbmVcblxuXG4gICAgZS5nXG5cbiAgICBqc19iZWF1dGlmeShqc19zb3VyY2VfdGV4dCwge1xuICAgICAgJ2luZGVudF9zaXplJzogMSxcbiAgICAgICdpbmRlbnRfY2hhcic6ICdcXHQnXG4gICAgfSk7XG5cbiovXG5cbi8vIE9iamVjdC52YWx1ZXMgcG9seWZpbGwgZm91bmQgaGVyZTpcbi8vIGh0dHA6Ly90b2tlbnBvc3RzLmJsb2dzcG90LmNvbS5hdS8yMDEyLzA0L2phdmFzY3JpcHQtb2JqZWN0a2V5cy1icm93c2VyLmh0bWxcbmlmICghT2JqZWN0LnZhbHVlcykge1xuICAgIE9iamVjdC52YWx1ZXMgPSBmdW5jdGlvbihvKSB7XG4gICAgICAgIGlmIChvICE9PSBPYmplY3QobykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC52YWx1ZXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrID0gW10sXG4gICAgICAgICAgICBwO1xuICAgICAgICBmb3IgKHAgaW4gbykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkge1xuICAgICAgICAgICAgICAgIGsucHVzaChvW3BdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaztcbiAgICB9O1xufVxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBtZXJnZU9wdHMoYWxsT3B0aW9ucywgdGFyZ2V0VHlwZSkge1xuICAgICAgICB2YXIgZmluYWxPcHRzID0ge307XG4gICAgICAgIHZhciBuYW1lO1xuXG4gICAgICAgIGZvciAobmFtZSBpbiBhbGxPcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gdGFyZ2V0VHlwZSkge1xuICAgICAgICAgICAgICAgIGZpbmFsT3B0c1tuYW1lXSA9IGFsbE9wdGlvbnNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL21lcmdlIGluIHRoZSBwZXIgdHlwZSBzZXR0aW5ncyBmb3IgdGhlIHRhcmdldFR5cGVcbiAgICAgICAgaWYgKHRhcmdldFR5cGUgaW4gYWxsT3B0aW9ucykge1xuICAgICAgICAgICAgZm9yIChuYW1lIGluIGFsbE9wdGlvbnNbdGFyZ2V0VHlwZV0pIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9wdHNbbmFtZV0gPSBhbGxPcHRpb25zW3RhcmdldFR5cGVdW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaW5hbE9wdHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ganNfYmVhdXRpZnkoanNfc291cmNlX3RleHQsIG9wdGlvbnMpIHtcblxuICAgICAgICB2YXIgYWNvcm4gPSB7fTtcbiAgICAgICAgKGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiAgICAgICAgICAgIC8qIGpzaGludCBjdXJseTogZmFsc2UgKi9cbiAgICAgICAgICAgIC8vIFRoaXMgc2VjdGlvbiBvZiBjb2RlIGlzIHRha2VuIGZyb20gYWNvcm4uXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWNvcm4gd2FzIHdyaXR0ZW4gYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgcmVsZWFzZWQgdW5kZXIgYW4gTUlUXG4gICAgICAgICAgICAvLyBsaWNlbnNlLiBUaGUgVW5pY29kZSByZWdleHBzIChmb3IgaWRlbnRpZmllcnMgYW5kIHdoaXRlc3BhY2UpIHdlcmVcbiAgICAgICAgICAgIC8vIHRha2VuIGZyb20gW0VzcHJpbWFdKGh0dHA6Ly9lc3ByaW1hLm9yZykgYnkgQXJpeWEgSGlkYXlhdC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBHaXQgcmVwb3NpdG9yaWVzIGZvciBBY29ybiBhcmUgYXZhaWxhYmxlIGF0XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICAgIGh0dHA6Ly9tYXJpam5oYXZlcmJla2UubmwvZ2l0L2Fjb3JuXG4gICAgICAgICAgICAvLyAgICAgaHR0cHM6Ly9naXRodWIuY29tL21hcmlqbmgvYWNvcm4uZ2l0XG5cbiAgICAgICAgICAgIC8vICMjIENoYXJhY3RlciBjYXRlZ29yaWVzXG5cbiAgICAgICAgICAgIC8vIEJpZyB1Z2x5IHJlZ3VsYXIgZXhwcmVzc2lvbnMgdGhhdCBtYXRjaCBjaGFyYWN0ZXJzIGluIHRoZVxuICAgICAgICAgICAgLy8gd2hpdGVzcGFjZSwgaWRlbnRpZmllciwgYW5kIGlkZW50aWZpZXItc3RhcnQgY2F0ZWdvcmllcy4gVGhlc2VcbiAgICAgICAgICAgIC8vIGFyZSBvbmx5IGFwcGxpZWQgd2hlbiBhIGNoYXJhY3RlciBpcyBmb3VuZCB0byBhY3R1YWxseSBoYXZlIGFcbiAgICAgICAgICAgIC8vIGNvZGUgcG9pbnQgYWJvdmUgMTI4LlxuXG4gICAgICAgICAgICB2YXIgbm9uQVNDSUl3aGl0ZXNwYWNlID0gL1tcXHUxNjgwXFx1MTgwZVxcdTIwMDAtXFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdLzsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyA9IFwiXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYyMC1cXHUwNjRhXFx1MDY2ZVxcdTA2NmZcXHUwNjcxLVxcdTA2ZDNcXHUwNmQ1XFx1MDZlNVxcdTA2ZTZcXHUwNmVlXFx1MDZlZlxcdTA2ZmEtXFx1MDZmY1xcdTA2ZmZcXHUwNzEwXFx1MDcxMi1cXHUwNzJmXFx1MDc0ZC1cXHUwN2E1XFx1MDdiMVxcdTA3Y2EtXFx1MDdlYVxcdTA3ZjRcXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgxNVxcdTA4MWFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3ZlxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGE1OS1cXHUwYTVjXFx1MGE1ZVxcdTBhNzItXFx1MGE3NFxcdTBhODUtXFx1MGE4ZFxcdTBhOGYtXFx1MGE5MVxcdTBhOTMtXFx1MGFhOFxcdTBhYWEtXFx1MGFiMFxcdTBhYjJcXHUwYWIzXFx1MGFiNS1cXHUwYWI5XFx1MGFiZFxcdTBhZDBcXHUwYWUwXFx1MGFlMVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZFxcdTBjNThcXHUwYzU5XFx1MGM2MFxcdTBjNjFcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNjBcXHUwZDYxXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4NS1cXHUwZDk2XFx1MGQ5YS1cXHUwZGIxXFx1MGRiMy1cXHUwZGJiXFx1MGRiZFxcdTBkYzAtXFx1MGRjNlxcdTBlMDEtXFx1MGUzMFxcdTBlMzJcXHUwZTMzXFx1MGU0MC1cXHUwZTQ2XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmMFxcdTE3MDAtXFx1MTcwY1xcdTE3MGUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YzEtXFx1MTljN1xcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGJcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmMVxcdTFjZjVcXHUxY2Y2XFx1MWQwMC1cXHUxZGJmXFx1MWUwMC1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwNzFcXHUyMDdmXFx1MjA5MC1cXHUyMDljXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNlZVxcdTJjZjJcXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ4MC1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjk3XFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE4MC1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYmMwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNcIjtcbiAgICAgICAgICAgIHZhciBub25BU0NJSWlkZW50aWZpZXJDaGFycyA9IFwiXFx1MDMwMC1cXHUwMzZmXFx1MDQ4My1cXHUwNDg3XFx1MDU5MS1cXHUwNWJkXFx1MDViZlxcdTA1YzFcXHUwNWMyXFx1MDVjNFxcdTA1YzVcXHUwNWM3XFx1MDYxMC1cXHUwNjFhXFx1MDYyMC1cXHUwNjQ5XFx1MDY3Mi1cXHUwNmQzXFx1MDZlNy1cXHUwNmU4XFx1MDZmYi1cXHUwNmZjXFx1MDczMC1cXHUwNzRhXFx1MDgwMC1cXHUwODE0XFx1MDgxYi1cXHUwODIzXFx1MDgyNS1cXHUwODI3XFx1MDgyOS1cXHUwODJkXFx1MDg0MC1cXHUwODU3XFx1MDhlNC1cXHUwOGZlXFx1MDkwMC1cXHUwOTAzXFx1MDkzYS1cXHUwOTNjXFx1MDkzZS1cXHUwOTRmXFx1MDk1MS1cXHUwOTU3XFx1MDk2Mi1cXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDlkN1xcdTA5ZGYtXFx1MDllMFxcdTBhMDEtXFx1MGEwM1xcdTBhM2NcXHUwYTNlLVxcdTBhNDJcXHUwYTQ3XFx1MGE0OFxcdTBhNGItXFx1MGE0ZFxcdTBhNTFcXHUwYTY2LVxcdTBhNzFcXHUwYTc1XFx1MGE4MS1cXHUwYTgzXFx1MGFiY1xcdTBhYmUtXFx1MGFjNVxcdTBhYzctXFx1MGFjOVxcdTBhY2ItXFx1MGFjZFxcdTBhZTItXFx1MGFlM1xcdTBhZTYtXFx1MGFlZlxcdTBiMDEtXFx1MGIwM1xcdTBiM2NcXHUwYjNlLVxcdTBiNDRcXHUwYjQ3XFx1MGI0OFxcdTBiNGItXFx1MGI0ZFxcdTBiNTZcXHUwYjU3XFx1MGI1Zi1cXHUwYjYwXFx1MGI2Ni1cXHUwYjZmXFx1MGI4MlxcdTBiYmUtXFx1MGJjMlxcdTBiYzYtXFx1MGJjOFxcdTBiY2EtXFx1MGJjZFxcdTBiZDdcXHUwYmU2LVxcdTBiZWZcXHUwYzAxLVxcdTBjMDNcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjItXFx1MGM2M1xcdTBjNjYtXFx1MGM2ZlxcdTBjODJcXHUwYzgzXFx1MGNiY1xcdTBjYmUtXFx1MGNjNFxcdTBjYzYtXFx1MGNjOFxcdTBjY2EtXFx1MGNjZFxcdTBjZDVcXHUwY2Q2XFx1MGNlMi1cXHUwY2UzXFx1MGNlNi1cXHUwY2VmXFx1MGQwMlxcdTBkMDNcXHUwZDQ2LVxcdTBkNDhcXHUwZDU3XFx1MGQ2Mi1cXHUwZDYzXFx1MGQ2Ni1cXHUwZDZmXFx1MGQ4MlxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZjJcXHUwZGYzXFx1MGUzNC1cXHUwZTNhXFx1MGU0MC1cXHUwZTQ1XFx1MGU1MC1cXHUwZTU5XFx1MGViNC1cXHUwZWI5XFx1MGVjOC1cXHUwZWNkXFx1MGVkMC1cXHUwZWQ5XFx1MGYxOFxcdTBmMTlcXHUwZjIwLVxcdTBmMjlcXHUwZjM1XFx1MGYzN1xcdTBmMzlcXHUwZjQxLVxcdTBmNDdcXHUwZjcxLVxcdTBmODRcXHUwZjg2LVxcdTBmODdcXHUwZjhkLVxcdTBmOTdcXHUwZjk5LVxcdTBmYmNcXHUwZmM2XFx1MTAwMC1cXHUxMDI5XFx1MTA0MC1cXHUxMDQ5XFx1MTA2Ny1cXHUxMDZkXFx1MTA3MS1cXHUxMDc0XFx1MTA4Mi1cXHUxMDhkXFx1MTA4Zi1cXHUxMDlkXFx1MTM1ZC1cXHUxMzVmXFx1MTcwZS1cXHUxNzEwXFx1MTcyMC1cXHUxNzMwXFx1MTc0MC1cXHUxNzUwXFx1MTc3MlxcdTE3NzNcXHUxNzgwLVxcdTE3YjJcXHUxN2RkXFx1MTdlMC1cXHUxN2U5XFx1MTgwYi1cXHUxODBkXFx1MTgxMC1cXHUxODE5XFx1MTkyMC1cXHUxOTJiXFx1MTkzMC1cXHUxOTNiXFx1MTk1MS1cXHUxOTZkXFx1MTliMC1cXHUxOWMwXFx1MTljOC1cXHUxOWM5XFx1MTlkMC1cXHUxOWQ5XFx1MWEwMC1cXHUxYTE1XFx1MWEyMC1cXHUxYTUzXFx1MWE2MC1cXHUxYTdjXFx1MWE3Zi1cXHUxYTg5XFx1MWE5MC1cXHUxYTk5XFx1MWI0Ni1cXHUxYjRiXFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWJiMC1cXHUxYmI5XFx1MWJlNi1cXHUxYmYzXFx1MWMwMC1cXHUxYzIyXFx1MWM0MC1cXHUxYzQ5XFx1MWM1Yi1cXHUxYzdkXFx1MWNkMC1cXHUxY2QyXFx1MWQwMC1cXHUxZGJlXFx1MWUwMS1cXHUxZjE1XFx1MjAwY1xcdTIwMGRcXHUyMDNmXFx1MjA0MFxcdTIwNTRcXHUyMGQwLVxcdTIwZGNcXHUyMGUxXFx1MjBlNS1cXHUyMGYwXFx1MmQ4MS1cXHUyZDk2XFx1MmRlMC1cXHUyZGZmXFx1MzAyMS1cXHUzMDI4XFx1MzA5OVxcdTMwOWFcXHVhNjQwLVxcdWE2NmRcXHVhNjc0LVxcdWE2N2RcXHVhNjlmXFx1YTZmMC1cXHVhNmYxXFx1YTdmOC1cXHVhODAwXFx1YTgwNlxcdWE4MGJcXHVhODIzLVxcdWE4MjdcXHVhODgwLVxcdWE4ODFcXHVhOGI0LVxcdWE4YzRcXHVhOGQwLVxcdWE4ZDlcXHVhOGYzLVxcdWE4ZjdcXHVhOTAwLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTMwLVxcdWE5NDVcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhYTAwLVxcdWFhMjdcXHVhYTQwLVxcdWFhNDFcXHVhYTRjLVxcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTdiXFx1YWFlMC1cXHVhYWU5XFx1YWFmMi1cXHVhYWYzXFx1YWJjMC1cXHVhYmUxXFx1YWJlY1xcdWFiZWRcXHVhYmYwLVxcdWFiZjlcXHVmYjIwLVxcdWZiMjhcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMjZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZcIjtcbiAgICAgICAgICAgIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydCA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgXCJdXCIpO1xuICAgICAgICAgICAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllciA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgKyBcIl1cIik7XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgYSBzaW5nbGUgY2hhcmFjdGVyIGRlbm90ZXMgYSBuZXdsaW5lLlxuXG4gICAgICAgICAgICBleHBvcnRzLm5ld2xpbmUgPSAvW1xcblxcclxcdTIwMjhcXHUyMDI5XS87XG5cbiAgICAgICAgICAgIC8vIE1hdGNoZXMgYSB3aG9sZSBsaW5lIGJyZWFrICh3aGVyZSBDUkxGIGlzIGNvbnNpZGVyZWQgYSBzaW5nbGVcbiAgICAgICAgICAgIC8vIGxpbmUgYnJlYWspLiBVc2VkIHRvIGNvdW50IGxpbmVzLlxuXG4gICAgICAgICAgICAvLyBpbiBqYXZhc2NyaXB0LCB0aGVzZSB0d28gZGlmZmVyXG4gICAgICAgICAgICAvLyBpbiBweXRob24gdGhleSBhcmUgdGhlIHNhbWUsIGRpZmZlcmVudCBtZXRob2RzIGFyZSBjYWxsZWQgb24gdGhlbVxuICAgICAgICAgICAgZXhwb3J0cy5saW5lQnJlYWsgPSBuZXcgUmVnRXhwKCdcXHJcXG58JyArIGV4cG9ydHMubmV3bGluZS5zb3VyY2UpO1xuICAgICAgICAgICAgZXhwb3J0cy5hbGxMaW5lQnJlYWtzID0gbmV3IFJlZ0V4cChleHBvcnRzLmxpbmVCcmVhay5zb3VyY2UsICdnJyk7XG5cblxuICAgICAgICAgICAgLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGNvZGUgc3RhcnRzIGFuIGlkZW50aWZpZXIuXG5cbiAgICAgICAgICAgIGV4cG9ydHMuaXNJZGVudGlmaWVyU3RhcnQgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gcGVybWl0ICQgKDM2KSBhbmQgQCAoNjQpLiBAIGlzIHVzZWQgaW4gRVM3IGRlY29yYXRvcnMuXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA2NSkgcmV0dXJuIGNvZGUgPT09IDM2IHx8IGNvZGUgPT09IDY0O1xuICAgICAgICAgICAgICAgIC8vIDY1IHRocm91Z2ggOTEgYXJlIHVwcGVyY2FzZSBsZXR0ZXJzLlxuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgOTEpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIHBlcm1pdCBfICg5NSkuXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgICAgICAgICAgICAgIC8vIDk3IHRocm91Z2ggMTIzIGFyZSBsb3dlcmNhc2UgbGV0dGVycy5cbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDEyMykgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGlzIHBhcnQgb2YgYW4gaWRlbnRpZmllci5cblxuICAgICAgICAgICAgZXhwb3J0cy5pc0lkZW50aWZpZXJDaGFyID0gZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgNDgpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDU4KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgICAgICAgICAgICAgIGlmIChjb2RlIDwgMTIzKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllci50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoYWNvcm4pO1xuICAgICAgICAvKiBqc2hpbnQgY3VybHk6IHRydWUgKi9cblxuICAgICAgICBmdW5jdGlvbiBpbl9hcnJheSh3aGF0LCBhcnIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFycltpXSA9PT0gd2hhdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0cmltKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGx0cmltKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnJlcGxhY2UoL15cXHMrL2csICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZ1bmN0aW9uIHJ0cmltKHMpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiBzLnJlcGxhY2UoL1xccyskL2csICcnKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNhbml0aXplT3BlcmF0b3JQb3NpdGlvbihvcFBvc2l0aW9uKSB7XG4gICAgICAgICAgICBvcFBvc2l0aW9uID0gb3BQb3NpdGlvbiB8fCBPUEVSQVRPUl9QT1NJVElPTi5iZWZvcmVfbmV3bGluZTtcblxuICAgICAgICAgICAgdmFyIHZhbGlkUG9zaXRpb25WYWx1ZXMgPSBPYmplY3QudmFsdWVzKE9QRVJBVE9SX1BPU0lUSU9OKTtcblxuICAgICAgICAgICAgaWYgKCFpbl9hcnJheShvcFBvc2l0aW9uLCB2YWxpZFBvc2l0aW9uVmFsdWVzKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgT3B0aW9uIFZhbHVlOiBUaGUgb3B0aW9uICdvcGVyYXRvcl9wb3NpdGlvbicgbXVzdCBiZSBvbmUgb2YgdGhlIGZvbGxvd2luZyB2YWx1ZXNcXG5cIiArXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkUG9zaXRpb25WYWx1ZXMgK1xuICAgICAgICAgICAgICAgICAgICBcIlxcbllvdSBwYXNzZWQgaW46ICdcIiArIG9wUG9zaXRpb24gKyBcIidcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvcFBvc2l0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIE9QRVJBVE9SX1BPU0lUSU9OID0ge1xuICAgICAgICAgICAgYmVmb3JlX25ld2xpbmU6ICdiZWZvcmUtbmV3bGluZScsXG4gICAgICAgICAgICBhZnRlcl9uZXdsaW5lOiAnYWZ0ZXItbmV3bGluZScsXG4gICAgICAgICAgICBwcmVzZXJ2ZV9uZXdsaW5lOiAncHJlc2VydmUtbmV3bGluZScsXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIE9QRVJBVE9SX1BPU0lUSU9OX0JFRk9SRV9PUl9QUkVTRVJWRSA9IFtPUEVSQVRPUl9QT1NJVElPTi5iZWZvcmVfbmV3bGluZSwgT1BFUkFUT1JfUE9TSVRJT04ucHJlc2VydmVfbmV3bGluZV07XG5cbiAgICAgICAgdmFyIE1PREUgPSB7XG4gICAgICAgICAgICBCbG9ja1N0YXRlbWVudDogJ0Jsb2NrU3RhdGVtZW50JywgLy8gJ0JMT0NLJ1xuICAgICAgICAgICAgU3RhdGVtZW50OiAnU3RhdGVtZW50JywgLy8gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgIE9iamVjdExpdGVyYWw6ICdPYmplY3RMaXRlcmFsJywgLy8gJ09CSkVDVCcsXG4gICAgICAgICAgICBBcnJheUxpdGVyYWw6ICdBcnJheUxpdGVyYWwnLCAvLydbRVhQUkVTU0lPTl0nLFxuICAgICAgICAgICAgRm9ySW5pdGlhbGl6ZXI6ICdGb3JJbml0aWFsaXplcicsIC8vJyhGT1ItRVhQUkVTU0lPTiknLFxuICAgICAgICAgICAgQ29uZGl0aW9uYWw6ICdDb25kaXRpb25hbCcsIC8vJyhDT05ELUVYUFJFU1NJT04pJyxcbiAgICAgICAgICAgIEV4cHJlc3Npb246ICdFeHByZXNzaW9uJyAvLycoRVhQUkVTU0lPTiknXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gQmVhdXRpZmllcihqc19zb3VyY2VfdGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgICAgICB2YXIgb3V0cHV0O1xuICAgICAgICAgICAgdmFyIHRva2VucyA9IFtdLFxuICAgICAgICAgICAgICAgIHRva2VuX3BvcztcbiAgICAgICAgICAgIHZhciBUb2tlbml6ZXI7XG4gICAgICAgICAgICB2YXIgY3VycmVudF90b2tlbjtcbiAgICAgICAgICAgIHZhciBsYXN0X3R5cGUsIGxhc3RfbGFzdF90ZXh0LCBpbmRlbnRfc3RyaW5nO1xuICAgICAgICAgICAgdmFyIGZsYWdzLCBwcmV2aW91c19mbGFncywgZmxhZ19zdG9yZTtcbiAgICAgICAgICAgIHZhciBwcmVmaXg7XG5cbiAgICAgICAgICAgIHZhciBoYW5kbGVycywgb3B0O1xuICAgICAgICAgICAgdmFyIGJhc2VJbmRlbnRTdHJpbmcgPSAnJztcblxuICAgICAgICAgICAgaGFuZGxlcnMgPSB7XG4gICAgICAgICAgICAgICAgJ1RLX1NUQVJUX0VYUFInOiBoYW5kbGVfc3RhcnRfZXhwcixcbiAgICAgICAgICAgICAgICAnVEtfRU5EX0VYUFInOiBoYW5kbGVfZW5kX2V4cHIsXG4gICAgICAgICAgICAgICAgJ1RLX1NUQVJUX0JMT0NLJzogaGFuZGxlX3N0YXJ0X2Jsb2NrLFxuICAgICAgICAgICAgICAgICdUS19FTkRfQkxPQ0snOiBoYW5kbGVfZW5kX2Jsb2NrLFxuICAgICAgICAgICAgICAgICdUS19XT1JEJzogaGFuZGxlX3dvcmQsXG4gICAgICAgICAgICAgICAgJ1RLX1JFU0VSVkVEJzogaGFuZGxlX3dvcmQsXG4gICAgICAgICAgICAgICAgJ1RLX1NFTUlDT0xPTic6IGhhbmRsZV9zZW1pY29sb24sXG4gICAgICAgICAgICAgICAgJ1RLX1NUUklORyc6IGhhbmRsZV9zdHJpbmcsXG4gICAgICAgICAgICAgICAgJ1RLX0VRVUFMUyc6IGhhbmRsZV9lcXVhbHMsXG4gICAgICAgICAgICAgICAgJ1RLX09QRVJBVE9SJzogaGFuZGxlX29wZXJhdG9yLFxuICAgICAgICAgICAgICAgICdUS19DT01NQSc6IGhhbmRsZV9jb21tYSxcbiAgICAgICAgICAgICAgICAnVEtfQkxPQ0tfQ09NTUVOVCc6IGhhbmRsZV9ibG9ja19jb21tZW50LFxuICAgICAgICAgICAgICAgICdUS19DT01NRU5UJzogaGFuZGxlX2NvbW1lbnQsXG4gICAgICAgICAgICAgICAgJ1RLX0RPVCc6IGhhbmRsZV9kb3QsXG4gICAgICAgICAgICAgICAgJ1RLX1VOS05PV04nOiBoYW5kbGVfdW5rbm93bixcbiAgICAgICAgICAgICAgICAnVEtfRU9GJzogaGFuZGxlX2VvZlxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gY3JlYXRlX2ZsYWdzKGZsYWdzX2Jhc2UsIG1vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dF9pbmRlbnRfbGV2ZWwgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChmbGFnc19iYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRfaW5kZW50X2xldmVsID0gZmxhZ3NfYmFzZS5pbmRlbnRhdGlvbl9sZXZlbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvdXRwdXQuanVzdF9hZGRlZF9uZXdsaW5lKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzX2Jhc2UubGluZV9pbmRlbnRfbGV2ZWwgPiBuZXh0X2luZGVudF9sZXZlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dF9pbmRlbnRfbGV2ZWwgPSBmbGFnc19iYXNlLmxpbmVfaW5kZW50X2xldmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5leHRfZmxhZ3MgPSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IG1vZGUsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogZmxhZ3NfYmFzZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdF90ZXh0OiBmbGFnc19iYXNlID8gZmxhZ3NfYmFzZS5sYXN0X3RleHQgOiAnJywgLy8gbGFzdCB0b2tlbiB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGxhc3Rfd29yZDogZmxhZ3NfYmFzZSA/IGZsYWdzX2Jhc2UubGFzdF93b3JkIDogJycsIC8vIGxhc3QgJ1RLX1dPUkQnIHBhc3NlZFxuICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbl9zdGF0ZW1lbnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbl9hc3NpZ25tZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlsaW5lX2ZyYW1lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lX2ZyYW1lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaWZfYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlbHNlX2Jsb2NrOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZG9fYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkb193aGlsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydF9ibG9jazogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGluX2Nhc2Vfc3RhdGVtZW50OiBmYWxzZSwgLy8gc3dpdGNoKC4uKXsgSU5TSURFIEhFUkUgfVxuICAgICAgICAgICAgICAgICAgICBpbl9jYXNlOiBmYWxzZSwgLy8gd2UncmUgb24gdGhlIGV4YWN0IGxpbmUgd2l0aCBcImNhc2UgMDpcIlxuICAgICAgICAgICAgICAgICAgICBjYXNlX2JvZHk6IGZhbHNlLCAvLyB0aGUgaW5kZW50ZWQgY2FzZS1hY3Rpb24gYmxvY2tcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50YXRpb25fbGV2ZWw6IG5leHRfaW5kZW50X2xldmVsLFxuICAgICAgICAgICAgICAgICAgICBsaW5lX2luZGVudF9sZXZlbDogZmxhZ3NfYmFzZSA/IGZsYWdzX2Jhc2UubGluZV9pbmRlbnRfbGV2ZWwgOiBuZXh0X2luZGVudF9sZXZlbCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRfbGluZV9pbmRleDogb3V0cHV0LmdldF9saW5lX251bWJlcigpLFxuICAgICAgICAgICAgICAgICAgICB0ZXJuYXJ5X2RlcHRoOiAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dF9mbGFncztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU29tZSBpbnRlcnByZXRlcnMgaGF2ZSB1bmV4cGVjdGVkIHJlc3VsdHMgd2l0aCBmb28gPSBiYXogfHwgYmFyO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zIDoge307XG5cbiAgICAgICAgICAgIC8vIEFsbG93IHRoZSBzZXR0aW5nIG9mIGxhbmd1YWdlL2ZpbGUtdHlwZSBzcGVjaWZpYyBvcHRpb25zXG4gICAgICAgICAgICAvLyB3aXRoIGluaGVyaXRhbmNlIG9mIG92ZXJhbGwgc2V0dGluZ3NcbiAgICAgICAgICAgIG9wdGlvbnMgPSBtZXJnZU9wdHMob3B0aW9ucywgJ2pzJyk7XG5cbiAgICAgICAgICAgIG9wdCA9IHt9O1xuXG4gICAgICAgICAgICAvLyBjb21wYXRpYmlsaXR5LCByZVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYnJhY2Vfc3R5bGUgPT09IFwiZXhwYW5kLXN0cmljdFwiKSB7IC8vZ3JhY2VmdWwgaGFuZGxpbmcgb2YgZGVwcmVjYXRlZCBvcHRpb25cbiAgICAgICAgICAgICAgICBvcHRpb25zLmJyYWNlX3N0eWxlID0gXCJleHBhbmRcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5icmFjZV9zdHlsZSA9PT0gXCJjb2xsYXBzZS1wcmVzZXJ2ZS1pbmxpbmVcIikgeyAvL2dyYWNlZnVsIGhhbmRsaW5nIG9mIGRlcHJlY2F0ZWQgb3B0aW9uXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFjZV9zdHlsZSA9IFwiY29sbGFwc2UscHJlc2VydmUtaW5saW5lXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuYnJhY2VzX29uX293bl9saW5lICE9PSB1bmRlZmluZWQpIHsgLy9ncmFjZWZ1bCBoYW5kbGluZyBvZiBkZXByZWNhdGVkIG9wdGlvblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYnJhY2Vfc3R5bGUgPSBvcHRpb25zLmJyYWNlc19vbl9vd25fbGluZSA/IFwiZXhwYW5kXCIgOiBcImNvbGxhcHNlXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFvcHRpb25zLmJyYWNlX3N0eWxlKSAvL05vdGhpbmcgZXhpc3RzIHRvIHNldCBpdFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuYnJhY2Vfc3R5bGUgPSBcImNvbGxhcHNlXCI7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgdmFyIGJyYWNlX3N0eWxlX3NwbGl0ID0gb3B0aW9ucy5icmFjZV9zdHlsZS5zcGxpdCgvW15hLXpBLVowLTlfXFwtXSsvKTtcbiAgICAgICAgICAgIG9wdC5icmFjZV9zdHlsZSA9IGJyYWNlX3N0eWxlX3NwbGl0WzBdO1xuICAgICAgICAgICAgb3B0LmJyYWNlX3ByZXNlcnZlX2lubGluZSA9IGJyYWNlX3N0eWxlX3NwbGl0WzFdID8gYnJhY2Vfc3R5bGVfc3BsaXRbMV0gOiBmYWxzZTtcblxuICAgICAgICAgICAgb3B0LmluZGVudF9zaXplID0gb3B0aW9ucy5pbmRlbnRfc2l6ZSA/IHBhcnNlSW50KG9wdGlvbnMuaW5kZW50X3NpemUsIDEwKSA6IDQ7XG4gICAgICAgICAgICBvcHQuaW5kZW50X2NoYXIgPSBvcHRpb25zLmluZGVudF9jaGFyID8gb3B0aW9ucy5pbmRlbnRfY2hhciA6ICcgJztcbiAgICAgICAgICAgIG9wdC5lb2wgPSBvcHRpb25zLmVvbCA/IG9wdGlvbnMuZW9sIDogJ2F1dG8nO1xuICAgICAgICAgICAgb3B0LnByZXNlcnZlX25ld2xpbmVzID0gKG9wdGlvbnMucHJlc2VydmVfbmV3bGluZXMgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcztcbiAgICAgICAgICAgIG9wdC5icmVha19jaGFpbmVkX21ldGhvZHMgPSAob3B0aW9ucy5icmVha19jaGFpbmVkX21ldGhvZHMgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuYnJlYWtfY2hhaW5lZF9tZXRob2RzO1xuICAgICAgICAgICAgb3B0Lm1heF9wcmVzZXJ2ZV9uZXdsaW5lcyA9IChvcHRpb25zLm1heF9wcmVzZXJ2ZV9uZXdsaW5lcyA9PT0gdW5kZWZpbmVkKSA/IDAgOiBwYXJzZUludChvcHRpb25zLm1heF9wcmVzZXJ2ZV9uZXdsaW5lcywgMTApO1xuICAgICAgICAgICAgb3B0LnNwYWNlX2luX3BhcmVuID0gKG9wdGlvbnMuc3BhY2VfaW5fcGFyZW4gPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuc3BhY2VfaW5fcGFyZW47XG4gICAgICAgICAgICBvcHQuc3BhY2VfaW5fZW1wdHlfcGFyZW4gPSAob3B0aW9ucy5zcGFjZV9pbl9lbXB0eV9wYXJlbiA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5zcGFjZV9pbl9lbXB0eV9wYXJlbjtcbiAgICAgICAgICAgIG9wdC5qc2xpbnRfaGFwcHkgPSAob3B0aW9ucy5qc2xpbnRfaGFwcHkgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuanNsaW50X2hhcHB5O1xuICAgICAgICAgICAgb3B0LnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24gPSAob3B0aW9ucy5zcGFjZV9hZnRlcl9hbm9uX2Z1bmN0aW9uID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb247XG4gICAgICAgICAgICBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiA9IChvcHRpb25zLmtlZXBfYXJyYXlfaW5kZW50YXRpb24gPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMua2VlcF9hcnJheV9pbmRlbnRhdGlvbjtcbiAgICAgICAgICAgIG9wdC5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwgPSAob3B0aW9ucy5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWw7XG4gICAgICAgICAgICBvcHQudW5lc2NhcGVfc3RyaW5ncyA9IChvcHRpb25zLnVuZXNjYXBlX3N0cmluZ3MgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMudW5lc2NhcGVfc3RyaW5ncztcbiAgICAgICAgICAgIG9wdC53cmFwX2xpbmVfbGVuZ3RoID0gKG9wdGlvbnMud3JhcF9saW5lX2xlbmd0aCA9PT0gdW5kZWZpbmVkKSA/IDAgOiBwYXJzZUludChvcHRpb25zLndyYXBfbGluZV9sZW5ndGgsIDEwKTtcbiAgICAgICAgICAgIG9wdC5lNHggPSAob3B0aW9ucy5lNHggPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuZTR4O1xuICAgICAgICAgICAgb3B0LmVuZF93aXRoX25ld2xpbmUgPSAob3B0aW9ucy5lbmRfd2l0aF9uZXdsaW5lID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmVuZF93aXRoX25ld2xpbmU7XG4gICAgICAgICAgICBvcHQuY29tbWFfZmlyc3QgPSAob3B0aW9ucy5jb21tYV9maXJzdCA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5jb21tYV9maXJzdDtcbiAgICAgICAgICAgIG9wdC5vcGVyYXRvcl9wb3NpdGlvbiA9IHNhbml0aXplT3BlcmF0b3JQb3NpdGlvbihvcHRpb25zLm9wZXJhdG9yX3Bvc2l0aW9uKTtcblxuICAgICAgICAgICAgLy8gRm9yIHRlc3Rpbmcgb2YgYmVhdXRpZnkgaWdub3JlOnN0YXJ0IGRpcmVjdGl2ZVxuICAgICAgICAgICAgb3B0LnRlc3Rfb3V0cHV0X3JhdyA9IChvcHRpb25zLnRlc3Rfb3V0cHV0X3JhdyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy50ZXN0X291dHB1dF9yYXc7XG5cbiAgICAgICAgICAgIC8vIGZvcmNlIG9wdC5zcGFjZV9hZnRlcl9hbm9uX2Z1bmN0aW9uIHRvIHRydWUgaWYgb3B0LmpzbGludF9oYXBweVxuICAgICAgICAgICAgaWYgKG9wdC5qc2xpbnRfaGFwcHkpIHtcbiAgICAgICAgICAgICAgICBvcHQuc3BhY2VfYWZ0ZXJfYW5vbl9mdW5jdGlvbiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmluZGVudF93aXRoX3RhYnMpIHtcbiAgICAgICAgICAgICAgICBvcHQuaW5kZW50X2NoYXIgPSAnXFx0JztcbiAgICAgICAgICAgICAgICBvcHQuaW5kZW50X3NpemUgPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0LmVvbCA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgICAgICAgb3B0LmVvbCA9ICdcXG4nO1xuICAgICAgICAgICAgICAgIGlmIChqc19zb3VyY2VfdGV4dCAmJiBhY29ybi5saW5lQnJlYWsudGVzdChqc19zb3VyY2VfdGV4dCB8fCAnJykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0LmVvbCA9IGpzX3NvdXJjZV90ZXh0Lm1hdGNoKGFjb3JuLmxpbmVCcmVhaylbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHQuZW9sID0gb3B0LmVvbC5yZXBsYWNlKC9cXFxcci8sICdcXHInKS5yZXBsYWNlKC9cXFxcbi8sICdcXG4nKTtcblxuICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBpbmRlbnRfc3RyaW5nID0gJyc7XG4gICAgICAgICAgICB3aGlsZSAob3B0LmluZGVudF9zaXplID4gMCkge1xuICAgICAgICAgICAgICAgIGluZGVudF9zdHJpbmcgKz0gb3B0LmluZGVudF9jaGFyO1xuICAgICAgICAgICAgICAgIG9wdC5pbmRlbnRfc2l6ZSAtPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcHJlaW5kZW50X2luZGV4ID0gMDtcbiAgICAgICAgICAgIGlmIChqc19zb3VyY2VfdGV4dCAmJiBqc19zb3VyY2VfdGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGpzX3NvdXJjZV90ZXh0LmNoYXJBdChwcmVpbmRlbnRfaW5kZXgpID09PSAnICcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzX3NvdXJjZV90ZXh0LmNoYXJBdChwcmVpbmRlbnRfaW5kZXgpID09PSAnXFx0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzZUluZGVudFN0cmluZyArPSBqc19zb3VyY2VfdGV4dC5jaGFyQXQocHJlaW5kZW50X2luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgcHJlaW5kZW50X2luZGV4ICs9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzX3NvdXJjZV90ZXh0ID0ganNfc291cmNlX3RleHQuc3Vic3RyaW5nKHByZWluZGVudF9pbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3RfdHlwZSA9ICdUS19TVEFSVF9CTE9DSyc7IC8vIGxhc3QgdG9rZW4gdHlwZVxuICAgICAgICAgICAgbGFzdF9sYXN0X3RleHQgPSAnJzsgLy8gcHJlLWxhc3QgdG9rZW4gdGV4dFxuICAgICAgICAgICAgb3V0cHV0ID0gbmV3IE91dHB1dChpbmRlbnRfc3RyaW5nLCBiYXNlSW5kZW50U3RyaW5nKTtcblxuICAgICAgICAgICAgLy8gSWYgdGVzdGluZyB0aGUgaWdub3JlIGRpcmVjdGl2ZSwgc3RhcnQgd2l0aCBvdXRwdXQgZGlzYWJsZSBzZXQgdG8gdHJ1ZVxuICAgICAgICAgICAgb3V0cHV0LnJhdyA9IG9wdC50ZXN0X291dHB1dF9yYXc7XG5cblxuICAgICAgICAgICAgLy8gU3RhY2sgb2YgcGFyc2luZy9mb3JtYXR0aW5nIHN0YXRlcywgaW5jbHVkaW5nIE1PREUuXG4gICAgICAgICAgICAvLyBXZSB0b2tlbml6ZSwgcGFyc2UsIGFuZCBvdXRwdXQgaW4gYW4gYWxtb3N0IHB1cmVseSBhIGZvcndhcmQtb25seSBzdHJlYW0gb2YgdG9rZW4gaW5wdXRcbiAgICAgICAgICAgIC8vIGFuZCBmb3JtYXR0ZWQgb3V0cHV0LiAgVGhpcyBtYWtlcyB0aGUgYmVhdXRpZmllciBsZXNzIGFjY3VyYXRlIHRoYW4gZnVsbCBwYXJzZXJzXG4gICAgICAgICAgICAvLyBidXQgYWxzbyBmYXIgbW9yZSB0b2xlcmFudCBvZiBzeW50YXggZXJyb3JzLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdCBtb2RlIGlzIE1PREUuQmxvY2tTdGF0ZW1lbnQuIElmIHdlIHNlZSBhICd7JyB3ZSBwdXNoIGEgbmV3IGZyYW1lIG9mIHR5cGVcbiAgICAgICAgICAgIC8vIE1PREUuQmxvY2tTdGF0ZW1lbnQgb24gdGhlIHRoZSBzdGFjaywgZXZlbiB0aG91Z2ggaXQgY291bGQgYmUgb2JqZWN0IGxpdGVyYWwuICBJZiB3ZSBsYXRlclxuICAgICAgICAgICAgLy8gZW5jb3VudGVyIGEgXCI6XCIsIHdlJ2xsIHN3aXRjaCB0byB0byBNT0RFLk9iamVjdExpdGVyYWwuICBJZiB3ZSB0aGVuIHNlZSBhIFwiO1wiLFxuICAgICAgICAgICAgLy8gbW9zdCBmdWxsIHBhcnNlcnMgd291bGQgZGllLCBidXQgdGhlIGJlYXV0aWZpZXIgZ3JhY2VmdWxseSBmYWxscyBiYWNrIHRvXG4gICAgICAgICAgICAvLyBNT0RFLkJsb2NrU3RhdGVtZW50IGFuZCBjb250aW51ZXMgb24uXG4gICAgICAgICAgICBmbGFnX3N0b3JlID0gW107XG4gICAgICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcblxuICAgICAgICAgICAgdGhpcy5iZWF1dGlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgLypqc2hpbnQgb25ldmFyOnRydWUgKi9cbiAgICAgICAgICAgICAgICB2YXIgc3dlZXRfY29kZTtcbiAgICAgICAgICAgICAgICBUb2tlbml6ZXIgPSBuZXcgdG9rZW5pemVyKGpzX3NvdXJjZV90ZXh0LCBvcHQsIGluZGVudF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgIHRva2VucyA9IFRva2VuaXplci50b2tlbml6ZSgpO1xuICAgICAgICAgICAgICAgIHRva2VuX3BvcyA9IDA7XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuID0gZ2V0X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRfdG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnNbY3VycmVudF90b2tlbi50eXBlXSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGFzdF90ZXh0ID0gZmxhZ3MubGFzdF90ZXh0O1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3R5cGUgPSBjdXJyZW50X3Rva2VuLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmxhc3RfdGV4dCA9IGN1cnJlbnRfdG9rZW4udGV4dDtcblxuICAgICAgICAgICAgICAgICAgICB0b2tlbl9wb3MgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF90b2tlbiA9IGdldF90b2tlbigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3ZWV0X2NvZGUgPSBvdXRwdXQuZ2V0X2NvZGUoKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LmVuZF93aXRoX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dlZXRfY29kZSArPSAnXFxuJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0LmVvbCAhPT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dlZXRfY29kZSA9IHN3ZWV0X2NvZGUucmVwbGFjZSgvW1xcbl0vZywgb3B0LmVvbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN3ZWV0X2NvZGU7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMobG9jYWxfdG9rZW4sIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgIHZhciBuZXdsaW5lcyA9IGxvY2FsX3Rva2VuLm5ld2xpbmVzO1xuICAgICAgICAgICAgICAgIHZhciBrZWVwX3doaXRlc3BhY2UgPSBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiAmJiBpc19hcnJheShmbGFncy5tb2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcF90b2tlbiA9IGN1cnJlbnRfdG9rZW47XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBoID0gMDsgaCA8IGxvY2FsX3Rva2VuLmNvbW1lbnRzX2JlZm9yZS5sZW5ndGg7IGgrKykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2xlYW5lc3QgaGFuZGxpbmcgb2YgaW5saW5lIGNvbW1lbnRzIGlzIHRvIHRyZWF0IHRoZW0gYXMgdGhvdWdoIHRoZXkgYXJlbid0IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICAvLyBKdXN0IGNvbnRpbnVlIGZvcm1hdHRpbmcgYW5kIHRoZSBiZWhhdmlvciBzaG91bGQgYmUgbG9naWNhbC5cbiAgICAgICAgICAgICAgICAgICAgLy8gQWxzbyBpZ25vcmUgdW5rbm93biB0b2tlbnMuICBBZ2FpbiwgdGhpcyBzaG91bGQgcmVzdWx0IGluIGJldHRlciBiZWhhdmlvci5cbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF90b2tlbiA9IGxvY2FsX3Rva2VuLmNvbW1lbnRzX2JlZm9yZVtoXTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4sIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzW2N1cnJlbnRfdG9rZW4udHlwZV0ocHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudF90b2tlbiA9IHRlbXBfdG9rZW47XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VlcF93aGl0ZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmV3bGluZXM7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShpID4gMCwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHQubWF4X3ByZXNlcnZlX25ld2xpbmVzICYmIG5ld2xpbmVzID4gb3B0Lm1heF9wcmVzZXJ2ZV9uZXdsaW5lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3bGluZXMgPSBvcHQubWF4X3ByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5wcmVzZXJ2ZV9uZXdsaW5lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsX3Rva2VuLm5ld2xpbmVzID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBuZXdsaW5lczsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUodHJ1ZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2UgY291bGQgdXNlIGp1c3Qgc3RyaW5nLnNwbGl0LCBidXRcbiAgICAgICAgICAgIC8vIElFIGRvZXNuJ3QgbGlrZSByZXR1cm5pbmcgZW1wdHkgc3RyaW5nc1xuICAgICAgICAgICAgZnVuY3Rpb24gc3BsaXRfbGluZWJyZWFrcyhzKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gcy5zcGxpdCgvXFx4MGRcXHgwYXxcXHgwYS8pO1xuXG4gICAgICAgICAgICAgICAgcyA9IHMucmVwbGFjZShhY29ybi5hbGxMaW5lQnJlYWtzLCAnXFxuJyk7XG4gICAgICAgICAgICAgICAgdmFyIG91dCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBpZHggPSBzLmluZGV4T2YoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gocy5zdWJzdHJpbmcoMCwgaWR4KSk7XG4gICAgICAgICAgICAgICAgICAgIHMgPSBzLnN1YnN0cmluZyhpZHggKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gcy5pbmRleE9mKFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gocyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBuZXdsaW5lX3Jlc3RyaWN0ZWRfdG9rZW5zID0gWydicmVhaycsICdjb250aW51ZScsICdyZXR1cm4nLCAndGhyb3cnXTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShmb3JjZV9saW5ld3JhcCkge1xuICAgICAgICAgICAgICAgIGZvcmNlX2xpbmV3cmFwID0gKGZvcmNlX2xpbmV3cmFwID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBmb3JjZV9saW5ld3JhcDtcblxuICAgICAgICAgICAgICAgIC8vIE5ldmVyIHdyYXAgdGhlIGZpcnN0IHRva2VuIG9uIGEgbGluZVxuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQuanVzdF9hZGRlZF9uZXdsaW5lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBzaG91bGRQcmVzZXJ2ZU9yRm9yY2UgPSAob3B0LnByZXNlcnZlX25ld2xpbmVzICYmIGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpIHx8IGZvcmNlX2xpbmV3cmFwO1xuICAgICAgICAgICAgICAgIHZhciBvcGVyYXRvckxvZ2ljQXBwbGllcyA9IGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgVG9rZW5pemVyLnBvc2l0aW9uYWJsZV9vcGVyYXRvcnMpIHx8IGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgVG9rZW5pemVyLnBvc2l0aW9uYWJsZV9vcGVyYXRvcnMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9wZXJhdG9yTG9naWNBcHBsaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaG91bGRQcmludE9wZXJhdG9yTmV3bGluZSA9IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFRva2VuaXplci5wb3NpdGlvbmFibGVfb3BlcmF0b3JzKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluX2FycmF5KG9wdC5vcGVyYXRvcl9wb3NpdGlvbiwgT1BFUkFUT1JfUE9TSVRJT05fQkVGT1JFX09SX1BSRVNFUlZFKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBUb2tlbml6ZXIucG9zaXRpb25hYmxlX29wZXJhdG9ycyk7XG4gICAgICAgICAgICAgICAgICAgIHNob3VsZFByZXNlcnZlT3JGb3JjZSA9IHNob3VsZFByZXNlcnZlT3JGb3JjZSAmJiBzaG91bGRQcmludE9wZXJhdG9yTmV3bGluZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJlc2VydmVPckZvcmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0LndyYXBfbGluZV9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIG5ld2xpbmVfcmVzdHJpY3RlZF90b2tlbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVzZSB0b2tlbnMgc2hvdWxkIG5ldmVyIGhhdmUgYSBuZXdsaW5lIGluc2VydGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZXR3ZWVuIHRoZW0gYW5kIHRoZSBmb2xsb3dpbmcgZXhwcmVzc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcG9zZWRfbGluZV9sZW5ndGggPSBvdXRwdXQuY3VycmVudF9saW5lLmdldF9jaGFyYWN0ZXJfY291bnQoKSArIGN1cnJlbnRfdG9rZW4udGV4dC5sZW5ndGggK1xuICAgICAgICAgICAgICAgICAgICAgICAgKG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPyAxIDogMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wb3NlZF9saW5lX2xlbmd0aCA+PSBvcHQud3JhcF9saW5lX2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHByaW50X25ld2xpbmUoZm9yY2VfbmV3bGluZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsYWdzLmxhc3RfdGV4dCAhPT0gJzsnICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJywnICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJz0nICYmIGxhc3RfdHlwZSAhPT0gJ1RLX09QRVJBVE9SJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRfdG9rZW4gPSBnZXRfdG9rZW4oMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhKGZsYWdzLmlmX2Jsb2NrICYmIG5leHRfdG9rZW4gJiYgbmV4dF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIG5leHRfdG9rZW4udGV4dCA9PT0gJ2Vsc2UnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFmbGFncy5kb19ibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dC5hZGRfbmV3X2xpbmUoZm9yY2VfbmV3bGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MubXVsdGlsaW5lX2ZyYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHByaW50X3Rva2VuX2xpbmVfaW5kZW50YXRpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dC5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gJiYgaXNfYXJyYXkoZmxhZ3MubW9kZSkgJiYgY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmN1cnJlbnRfbGluZS5wdXNoKGN1cnJlbnRfdG9rZW4ud2hpdGVzcGFjZV9iZWZvcmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dC5zZXRfaW5kZW50KGZsYWdzLmluZGVudGF0aW9uX2xldmVsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MubGluZV9pbmRlbnRfbGV2ZWwgPSBmbGFncy5pbmRlbnRhdGlvbl9sZXZlbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJpbnRfdG9rZW4ocHJpbnRhYmxlX3Rva2VuKSB7XG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dC5yYXcpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmFkZF9yYXdfdG9rZW4oY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0LmNvbW1hX2ZpcnN0ICYmIGxhc3RfdHlwZSA9PT0gJ1RLX0NPTU1BJyAmJlxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuanVzdF9hZGRlZF9uZXdsaW5lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dC5wcmV2aW91c19saW5lLmxhc3QoKSA9PT0gJywnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9wcGVkID0gb3V0cHV0LnByZXZpb3VzX2xpbmUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgY29tbWEgd2FzIGFscmVhZHkgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHVsbCBiYWNrIG9udG8gdGhhdCBsaW5lIGFuZCByZXByaW50IHRoZSBpbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dC5wcmV2aW91c19saW5lLmlzX2VtcHR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHJldmlvdXNfbGluZS5wdXNoKHBvcHBlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnRyaW0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmN1cnJlbnRfbGluZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGNvbW1hIGluIGZyb250IG9mIHRoZSBuZXh0IHRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbl9saW5lX2luZGVudGF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuYWRkX3Rva2VuKCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByaW50YWJsZV90b2tlbiA9IHByaW50YWJsZV90b2tlbiB8fCBjdXJyZW50X3Rva2VuLnRleHQ7XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW5fbGluZV9pbmRlbnRhdGlvbigpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5hZGRfdG9rZW4ocHJpbnRhYmxlX3Rva2VuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5kZW50KCkge1xuICAgICAgICAgICAgICAgIGZsYWdzLmluZGVudGF0aW9uX2xldmVsICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlaW5kZW50KCkge1xuICAgICAgICAgICAgICAgIGlmIChmbGFncy5pbmRlbnRhdGlvbl9sZXZlbCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgKCghZmxhZ3MucGFyZW50KSB8fCBmbGFncy5pbmRlbnRhdGlvbl9sZXZlbCA+IGZsYWdzLnBhcmVudC5pbmRlbnRhdGlvbl9sZXZlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW5kZW50YXRpb25fbGV2ZWwgLT0gMTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2V0X21vZGUobW9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChmbGFncykge1xuICAgICAgICAgICAgICAgICAgICBmbGFnX3N0b3JlLnB1c2goZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncyA9IGZsYWdzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzX2ZsYWdzID0gY3JlYXRlX2ZsYWdzKG51bGwsIG1vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZsYWdzID0gY3JlYXRlX2ZsYWdzKHByZXZpb3VzX2ZsYWdzLCBtb2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNfYXJyYXkobW9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlID09PSBNT0RFLkFycmF5TGl0ZXJhbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNfZXhwcmVzc2lvbihtb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluX2FycmF5KG1vZGUsIFtNT0RFLkV4cHJlc3Npb24sIE1PREUuRm9ySW5pdGlhbGl6ZXIsIE1PREUuQ29uZGl0aW9uYWxdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVzdG9yZV9tb2RlKCkge1xuICAgICAgICAgICAgICAgIGlmIChmbGFnX3N0b3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNfZmxhZ3MgPSBmbGFncztcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MgPSBmbGFnX3N0b3JlLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNfZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5yZW1vdmVfcmVkdW5kYW50X2luZGVudGF0aW9uKHByZXZpb3VzX2ZsYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3RhcnRfb2Zfb2JqZWN0X3Byb3BlcnR5KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbGFncy5wYXJlbnQubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsICYmIGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50ICYmIChcbiAgICAgICAgICAgICAgICAgICAgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJzonICYmIGZsYWdzLnRlcm5hcnlfZGVwdGggPT09IDApIHx8IChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ2dldCcsICdzZXQnXSkpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3RhcnRfb2Zfc3RhdGVtZW50KCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCddKSAmJiBjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19XT1JEJykgfHxcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICdkbycpIHx8XG4gICAgICAgICAgICAgICAgICAgIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ3JldHVybicsICd0aHJvdyddKSAmJiAhY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICdlbHNlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIShjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgY3VycmVudF90b2tlbi50ZXh0ID09PSAnaWYnICYmICFjdXJyZW50X3Rva2VuLmNvbW1lbnRzX2JlZm9yZS5sZW5ndGgpKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInICYmIChwcmV2aW91c19mbGFncy5tb2RlID09PSBNT0RFLkZvckluaXRpYWxpemVyIHx8IHByZXZpb3VzX2ZsYWdzLm1vZGUgPT09IE1PREUuQ29uZGl0aW9uYWwpKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfV09SRCcgJiYgZmxhZ3MubW9kZSA9PT0gTU9ERS5CbG9ja1N0YXRlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIWZsYWdzLmluX2Nhc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICEoY3VycmVudF90b2tlbi50ZXh0ID09PSAnLS0nIHx8IGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJysrJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RfbGFzdF90ZXh0ICE9PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuLnR5cGUgIT09ICdUS19XT1JEJyAmJiBjdXJyZW50X3Rva2VuLnR5cGUgIT09ICdUS19SRVNFUlZFRCcpIHx8XG4gICAgICAgICAgICAgICAgICAgIChmbGFncy5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJzonICYmIGZsYWdzLnRlcm5hcnlfZGVwdGggPT09IDApIHx8IChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ2dldCcsICdzZXQnXSkpKSlcbiAgICAgICAgICAgICAgICApIHtcblxuICAgICAgICAgICAgICAgICAgICBzZXRfbW9kZShNT0RFLlN0YXRlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJc3N1ZSAjMjc2OlxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBzdGFydGluZyBhIG5ldyBzdGF0ZW1lbnQgd2l0aCBbaWYsIGZvciwgd2hpbGUsIGRvXSwgcHVzaCB0byBhIG5ldyBsaW5lLlxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoYSkgaWYgKGIpIGlmKGMpIGQoKTsgZWxzZSBlKCk7IGVsc2UgZigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0X29mX29iamVjdF9wcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnZG8nLCAnZm9yJywgJ2lmJywgJ3doaWxlJ10pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFsbF9saW5lc19zdGFydF93aXRoKGxpbmVzLCBjKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IHRyaW0obGluZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGluZS5jaGFyQXQoMCkgIT09IGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZWFjaF9saW5lX21hdGNoZXNfaW5kZW50KGxpbmVzLCBpbmRlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IGxpbmVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgbGluZTtcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsb3cgZW1wdHkgbGluZXMgdG8gcGFzcyB0aHJvdWdoXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lICYmIGxpbmUuaW5kZXhPZihpbmRlbnQpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzX3NwZWNpYWxfd29yZCh3b3JkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluX2FycmF5KHdvcmQsIFsnY2FzZScsICdyZXR1cm4nLCAnZG8nLCAnaWYnLCAndGhyb3cnLCAnZWxzZSddKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0X3Rva2VuKG9mZnNldCkge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRva2VuX3BvcyArIChvZmZzZXQgfHwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdG9rZW5zLmxlbmd0aCkgPyBudWxsIDogdG9rZW5zW2luZGV4XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX3N0YXJ0X2V4cHIoKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGNvbmRpdGlvbmFsIHN0YXJ0cyB0aGUgc3RhdGVtZW50IGlmIGFwcHJvcHJpYXRlLlxuICAgICAgICAgICAgICAgIGlmICghc3RhcnRfb2Zfc3RhdGVtZW50KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBuZXh0X21vZGUgPSBNT0RFLkV4cHJlc3Npb247XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ1snKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1dPUkQnIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGFycmF5IGluZGV4IHNwZWNpZmllciwgYnJlYWsgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFbeF0sIGZuKClbeF1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBUb2tlbml6ZXIubGluZV9zdGFydGVycykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldF9tb2RlKG5leHRfbW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2luX3BhcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBuZXh0X21vZGUgPSBNT0RFLkFycmF5TGl0ZXJhbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzX2FycmF5KGZsYWdzLm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubGFzdF90ZXh0ID09PSAnWycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZmxhZ3MubGFzdF90ZXh0ID09PSAnLCcgJiYgKGxhc3RfbGFzdF90ZXh0ID09PSAnXScgfHwgbGFzdF9sYXN0X3RleHQgPT09ICd9JykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXSwgWyBnb2VzIHRvIG5ldyBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSwgWyBnb2VzIHRvIG5ldyBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2ZvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRfbW9kZSA9IE1PREUuRm9ySW5pdGlhbGl6ZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWydpZicsICd3aGlsZSddKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dF9tb2RlID0gTU9ERS5Db25kaXRpb25hbDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRfbW9kZSA9IE1PREUuRXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5sYXN0X3RleHQgPT09ICc7JyB8fCBsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9CTE9DSycpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX0VORF9CTE9DSycgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgd2hldGhlciBmb3JjaW5nIHRoaXMgaXMgcmVxdWlyZWQuICBSZXZpZXcgZmFpbGluZyB0ZXN0cyB3aGVuIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcgb24gKCggYW5kICkoIGFuZCBdWyBhbmQgXSggYW5kIC4oXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBjdXJyZW50X3Rva2VuLnRleHQgPT09ICcoJykgJiYgbGFzdF90eXBlICE9PSAnVEtfV09SRCcgJiYgbGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiAoZmxhZ3MubGFzdF93b3JkID09PSAnZnVuY3Rpb24nIHx8IGZsYWdzLmxhc3Rfd29yZCA9PT0gJ3R5cGVvZicpKSB8fFxuICAgICAgICAgICAgICAgICAgICAoZmxhZ3MubGFzdF90ZXh0ID09PSAnKicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShsYXN0X2xhc3RfdGV4dCwgWydmdW5jdGlvbicsICd5aWVsZCddKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmbGFncy5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwgJiYgaW5fYXJyYXkobGFzdF9sYXN0X3RleHQsIFsneycsICcsJ10pKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9uKCkgdnMgZnVuY3Rpb24gKClcbiAgICAgICAgICAgICAgICAgICAgLy8geWllbGQqKCkgdnMgeWllbGQqICgpXG4gICAgICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9uKigpIHZzIGZ1bmN0aW9uKiAoKVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgKGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgVG9rZW5pemVyLmxpbmVfc3RhcnRlcnMpIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2NhdGNoJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU2hvdWxkIGJlIGEgc3BhY2UgYmV0d2VlbiBhd2FpdCBhbmQgYW4gSUlGRVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICcoJyAmJiBsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgZmxhZ3MubGFzdF93b3JkID09PSAnYXdhaXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgb2YgdGhpcyBraW5kIG9mIG5ld2xpbmUgcHJlc2VydmF0aW9uLlxuICAgICAgICAgICAgICAgIC8vIGEgPSAoYiAmJlxuICAgICAgICAgICAgICAgIC8vICAgICAoYyB8fCBkKSk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJygnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGFydF9vZl9vYmplY3RfcHJvcGVydHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgcHJlc2VydmluZyB3cmFwcGVkIGFycm93IGZ1bmN0aW9uIGV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgLy8gYS5iKCdjJyxcbiAgICAgICAgICAgICAgICAvLyAgICAgKCkgPT4gZC5lXG4gICAgICAgICAgICAgICAgLy8gKVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICcoJyAmJiBsYXN0X3R5cGUgIT09ICdUS19XT1JEJyAmJiBsYXN0X3R5cGUgIT09ICdUS19SRVNFUlZFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNldF9tb2RlKG5leHRfbW9kZSk7XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2luX3BhcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluIGFsbCBjYXNlcywgaWYgd2UgbmV3bGluZSB3aGlsZSBpbnNpZGUgYW4gZXhwcmVzc2lvbiBpdCBzaG91bGQgYmUgaW5kZW50ZWQuXG4gICAgICAgICAgICAgICAgaW5kZW50KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9lbmRfZXhwcigpIHtcbiAgICAgICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIGluc2lkZSBleHByZXNzaW9ucyBhcmUgbm90IHZhbGlkIHN5bnRheCwgYnV0Li4uXG4gICAgICAgICAgICAgICAgLy8gc3RhdGVtZW50cyBtdXN0IGFsbCBiZSBjbG9zZWQgd2hlbiB0aGVpciBjb250YWluZXIgY2xvc2VzXG4gICAgICAgICAgICAgICAgd2hpbGUgKGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5tdWx0aWxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShjdXJyZW50X3Rva2VuLnRleHQgPT09ICddJyAmJiBpc19hcnJheShmbGFncy5tb2RlKSAmJiAhb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHQuc3BhY2VfaW5fcGFyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInICYmICFvcHQuc3BhY2VfaW5fZW1wdHlfcGFyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICgpIFtdIG5vIGlubmVyIHNwYWNlIGluIGVtcHR5IHBhcmVucyBsaWtlIHRoZXNlLCBldmVyLCByZWYgIzMyMFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICddJyAmJiBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnJlbW92ZV9yZWR1bmRhbnRfaW5kZW50YXRpb24ocHJldmlvdXNfZmxhZ3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gZG8ge30gd2hpbGUgKCkgLy8gbm8gc3RhdGVtZW50IHJlcXVpcmVkIGFmdGVyXG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmRvX3doaWxlICYmIHByZXZpb3VzX2ZsYWdzLm1vZGUgPT09IE1PREUuQ29uZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNfZmxhZ3MubW9kZSA9IE1PREUuRXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZG9fYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZG9fd2hpbGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX3N0YXJ0X2Jsb2NrKCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoaXMgaXMgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgYSBPYmplY3RMaXRlcmFsXG4gICAgICAgICAgICAgICAgdmFyIG5leHRfdG9rZW4gPSBnZXRfdG9rZW4oMSk7XG4gICAgICAgICAgICAgICAgdmFyIHNlY29uZF90b2tlbiA9IGdldF90b2tlbigyKTtcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kX3Rva2VuICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShzZWNvbmRfdG9rZW4udGV4dCwgWyc6JywgJywnXSkgJiYgaW5fYXJyYXkobmV4dF90b2tlbi50eXBlLCBbJ1RLX1NUUklORycsICdUS19XT1JEJywgJ1RLX1JFU0VSVkVEJ10pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGluX2FycmF5KG5leHRfdG9rZW4udGV4dCwgWydnZXQnLCAnc2V0JywgJy4uLiddKSAmJiBpbl9hcnJheShzZWNvbmRfdG9rZW4udHlwZSwgWydUS19XT1JEJywgJ1RLX1JFU0VSVkVEJ10pKVxuICAgICAgICAgICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IHN1cHBvcnQgVHlwZVNjcmlwdCxidXQgd2UgZGlkbid0IGJyZWFrIGl0IGZvciBhIHZlcnkgbG9uZyB0aW1lLlxuICAgICAgICAgICAgICAgICAgICAvLyBXZSdsbCB0cnkgdG8ga2VlcCBub3QgYnJlYWtpbmcgaXQuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5fYXJyYXkobGFzdF9sYXN0X3RleHQsIFsnY2xhc3MnLCAnaW50ZXJmYWNlJ10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRfbW9kZShNT0RFLk9iamVjdExpdGVyYWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0X21vZGUoTU9ERS5CbG9ja1N0YXRlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICc9PicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXJyb3cgZnVuY3Rpb246IChwYXJhbTEsIHBhcmFtTikgPT4geyBzdGF0ZW1lbnRzIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0X21vZGUoTU9ERS5CbG9ja1N0YXRlbWVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbl9hcnJheShsYXN0X3R5cGUsIFsnVEtfRVFVQUxTJywgJ1RLX1NUQVJUX0VYUFInLCAnVEtfQ09NTUEnLCAnVEtfT1BFUkFUT1InXSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsncmV0dXJuJywgJ3Rocm93JywgJ2ltcG9ydCcsICdkZWZhdWx0J10pKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlY3Rpbmcgc2hvcnRoYW5kIGZ1bmN0aW9uIHN5bnRheCBpcyBkaWZmaWN1bHQgYnkgc2Nhbm5pbmcgZm9yd2FyZCxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHNvIGNoZWNrIHRoZSBzdXJyb3VuZGluZyBjb250ZXh0LlxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYmxvY2sgaXMgYmVpbmcgcmV0dXJuZWQsIGltcG9ydGVkLCBleHBvcnQgZGVmYXVsdCwgcGFzc2VkIGFzIGFyZyxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGFzc2lnbmVkIHdpdGggPSBvciBhc3NpZ25lZCBpbiBhIG5lc3RlZCBvYmplY3QsIHRyZWF0IGFzIGFuIE9iamVjdExpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgIHNldF9tb2RlKE1PREUuT2JqZWN0TGl0ZXJhbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0X21vZGUoTU9ERS5CbG9ja1N0YXRlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGVtcHR5X2JyYWNlcyA9ICFuZXh0X3Rva2VuLmNvbW1lbnRzX2JlZm9yZS5sZW5ndGggJiYgbmV4dF90b2tlbi50ZXh0ID09PSAnfSc7XG4gICAgICAgICAgICAgICAgdmFyIGVtcHR5X2Fub255bW91c19mdW5jdGlvbiA9IGVtcHR5X2JyYWNlcyAmJiBmbGFncy5sYXN0X3dvcmQgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgbGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9wdC5icmFjZV9wcmVzZXJ2ZV9pbmxpbmUpIC8vIGNoZWNrIGZvciBpbmxpbmUsIHNldCBpbmxpbmVfZnJhbWUgaWYgc29cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNlYXJjaCBmb3J3YXJkIGZvciBhIG5ld2xpbmUgd2FudGVkIGluc2lkZSB0aGlzIGJsb2NrXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGVja190b2tlbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmlubGluZV9mcmFtZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja190b2tlbiA9IGdldF90b2tlbihpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tfdG9rZW4ud2FudGVkX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5pbmxpbmVfZnJhbWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoY2hlY2tfdG9rZW4udHlwZSAhPT0gJ1RLX0VPRicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICEoY2hlY2tfdG9rZW4udHlwZSA9PT0gJ1RLX0VORF9CTE9DSycgJiYgY2hlY2tfdG9rZW4ub3BlbmVkID09PSBjdXJyZW50X3Rva2VuKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKChvcHQuYnJhY2Vfc3R5bGUgPT09IFwiZXhwYW5kXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChvcHQuYnJhY2Vfc3R5bGUgPT09IFwibm9uZVwiICYmIGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpKSAmJlxuICAgICAgICAgICAgICAgICAgICAhZmxhZ3MuaW5saW5lX2ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgIT09ICdUS19PUEVSQVRPUicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChlbXB0eV9hbm9ueW1vdXNfZnVuY3Rpb24gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpc19zcGVjaWFsX3dvcmQoZmxhZ3MubGFzdF90ZXh0KSAmJiBmbGFncy5sYXN0X3RleHQgIT09ICdlbHNlJykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gY29sbGFwc2UgfHwgaW5saW5lX2ZyYW1lXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc19hcnJheShwcmV2aW91c19mbGFncy5tb2RlKSAmJiAobGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgfHwgbGFzdF90eXBlID09PSAnVEtfQ09NTUEnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0NPTU1BJyB8fCBvcHQuc3BhY2VfaW5fcGFyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0NPTU1BJyB8fCAobGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgJiYgZmxhZ3MuaW5saW5lX2ZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncy5tdWx0aWxpbmVfZnJhbWUgPSBwcmV2aW91c19mbGFncy5tdWx0aWxpbmVfZnJhbWUgfHwgZmxhZ3MubXVsdGlsaW5lX2ZyYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLm11bHRpbGluZV9mcmFtZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgIT09ICdUS19PUEVSQVRPUicgJiYgbGFzdF90eXBlICE9PSAnVEtfU1RBUlRfRVhQUicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9CTE9DSycgJiYgIWZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX2VuZF9ibG9jaygpIHtcbiAgICAgICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIG11c3QgYWxsIGJlIGNsb3NlZCB3aGVuIHRoZWlyIGNvbnRhaW5lciBjbG9zZXNcbiAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGVtcHR5X2JyYWNlcyA9IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJztcblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5pbmxpbmVfZnJhbWUgJiYgIWVtcHR5X2JyYWNlcykgeyAvLyB0cnkgaW5saW5lX2ZyYW1lIChvbmx5IHNldCBpZiBvcHQuYnJhY2VzLXByZXNlcnZlLWlubGluZSkgZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHQuYnJhY2Vfc3R5bGUgPT09IFwiZXhwYW5kXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlbXB0eV9icmFjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNraXAge31cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlbXB0eV9icmFjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc19hcnJheShmbGFncy5tb2RlKSAmJiBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIFJFQUxMWSBuZWVkIGEgbmV3bGluZSBoZXJlLCBidXQgbmV3bGluZXIgd291bGQgc2tpcCB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfd29yZCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnc2V0JywgJ2dldCddKSAmJiBmbGFncy5tb2RlICE9PSBNT0RFLk9iamVjdExpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4udHlwZSA9ICdUS19XT1JEJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnYXMnLCAnZnJvbSddKSAmJiAhZmxhZ3MuaW1wb3J0X2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3Rva2VuLnR5cGUgPSAnVEtfV09SRCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmxhZ3MubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dF90b2tlbiA9IGdldF90b2tlbigxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0X3Rva2VuLnRleHQgPT09ICc6Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdG9rZW4udHlwZSA9ICdUS19XT1JEJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ3ZhcicsICdsZXQnLCAnY29uc3QnXSkgJiYgY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfV09SRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmRlY2xhcmF0aW9uX3N0YXRlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUgJiYgIWlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSAhPT0gJ1RLX09QRVJBVE9SJyB8fCAoZmxhZ3MubGFzdF90ZXh0ID09PSAnLS0nIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJysrJykpICYmXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfdHlwZSAhPT0gJ1RLX0VRVUFMUycgJiZcbiAgICAgICAgICAgICAgICAgICAgKG9wdC5wcmVzZXJ2ZV9uZXdsaW5lcyB8fCAhKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCcsICdzZXQnLCAnZ2V0J10pKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5kb19ibG9jayAmJiAhZmxhZ3MuZG9fd2hpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBjdXJyZW50X3Rva2VuLnRleHQgPT09ICd3aGlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRvIHt9ICMjIHdoaWxlICgpXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmRvX3doaWxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRvIHt9IHNob3VsZCBhbHdheXMgaGF2ZSB3aGlsZSBhcyB0aGUgbmV4dCB3b3JkLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgZG9uJ3Qgc2VlIHRoZSBleHBlY3RlZCB3aGlsZSwgcmVjb3ZlclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZG9fYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIG1heSBiZSBmb2xsb3dlZCBieSBlbHNlLCBvciBub3RcbiAgICAgICAgICAgICAgICAvLyBCYXJlL2lubGluZSBpZnMgYXJlIHRyaWNreVxuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gdW53aW5kIHRoZSBtb2RlcyBjb3JyZWN0bHk6IGlmIChhKSBpZiAoYikgYygpOyBlbHNlIGQoKTsgZWxzZSBlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmlmX2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmxhZ3MuZWxzZV9ibG9jayAmJiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ2Vsc2UnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZWxzZV9ibG9jayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmlmX2Jsb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5lbHNlX2Jsb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICdjYXNlJyB8fCAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnZGVmYXVsdCcgJiYgZmxhZ3MuaW5fY2FzZV9zdGF0ZW1lbnQpKSkge1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5jYXNlX2JvZHkgfHwgb3B0LmpzbGludF9oYXBweSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3dpdGNoIGNhc2VzIGZvbGxvd2luZyBvbmUgYW5vdGhlclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVpbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmNhc2VfYm9keSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmluX2Nhc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5pbl9jYXNlX3N0YXRlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfQ09NTUEnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX0VRVUFMUycgfHwgbGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RhcnRfb2Zfb2JqZWN0X3Byb3BlcnR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgY3VycmVudF90b2tlbi50ZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnfScsICc7J10pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAob3V0cHV0Lmp1c3RfYWRkZWRfbmV3bGluZSgpICYmICEoaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJygnLCAnWycsICd7JywgJzonLCAnPScsICcsJ10pIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlcmUgaXMgYSBuaWNlIGNsZWFuIHNwYWNlIG9mIGF0IGxlYXN0IG9uZSBibGFuayBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZWZvcmUgYSBuZXcgZnVuY3Rpb24gZGVmaW5pdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvdXRwdXQuanVzdF9hZGRlZF9ibGFua2xpbmUoKSAmJiAhY3VycmVudF90b2tlbi5jb21tZW50c19iZWZvcmUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyB8fCBsYXN0X3R5cGUgPT09ICdUS19XT1JEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnZ2V0JywgJ3NldCcsICduZXcnLCAncmV0dXJuJywgJ2V4cG9ydCcsICdhc3luYyddKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgZmxhZ3MubGFzdF90ZXh0ID09PSAnZGVmYXVsdCcgJiYgbGFzdF9sYXN0X3RleHQgPT09ICdleHBvcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvbyA9IGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZmxhZ3MubXVsdGlsaW5lX2ZyYW1lICYmIChpc19leHByZXNzaW9uKGZsYWdzLm1vZGUpIHx8IGlzX2FycmF5KGZsYWdzLm1vZGUpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5sYXN0X3dvcmQgPSBjdXJyZW50X3Rva2VuLnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnTk9ORSc7XG5cbiAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfRU5EX0JMT0NLJykge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c19mbGFncy5pbmxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdTUEFDRSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIShjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBbJ2Vsc2UnLCAnY2F0Y2gnLCAnZmluYWxseScsICdmcm9tJ10pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmRcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5icmFjZV9zdHlsZSA9PT0gXCJlbmQtZXhwYW5kXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAob3B0LmJyYWNlX3N0eWxlID09PSBcIm5vbmVcIiAmJiBjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfU0VNSUNPTE9OJyAmJiBmbGFncy5tb2RlID09PSBNT0RFLkJsb2NrU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFNob3VsZCB0aGlzIGJlIGZvciBTVEFURU1FTlQgYXMgd2VsbD9cbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfU0VNSUNPTE9OJyAmJiBpc19leHByZXNzaW9uKGZsYWdzLm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdTUEFDRSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVFJJTkcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyB8fCBsYXN0X3R5cGUgPT09ICdUS19XT1JEJyB8fFxuICAgICAgICAgICAgICAgICAgICAoZmxhZ3MubGFzdF90ZXh0ID09PSAnKicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShsYXN0X2xhc3RfdGV4dCwgWydmdW5jdGlvbicsICd5aWVsZCddKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmbGFncy5tb2RlID09PSBNT0RFLk9iamVjdExpdGVyYWwgJiYgaW5fYXJyYXkobGFzdF9sYXN0X3RleHQsIFsneycsICcsJ10pKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdTUEFDRSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9CTE9DSycpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsYWdzLmlubGluZV9mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFRva2VuaXplci5saW5lX3N0YXJ0ZXJzKSAmJiBmbGFncy5sYXN0X3RleHQgIT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuaW5saW5lX2ZyYW1lIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2Vsc2UnIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2V4cG9ydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCA9ICdTUEFDRSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnR5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoY3VycmVudF90b2tlbi50ZXh0LCBbJ2Vsc2UnLCAnY2F0Y2gnLCAnZmluYWxseSddKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKCEobGFzdF90eXBlID09PSAnVEtfRU5EX0JMT0NLJyAmJiBwcmV2aW91c19mbGFncy5tb2RlID09PSBNT0RFLkJsb2NrU3RhdGVtZW50KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmRcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5icmFjZV9zdHlsZSA9PT0gXCJlbmQtZXhwYW5kXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAob3B0LmJyYWNlX3N0eWxlID09PSBcIm5vbmVcIiAmJiBjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFmbGFncy5pbmxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC50cmltKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBvdXRwdXQuY3VycmVudF9saW5lO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgdHJpbW1lZCBhbmQgdGhlcmUncyBzb21ldGhpbmcgb3RoZXIgdGhhbiBhIGNsb3NlIGJsb2NrIGJlZm9yZSB1c1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHV0IGEgbmV3bGluZSBiYWNrIGluLiAgSGFuZGxlcyAnfSAvLyBjb21tZW50JyBzY2VuYXJpby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5lLmxhc3QoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZWZpeCA9PT0gJ05FV0xJTkUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaXNfc3BlY2lhbF93b3JkKGZsYWdzLmxhc3RfdGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG5ld2xpbmUgYmV0d2VlbiAncmV0dXJuIG5ubidcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSAhPT0gJ1RLX0VORF9FWFBSJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChsYXN0X3R5cGUgIT09ICdUS19TVEFSVF9FWFBSJyB8fCAhKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCddKSkpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJzonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbmVlZCB0byBmb3JjZSBuZXdsaW5lIG9uICd2YXInOiBmb3IgKHZhciB4ID0gMC4uLilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ2lmJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICdlbHNlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBuZXdsaW5lIGZvciB9IGVsc2UgaWYge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFRva2VuaXplci5saW5lX3N0YXJ0ZXJzKSAmJiBmbGFncy5sYXN0X3RleHQgIT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbGFncy5tdWx0aWxpbmVfZnJhbWUgJiYgaXNfYXJyYXkoZmxhZ3MubW9kZSkgJiYgZmxhZ3MubGFzdF90ZXh0ID09PSAnLCcgJiYgbGFzdF9sYXN0X3RleHQgPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7IC8vIH0sIGluIGxpc3RzIGdldCBhIG5ld2xpbmUgdHJlYXRtZW50XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcmVmaXggPT09ICdTUEFDRScpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgZmxhZ3MubGFzdF93b3JkID0gY3VycmVudF90b2tlbi50ZXh0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnZG8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5kb19ibG9jayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnaWYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5pZl9ibG9jayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnaW1wb3J0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW1wb3J0X2Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbGFncy5pbXBvcnRfYmxvY2sgJiYgY3VycmVudF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJ2Zyb20nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5pbXBvcnRfYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlX3NlbWljb2xvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRfb2Zfc3RhdGVtZW50KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNvbmRpdGlvbmFsIHN0YXJ0cyB0aGUgc3RhdGVtZW50IGlmIGFwcHJvcHJpYXRlLlxuICAgICAgICAgICAgICAgICAgICAvLyBTZW1pY29sb24gY2FuIGJlIHRoZSBzdGFydCAoYW5kIGVuZCkgb2YgYSBzdGF0ZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbmV4dF90b2tlbiA9IGdldF90b2tlbigxKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgIShmbGFncy5pZl9ibG9jayAmJiBuZXh0X3Rva2VuICYmIG5leHRfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBuZXh0X3Rva2VuLnRleHQgPT09ICdlbHNlJykgJiZcbiAgICAgICAgICAgICAgICAgICAgIWZsYWdzLmRvX2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGhhY2t5IGJ1dCBlZmZlY3RpdmUgZm9yIHRoZSBtb21lbnRcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuaW1wb3J0X2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmltcG9ydF9ibG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc3RyaW5nKCkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIE9uZSBkaWZmZXJlbmNlIC0gc3RyaW5ncyB3YW50IGF0IGxlYXN0IGEgc3BhY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyB8fCBsYXN0X3R5cGUgPT09ICdUS19XT1JEJyB8fCBmbGFncy5pbmxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0NPTU1BJyB8fCBsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9FWFBSJyB8fCBsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGFydF9vZl9vYmplY3RfcHJvcGVydHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfZXF1YWxzKCkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5kZWNsYXJhdGlvbl9zdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBnb3QgYW4gJz0nIGluIGEgdmFyLWxpbmUsIGRpZmZlcmVudCBmb3JtYXR0aW5nL2xpbmUtYnJlYWtpbmcsIGV0YyB3aWxsIG5vdyBiZSBkb25lXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmRlY2xhcmF0aW9uX2Fzc2lnbm1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfY29tbWEoKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4sIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuZGVjbGFyYXRpb25fc3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc19leHByZXNzaW9uKGZsYWdzLnBhcmVudC5tb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90IGJyZWFrIG9uIGNvbW1hLCBmb3IodmFyIGEgPSAxLCBiID0gMilcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLmRlY2xhcmF0aW9uX2Fzc2lnbm1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5kZWNsYXJhdGlvbl9hc3NpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncy5kZWNsYXJhdGlvbl9hc3NpZ25tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHQuY29tbWFfZmlyc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBjb21tYS1maXJzdCwgd2Ugd2FudCB0byBhbGxvdyBhIG5ld2xpbmUgYmVmb3JlIHRoZSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gdHVybiBpbnRvIGEgbmV3bGluZSBhZnRlciB0aGUgY29tbWEsIHdoaWNoIHdlIHdpbGwgZml4dXAgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmxhZ3MubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsIHx8XG4gICAgICAgICAgICAgICAgICAgIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCAmJiBmbGFncy5wYXJlbnQubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFncy5pbmxpbmVfZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0LmNvbW1hX2ZpcnN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVYUFIgb3IgRE9fQkxPQ0tcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGNvbW1hLWZpcnN0LCB3ZSB3YW50IHRvIGFsbG93IGEgbmV3bGluZSBiZWZvcmUgdGhlIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHR1cm4gaW50byBhIG5ld2xpbmUgYWZ0ZXIgdGhlIGNvbW1hLCB3aGljaCB3ZSB3aWxsIGZpeHVwIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9vcGVyYXRvcigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNHZW5lcmF0b3JBc3RlcmlzayA9IGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJyonICYmXG4gICAgICAgICAgICAgICAgICAgICgobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWydmdW5jdGlvbicsICd5aWVsZCddKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShsYXN0X3R5cGUsIFsnVEtfU1RBUlRfQkxPQ0snLCAnVEtfQ09NTUEnLCAnVEtfRU5EX0JMT0NLJywgJ1RLX1NFTUlDT0xPTiddKSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB2YXIgaXNVbmFyeSA9IGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWyctJywgJysnXSkgJiYgKFxuICAgICAgICAgICAgICAgICAgICBpbl9hcnJheShsYXN0X3R5cGUsIFsnVEtfU1RBUlRfQkxPQ0snLCAnVEtfU1RBUlRfRVhQUicsICdUS19FUVVBTFMnLCAnVEtfT1BFUkFUT1InXSkgfHxcbiAgICAgICAgICAgICAgICAgICAgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBUb2tlbml6ZXIubGluZV9zdGFydGVycykgfHxcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MubGFzdF90ZXh0ID09PSAnLCdcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzID0gIWlzR2VuZXJhdG9yQXN0ZXJpc2s7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZV93aGl0ZXNwYWNlX2FuZF9jb21tZW50cyhjdXJyZW50X3Rva2VuLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaXNfc3BlY2lhbF93b3JkKGZsYWdzLmxhc3RfdGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gXCJyZXR1cm5cIiBoYWQgYSBzcGVjaWFsIGhhbmRsaW5nIGluIFRLX1dPUkQuIE5vdyB3ZSBuZWVkIHRvIHJldHVybiB0aGUgZmF2b3JcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBoYWNrIGZvciBhY3Rpb25zY3JpcHQncyBpbXBvcnQgLio7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJyonICYmIGxhc3RfdHlwZSA9PT0gJ1RLX0RPVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICc6OicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gc3BhY2VzIGFyb3VuZCBleG90aWMgbmFtZXNwYWNpbmcgc3ludGF4IG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBbGxvdyBsaW5lIHdyYXBwaW5nIGJldHdlZW4gb3BlcmF0b3JzIHdoZW4gb3BlcmF0b3JfcG9zaXRpb24gaXNcbiAgICAgICAgICAgICAgICAvLyAgIHNldCB0byBiZWZvcmUgb3IgcHJlc2VydmVcbiAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InICYmIGluX2FycmF5KG9wdC5vcGVyYXRvcl9wb3NpdGlvbiwgT1BFUkFUT1JfUE9TSVRJT05fQkVGT1JFX09SX1BSRVNFUlZFKSkge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJzonICYmIGZsYWdzLmluX2Nhc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuY2FzZV9ib2R5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaW5fY2FzZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlX2JlZm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlX2FmdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2YXIgaW5fdGVybmFyeSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICc6Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MudGVybmFyeV9kZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29sb24gaXMgaW52YWxpZCBqYXZhc2NyaXB0IG91dHNpZGUgb2YgdGVybmFyeSBhbmQgb2JqZWN0LCBidXQgZG8gb3VyIGJlc3QgdG8gZ3Vlc3Mgd2hhdCB3YXMgbWVhbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzLnRlcm5hcnlfZGVwdGggLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluX3Rlcm5hcnkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICc/Jykge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy50ZXJuYXJ5X2RlcHRoICs9IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gbGV0J3MgaGFuZGxlIHRoZSBvcGVyYXRvcl9wb3NpdGlvbiBvcHRpb24gcHJpb3IgdG8gYW55IGNvbmZsaWN0aW5nIGxvZ2ljXG4gICAgICAgICAgICAgICAgaWYgKCFpc1VuYXJ5ICYmICFpc0dlbmVyYXRvckFzdGVyaXNrICYmIG9wdC5wcmVzZXJ2ZV9uZXdsaW5lcyAmJiBpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFRva2VuaXplci5wb3NpdGlvbmFibGVfb3BlcmF0b3JzKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNDb2xvbiA9IGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJzonO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNUZXJuYXJ5Q29sb24gPSAoaXNDb2xvbiAmJiBpbl90ZXJuYXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzT3RoZXJDb2xvbiA9IChpc0NvbG9uICYmICFpbl90ZXJuYXJ5KTtcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG9wdC5vcGVyYXRvcl9wb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBPUEVSQVRPUl9QT1NJVElPTi5iZWZvcmVfbmV3bGluZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgY3VycmVudCB0b2tlbiBpcyA6IGFuZCBpdCdzIG5vdCBhIHRlcm5hcnkgc3RhdGVtZW50IHRoZW4gd2Ugc2V0IHNwYWNlX2JlZm9yZSB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSAhaXNPdGhlckNvbG9uO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNDb2xvbiB8fCBpc1Rlcm5hcnlDb2xvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIE9QRVJBVE9SX1BPU0lUSU9OLmFmdGVyX25ld2xpbmU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGN1cnJlbnQgdG9rZW4gaXMgYW55dGhpbmcgYnV0IGNvbG9uLCBvciAodmlhIGRlZHVjdGlvbikgaXQncyBhIGNvbG9uIGFuZCBpbiBhIHRlcm5hcnkgc3RhdGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgdGhlbiBwcmludCBhIG5ld2xpbmUuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNDb2xvbiB8fCBpc1Rlcm5hcnlDb2xvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0X3Rva2VuKDEpLndhbnRlZF9uZXdsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIE9QRVJBVE9SX1BPU0lUSU9OLnByZXNlcnZlX25ld2xpbmU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc090aGVyQ29sb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGp1c3QgYWRkZWQgYSBuZXdsaW5lLCBvciB0aGUgY3VycmVudCB0b2tlbiBpcyA6IGFuZCBpdCdzIG5vdCBhIHRlcm5hcnkgc3RhdGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgdGhlbiB3ZSBzZXQgc3BhY2VfYmVmb3JlIHRvIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gIShvdXRwdXQuanVzdF9hZGRlZF9uZXdsaW5lKCkgfHwgaXNPdGhlckNvbG9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSBzcGFjZV9iZWZvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNHZW5lcmF0b3JBc3Rlcmlzaykge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dF90b2tlbiA9IGdldF90b2tlbigxKTtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VfYWZ0ZXIgPSBuZXh0X3Rva2VuICYmIGluX2FycmF5KG5leHRfdG9rZW4udHlwZSwgWydUS19XT1JEJywgJ1RLX1JFU0VSVkVEJ10pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnLi4uJykge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJztcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VfYWZ0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWyctLScsICcrKycsICchJywgJ34nXSkgfHwgaXNVbmFyeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1bmFyeSBvcGVyYXRvcnMgKGFuZCBiaW5hcnkgKy8tIHByZXRlbmRpbmcgdG8gYmUgdW5hcnkpIHNwZWNpYWwgY2FzZXNcblxuICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VfYWZ0ZXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNS4xLyNzZWMtNy45LjFcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBuZXdsaW5lIGJldHdlZW4gLS0gb3IgKysgYW5kIGFueXRoaW5nIGVsc2Ugd2Ugc2hvdWxkIHByZXNlcnZlIGl0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi53YW50ZWRfbmV3bGluZSAmJiAoY3VycmVudF90b2tlbi50ZXh0ID09PSAnLS0nIHx8IGN1cnJlbnRfdG9rZW4udGV4dCA9PT0gJysrJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJzsnICYmIGlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciAoOzsgKytpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIF5eXlxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSAhKGZsYWdzLmxhc3RfdGV4dCA9PT0gJ10nICYmIChjdXJyZW50X3Rva2VuLnRleHQgPT09ICctLScgfHwgY3VycmVudF90b2tlbi50ZXh0ID09PSAnKysnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhKysgKyArK2I7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIC0gLWJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IGluX2FycmF5KGN1cnJlbnRfdG9rZW4udGV4dCwgWyctLScsICctJywgJysrJywgJysnXSkgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJy0tJywgJy0nLCAnKysnLCAnKyddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICsgYW5kIC0gYXJlIG5vdCB1bmFyeSB3aGVuIHByZWNlZWRlZCBieSAtLSBvciArKyBvcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYS0tICsgYlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSAqICtiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIC0gLWJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbl9hcnJheShjdXJyZW50X3Rva2VuLnRleHQsIFsnKycsICctJ10pICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWyctLScsICcrKyddKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlX2FmdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCgoZmxhZ3MubW9kZSA9PT0gTU9ERS5CbG9ja1N0YXRlbWVudCAmJiAhZmxhZ3MuaW5saW5lX2ZyYW1lKSB8fCBmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChmbGFncy5sYXN0X3RleHQgPT09ICd7JyB8fCBmbGFncy5sYXN0X3RleHQgPT09ICc7JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHsgZm9vOyAtLWkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9vKCk7IC0tYmFyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gfHwgc3BhY2VfYmVmb3JlO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHNwYWNlX2FmdGVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfYmxvY2tfY29tbWVudChwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0LnJhdykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuYWRkX3Jhd190b2tlbihjdXJyZW50X3Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4uZGlyZWN0aXZlcyAmJiBjdXJyZW50X3Rva2VuLmRpcmVjdGl2ZXMucHJlc2VydmUgPT09ICdlbmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSdyZSB0ZXN0aW5nIHRoZSByYXcgb3V0cHV0IGJlaGF2aW9yLCBkbyBub3QgYWxsb3cgYSBkaXJlY3RpdmUgdG8gdHVybiBpdCBvZmYuXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucmF3ID0gb3B0LnRlc3Rfb3V0cHV0X3JhdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4uZGlyZWN0aXZlcykge1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF90b2tlbi5kaXJlY3RpdmVzLnByZXNlcnZlID09PSAnc3RhcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucmF3ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlubGluZSBibG9ja1xuICAgICAgICAgICAgICAgIGlmICghYWNvcm4ubmV3bGluZS50ZXN0KGN1cnJlbnRfdG9rZW4udGV4dCkgJiYgIWN1cnJlbnRfdG9rZW4ud2FudGVkX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVzID0gc3BsaXRfbGluZWJyZWFrcyhjdXJyZW50X3Rva2VuLnRleHQpO1xuICAgICAgICAgICAgICAgIHZhciBqOyAvLyBpdGVyYXRvciBmb3IgdGhpcyBjYXNlXG4gICAgICAgICAgICAgICAgdmFyIGphdmFkb2MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgc3Rhcmxlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgbGFzdEluZGVudCA9IGN1cnJlbnRfdG9rZW4ud2hpdGVzcGFjZV9iZWZvcmU7XG4gICAgICAgICAgICAgICAgdmFyIGxhc3RJbmRlbnRMZW5ndGggPSBsYXN0SW5kZW50Lmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIC8vIGJsb2NrIGNvbW1lbnQgc3RhcnRzIHdpdGggYSBuZXcgbGluZVxuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgamF2YWRvYyA9IGFsbF9saW5lc19zdGFydF93aXRoKGxpbmVzLnNsaWNlKDEpLCAnKicpO1xuICAgICAgICAgICAgICAgICAgICBzdGFybGVzcyA9IGVhY2hfbGluZV9tYXRjaGVzX2luZGVudChsaW5lcy5zbGljZSgxKSwgbGFzdEluZGVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgbGluZSBhbHdheXMgaW5kZW50ZWRcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbihsaW5lc1swXSk7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoamF2YWRvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gamF2YWRvYzogcmVmb3JtYXQgYW5kIHJlLWluZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oJyAnICsgbHRyaW0obGluZXNbal0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGFybGVzcyAmJiBsaW5lc1tqXS5sZW5ndGggPiBsYXN0SW5kZW50TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGFybGVzczogcmUtaW5kZW50IG5vbi1lbXB0eSBjb250ZW50LCBhdm9pZGluZyB0cmltXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbihsaW5lc1tqXS5zdWJzdHJpbmcobGFzdEluZGVudExlbmd0aCkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9ybWFsIGNvbW1lbnRzIG91dHB1dCByYXdcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5hZGRfdG9rZW4obGluZXNbal0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZm9yIGNvbW1lbnRzIG9mIG1vcmUgdGhhbiBvbmUgbGluZSwgbWFrZSBzdXJlIHRoZXJlJ3MgYSBuZXcgbGluZSBhZnRlclxuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9jb21tZW50KHByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3Rva2VuLndhbnRlZF9uZXdsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnRyaW0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCBwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfZG90KCkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlX3doaXRlc3BhY2VfYW5kX2NvbW1lbnRzKGN1cnJlbnRfdG9rZW4sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaXNfc3BlY2lhbF93b3JkKGZsYWdzLmxhc3RfdGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsb3cgcHJlc2VydmVkIG5ld2xpbmVzIGJlZm9yZSBkb3RzIGluIGdlbmVyYWxcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yY2UgbmV3bGluZXMgb24gZG90cyBhZnRlciBjbG9zZSBwYXJlbiB3aGVuIGJyZWFrX2NoYWluZWQgLSBmb3IgYmFyKCkuYmF6KClcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShmbGFncy5sYXN0X3RleHQgPT09ICcpJyAmJiBvcHQuYnJlYWtfY2hhaW5lZF9tZXRob2RzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfdW5rbm93bihwcmVzZXJ2ZV9zdGF0ZW1lbnRfZmxhZ3MpIHtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfdG9rZW4udGV4dFtjdXJyZW50X3Rva2VuLnRleHQubGVuZ3RoIC0gMV0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHByZXNlcnZlX3N0YXRlbWVudF9mbGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVfZW9mKCkge1xuICAgICAgICAgICAgICAgIC8vIFVud2luZCBhbnkgb3BlbiBzdGF0ZW1lbnRzXG4gICAgICAgICAgICAgICAgd2hpbGUgKGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYW5kbGVfd2hpdGVzcGFjZV9hbmRfY29tbWVudHMoY3VycmVudF90b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIE91dHB1dExpbmUocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgX2NoYXJhY3Rlcl9jb3VudCA9IDA7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZW50X2NvdW50IGFzIGEgbWFya2VyIGZvciBsaW5lcyB0aGF0IGhhdmUgcHJlc2VydmVkIGluZGVudGF0aW9uXG4gICAgICAgICAgICB2YXIgX2luZGVudF9jb3VudCA9IC0xO1xuXG4gICAgICAgICAgICB2YXIgX2l0ZW1zID0gW107XG4gICAgICAgICAgICB2YXIgX2VtcHR5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5zZXRfaW5kZW50ID0gZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBfY2hhcmFjdGVyX2NvdW50ID0gcGFyZW50LmJhc2VJbmRlbnRMZW5ndGggKyBsZXZlbCAqIHBhcmVudC5pbmRlbnRfbGVuZ3RoO1xuICAgICAgICAgICAgICAgIF9pbmRlbnRfY291bnQgPSBsZXZlbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2NoYXJhY3Rlcl9jb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfY2hhcmFjdGVyX2NvdW50O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5pc19lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZW1wdHk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmxhc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2VtcHR5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfaXRlbXNbX2l0ZW1zLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHVzaCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgX2l0ZW1zLnB1c2goaW5wdXQpO1xuICAgICAgICAgICAgICAgIF9jaGFyYWN0ZXJfY291bnQgKz0gaW5wdXQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIF9lbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFfZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IF9pdGVtcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgX2NoYXJhY3Rlcl9jb3VudCAtPSBpdGVtLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgX2VtcHR5ID0gX2l0ZW1zLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnJlbW92ZV9pbmRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoX2luZGVudF9jb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgX2luZGVudF9jb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgICBfY2hhcmFjdGVyX2NvdW50IC09IHBhcmVudC5pbmRlbnRfbGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMudHJpbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmxhc3QoKSA9PT0gJyAnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pdGVtcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgX2NoYXJhY3Rlcl9jb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfZW1wdHkgPSBfaXRlbXMubGVuZ3RoID09PSAwO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2VtcHR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaW5kZW50X2NvdW50ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudC5pbmRlbnRfY2FjaGVbX2luZGVudF9jb3VudF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IF9pdGVtcy5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBPdXRwdXQoaW5kZW50X3N0cmluZywgYmFzZUluZGVudFN0cmluZykge1xuICAgICAgICAgICAgYmFzZUluZGVudFN0cmluZyA9IGJhc2VJbmRlbnRTdHJpbmcgfHwgJyc7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9jYWNoZSA9IFtiYXNlSW5kZW50U3RyaW5nXTtcbiAgICAgICAgICAgIHRoaXMuYmFzZUluZGVudExlbmd0aCA9IGJhc2VJbmRlbnRTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGVuZ3RoID0gaW5kZW50X3N0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnJhdyA9IGZhbHNlO1xuXG4gICAgICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuYmFzZUluZGVudFN0cmluZyA9IGJhc2VJbmRlbnRTdHJpbmc7XG4gICAgICAgICAgICB0aGlzLmluZGVudF9zdHJpbmcgPSBpbmRlbnRfc3RyaW5nO1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c19saW5lID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuYWRkX291dHB1dGxpbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzX2xpbmUgPSB0aGlzLmN1cnJlbnRfbGluZTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZSA9IG5ldyBPdXRwdXRMaW5lKHRoaXMpO1xuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2godGhpcy5jdXJyZW50X2xpbmUpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZVxuICAgICAgICAgICAgdGhpcy5hZGRfb3V0cHV0bGluZSgpO1xuXG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2xpbmVfbnVtYmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIG9iamVjdCBpbnN0ZWFkIG9mIHN0cmluZyB0byBhbGxvdyBmb3IgbGF0ZXIgZXhwYW5zaW9uIG9mIGluZm8gYWJvdXQgZWFjaCBsaW5lXG4gICAgICAgICAgICB0aGlzLmFkZF9uZXdfbGluZSA9IGZ1bmN0aW9uKGZvcmNlX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRfbGluZV9udW1iZXIoKSA9PT0gMSAmJiB0aGlzLmp1c3RfYWRkZWRfbmV3bGluZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gbmV3bGluZSBvbiBzdGFydCBvZiBmaWxlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlX25ld2xpbmUgfHwgIXRoaXMuanVzdF9hZGRlZF9uZXdsaW5lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJhdykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRfb3V0cHV0bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2NvZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3dlZXRfY29kZSA9IGxpbmVzLmpvaW4oJ1xcbicpLnJlcGxhY2UoL1tcXHJcXG5cXHQgXSskLywgJycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzd2VldF9jb2RlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5zZXRfaW5kZW50ID0gZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAvLyBOZXZlciBpbmRlbnQgeW91ciBmaXJzdCBvdXRwdXQgaW5kZW50IGF0IHRoZSBzdGFydCBvZiB0aGUgZmlsZVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChsZXZlbCA+PSB0aGlzLmluZGVudF9jYWNoZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X2NhY2hlLnB1c2godGhpcy5pbmRlbnRfY2FjaGVbdGhpcy5pbmRlbnRfY2FjaGUubGVuZ3RoIC0gMV0gKyB0aGlzLmluZGVudF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUuc2V0X2luZGVudChsZXZlbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5zZXRfaW5kZW50KDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuYWRkX3Jhd190b2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0b2tlbi5uZXdsaW5lczsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkX291dHB1dGxpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUucHVzaCh0b2tlbi53aGl0ZXNwYWNlX2JlZm9yZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUucHVzaCh0b2tlbi50ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5hZGRfdG9rZW4gPSBmdW5jdGlvbihwcmludGFibGVfdG9rZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZF9zcGFjZV9iZWZvcmVfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS5wdXNoKHByaW50YWJsZV90b2tlbik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmFkZF9zcGFjZV9iZWZvcmVfdG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zcGFjZV9iZWZvcmVfdG9rZW4gJiYgIXRoaXMuanVzdF9hZGRlZF9uZXdsaW5lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50X2xpbmUucHVzaCgnICcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdmVfcmVkdW5kYW50X2luZGVudGF0aW9uID0gZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGVmZmVjdGl2ZSBidXQgaGFzIHNvbWUgaXNzdWVzOlxuICAgICAgICAgICAgICAgIC8vICAgICAtIGNhbiBjYXVzZSBsaW5lIHdyYXAgdG8gaGFwcGVuIHRvbyBzb29uIGR1ZSB0byBpbmRlbnQgcmVtb3ZhbFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICBhZnRlciB3cmFwIHBvaW50cyBhcmUgY2FsY3VsYXRlZFxuICAgICAgICAgICAgICAgIC8vIFRoZXNlIGlzc3VlcyBhcmUgbWlub3IgY29tcGFyZWQgdG8gdWdseSBpbmRlbnRhdGlvbi5cblxuICAgICAgICAgICAgICAgIGlmIChmcmFtZS5tdWx0aWxpbmVfZnJhbWUgfHxcbiAgICAgICAgICAgICAgICAgICAgZnJhbWUubW9kZSA9PT0gTU9ERS5Gb3JJbml0aWFsaXplciB8fFxuICAgICAgICAgICAgICAgICAgICBmcmFtZS5tb2RlID09PSBNT0RFLkNvbmRpdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgb25lIGluZGVudCBmcm9tIGVhY2ggbGluZSBpbnNpZGUgdGhpcyBzZWN0aW9uXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZnJhbWUuc3RhcnRfbGluZV9pbmRleDtcblxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXRfbGVuZ3RoID0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IG91dHB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZXNbaW5kZXhdLnJlbW92ZV9pbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRyaW0gPSBmdW5jdGlvbihlYXRfbmV3bGluZXMpIHtcbiAgICAgICAgICAgICAgICBlYXRfbmV3bGluZXMgPSAoZWF0X25ld2xpbmVzID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBlYXRfbmV3bGluZXM7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRfbGluZS50cmltKGluZGVudF9zdHJpbmcsIGJhc2VJbmRlbnRTdHJpbmcpO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVhdF9uZXdsaW5lcyAmJiBsaW5lcy5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lLmlzX2VtcHR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lID0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9saW5lLnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzX2xpbmUgPSBsaW5lcy5sZW5ndGggPiAxID8gbGluZXNbbGluZXMubGVuZ3RoIC0gMl0gOiBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5qdXN0X2FkZGVkX25ld2xpbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50X2xpbmUuaXNfZW1wdHkoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuanVzdF9hZGRlZF9ibGFua2xpbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5qdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc3RhcnQgb2YgdGhlIGZpbGUgYW5kIG5ld2xpbmUgPSBibGFua1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxpbmUuaXNfZW1wdHkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBJbnB1dFNjYW5uZXIgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICAgICAgdmFyIF9pbnB1dCA9IGlucHV0O1xuICAgICAgICAgICAgdmFyIF9pbnB1dF9sZW5ndGggPSBfaW5wdXQubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIF9wb3NpdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIF9wb3NpdGlvbiAtPSAxO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5oYXNOZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9wb3NpdGlvbiA8IF9pbnB1dF9sZW5ndGg7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gX2lucHV0LmNoYXJBdChfcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBfcG9zaXRpb24gKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucGVlayA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IF9wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IF9pbnB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gX2lucHV0LmNoYXJBdChpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnBlZWtDaGFyQ29kZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IDA7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IF9wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IF9pbnB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gX2lucHV0LmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50ZXN0ID0gZnVuY3Rpb24ocGF0dGVybiwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG4gICAgICAgICAgICAgICAgcGF0dGVybi5sYXN0SW5kZXggPSBfcG9zaXRpb24gKyBpbmRleDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi50ZXN0KF9pbnB1dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnRlc3RDaGFyID0gZnVuY3Rpb24ocGF0dGVybiwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhpcy5wZWVrKGluZGV4KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsICE9PSBudWxsICYmIHBhdHRlcm4udGVzdCh2YWwpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5tYXRjaCA9IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IF9wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICB2YXIgcGF0dGVybl9tYXRjaCA9IHBhdHRlcm4uZXhlYyhfaW5wdXQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXR0ZXJuX21hdGNoICYmIHBhdHRlcm5fbWF0Y2guaW5kZXggPT09IF9wb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBfcG9zaXRpb24gKz0gcGF0dGVybl9tYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybl9tYXRjaCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuX21hdGNoO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgVG9rZW4gPSBmdW5jdGlvbih0eXBlLCB0ZXh0LCBuZXdsaW5lcywgd2hpdGVzcGFjZV9iZWZvcmUsIHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAgICAgICAgIC8vIGNvbW1lbnRzX2JlZm9yZSBhcmVcbiAgICAgICAgICAgIC8vIGNvbW1lbnRzIHRoYXQgaGF2ZSBhIG5ldyBsaW5lIGJlZm9yZSB0aGVtXG4gICAgICAgICAgICAvLyBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBhIG5ld2xpbmUgYWZ0ZXJcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgYSBzZXQgb2YgY29tbWVudHMgYmVmb3JlXG4gICAgICAgICAgICB0aGlzLmNvbW1lbnRzX2JlZm9yZSA9IC8qIGlubGluZSBjb21tZW50Ki8gW107XG5cblxuICAgICAgICAgICAgdGhpcy5jb21tZW50c19hZnRlciA9IFtdOyAvLyBubyBuZXcgbGluZSBiZWZvcmUgYW5kIG5ld2xpbmUgYWZ0ZXJcbiAgICAgICAgICAgIHRoaXMubmV3bGluZXMgPSBuZXdsaW5lcyB8fCAwO1xuICAgICAgICAgICAgdGhpcy53YW50ZWRfbmV3bGluZSA9IG5ld2xpbmVzID4gMDtcbiAgICAgICAgICAgIHRoaXMud2hpdGVzcGFjZV9iZWZvcmUgPSB3aGl0ZXNwYWNlX2JlZm9yZSB8fCAnJztcbiAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50IHx8IG51bGw7XG4gICAgICAgICAgICB0aGlzLm9wZW5lZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGl2ZXMgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuaXplcihpbnB1dF9zdHJpbmcsIG9wdHMpIHtcblxuICAgICAgICAgICAgdmFyIHdoaXRlc3BhY2UgPSBcIlxcblxcclxcdCBcIi5zcGxpdCgnJyk7XG4gICAgICAgICAgICB2YXIgZGlnaXQgPSAvWzAtOV0vO1xuICAgICAgICAgICAgdmFyIGRpZ2l0X2JpbiA9IC9bMDFdLztcbiAgICAgICAgICAgIHZhciBkaWdpdF9vY3QgPSAvWzAxMjM0NTY3XS87XG4gICAgICAgICAgICB2YXIgZGlnaXRfaGV4ID0gL1swMTIzNDU2Nzg5YWJjZGVmQUJDREVGXS87XG5cbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25hYmxlX29wZXJhdG9ycyA9ICchPSAhPT0gJSAmICYmICogKiogKyAtIC8gOiA8IDw8IDw9ID09ID09PSA+ID49ID4+ID4+PiA/IF4gfCB8fCcuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIHZhciBwdW5jdCA9IHRoaXMucG9zaXRpb25hYmxlX29wZXJhdG9ycy5jb25jYXQoXG4gICAgICAgICAgICAgICAgLy8gbm9uLXBvc2l0aW9uYWJsZSBvcGVyYXRvcnMgLSB0aGVzZSBkbyBub3QgZm9sbG93IG9wZXJhdG9yIHBvc2l0aW9uIHNldHRpbmdzXG4gICAgICAgICAgICAgICAgJyEgJT0gJj0gKj0gKio9ICsrICs9ICwgLS0gLT0gLz0gOjogPDw9ID0gPT4gPj49ID4+Pj0gXj0gfD0gfiAuLi4nLnNwbGl0KCcgJykpO1xuXG4gICAgICAgICAgICAvLyB3b3JkcyB3aGljaCBzaG91bGQgYWx3YXlzIHN0YXJ0IG9uIG5ldyBsaW5lLlxuICAgICAgICAgICAgdGhpcy5saW5lX3N0YXJ0ZXJzID0gJ2NvbnRpbnVlLHRyeSx0aHJvdyxyZXR1cm4sdmFyLGxldCxjb25zdCxpZixzd2l0Y2gsY2FzZSxkZWZhdWx0LGZvcix3aGlsZSxicmVhayxmdW5jdGlvbixpbXBvcnQsZXhwb3J0Jy5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgdmFyIHJlc2VydmVkX3dvcmRzID0gdGhpcy5saW5lX3N0YXJ0ZXJzLmNvbmNhdChbJ2RvJywgJ2luJywgJ29mJywgJ2Vsc2UnLCAnZ2V0JywgJ3NldCcsICduZXcnLCAnY2F0Y2gnLCAnZmluYWxseScsICd0eXBlb2YnLCAneWllbGQnLCAnYXN5bmMnLCAnYXdhaXQnLCAnZnJvbScsICdhcyddKTtcblxuICAgICAgICAgICAgLy8gIC8qIC4uLiAqLyBjb21tZW50IGVuZHMgd2l0aCBuZWFyZXN0ICovIG9yIGVuZCBvZiBmaWxlXG4gICAgICAgICAgICB2YXIgYmxvY2tfY29tbWVudF9wYXR0ZXJuID0gLyhbXFxzXFxTXSo/KSgoPzpcXCpcXC8pfCQpL2c7XG5cbiAgICAgICAgICAgIC8vIGNvbW1lbnQgZW5kcyBqdXN0IGJlZm9yZSBuZWFyZXN0IGxpbmVmZWVkIG9yIGVuZCBvZiBmaWxlXG4gICAgICAgICAgICB2YXIgY29tbWVudF9wYXR0ZXJuID0gLyhbXlxcblxcclxcdTIwMjhcXHUyMDI5XSopL2c7XG5cbiAgICAgICAgICAgIHZhciBkaXJlY3RpdmVzX2Jsb2NrX3BhdHRlcm4gPSAvXFwvXFwqIGJlYXV0aWZ5KCBcXHcrWzpdXFx3KykrIFxcKlxcLy9nO1xuICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZV9wYXR0ZXJuID0gLyAoXFx3KylbOl0oXFx3KykvZztcbiAgICAgICAgICAgIHZhciBkaXJlY3RpdmVzX2VuZF9pZ25vcmVfcGF0dGVybiA9IC8oW1xcc1xcU10qPykoKD86XFwvXFwqXFxzYmVhdXRpZnlcXHNpZ25vcmU6ZW5kXFxzXFwqXFwvKXwkKS9nO1xuXG4gICAgICAgICAgICB2YXIgdGVtcGxhdGVfcGF0dGVybiA9IC8oKDxcXD9waHB8PFxcPz0pW1xcc1xcU10qP1xcPz4pfCg8JVtcXHNcXFNdKj8lPikvZztcblxuICAgICAgICAgICAgdmFyIG5fbmV3bGluZXMsIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuLCBpbl9odG1sX2NvbW1lbnQsIHRva2VucztcbiAgICAgICAgICAgIHZhciBpbnB1dDtcblxuICAgICAgICAgICAgdGhpcy50b2tlbml6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbmV3IElucHV0U2Nhbm5lcihpbnB1dF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgIGluX2h0bWxfY29tbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRva2VucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIG5leHQsIGxhc3Q7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuX3ZhbHVlcztcbiAgICAgICAgICAgICAgICB2YXIgb3BlbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIG9wZW5fc3RhY2sgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHdoaWxlICghKGxhc3QgJiYgbGFzdC50eXBlID09PSAnVEtfRU9GJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5fdmFsdWVzID0gdG9rZW5pemVfbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0ID0gbmV3IFRva2VuKHRva2VuX3ZhbHVlc1sxXSwgdG9rZW5fdmFsdWVzWzBdLCBuX25ld2xpbmVzLCB3aGl0ZXNwYWNlX2JlZm9yZV90b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChuZXh0LnR5cGUgPT09ICdUS19DT01NRU5UJyB8fCBuZXh0LnR5cGUgPT09ICdUS19CTE9DS19DT01NRU5UJyB8fCBuZXh0LnR5cGUgPT09ICdUS19VTktOT1dOJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQudHlwZSA9PT0gJ1RLX0JMT0NLX0NPTU1FTlQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5kaXJlY3RpdmVzID0gdG9rZW5fdmFsdWVzWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHMucHVzaChuZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuX3ZhbHVlcyA9IHRva2VuaXplX25leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSBuZXcgVG9rZW4odG9rZW5fdmFsdWVzWzFdLCB0b2tlbl92YWx1ZXNbMF0sIG5fbmV3bGluZXMsIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQuY29tbWVudHNfYmVmb3JlID0gY29tbWVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQudHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJyB8fCBuZXh0LnR5cGUgPT09ICdUS19TVEFSVF9FWFBSJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5wYXJlbnQgPSBsYXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgb3Blbl9zdGFjay5wdXNoKG9wZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbiA9IG5leHQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKG5leHQudHlwZSA9PT0gJ1RLX0VORF9CTE9DSycgfHwgbmV4dC50eXBlID09PSAnVEtfRU5EX0VYUFInKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKG9wZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuZXh0LnRleHQgPT09ICddJyAmJiBvcGVuLnRleHQgPT09ICdbJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmV4dC50ZXh0ID09PSAnKScgJiYgb3Blbi50ZXh0ID09PSAnKCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5leHQudGV4dCA9PT0gJ30nICYmIG9wZW4udGV4dCA9PT0gJ3snKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0LnBhcmVudCA9IG9wZW4ucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5vcGVuZWQgPSBvcGVuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gb3Blbl9zdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5wdXNoKG5leHQpO1xuICAgICAgICAgICAgICAgICAgICBsYXN0ID0gbmV4dDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW5zO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0X2RpcmVjdGl2ZXModGV4dCkge1xuICAgICAgICAgICAgICAgIGlmICghdGV4dC5tYXRjaChkaXJlY3RpdmVzX2Jsb2NrX3BhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBkaXJlY3RpdmVzID0ge307XG4gICAgICAgICAgICAgICAgZGlyZWN0aXZlX3BhdHRlcm4ubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aXZlX21hdGNoID0gZGlyZWN0aXZlX3BhdHRlcm4uZXhlYyh0ZXh0KTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChkaXJlY3RpdmVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlc1tkaXJlY3RpdmVfbWF0Y2hbMV1dID0gZGlyZWN0aXZlX21hdGNoWzJdO1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVfbWF0Y2ggPSBkaXJlY3RpdmVfcGF0dGVybi5leGVjKHRleHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3RpdmVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB0b2tlbml6ZV9uZXh0KCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHRpbmdfc3RyaW5nO1xuICAgICAgICAgICAgICAgIHZhciB3aGl0ZXNwYWNlX29uX3RoaXNfbGluZSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgbl9uZXdsaW5lcyA9IDA7XG4gICAgICAgICAgICAgICAgd2hpdGVzcGFjZV9iZWZvcmVfdG9rZW4gPSAnJztcblxuICAgICAgICAgICAgICAgIHZhciBjID0gaW5wdXQubmV4dCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBsYXN0X3Rva2VuO1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfdG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciB0aGUgc2FrZSBvZiB0b2tlbml6aW5nIHdlIGNhbiBwcmV0ZW5kIHRoYXQgdGhlcmUgd2FzIG9uIG9wZW4gYnJhY2UgdG8gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgbGFzdF90b2tlbiA9IG5ldyBUb2tlbignVEtfU1RBUlRfQkxPQ0snLCAneycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlIChpbl9hcnJheShjLCB3aGl0ZXNwYWNlKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY29ybi5uZXdsaW5lLnRlc3QoYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGMgPT09ICdcXG4nICYmIGlucHV0LnBlZWsoLTIpID09PSAnXFxyJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuX25ld2xpbmVzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVzcGFjZV9vbl90aGlzX2xpbmUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlc3BhY2Vfb25fdGhpc19saW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjID0gaW5wdXQubmV4dCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWycnLCAnVEtfRU9GJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAod2hpdGVzcGFjZV9vbl90aGlzX2xpbmUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuID0gd2hpdGVzcGFjZV9vbl90aGlzX2xpbmUuam9pbignJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRpZ2l0LnRlc3QoYykgfHwgKGMgPT09ICcuJyAmJiBpbnB1dC50ZXN0Q2hhcihkaWdpdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGxvd19kZWNpbWFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsbG93X2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG9jYWxfZGlnaXQgPSBkaWdpdDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJzAnICYmIGlucHV0LnRlc3RDaGFyKC9bWHhPb0JiXS8pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzd2l0Y2ggdG8gaGV4L29jdC9iaW4gbnVtYmVyLCBubyBkZWNpbWFsIG9yIGUsIGp1c3QgaGV4L29jdC9iaW4gZGlnaXRzXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd19kZWNpbWFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd19lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQudGVzdENoYXIoL1tCYl0vKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2RpZ2l0ID0gZGlnaXRfYmluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnB1dC50ZXN0Q2hhcigvW09vXS8pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxfZGlnaXQgPSBkaWdpdF9vY3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2RpZ2l0ID0gZGlnaXRfaGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBbHJlYWR5IGhhdmUgYSBkZWNpbWFsIGZvciB0aGlzIGxpdGVyYWwsIGRvbid0IGFsbG93IGFub3RoZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2RlY2ltYWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGtub3cgdGhpcyBmaXJzdCBsb29wIHdpbGwgcnVuLiAgSXQga2VlcHMgdGhlIGxvZ2ljIHNpbXBsZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5iYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGRpZ2l0c1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXQudGVzdENoYXIobG9jYWxfZGlnaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsbG93X2RlY2ltYWwgJiYgaW5wdXQucGVlaygpID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd19kZWNpbWFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgPSAxLmUtNyBpcyB2YWxpZCwgc28gd2UgdGVzdCBmb3IgLiB0aGVuIGUgaW4gb25lIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbGxvd19lICYmIGlucHV0LnRlc3RDaGFyKC9bRWVdLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC50ZXN0Q2hhcigvWystXS8pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93X2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd19kZWNpbWFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19XT1JEJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjb3JuLmlzSWRlbnRpZmllclN0YXJ0KGlucHV0LnBlZWtDaGFyQ29kZSgtMSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChhY29ybi5pc0lkZW50aWZpZXJDaGFyKGlucHV0LnBlZWtDaGFyQ29kZSgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXQuaGFzTmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGxhc3RfdG9rZW4udHlwZSA9PT0gJ1RLX0RPVCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobGFzdF90b2tlbi50eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGxhc3RfdG9rZW4udGV4dCwgWydzZXQnLCAnZ2V0J10pKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluX2FycmF5KGMsIHJlc2VydmVkX3dvcmRzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09ICdpbicgfHwgYyA9PT0gJ29mJykgeyAvLyBoYWNrIGZvciAnaW4nIGFuZCAnb2YnIG9wZXJhdG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX09QRVJBVE9SJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19SRVNFUlZFRCddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfV09SRCddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnKCcgfHwgYyA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX1NUQVJUX0VYUFInXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJyknIHx8IGMgPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19FTkRfRVhQUiddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfU1RBUlRfQkxPQ0snXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0VORF9CTE9DSyddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnOycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfU0VNSUNPTE9OJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWVudCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWVudF9tYXRjaDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcGVlayBmb3IgY29tbWVudCAvKiAuLi4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnBlZWsoKSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50X21hdGNoID0gaW5wdXQubWF0Y2goYmxvY2tfY29tbWVudF9wYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAnLyonICsgY29tbWVudF9tYXRjaFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3RpdmVzID0gZ2V0X2RpcmVjdGl2ZXMoY29tbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aXZlcyAmJiBkaXJlY3RpdmVzLmlnbm9yZSA9PT0gJ3N0YXJ0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRfbWF0Y2ggPSBpbnB1dC5tYXRjaChkaXJlY3RpdmVzX2VuZF9pZ25vcmVfcGF0dGVybik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCArPSBjb21tZW50X21hdGNoWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGNvbW1lbnQucmVwbGFjZShhY29ybi5hbGxMaW5lQnJlYWtzLCAnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2NvbW1lbnQsICdUS19CTE9DS19DT01NRU5UJywgZGlyZWN0aXZlc107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gcGVlayBmb3IgY29tbWVudCAvLyAuLi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnBlZWsoKSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50X21hdGNoID0gaW5wdXQubWF0Y2goY29tbWVudF9wYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAnLy8nICsgY29tbWVudF9tYXRjaFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbY29tbWVudCwgJ1RLX0NPTU1FTlQnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0WG1sUmVnRXhwID0gLzwoKShbLWEtekEtWjowLTlfLl0rfHtbXFxzXFxTXSs/fXwhXFxbQ0RBVEFcXFtbXFxzXFxTXSo/XFxdXFxdKShcXHMre1tcXHNcXFNdKz99fFxccytbLWEtekEtWjowLTlfLl0rfFxccytbLWEtekEtWjowLTlfLl0rXFxzKj1cXHMqKCdbXiddKid8XCJbXlwiXSpcInx7W1xcc1xcU10rP30pKSpcXHMqKFxcLz8pXFxzKj4vZztcblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnYCcgfHwgYyA9PT0gXCInXCIgfHwgYyA9PT0gJ1wiJyB8fCAvLyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGMgPT09ICcvJykgfHwgLy8gcmVnZXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAob3B0cy5lNHggJiYgYyA9PT0gXCI8XCIgJiYgaW5wdXQudGVzdChzdGFydFhtbFJlZ0V4cCwgLTEpKSAvLyB4bWxcbiAgICAgICAgICAgICAgICAgICAgKSAmJiAoIC8vIHJlZ2V4IGFuZCB4bWwgY2FuIG9ubHkgYXBwZWFyIGluIHNwZWNpZmljIGxvY2F0aW9ucyBkdXJpbmcgcGFyc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgKGxhc3RfdG9rZW4udHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShsYXN0X3Rva2VuLnRleHQsIFsncmV0dXJuJywgJ2Nhc2UnLCAndGhyb3cnLCAnZWxzZScsICdkbycsICd0eXBlb2YnLCAneWllbGQnXSkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAobGFzdF90b2tlbi50eXBlID09PSAnVEtfRU5EX0VYUFInICYmIGxhc3RfdG9rZW4udGV4dCA9PT0gJyknICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF90b2tlbi5wYXJlbnQgJiYgbGFzdF90b2tlbi5wYXJlbnQudHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShsYXN0X3Rva2VuLnBhcmVudC50ZXh0LCBbJ2lmJywgJ3doaWxlJywgJ2ZvciddKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShsYXN0X3Rva2VuLnR5cGUsIFsnVEtfQ09NTUVOVCcsICdUS19TVEFSVF9FWFBSJywgJ1RLX1NUQVJUX0JMT0NLJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVEtfRU5EX0JMT0NLJywgJ1RLX09QRVJBVE9SJywgJ1RLX0VRVUFMUycsICdUS19FT0YnLCAnVEtfU0VNSUNPTE9OJywgJ1RLX0NPTU1BJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXSkpXG4gICAgICAgICAgICAgICAgICAgICkpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VwID0gYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzX2NoYXJfZXNjYXBlcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgPSBjO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXAgPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSByZWdleHBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5fY2hhcl9jbGFzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlucHV0Lmhhc05leHQoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoZXNjIHx8IGluX2NoYXJfY2xhc3MgfHwgaW5wdXQucGVlaygpICE9PSBzZXApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFpbnB1dC50ZXN0Q2hhcihhY29ybi5uZXdsaW5lKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9IGlucHV0LnBlZWsoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc2MgPSBpbnB1dC5wZWVrKCkgPT09ICdcXFxcJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnBlZWsoKSA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbl9jaGFyX2NsYXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5wZWVrKCkgPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5fY2hhcl9jbGFzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXNjID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRzLmU0eCAmJiBzZXAgPT09ICc8Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBlNHggeG1sIGxpdGVyYWxzXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeG1sUmVnRXhwID0gL1tcXHNcXFNdKj88KFxcLz8pKFstYS16QS1aOjAtOV8uXSt8e1tcXHNcXFNdKz99fCFcXFtDREFUQVxcW1tcXHNcXFNdKj9cXF1cXF0pKFxccyt7W1xcc1xcU10rP318XFxzK1stYS16QS1aOjAtOV8uXSt8XFxzK1stYS16QS1aOjAtOV8uXStcXHMqPVxccyooJ1teJ10qJ3xcIlteXCJdKlwifHtbXFxzXFxTXSs/fSkpKlxccyooXFwvPylcXHMqPi9nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHhtbFN0ciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gaW5wdXQubWF0Y2goc3RhcnRYbWxSZWdFeHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJpbSByb290IHRhZyB0byBhdHRlbXB0IHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3RUYWcgPSBtYXRjaFsyXS5yZXBsYWNlKC9ee1xccysvLCAneycpLnJlcGxhY2UoL1xccyt9JC8sICd9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzQ3VybHlSb290ID0gcm9vdFRhZy5pbmRleE9mKCd7JykgPT09IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlcHRoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzRW5kVGFnID0gISFtYXRjaFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzU2luZ2xldG9uVGFnID0gKCEhbWF0Y2hbbWF0Y2gubGVuZ3RoIC0gMV0pIHx8ICh0YWdOYW1lLnNsaWNlKDAsIDgpID09PSBcIiFbQ0RBVEFbXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU2luZ2xldG9uVGFnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGFnTmFtZSA9PT0gcm9vdFRhZyB8fCAoaXNDdXJseVJvb3QgJiYgdGFnTmFtZS5yZXBsYWNlKC9ee1xccysvLCAneycpLnJlcGxhY2UoL1xccyt9JC8sICd9JykpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzRW5kVGFnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS1kZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytkZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxTdHIgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXB0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGlucHV0Lm1hdGNoKHhtbFJlZ0V4cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBjbG9zZSBjb3JyZWN0bHksIGtlZXAgdW5mb3JtYXR0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxTdHIgKz0gaW5wdXQubWF0Y2goL1tcXHNcXFNdKi9nKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sU3RyID0geG1sU3RyLnJlcGxhY2UoYWNvcm4uYWxsTGluZUJyZWFrcywgJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbeG1sU3RyLCBcIlRLX1NUUklOR1wiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlX3N0cmluZyA9IGZ1bmN0aW9uKGRlbGltaXRlciwgYWxsb3dfdW5lc2NhcGVkX25ld2xpbmVzLCBzdGFydF9zdWIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUZW1wbGF0ZSBzdHJpbmdzIGNhbiB0cmF2ZXJzIGxpbmVzIHdpdGhvdXQgZXNjYXBlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXIgc3RyaW5ncyBjYW5ub3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudF9jaGFyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9jaGFyID0gaW5wdXQucGVlaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShlc2MgfHwgKGN1cnJlbnRfY2hhciAhPT0gZGVsaW1pdGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGFsbG93X3VuZXNjYXBlZF9uZXdsaW5lcyB8fCAhYWNvcm4ubmV3bGluZS50ZXN0KGN1cnJlbnRfY2hhcikpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIFxcclxcbiBsaW5lYnJlYWtzIGFmdGVyIGVzY2FwZXMgb3IgaW4gdGVtcGxhdGUgc3RyaW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGVzYyB8fCBhbGxvd191bmVzY2FwZWRfbmV3bGluZXMpICYmIGFjb3JuLm5ld2xpbmUudGVzdChjdXJyZW50X2NoYXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9jaGFyID09PSAnXFxyJyAmJiBpbnB1dC5wZWVrKDEpID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXIgPSBpbnB1dC5wZWVrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBjdXJyZW50X2NoYXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9jaGFyID09PSAneCcgfHwgY3VycmVudF9jaGFyID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNfY2hhcl9lc2NhcGVzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXNjID0gY3VycmVudF9jaGFyID09PSAnXFxcXCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0X3N1YiAmJiByZXN1bHRpbmdfc3RyaW5nLmluZGV4T2Yoc3RhcnRfc3ViLCByZXN1bHRpbmdfc3RyaW5nLmxlbmd0aCAtIHN0YXJ0X3N1Yi5sZW5ndGgpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGltaXRlciA9PT0gJ2AnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Vfc3RyaW5nKCd9JywgYWxsb3dfdW5lc2NhcGVkX25ld2xpbmVzLCAnYCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9zdHJpbmcoJ2AnLCBhbGxvd191bmVzY2FwZWRfbmV3bGluZXMsICckeycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuaGFzTmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VwID09PSAnYCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9zdHJpbmcoJ2AnLCB0cnVlLCAnJHsnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Vfc3RyaW5nKHNlcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzX2NoYXJfZXNjYXBlcyAmJiBvcHRzLnVuZXNjYXBlX3N0cmluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgPSB1bmVzY2FwZV9zdHJpbmcocmVzdWx0aW5nX3N0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQucGVlaygpID09PSBzZXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gc2VwO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VwID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZWdleHBzIG1heSBoYXZlIG1vZGlmaWVycyAvcmVnZXhwL01PRCAsIHNvIGZldGNoIHRob3NlLCB0b29cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IFtnaW1dIGFyZSB2YWxpZCwgYnV0IGlmIHRoZSB1c2VyIHB1dHMgaW4gZ2FyYmFnZSwgZG8gd2hhdCB3ZSBjYW4gdG8gdGFrZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXQuaGFzTmV4dCgpICYmIGFjb3JuLmlzSWRlbnRpZmllclN0YXJ0KGlucHV0LnBlZWtDaGFyQ29kZSgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9IGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHRpbmdfc3RyaW5nLCAnVEtfU1RSSU5HJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcjJykge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbnMubGVuZ3RoID09PSAwICYmIGlucHV0LnBlZWsoKSA9PT0gJyEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaGViYW5nXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC5oYXNOZXh0KCkgJiYgYyAhPT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdHJpbShyZXN1bHRpbmdfc3RyaW5nKSArICdcXG4nLCAnVEtfVU5LTk9XTiddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNwaWRlcm1vbmtleS1zcGVjaWZpYyBzaGFycCB2YXJpYWJsZXMgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vU2hhcnBfdmFyaWFibGVzX2luX0phdmFTY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cDovL214ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvc291cmNlL2pzL3NyYy9qc3NjYW4uY3BwIGFyb3VuZCBsaW5lIDE5MzVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNoYXJwID0gJyMnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuaGFzTmV4dCgpICYmIGlucHV0LnRlc3RDaGFyKGRpZ2l0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcnAgKz0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGlucHV0Lmhhc05leHQoKSAmJiBjICE9PSAnIycgJiYgYyAhPT0gJz0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjID09PSAnIycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5wZWVrKCkgPT09ICdbJyAmJiBpbnB1dC5wZWVrKDEpID09PSAnXScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFycCArPSAnW10nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LnBlZWsoKSA9PT0gJ3snICYmIGlucHV0LnBlZWsoMSkgPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXJwICs9ICd7fSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbc2hhcnAsICdUS19XT1JEJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJzwnICYmIChpbnB1dC5wZWVrKCkgPT09ICc/JyB8fCBpbnB1dC5wZWVrKCkgPT09ICclJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGVfbWF0Y2ggPSBpbnB1dC5tYXRjaCh0ZW1wbGF0ZV9wYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlX21hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gdGVtcGxhdGVfbWF0Y2hbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gYy5yZXBsYWNlKGFjb3JuLmFsbExpbmVCcmVha3MsICdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX1NUUklORyddO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICc8JyAmJiBpbnB1dC5tYXRjaCgvXFwhLS0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYyA9ICc8IS0tJztcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlucHV0Lmhhc05leHQoKSAmJiAhaW5wdXQudGVzdENoYXIoYWNvcm4ubmV3bGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGluX2h0bWxfY29tbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0NPTU1FTlQnXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJy0nICYmIGluX2h0bWxfY29tbWVudCAmJiBpbnB1dC5tYXRjaCgvLT4vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5faHRtbF9jb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbJy0tPicsICdUS19DT01NRU5UJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQucGVlaygpID09PSAnLicgJiYgaW5wdXQucGVlaygxKSA9PT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0Lm5leHQoKSArIGlucHV0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX09QRVJBVE9SJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfRE9UJ107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGluX2FycmF5KGMsIHB1bmN0KSkge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXQuaGFzTmV4dCgpICYmIGluX2FycmF5KGMgKyBpbnB1dC5wZWVrKCksIHB1bmN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYyArPSBpbnB1dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlucHV0Lmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09ICcsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfQ09NTUEnXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0VRVUFMUyddO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfT1BFUkFUT1InXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX1VOS05PV04nXTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBmdW5jdGlvbiB1bmVzY2FwZV9zdHJpbmcocykge1xuICAgICAgICAgICAgICAgIC8vIFlvdSB0aGluayB0aGF0IGEgcmVnZXggd291bGQgd29yayBmb3IgdGhpc1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiBzLnJlcGxhY2UoL1xcXFx4KFswLTlhLWZdezJ9KS9naSwgZnVuY3Rpb24obWF0Y2gsIHZhbCkge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQodmFsLCAxNikpO1xuICAgICAgICAgICAgICAgIC8vICAgICB9KVxuICAgICAgICAgICAgICAgIC8vIEhvd2V2ZXIsIGRlYWxpbmcgd2l0aCAnXFx4ZmYnLCAnXFxcXHhmZicsICdcXFxcXFx4ZmYnIG1ha2VzIHRoaXMgbW9yZSBmdW4uXG4gICAgICAgICAgICAgICAgdmFyIG91dCA9ICcnLFxuICAgICAgICAgICAgICAgICAgICBlc2NhcGVkID0gMDtcblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dF9zY2FuID0gbmV3IElucHV0U2Nhbm5lcihzKTtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlZCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaW5wdXRfc2Nhbi5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCBhbnkgd2hpdGVzcGFjZSwgbm9uLXNsYXNoIGNoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBrZWVwIHNsYXNoIHBhaXJzLlxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gaW5wdXRfc2Nhbi5tYXRjaCgvKFtcXHNdfFteXFxcXF18XFxcXFxcXFwpKy9nKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ICs9IG1hdGNoZWRbMF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfc2Nhbi5wZWVrKCkgPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRfc2Nhbi5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfc2Nhbi5wZWVrKCkgPT09ICd4Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBpbnB1dF9zY2FuLm1hdGNoKC94KFswLTlBLUZhLWZdezJ9KS9nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5wdXRfc2Nhbi5wZWVrKCkgPT09ICd1Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBpbnB1dF9zY2FuLm1hdGNoKC91KFswLTlBLUZhLWZdezR9KS9nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0ICs9ICdcXFxcJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRfc2Nhbi5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0ICs9IGlucHV0X3NjYW4ubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBzb21lIGVycm9yIGRlY29kaW5nLCByZXR1cm4gdGhlIG9yaWdpbmFsIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBwYXJzZUludChtYXRjaGVkWzFdLCAxNik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlc2NhcGVkID4gMHg3ZSAmJiBlc2NhcGVkIDw9IDB4ZmYgJiYgbWF0Y2hlZFswXS5pbmRleE9mKCd4JykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBiYWlsIG91dCBvbiBcXHg3Zi4uXFx4ZmYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGVhdmluZyB3aG9sZSBzdHJpbmcgZXNjYXBlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcyBpdCdzIHByb2JhYmx5IGNvbXBsZXRlbHkgYmluYXJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVzY2FwZWQgPj0gMHgwMCAmJiBlc2NhcGVkIDwgMHgyMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlYXZlIDB4MDAuLi4weDFmIGVzY2FwZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gJ1xcXFwnICsgbWF0Y2hlZFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXNjYXBlZCA9PT0gMHgyMiB8fCBlc2NhcGVkID09PSAweDI3IHx8IGVzY2FwZWQgPT09IDB4NWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUtcXVvdGUsIGFwb3N0cm9waGUsIGJhY2tzbGFzaCAtIGVzY2FwZSB0aGVzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dCArPSAnXFxcXCcgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGVzY2FwZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShlc2NhcGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVhdXRpZmllciA9IG5ldyBCZWF1dGlmaWVyKGpzX3NvdXJjZV90ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGJlYXV0aWZpZXIuYmVhdXRpZnkoKTtcblxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGpzX2JlYXV0aWZ5OiBqc19iZWF1dGlmeSB9O1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBDb21tb25KUy4gSnVzdCBwdXQgdGhpcyBmaWxlIHNvbWV3aGVyZSBvbiB5b3VyIHJlcXVpcmUucGF0aHNcbiAgICAgICAgLy8gYW5kIHlvdSB3aWxsIGJlIGFibGUgdG8gYHZhciBqc19iZWF1dGlmeSA9IHJlcXVpcmUoXCJiZWF1dGlmeVwiKS5qc19iZWF1dGlmeWAuXG4gICAgICAgIGV4cG9ydHMuanNfYmVhdXRpZnkgPSBqc19iZWF1dGlmeTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgcnVubmluZyBhIHdlYiBwYWdlIGFuZCBkb24ndCBoYXZlIGVpdGhlciBvZiB0aGUgYWJvdmUsIGFkZCBvdXIgb25lIGdsb2JhbFxuICAgICAgICB3aW5kb3cuanNfYmVhdXRpZnkgPSBqc19iZWF1dGlmeTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZXZlbiBoYXZlIHdpbmRvdywgdHJ5IGdsb2JhbC5cbiAgICAgICAgZ2xvYmFsLmpzX2JlYXV0aWZ5ID0ganNfYmVhdXRpZnk7XG4gICAgfVxuXG59KCkpOyIsInJpb3QudGFnMignZGVidWdnZXInLCAnPGIgaWQ9XCJzdGlja1wiIG9uY2xpY2s9XCJ7c3RpY2tUb2dnbGV9XCIgaWY9XCJ7b3Blbn1cIj57c3RpY2tJbmRpY2F0b3J9PC9iPjxzZWxlY3Qgb25jaGFuZ2U9XCJ7Y2hhbmdlUG9zfVwiIGlmPVwie29wZW59XCI+PG9wdGlvbj50b3AtcmlnaHQ8L29wdGlvbj48b3B0aW9uPnRvcC1sZWZ0PC9vcHRpb24+PG9wdGlvbiBzZWxlY3RlZD1cIlwiPmJvdHRvbS1yaWdodDwvb3B0aW9uPjxvcHRpb24+Ym90dG9tLWxlZnQ8L29wdGlvbj48L3NlbGVjdD48YiBpZD1cImNsZWFyXCIgb25jbGljaz1cIntjbGVhcn1cIiBpZj1cIntvcGVufVwiPmNsZWFyPC9iPjxoMyBvbmNsaWNrPVwie3RvZ2dsZX1cIj48YiBpZD1cInRvZ2dsZVwiPnt0b2dnbGVJbmRpY2F0b3J9PC9iPiBEZWJ1Z2dlciA8L2gzPjxzZWN0aW9uIGlkPVwiYWN0aW9uc1wiPjxkZWJ1Z2l0ZW0gZWFjaD1cInthY3Rpb25zfVwiPjwvZGVidWdpdGVtPjxwIGNsYXNzPVwibWVzc2FnZVwiIG9uY2xpY2s9XCJ7Y2hhbmdlTnVtQWN0aW9uc31cIj4gU2hvd2luZyBsYXN0IHtudW1BY3Rpb25zfSBhY3Rpb25zLi4uIDwvcD48L3NlY3Rpb24+JywgJ2RlYnVnZ2VyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl17IHBvc2l0aW9uOiBmaXhlZDsgei1pbmRleDogOTk5OTsgYm90dG9tOiAxMHB4OyByaWdodDogLTMwMHB4OyBvcGFjaXR5OiAwLjI1OyB3aWR0aDogNDAwcHg7IGhlaWdodDogNjAwcHg7IGJhY2tncm91bmQ6ICNlZWU7IGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IGZvbnQtc2l6ZTogMTFweDsgfSBkZWJ1Z2dlci50b3AtbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0LGRlYnVnZ2VyLnRvcC1yaWdodCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodHsgdG9wOiAxMHB4OyB9IGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnQsZGVidWdnZXIuYm90dG9tLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0eyBib3R0b206IDEwcHg7IH0gZGVidWdnZXIudG9wLWxlZnQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtbGVmdCxkZWJ1Z2dlci5ib3R0b20tbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0eyBsZWZ0OiAtMzAwcHg7IH0gZGVidWdnZXIudG9wLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0LGRlYnVnZ2VyLmJvdHRvbS1yaWdodCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1yaWdodHsgcmlnaHQ6IC0zMDBweDsgfSBkZWJ1Z2dlci50b3AtbGVmdDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0OmhvdmVyLGRlYnVnZ2VyLnRvcC1sZWZ0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQuc3RpY2ssZGVidWdnZXIuYm90dG9tLWxlZnQ6aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tbGVmdDpob3ZlcixkZWJ1Z2dlci5ib3R0b20tbGVmdC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0LnN0aWNreyBsZWZ0OiAxMHB4OyBvcGFjaXR5OiAxOyB9IGRlYnVnZ2VyLnRvcC1yaWdodDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodDpob3ZlcixkZWJ1Z2dlci50b3AtcmlnaHQuc3RpY2ssW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtcmlnaHQuc3RpY2ssZGVidWdnZXIuYm90dG9tLXJpZ2h0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0OmhvdmVyLGRlYnVnZ2VyLmJvdHRvbS1yaWdodC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1yaWdodC5zdGlja3sgcmlnaHQ6IDEwcHg7IG9wYWNpdHk6IDE7IH0gZGVidWdnZXIuY2xvc2UsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5jbG9zZXsgaGVpZ2h0OiAxNXB4OyB9IGRlYnVnZ2VyICN0b2dnbGUsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjdG9nZ2xlLGRlYnVnZ2VyICNzdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNzdGljayxkZWJ1Z2dlciBoMyxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdIGgzLGRlYnVnZ2VyICNjbGVhcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNjbGVhcnsgY3Vyc29yOiBwb2ludGVyOyB9IGRlYnVnZ2VyICNzdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNzdGljayxkZWJ1Z2dlciBzZWxlY3QsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBzZWxlY3QsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBmbG9hdDogcmlnaHQ7IH0gZGVidWdnZXIgc2VsZWN0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gc2VsZWN0LGRlYnVnZ2VyICNjbGVhcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNjbGVhcnsgbWFyZ2luLXJpZ2h0OiAyMHB4OyB9IGRlYnVnZ2VyIGgzLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gaDN7IG1hcmdpbjogMDsgZm9udC1zaXplOiAxNXB4OyBsaW5lLWhlaWdodDogMTVweDsgcGFkZGluZzogMDsgfSBkZWJ1Z2dlciAjYWN0aW9ucyxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zeyBkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDUwcHg7IGxlZnQ6IDEwcHg7IHJpZ2h0OiAxMHB4OyBib3R0b206IDEwcHg7IG92ZXJmbG93OiBhdXRvOyB9IGRlYnVnZ2VyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0sZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVteyBkaXNwbGF5OiBibG9jazsgcGFkZGluZzogMTBweDsgbWFyZ2luLWJvdHRvbTogMTBweDsgYm9yZGVyOiAxcHggc29saWQgI2FhYTsgdHJhbnNpdGlvbjogYWxsIDI1MG1zIGN1YmljLWJlemllcigwLjIyLCAwLjYxLCAwLjM2LCAxKTsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0sW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW17IGJhY2tncm91bmQ6ICNmZmY7IHBvc2l0aW9uOiByZWxhdGl2ZTsgYm94LXNoYWRvdzogMDsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW06aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW06aG92ZXJ7IGJvcmRlci1jb2xvcjogI2Y3MDsgYm94LXNoYWRvdzogMHB4IDEwcHggNXB4IC04cHggcmdiYSgwLDAsMCwwLjI1KTsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0gY29kZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSBjb2RleyBiYWNrZ3JvdW5kOiAjZWVlOyBwYWRkaW5nOiAyLjVweCA1cHg7IGxpbmUtaGVpZ2h0OiAxMXB4OyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSBpI251bSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSBpI251bXsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEwcHg7IHJpZ2h0OiAxMHB4OyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSAjdGltZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSAjdGltZXsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEwcHg7IHJpZ2h0OiA2MHB4OyBvcGFjaXR5OiAwLjI1OyB9IGRlYnVnZ2VyICNhY3Rpb25zIC5tZXNzYWdlLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgLm1lc3NhZ2V7IGN1cnNvcjogcG9pbnRlcjsgdGV4dC1hbGlnbjogY2VudGVyOyBvcGFjaXR5OiAwLjI1OyB9JywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcblxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5hY3Rpb25zID0gW107XG4gICAgICAgIHNlbGYuaSA9IDA7XG4gICAgICAgIHNlbGYudG9nZ2xlSW5kaWNhdG9yID0gJy0nO1xuICAgICAgICBzZWxmLnN0aWNrSW5kaWNhdG9yID0gJ3N0aWNrJztcbiAgICAgICAgc2VsZi5vcGVuID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zdGljayA9IGZhbHNlO1xuXG4gICAgICAgIHNlbGYudG9nZ2xlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLm9wZW4gPSAhc2VsZi5vcGVuO1xuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdFtzZWxmLm9wZW4gPyAncmVtb3ZlJyA6ICdhZGQnXSgnY2xvc2UnKTtcbiAgICAgICAgICAgIHNlbGYudG9nZ2xlSW5kaWNhdG9yID0gc2VsZi5vcGVuID8gJy0nIDogJysnO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5zdGlja1RvZ2dsZSA9ICgpID0+IHtcblxuICAgICAgICAgICAgc2VsZi5zdGljayA9ICFzZWxmLnN0aWNrO1xuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdFtzZWxmLnN0aWNrID8gJ2FkZCcgOiAncmVtb3ZlJ10oJ3N0aWNrJyk7XG4gICAgICAgICAgICBzZWxmLnN0aWNrSW5kaWNhdG9yID0gc2VsZi5zdGljayA/ICdmYWRlJyA6ICdzdGljayc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmNsZWFyID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLmFjdGlvbnMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuY2hhbmdlUG9zID0gKGV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QucmVtb3ZlKCd0b3AtcmlnaHQnLCAndG9wLWxlZnQnLCAnYm90dG9tLXJpZ2h0JywgJ2JvdHRvbS1sZWZ0Jyk7XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0LmFkZChldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5udW1BY3Rpb25zID0gMjA7XG4gICAgICAgIHNlbGYuY2hhbmdlTnVtQWN0aW9ucyA9ICgpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgYXNrID0gcHJvbXB0KCdOdW1iZXIgb2YgYWN0aW9ucyB0byBzaG93PycpO1xuXG4gICAgICAgICAgICBpZiAoYXNrKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLm51bUFjdGlvbnMgPSBwYXJzZUludChhc2sucmVwbGFjZSgvW2Etel0rL2lnLCAnJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5vbignc3RhdGUnLCAob2JqLCBmbiwgYWN0aW9uLCBhcmdzKSA9PiB7XG5cbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSArbmV3IERhdGU7XG5cbiAgICAgICAgICAgIHNlbGYuaSsrO1xuICAgICAgICAgICAgY29uc3QgaSA9IHNlbGYuaTtcbiAgICAgICAgICAgIHNlbGYuYWN0aW9ucy51bnNoaWZ0KHsgb2JqLCBmbiwgYWN0aW9uLCBhcmdzLCB0aW1lLCBpIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5hY3Rpb25zLmxlbmd0aCA+IHNlbGYubnVtQWN0aW9ucykge1xuXG4gICAgICAgICAgICAgICAgc2VsZi5hY3Rpb25zLnBvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLnVwZGF0ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0LmFkZCgnYm90dG9tLXJpZ2h0Jyk7XG5cbiAgICAgICAgYXBwLmRlYnVnZ2VyID0gc2VsZjtcbn0pO1xuXG5cbnJpb3QudGFnMignZGVidWdpdGVtJywgJzxzcGFuIGNsYXNzPVwibmFtZVwiIGlmPVwie29iaiAmJiBvYmoubmFtZX1cIj4ge29iai5uYW1lfSA8L3NwYW4+PGI+e2ZufTwvYj4gJm1kYXNoOyA8aT57YWN0aW9ufTwvaT48c3BhbiBpZD1cInRpbWVcIj57dGltZX08L3NwYW4+PGkgaWQ9XCJudW1cIj57aX08L2k+PGJyPjxwPkFyZ3VtZW50czwvcD48ZGl2IGVhY2g9XCJ7YXJnIGluIGFyZ3N9XCI+PGk+e2FyZy5jb25zdHJ1Y3Rvci5uYW1lfTwvaT4gJm1kYXNoOyA8c3BhbiBpZj1cIntbXFwnb2JqZWN0XFwnLCBcXCdmdW5jdGlvblxcJ10uaW5kZXhPZih0eXBlb2YgYXJnKSA9PT0gLTF9XCI+e2FyZ308L3NwYW4+PGNvZGUgaWY9XCJ7dHlwZW9mIGFyZyA9PT0gXFwnb2JqZWN0XFwnfVwiPntKU09OLnN0cmluZ2lmeShhcmcpfTwvY29kZT48Y29kZSBpZj1cInt0eXBlb2YgYXJnID09PSBcXCdmdW5jdGlvblxcJ31cIj57YXJnfTwvY29kZT48L2Rpdj4nLCAnJywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcbn0pO1xuXG5cbnJpb3QudGFnMignaWNvbicsICc8aSBjbGFzcz1cImZhIHtpY29ufVwiPjwvaT4nLCAnJywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcblxuICAgIHRoaXMuaWNvbiA9IE9iamVjdC5rZXlzKHRoaXMub3B0cykubWFwKGkgPT4gYGZhLSR7aX1gKS5qb2luKCcgJylcbn0pO1xuXG5yaW90LnRhZzIoJ3ByZXR0eS1jb2RlJywgJycsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBkZWZhdWx0T3B0cyA9IHtcblxuICAgICAgICAgICAgXCJpbmRlbnRfc2l6ZVwiOiA0LFxuICAgICAgICAgICAgXCJpbmRlbnRfY2hhclwiOiBcIiBcIlxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHR5cGUgPSBzZWxmLm9wdHMudHlwZSB8fCAnanMnO1xuICAgICAgICBjb25zdCBiZWF1dGlmeU9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0cywgc2VsZi5vcHRzKTtcblxuICAgICAgICB0aGlzLm9uKCdtb3VudCcsICgpID0+IHtcblxuICAgICAgICAgICAgUmlvdFV0aWxzLkJlYXV0aWZ5W3R5cGVdO1xuICAgICAgICB9KVxufSk7XG5cbnJpb3QudGFnMigncmF3JywgJycsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMucm9vdC5pbm5lckhUTUwgPSB0aGlzLm9wdHMuY29udGVudFxufSk7XG5cbiJdfQ==
