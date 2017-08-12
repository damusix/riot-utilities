(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _observer = require('./lib/observer');

var _actionForms = require('./lib/action-forms');

var ActionForms = _interopRequireWildcard(_actionForms);

require('./tags');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var RiotUtils = {

    Observer: _observer.Observer,
    ActionForms: ActionForms
};

global.RiotUtils = RiotUtils;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/action-forms":4,"./lib/observer":6,"./tags":7}],2:[function(require,module,exports){
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

riot.tag2('raw', '', '', '', function (opts) {
    this.root.innerHTML = this.opts.content;
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1maWVsZC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1mb3JtLmpzIiwibGliL2FjdGlvbi1mb3Jtcy9pbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvdXRpbHMuanMiLCJsaWIvb2JzZXJ2ZXIuanMiLCJ0YWdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBOztBQUNBOztJQUFZLFc7O0FBQ1o7Ozs7QUFFQSxJQUFNLFlBQVk7O0FBRWQsZ0NBRmM7QUFHZDtBQUhjLENBQWxCOztBQU1BLE9BQU8sU0FBUCxHQUFtQixTQUFuQjs7Ozs7Ozs7OztRQ0VnQixTLEdBQUEsUzs7QUFkaEI7O0FBQ0E7O0FBRUEsSUFBTSxVQUFVLGNBQU8sT0FBdkI7O0FBRUE7Ozs7Ozs7OztBQVNPLFNBQVMsU0FBVCxDQUFvQixLQUFwQixFQUEyQixXQUEzQixFQUF3Qzs7QUFFM0MsUUFBTSxTQUFTLCtCQUFtQixLQUFuQixFQUEwQixRQUFRLFNBQVIsSUFBcUIsUUFBL0MsQ0FBZjs7QUFFQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLE1BQW1DLFNBQXBEOztBQUVBO0FBQ0EsUUFBTSxTQUFTLE1BQU0sWUFBTixDQUFtQixRQUFuQixDQUFmOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLENBQWpCOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFNBQVMsTUFBTSxZQUFOLENBQW1CLFFBQW5CLENBQWY7O0FBRUE7QUFDQSxRQUFNLFFBQVEsTUFBTSxZQUFOLENBQW1CLE9BQW5CLENBQWQ7O0FBRUE7QUFDQSxRQUFNLEtB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QUFDQSxhQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLEVBQUUsUUFBRixFQUFPLE1BQVAsRUFBVyxjQUFYLEVBQW1CLFVBQW5CLEVBQXlCLFVBQXpCLEVBQStCLElBQS9CLEVBQXJCOztBQUVBLFlBQUksS0FBSyxPQUFMLENBQWEsTUFBYixHQUFzQixLQUFLLFVBQS9CLEVBQTJDOztBQUV2QyxpQkFBSyxPQUFMLENBQWEsR0FBYjtBQUNIOztBQUVELGFBQUssTUFBTDtBQUNILEtBZEQ7O0FBZ0JBLFNBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0IsY0FBeEI7O0FBRUEsUUFBSSxRQUFKLEdBQWUsSUFBZjtBQUNQLENBakVEOztBQW9FQSxLQUFLLElBQUwsQ0FBVSxXQUFWLEVBQXVCLG1iQUF2QixFQUE0YyxFQUE1YyxFQUFnZCxFQUFoZCxFQUFvZCxVQUFTLElBQVQsRUFBZSxDQUNsZSxDQUREOztBQUlBLEtBQUssSUFBTCxDQUFVLE1BQVYsRUFBa0IsMkJBQWxCLEVBQStDLEVBQS9DLEVBQW1ELEVBQW5ELEVBQXVELFVBQVMsSUFBVCxFQUFlOztBQUVsRSxTQUFLLElBQUwsR0FBWSxPQUFPLElBQVAsQ0FBWSxLQUFLLElBQWpCLEVBQXVCLEdBQXZCLENBQTJCO0FBQUEsdUJBQVcsQ0FBWDtBQUFBLEtBQTNCLEVBQTJDLElBQTNDLENBQWdELEdBQWhELENBQVo7QUFDSCxDQUhEOztBQUtBLEtBQUssSUFBTCxDQUFVLEtBQVYsRUFBaUIsRUFBakIsRUFBcUIsRUFBckIsRUFBeUIsRUFBekIsRUFBNkIsVUFBUyxJQUFULEVBQWU7QUFDeEMsU0FBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLElBQUwsQ0FBVSxPQUFoQztBQUNILENBRkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4vbGliL29ic2VydmVyJztcbmltcG9ydCAqIGFzIEFjdGlvbkZvcm1zIGZyb20gJy4vbGliL2FjdGlvbi1mb3Jtcyc7XG5pbXBvcnQgJy4vdGFncyc7XG5cbmNvbnN0IFJpb3RVdGlscyA9IHtcblxuICAgIE9ic2VydmVyLFxuICAgIEFjdGlvbkZvcm1zXG59XG5cbmdsb2JhbC5SaW90VXRpbHMgPSBSaW90VXRpbHM7XG4iLCJpbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4uL29ic2VydmVyJztcbmltcG9ydCB7IHZhbGlkYXRlUmVnZXgsIGNvbmZpcm1WYWxpZGF0aW9uLCBmaW5kRmllbGRDb250YWluZXIsIGZvcm1hdFZhbHVlLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgY2xhc3NlcyA9IGNvbmZpZy5jbGFzc2VzO1xuXG4vKipcbiAqIEFkZHMgdmFsaWRhdGlvbiBmdW5jdGlvbmFsaXR5IHRvIGZvcm0gZmllbGRzXG4gKiB0byBkaXNwbGF5IGVycm9ycyBhbmQgaGVscCBmaWVsZHMuIEJpbmRzIGZpZWxkIHdpdGhcbiAqIFJpb3QgT2JzZXJ2YWJsZSBhbmQgZ2l2ZXMgZWxlbWVudHMgZXZlbnQgZmVhdHVyZXMuXG4gKlxuICogQHBhcmFtIHsgSFRNTEZvcm1FbGVtZW50IH0gZmllbGQgLSBGaWVsZCB3aG9zZSBwYXJlbnQgd2Ugd2lsbCByZXR1cm5cbiAqIEBwYXJhbSB7IE9iamVjdCB9IHZhbGlkYXRpb25zIC0gUGFyZW50IGZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kRmllbGQgKGZpZWxkLCB2YWxpZGF0aW9ucykge1xuXG4gICAgY29uc3QgcGFyZW50ID0gZmluZEZpZWxkQ29udGFpbmVyKGZpZWxkLCBjbGFzc2VzLmNvbnRhaW5lciB8fCAnLmZpZWxkJyApO1xuXG4gICAgY29uc3QgbmFtZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnbmFtZScpO1xuICAgIGNvbnN0IHR5cGUgPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKTtcbiAgICBjb25zdCByZXF1aXJlZCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVxdWlyZWQnKSAhPT0gdW5kZWZpbmVkO1xuXG4gICAgLy8gRm9ybWF0dGluZyBmdW5jdGlvblxuICAgIGNvbnN0IGZvcm1hdCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnZm9ybWF0Jyk7XG5cbiAgICAvLyBWYWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgLy8gaW5wdXRbZGF0YS12YWxpZGF0ZV0gc2hvdWxkIGJlIGEgZnVuY3Rpb24gaW5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgndmFsaWRhdGUnKTtcblxuICAgIC8vIE1hdGNoIHZhbHVlIGFnYWluc3QgYW5vdGhlciBlbGVtZW50XG4gICAgLy8gU2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yXG4gICAgY29uc3QgZXF1YWxzID0gZmllbGQuZ2V0QXR0cmlidXRlKCdlcXVhbHMnKTtcblxuICAgIC8vIEN1c3RvbSByZWd1bGFyIGV4cHJlc3Npb25cbiAgICBjb25zdCByZWdleCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVnZXgnKTtcblxuICAgIC8vIEV2ZW50cyB0byBiaW5kIHRvXG4gICAgY29uc3Qgb24gPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ29uJykgfHwgJ2NoYW5nZSc7XG5cbiAgICAvLyBJbnB1dCB2YWxpZGF0aW9uIG9iamVjdCB0byBoYW5kbGUgbXVsdGlwbGUgbWV0aG9kc1xuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB7fTtcblxuICAgIGxldCBpc1ZhbGlkID0gZmFsc2U7XG5cbiAgICBpZiAoZmllbGQuZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpIHx8IHR5cGUgPT09ICdoaWRkZW4nKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9ic2VydmVyKGZpZWxkKTtcblxuICAgIC8vIEZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG5cbiAgICBpZiAoZm9ybWF0KSB7XG5cbiAgICAgICAgZm9ybWF0VmFsdWUoZm9ybWF0LCBmaWVsZCk7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGVGbiA9IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBjb25zdCBrZXlDb2RlID0gKHdpbmRvdy5ldmVudCkgPyBlLndoaWNoIDogZS5rZXlDb2RlO1xuICAgICAgICBjb25zdCBpc0JsdXIgPSBlLnR5cGUgPT09J2JsdXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGZpZWxkLnZhbHVlO1xuICAgICAgICBjb25zdCBlbXB0eSA9ICF2YWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gSWYgaXQncyByZXF1aXJlZCwgaXQgY2FuJ3QgYmUgZW1wdHlcbiAgICAgICAgaWYgKHJlcXVpcmVkKSB7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVxdWlyZWQgPSAhIXZhbHVlO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvbi5jaGVja2VkID0gZmllbGQuY2hlY2tlZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBleGlzdGluZyB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgICAgIGlmICh2YWxpZGF0ZSkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnZhbGlkYXRlID0gdmFsaWRhdGVSZWdleCh2YWx1ZSwgdmFsaWRhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzZXJ0IGFnYWluc3QgY3VzdG9tIHJlZ2V4XG4gICAgICAgIGlmIChyZWdleCkge1xuXG4gICAgICAgICAgICBjb25zdCByZ3ggPSBuZXcgUmVnRXhwKHJlZ2V4KTtcbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVnZXggPSByZ3gudGVzdCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBhbm90aGVyIGZpZWxkJ3MgdmFsdWVcbiAgICAgICAgaWYgKGVxdWFscykge1xuXG4gICAgICAgICAgICBjb25zdCBlcXVhbHNFbGVtZW50ID0gZmllbGQuZm9ybS5xdWVyeVNlbGVjdG9yKGVxdWFscyk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24uZXF1YWxzID0gdmFsdWUgPT09IGVxdWFsc0VsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgICAgIGlmICghZXF1YWxzRWxlbWVudC5pc1ZhbGlkKSB7XG5cbiAgICAgICAgICAgICAgICBlcXVhbHNFbGVtZW50LnRyaWdnZXIoJ3ZhbGlkYXRlJywge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBDaGVjayBpbnB1dCB2YWxpZGF0aW9uXG4gICAgICAgIGlzVmFsaWQgPSBjb25maXJtVmFsaWRhdGlvbih2YWxpZGF0aW9uKTtcblxuICAgICAgICAvLyBJbnB1dCBpcyBub3QgcmVxdWlyZWQgYW5kIGlzIGVtcHR5XG4gICAgICAgIGlmICghaXNWYWxpZCAmJiAhcmVxdWlyZWQgJiYgIXZhbHVlICYmIGlzQmx1cikge1xuXG4gICAgICAgICAgICBpc1ZhbGlkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbGlkYXRlZChpc1ZhbGlkKTtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XG5cbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVkID0gZnVuY3Rpb24oaXNWYWxpZCkge1xuXG4gICAgICAgIC8vIEJpbmQgdG8gdmFsaWRhdGlvbiBvYmplY3QgZm9yIGZvcm0gY2hlY2tcbiAgICAgICAgaWYgKHZhbGlkYXRlIHx8IHJlZ2V4IHx8IGVxdWFscyB8fCByZXF1aXJlZCkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kIHZhbGlkaXR5IHRvIGh0bWwgZWxlbWVudFxuICAgICAgICBmaWVsZC5pc1ZhbGlkID0gaXNWYWxpZDtcblxuICAgICAgICAvLyBJZiBpdCdzIHZhbGlkLCByZW1vdmUgZXJyb3IgY2xhc3NlcyBhbmQgaGlkZSB0aGUgaGVscCBibG9jay5cbiAgICAgICAgLy8gVGhpcyBpcyBtZWFudCB0byB3b3JrIHdpdGggYm9vdHN0cmFwIGZvcm1zLlxuICAgICAgICBpZiAoaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWxsb3cgZmllbGRzIHRoYXQgYXJlIG5vdCByZXF1aXJlZFxuICAgICAgICBpZiAoaXNWYWxpZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICBmaWVsZC5zZXRCbGFuaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgfTtcblxuICAgIC8vIEJpbmQgZXZlbnRzIHRvIHZhbGlkYXRpb24gZnVuY3Rpb25cbiAgICBvbi5zcGxpdCgnICcpLm1hcChvID0+IGZpZWxkW2BvbiR7b31gXSA9IHZhbGlkYXRlRm4pO1xuXG4gICAgZmllbGQub24oJ3ZhbGlkYXRlJywgdmFsaWRhdGVGbik7XG5cbiAgICBjb25zdCBzZXRCbGFuayA9ICgpID0+IHtcblxuICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLnN1Y2Nlc3MsIGNsYXNzZXMuZXJyb3IsIGNsYXNzZXMud2FybmluZywgY2xhc3Nlcy5pbmZvKTtcbiAgICAgICAgcGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2NsYXNzZXMuaGVscH1gKS5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuaGlkZSk7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IE9ic2VydmVyIH0gZnJvbSAnLi4vb2JzZXJ2ZXInO1xuaW1wb3J0IHsgYmluZEZpZWxkIH0gZnJvbSAnLi9iaW5kLWZpZWxkJztcbmltcG9ydCB7IGNvbmZpcm1WYWxpZGF0aW9uLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc29sZS5sb2coY29uZmlnLmVsZW1lbnRzKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZm9ybSkge1xuXG4gICAgY29uc29sZS5sb2coZm9ybSk7XG5cbiAgICBsZXQgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKGNvbmZpZy5lbGVtZW50cyk7XG4gICAgY29uc3Qgc3VibWl0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgY29uc3QgdmFsaWRhdGlvbnMgPSB7fTtcblxuICAgIGZvcm0udmFsaWRhdGlvbnMgPSB2YWxpZGF0aW9ucztcbiAgICBmb3JtLmlzVmFsaWQgPSBmYWxzZTtcbiAgICBmb3JtLm5vVmFsaWRhdGUgPSB0cnVlO1xuXG4gICAgT2JzZXJ2ZXIoZm9ybSk7XG5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0uaXNWYWxpZCA9IGNvbmZpcm1WYWxpZGF0aW9uKHZhbGlkYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIGZvcm0uaXNWYWxpZDtcbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVBbGwgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhc3Nlc3NTdWJtaXQoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgdmFsaWRcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dHMuZm9yRWFjaCgoZmllbGQsIGkpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpID09PSAoaW5wdXRzLmxlbmd0aC0xKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLm9uZSgndmFsaWRhdGVkJywgKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3Nlc3NTdWJtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGUnLCB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9ybS5vbigndmFsaWRhdGUnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YWxpZGF0ZUFsbCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZm9ybS5vbigndmFsaWRhdGVkJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmIChmb3JtLmlzVmFsaWQpIHtcblxuICAgICAgICAgICAgZm9ybS50cmlnZ2VyKCdzdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGUgZm9ybSBpcyBzdWJtaXR0aW5nLCBpdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBmaWVsZHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICBmb3JtLm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAoIWZvcm0uaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3ZhbGlkYXRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3N1Ym1pdHRlZCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8gQWRkIHZhbGlkYXRpb24gZnVuY3Rpb25hbGl0eSB0byBmb3JtIGVsZW1lbnRzXG4gICAgZnVuY3Rpb24gYmluZEZpZWxkcygpIHtcblxuICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuXG4gICAgICAgICAgICBiaW5kRmllbGQoZmllbGQsIHZhbGlkYXRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmluZEZpZWxkcygpO1xuXG4gICAgLy8gUmViaW5kIHZhbGlkYXRpb25zIGluIGNhc2Ugb2YgbmV3IHJlcXVpcmVkIGZpZWxkc1xuICAgIGlmICghZm9ybS5yZWJpbmQpIHtcblxuICAgICAgICBmb3JtLnJlYmluZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpbnB1dHMgPSBmb3JtLmZpbmQoY29uZmlnLmVsZW1lbnRzKTtcbiAgICAgICAgICAgIGJpbmRGaWVsZHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm0ub24oJ3JlYmluZCcsIGZvcm0ucmViaW5kKTtcbiAgICB9XG5cbiAgICBmb3JtLm9uKCdyZXNldCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0ucmVzZXQoKTtcbiAgICAgICAgZm9ybS5pc1ZhbGlkID0gZmFsc2U7XG5cbiAgICAgICAgaW5wdXRzLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcblxuICAgICAgICAgICAgZmllbGQuc2V0QmxhbmsoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuIiwiZXhwb3J0IHsgYmluZCB9IGZyb20gJy4vYmluZC1mb3JtJztcbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMnO1xuIiwiZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcblxuICAgIC8vIEVsZW1lbnRzIHRvIGJlIHNlbGVjdGVkIGZvciB2YWxpZGF0aW9uXG4gICAgZWxlbWVudHM6ICdbcmVxdWlyZWRdLFtkYXRhLXZhbGlkYXRlXSxbZGF0YS1lcXVhbHNdLFtkYXRhLXJlZ2V4XSxbZGF0YS1jY10nLFxuXG4gICAgLy8gUmVndWxhciBleHByZXNzaW9ucyB1c2VkIHRvIHZhbGlkYXRlXG4gICAgcmVnZXhlczoge1xuXG4gICAgICAgIGFscGhhbnVtOiAvXlthLXowLTldKyQvaSxcbiAgICAgICAgYWxwaGFudW1zcGFjZTogL15bYS16MC05XFxzXSskL2ksXG4gICAgICAgIG5hbWU6IC9eW2Etelxcc1xcLVxcLFxcLl0rJC9pLFxuICAgICAgICB1c2VybmFtZTogL15bYS16MC05XVthLXowLTlcXHNcXC1cXF9cXCtcXC5dK1thLXowLTldJC9pLFxuICAgICAgICBmcWRuOiAvXlthLXowLTldW2EtejAtOVxcLVxcX1xcLl0rW2EtejAtOV17MiwyMH0kL2ksXG4gICAgICAgIHRsZDogL15bYS16XXsyLDIwfS9pLFxuICAgICAgICBwaG9uZTogL15cXCg/KFswLTldezN9KVxcKT9bLS4gXT8oWzAtOV17M30pWy0uIF0/KFswLTldezR9KSQvLFxuICAgICAgICBlbWFpbDogLy4rQC4rXFwuLisvaVxuICAgIH0sXG5cbiAgICAvLyBGZWVkYmFjaywgc3RhdGUsIGFuZCBjb250YWluZXIgY2xhc3Nlc1xuICAgIGNsYXNzZXM6IHtcblxuICAgICAgICBjb250YWluZXI6ICdmaWVsZCcsXG4gICAgICAgIGVycm9yOiAnZXJyb3InLFxuICAgICAgICBoZWxwOiAnaGVscCcsXG4gICAgICAgIGhpZGU6ICdoaWRlJyxcbiAgICAgICAgaW5mbzogJ2luZm8nLFxuICAgICAgICBzdWNjZXNzOiAnc3VjY2VzcycsXG4gICAgICAgIHdhcm5pbmc6ICd3YXJuaW5nJ1xuICAgIH0sXG5cbiAgICAvLyBGaWVsZCBmb3JtYXR0aW5nIGZ1bmN0aW9uc1xuICAgIGZvcm1hdDoge1xuICAgICAgICBjYzogZnVuY3Rpb24gKCkge31cbiAgICB9XG59XG5cbi8qXG4gKiBGb3JtYXQgYSBmaWVsZCdzIHZhbHVlIGJhc2VkIG9uIGZ1bmN0aW9ucyBpbiBgY29uZmlnLmZvcm1hdGBcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSBmb3JtYXRGbiAtIE5hbWUgb2YgZnVuY3Rpb24gaW4gYGNvbmZpZy5mb3JtYXRgXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHRvIGZvcm1hdCB2YWx1ZSBvZlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUoZm9ybWF0Rm4sIGZpZWxkKSB7XG5cbiAgICBpZiAodHlwZW9mIGNvbmZpZy5mb3JtYXRbZm9ybWF0Rm5dID09PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGAke2Zvcm1hdEZufSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYSBmdW5jdGlvbmApO1xuICAgIH1cblxuICAgIGZpZWxkLnZhbHVlID0gY29uZmlnLmZvcm1hdFtmb3JtYXRGbl0oZmllbGQudmFsdWUpO1xufVxuXG4vLyBPdmVyd3JpdGUgY29uZmlnXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKG9wdHMpIHtcblxuICAgIGZvciAob3B0IGluIG9wdHMpIHtcblxuICAgICAgICBpZiAoY29uZmlnW29wdF0uY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbmZpZ1tvcHRdLCBvcHRzW29wdF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBjb25maWdbb3B0XSA9IG9wdHNbb3B0XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIHZhbHVlIGFuZCByZXR1cm5zIHRydWUgb3IgZmFsc2UuXG4gKiBUaHJvd3MgZXJyb3IgaWYgaXQgY2Fubm90IHZhbGlkYXRlXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gdmFsdWUgLSBWYWx1ZSB0byBiZSB2YWxpZGF0ZWRcbiAqIEBwYXJhbSB7IFN0cmluZyB8IFJlZ0V4cCB9IHJneCAtIFN0cmluZyByZWZlcmVuY2UgdG8gYHJlZ2V4ZXNgIG9yIGEgUmVnRXhwXG4gKlxuICogQHJldHVybnMgeyBCb29sZWFuIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUmVnZXgodmFsdWUsIHJneCkge1xuXG4gICAgLy8gQWNjZXB0cyBSZWdFeHAgYXMgc2Vjb25kIHZhbHVlXG4gICAgaWYgKHJneC5jb25zdHJ1Y3RvciA9PT0gUmVnRXhwKSB7XG5cbiAgICAgICAgcmV0dXJuIHJneC50ZXN0KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBTZWNvbmQgdmFsdWUgaXMgYSBzdHJpbmcsIHNvIGl0IG11c3QgZXhpc3RcbiAgICAvLyBpbnNpZGUgb2YgYGNvbmZpZy5yZWdleGVzYCBvYmplY3RcbiAgICBpZiAodHlwZW9mIHJneCA9PT0gJ3N0cmluZycgJiYgY29uZmlnLnJlZ2V4ZXNbcmd4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZWdleGVzW3JneF0udGVzdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgY29uZGl0aW9ucyBhcmVuJ3QgbWV0LCB0aHJvdyBlcnJvclxuICAgIHRocm93IEVycm9yKCdzZWNvbmQgcGFyYW1ldGVyIGlzIGFuIGludmFsaWQgcmVndWxhciBleHByZXNzaW9uIG9yIGRvZXMgbm90IGV4aXN0IHdpdGhpbiB1dGlsaXRpZXMgb2JqZWN0Jyk7XG5cbn1cblxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW4gb2JqZWN0IGFuZCBjaGVja3MgZm9yIHRydWUgb3IgZmFsc2VcbiAqXG4gKiBAcGFyYW0geyBPYmplY3QgfSBvYmogLSBPYmplY3QgdG8gaXRlcmF0ZVxuICpcbiAqIEByZXR1cm5zIHsgQm9vbGVhbiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25maXJtVmFsaWRhdGlvbihvYmopIHtcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgb2JqZWN0XG4gICAgZm9yICh2YXIgdiBpbiBvYmopIHtcblxuICAgICAgICAvLyBBbmQgcmV0dXJuIGZhbHNlIGlmIGFueSBrZXkgaXMgZmFsc2VcbiAgICAgICAgaWYgKG9ialt2XSA9PT0gZmFsc2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8qKlxuICogQ3Jhd2xzIHVwIHRoZSBET00gc3RhcnRpbmcgZnJvbSB0aGUgYGZpZWxkYCBlbGVtZW50XG4gKiBhbmQgZmluZHMgY29udGFpbmluZyBlbGVtZW50IHdpdGggY2xhc3MgbmFtZXMgc3BlY2lmaWVkXG4gKiBpbiB0aGUgYGNsYXNzZXNgIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0geyBIVE1MRm9ybUVsZW1lbnQgfSBmaWVsZCAtIEZpZWxkIHdob3NlIHBhcmVudCB3ZSB3aWxsIHJldHVyblxuICogQHBhcmFtIHsgT2JqZWN0IH0gY29udGFpbmVyQ2xhc3MgLSBOYW1lIG9mIGNsYXNzIHRoZSBjb250YWluZXIgd2lsbCBoYXZlXG4gKlxuICogQHJldHVybnMgeyBIVE1MRWxlbWVudCB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRmllbGRDb250YWluZXIgKGZpZWxkLCBjb250YWluZXJDbGFzcykge1xuXG4gICAgaWYgKGZpZWxkID09PSBkb2N1bWVudC5ib2R5KSB7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWVsZCBuYW1lZCAke2ZpZWxkLm5hbWV9IGlzIG5vdCBpbnNpZGUgYSBmaWVsZCBjb250YWluZXJgKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyZW50ID0gZmllbGQucGFyZW50RWxlbWVudDtcblxuICAgIGlmICghcGFyZW50LmNsYXNzTGlzdC5jb250YWlucyhjb250YWluZXJDbGFzcykpIHtcblxuICAgICAgICBwYXJlbnQgPSBmaW5kRmllbGRDb250YWluZXIocGFyZW50LCBjb250YWluZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudDtcbn1cbiIsImNvbnN0IG9ic2VydmFibGUgPSByaW90Lm9ic2VydmFibGU7XHJcblxyXG5jb25zdCBvcHRzID0ge1xyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgZGVidWdGbjogZmFsc2VcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIE9ic2VydmVyIChvYmosIHByb3BzKSB7XHJcblxyXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLy8gT2JzZXJ2ZXJhYmxlIG9ic2VydmVyIGZvciB0aGlzIGluc3RhbmNlXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG9ic2VydmFibGUoKTtcclxuXHJcbiAgICAvLyBQcm9wZXJ0aWVzIG9iamVjdCB0byByZXdyYXBcclxuICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7fTtcclxuXHJcbiAgICAvLyBSZXdyYXAgb2JzZXJ2ZXIgZnVuY3Rpb25zIGZvciBkZWJ1Z2dpbmdcclxuICAgIFsnb24nLCAnb25lJywgJ29mZicsICd0cmlnZ2VyJ10uZm9yRWFjaCgoZm4pID0+IHtcclxuXHJcbiAgICAgICAgLy8gU2ltcGx5IHBhc3MgYnkgcmVmZXJlbmNlIGluIHByb2R1Y3Rpb25cclxuICAgICAgICBsZXQgZXhlY0ZuID0gb2JzZXJ2ZXJbZm5dO1xyXG5cclxuICAgICAgICAvLyBSZXdyYXAgYW5kIGxvZyBpZiBkZWJ1Z2dpbmdcclxuICAgICAgICBpZiAob3B0cy5kZWJ1Zykge1xyXG5cclxuICAgICAgICAgICAgZXhlY0ZuID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIG9ic2VydmVyW2ZuXS5hcHBseShvYnNlcnZlcltmbl0sIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSG9vayBpbnRvIGZ1bmN0aW9uIGZvciBtYWtpbmcgZGVidWdnaW5nIHRvb2xzXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kZWJ1Z0ZuICYmIHR5cGVvZiBvcHRzLmRlYnVnRm4gPT09ICdmdW5jdGlvbicpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGFyZ3Muc2hpZnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWJ1Z0ZuLmFwcGx5KHt9LCBbb2JqLCBmbiwgYWN0aW9uLCBhcmdzXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhvc2UgZnVuY3Rpb25zIGNhbm5vdCBiZSBvdmVyd3JpdHRlblxyXG4gICAgICAgIHByb3BlcnRpZXNbZm5dID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogZXhlY0ZuLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRGVmaW5lIHByb3BlcnRpZXMgaW4gYHByb3BzYFxyXG4gICAgcHJvcHMgJiYgT2JqZWN0LmtleXMocHJvcHMpLm1hcCgoa2V5KSA9PiB7XHJcblxyXG4gICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHByb3BzW2tleV07XHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmosIHByb3BlcnRpZXMpO1xyXG59XHJcblxyXG5PYnNlcnZlci5jb25maWd1cmUgPSAob2JqKSA9PiB7XHJcblxyXG4gICAgT2JqZWN0LmFzc2lnbihvcHRzLCBvYmopO1xyXG59XHJcbiIsInJpb3QudGFnMignZGVidWdnZXInLCAnPGIgaWQ9XCJzdGlja1wiIG9uY2xpY2s9XCJ7c3RpY2tUb2dnbGV9XCIgaWY9XCJ7b3Blbn1cIj57c3RpY2tJbmRpY2F0b3J9PC9iPjxzZWxlY3Qgb25jaGFuZ2U9XCJ7Y2hhbmdlUG9zfVwiIGlmPVwie29wZW59XCI+PG9wdGlvbj50b3AtcmlnaHQ8L29wdGlvbj48b3B0aW9uPnRvcC1sZWZ0PC9vcHRpb24+PG9wdGlvbiBzZWxlY3RlZD1cIlwiPmJvdHRvbS1yaWdodDwvb3B0aW9uPjxvcHRpb24+Ym90dG9tLWxlZnQ8L29wdGlvbj48L3NlbGVjdD48YiBpZD1cImNsZWFyXCIgb25jbGljaz1cIntjbGVhcn1cIiBpZj1cIntvcGVufVwiPmNsZWFyPC9iPjxoMyBvbmNsaWNrPVwie3RvZ2dsZX1cIj48YiBpZD1cInRvZ2dsZVwiPnt0b2dnbGVJbmRpY2F0b3J9PC9iPiBEZWJ1Z2dlciA8L2gzPjxzZWN0aW9uIGlkPVwiYWN0aW9uc1wiPjxkZWJ1Z2l0ZW0gZWFjaD1cInthY3Rpb25zfVwiPjwvZGVidWdpdGVtPjxwIGNsYXNzPVwibWVzc2FnZVwiIG9uY2xpY2s9XCJ7Y2hhbmdlTnVtQWN0aW9uc31cIj4gU2hvd2luZyBsYXN0IHtudW1BY3Rpb25zfSBhY3Rpb25zLi4uIDwvcD48L3NlY3Rpb24+JywgJ2RlYnVnZ2VyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl17IHBvc2l0aW9uOiBmaXhlZDsgei1pbmRleDogOTk5OTsgYm90dG9tOiAxMHB4OyByaWdodDogLTMwMHB4OyBvcGFjaXR5OiAwLjI1OyB3aWR0aDogNDAwcHg7IGhlaWdodDogNjAwcHg7IGJhY2tncm91bmQ6ICNlZWU7IGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IGZvbnQtc2l6ZTogMTFweDsgfSBkZWJ1Z2dlci50b3AtbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0LGRlYnVnZ2VyLnRvcC1yaWdodCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodHsgdG9wOiAxMHB4OyB9IGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnQsZGVidWdnZXIuYm90dG9tLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0eyBib3R0b206IDEwcHg7IH0gZGVidWdnZXIudG9wLWxlZnQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtbGVmdCxkZWJ1Z2dlci5ib3R0b20tbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0eyBsZWZ0OiAtMzAwcHg7IH0gZGVidWdnZXIudG9wLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0LGRlYnVnZ2VyLmJvdHRvbS1yaWdodCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1yaWdodHsgcmlnaHQ6IC0zMDBweDsgfSBkZWJ1Z2dlci50b3AtbGVmdDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0OmhvdmVyLGRlYnVnZ2VyLnRvcC1sZWZ0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQuc3RpY2ssZGVidWdnZXIuYm90dG9tLWxlZnQ6aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tbGVmdDpob3ZlcixkZWJ1Z2dlci5ib3R0b20tbGVmdC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0LnN0aWNreyBsZWZ0OiAxMHB4OyBvcGFjaXR5OiAxOyB9IGRlYnVnZ2VyLnRvcC1yaWdodDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodDpob3ZlcixkZWJ1Z2dlci50b3AtcmlnaHQuc3RpY2ssW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtcmlnaHQuc3RpY2ssZGVidWdnZXIuYm90dG9tLXJpZ2h0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0OmhvdmVyLGRlYnVnZ2VyLmJvdHRvbS1yaWdodC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1yaWdodC5zdGlja3sgcmlnaHQ6IDEwcHg7IG9wYWNpdHk6IDE7IH0gZGVidWdnZXIuY2xvc2UsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5jbG9zZXsgaGVpZ2h0OiAxNXB4OyB9IGRlYnVnZ2VyICN0b2dnbGUsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjdG9nZ2xlLGRlYnVnZ2VyICNzdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNzdGljayxkZWJ1Z2dlciBoMyxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdIGgzLGRlYnVnZ2VyICNjbGVhcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNjbGVhcnsgY3Vyc29yOiBwb2ludGVyOyB9IGRlYnVnZ2VyICNzdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNzdGljayxkZWJ1Z2dlciBzZWxlY3QsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBzZWxlY3QsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBmbG9hdDogcmlnaHQ7IH0gZGVidWdnZXIgc2VsZWN0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gc2VsZWN0LGRlYnVnZ2VyICNjbGVhcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNjbGVhcnsgbWFyZ2luLXJpZ2h0OiAyMHB4OyB9IGRlYnVnZ2VyIGgzLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gaDN7IG1hcmdpbjogMDsgZm9udC1zaXplOiAxNXB4OyBsaW5lLWhlaWdodDogMTVweDsgcGFkZGluZzogMDsgfSBkZWJ1Z2dlciAjYWN0aW9ucyxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zeyBkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDUwcHg7IGxlZnQ6IDEwcHg7IHJpZ2h0OiAxMHB4OyBib3R0b206IDEwcHg7IG92ZXJmbG93OiBhdXRvOyB9IGRlYnVnZ2VyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0sZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVteyBkaXNwbGF5OiBibG9jazsgcGFkZGluZzogMTBweDsgbWFyZ2luLWJvdHRvbTogMTBweDsgYm9yZGVyOiAxcHggc29saWQgI2FhYTsgdHJhbnNpdGlvbjogYWxsIDI1MG1zIGN1YmljLWJlemllcigwLjIyLCAwLjYxLCAwLjM2LCAxKTsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0sW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW17IGJhY2tncm91bmQ6ICNmZmY7IHBvc2l0aW9uOiByZWxhdGl2ZTsgYm94LXNoYWRvdzogMDsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW06aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW06aG92ZXJ7IGJvcmRlci1jb2xvcjogI2Y3MDsgYm94LXNoYWRvdzogMHB4IDEwcHggNXB4IC04cHggcmdiYSgwLDAsMCwwLjI1KTsgfSBkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0gY29kZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSBjb2RleyBiYWNrZ3JvdW5kOiAjZWVlOyBwYWRkaW5nOiAyLjVweCA1cHg7IGxpbmUtaGVpZ2h0OiAxMXB4OyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSBpI251bSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSBpI251bXsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEwcHg7IHJpZ2h0OiAxMHB4OyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSAjdGltZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbSAjdGltZXsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEwcHg7IHJpZ2h0OiA2MHB4OyBvcGFjaXR5OiAwLjI1OyB9IGRlYnVnZ2VyICNhY3Rpb25zIC5tZXNzYWdlLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgLm1lc3NhZ2V7IGN1cnNvcjogcG9pbnRlcjsgdGV4dC1hbGlnbjogY2VudGVyOyBvcGFjaXR5OiAwLjI1OyB9JywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcblxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5hY3Rpb25zID0gW107XG4gICAgICAgIHNlbGYuaSA9IDA7XG4gICAgICAgIHNlbGYudG9nZ2xlSW5kaWNhdG9yID0gJy0nO1xuICAgICAgICBzZWxmLnN0aWNrSW5kaWNhdG9yID0gJ3N0aWNrJztcbiAgICAgICAgc2VsZi5vcGVuID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zdGljayA9IGZhbHNlO1xuXG4gICAgICAgIHNlbGYudG9nZ2xlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLm9wZW4gPSAhc2VsZi5vcGVuO1xuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdFtzZWxmLm9wZW4gPyAncmVtb3ZlJyA6ICdhZGQnXSgnY2xvc2UnKTtcbiAgICAgICAgICAgIHNlbGYudG9nZ2xlSW5kaWNhdG9yID0gc2VsZi5vcGVuID8gJy0nIDogJysnO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5zdGlja1RvZ2dsZSA9ICgpID0+IHtcblxuICAgICAgICAgICAgc2VsZi5zdGljayA9ICFzZWxmLnN0aWNrO1xuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdFtzZWxmLnN0aWNrID8gJ2FkZCcgOiAncmVtb3ZlJ10oJ3N0aWNrJyk7XG4gICAgICAgICAgICBzZWxmLnN0aWNrSW5kaWNhdG9yID0gc2VsZi5zdGljayA/ICdmYWRlJyA6ICdzdGljayc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmNsZWFyID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLmFjdGlvbnMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuY2hhbmdlUG9zID0gKGV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QucmVtb3ZlKCd0b3AtcmlnaHQnLCAndG9wLWxlZnQnLCAnYm90dG9tLXJpZ2h0JywgJ2JvdHRvbS1sZWZ0Jyk7XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0LmFkZChldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5udW1BY3Rpb25zID0gMjA7XG4gICAgICAgIHNlbGYuY2hhbmdlTnVtQWN0aW9ucyA9ICgpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgYXNrID0gcHJvbXB0KCdOdW1iZXIgb2YgYWN0aW9ucyB0byBzaG93PycpO1xuXG4gICAgICAgICAgICBpZiAoYXNrKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLm51bUFjdGlvbnMgPSBwYXJzZUludChhc2sucmVwbGFjZSgvW2Etel0rL2lnLCAnJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5vbignc3RhdGUnLCAob2JqLCBmbiwgYWN0aW9uLCBhcmdzKSA9PiB7XG5cbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSArbmV3IERhdGU7XG5cbiAgICAgICAgICAgIHNlbGYuaSsrO1xuICAgICAgICAgICAgY29uc3QgaSA9IHNlbGYuaTtcbiAgICAgICAgICAgIHNlbGYuYWN0aW9ucy51bnNoaWZ0KHsgb2JqLCBmbiwgYWN0aW9uLCBhcmdzLCB0aW1lLCBpIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5hY3Rpb25zLmxlbmd0aCA+IHNlbGYubnVtQWN0aW9ucykge1xuXG4gICAgICAgICAgICAgICAgc2VsZi5hY3Rpb25zLnBvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLnVwZGF0ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0LmFkZCgnYm90dG9tLXJpZ2h0Jyk7XG5cbiAgICAgICAgYXBwLmRlYnVnZ2VyID0gc2VsZjtcbn0pO1xuXG5cbnJpb3QudGFnMignZGVidWdpdGVtJywgJzxzcGFuIGNsYXNzPVwibmFtZVwiIGlmPVwie29iaiAmJiBvYmoubmFtZX1cIj4ge29iai5uYW1lfSA8L3NwYW4+PGI+e2ZufTwvYj4gJm1kYXNoOyA8aT57YWN0aW9ufTwvaT48c3BhbiBpZD1cInRpbWVcIj57dGltZX08L3NwYW4+PGkgaWQ9XCJudW1cIj57aX08L2k+PGJyPjxwPkFyZ3VtZW50czwvcD48ZGl2IGVhY2g9XCJ7YXJnIGluIGFyZ3N9XCI+PGk+e2FyZy5jb25zdHJ1Y3Rvci5uYW1lfTwvaT4gJm1kYXNoOyA8c3BhbiBpZj1cIntbXFwnb2JqZWN0XFwnLCBcXCdmdW5jdGlvblxcJ10uaW5kZXhPZih0eXBlb2YgYXJnKSA9PT0gLTF9XCI+e2FyZ308L3NwYW4+PGNvZGUgaWY9XCJ7dHlwZW9mIGFyZyA9PT0gXFwnb2JqZWN0XFwnfVwiPntKU09OLnN0cmluZ2lmeShhcmcpfTwvY29kZT48Y29kZSBpZj1cInt0eXBlb2YgYXJnID09PSBcXCdmdW5jdGlvblxcJ31cIj57YXJnfTwvY29kZT48L2Rpdj4nLCAnJywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcbn0pO1xuXG5cbnJpb3QudGFnMignaWNvbicsICc8aSBjbGFzcz1cImZhIHtpY29ufVwiPjwvaT4nLCAnJywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcblxuICAgIHRoaXMuaWNvbiA9IE9iamVjdC5rZXlzKHRoaXMub3B0cykubWFwKGkgPT4gYGZhLSR7aX1gKS5qb2luKCcgJylcbn0pO1xuXG5yaW90LnRhZzIoJ3JhdycsICcnLCAnJywgJycsIGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLnJvb3QuaW5uZXJIVE1MID0gdGhpcy5vcHRzLmNvbnRlbnRcbn0pO1xuXG4iXX0=
