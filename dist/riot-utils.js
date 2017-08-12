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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1maWVsZC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvYmluZC1mb3JtLmpzIiwibGliL2FjdGlvbi1mb3Jtcy9pbmRleC5qcyIsImxpYi9hY3Rpb24tZm9ybXMvdXRpbHMuanMiLCJsaWIvb2JzZXJ2ZXIuanMiLCJ0YWdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBOztBQUNBOztJQUFZLFc7O0FBQ1o7Ozs7QUFFQSxJQUFNLFlBQVk7O0FBRWQsZ0NBRmM7QUFHZDtBQUhjLENBQWxCOztBQU1BLE9BQU8sU0FBUCxHQUFtQixTQUFuQjs7Ozs7Ozs7OztRQ0VnQixTLEdBQUEsUzs7QUFkaEI7O0FBQ0E7O0FBRUEsSUFBTSxVQUFVLGNBQU8sT0FBdkI7O0FBRUE7Ozs7Ozs7OztBQVNPLFNBQVMsU0FBVCxDQUFvQixLQUFwQixFQUEyQixXQUEzQixFQUF3Qzs7QUFFM0MsUUFBTSxTQUFTLCtCQUFtQixLQUFuQixFQUEwQixRQUFRLFNBQVIsSUFBcUIsUUFBL0MsQ0FBZjs7QUFFQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLE9BQU8sTUFBTSxZQUFOLENBQW1CLE1BQW5CLENBQWI7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLE1BQW1DLFNBQXBEOztBQUVBO0FBQ0EsUUFBTSxTQUFTLE1BQU0sWUFBTixDQUFtQixRQUFuQixDQUFmOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFdBQVcsTUFBTSxZQUFOLENBQW1CLFVBQW5CLENBQWpCOztBQUVBO0FBQ0E7QUFDQSxRQUFNLFNBQVMsTUFBTSxZQUFOLENBQW1CLFFBQW5CLENBQWY7O0FBRUE7QUFDQSxRQUFNLFFBQVEsTUFBTSxZQUFOLENBQW1CLE9BQW5CLENBQWQ7O0FBRUE7QUFDQSxRQUFNLEtB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QXFCLEVBQUUsUUFBRixFQUFPLE1BQVAsRUFBVyxjQUFYLEVBQW1CLFVBQW5CLEVBQXlCLFVBQXpCLEVBQStCLElBQS9CLEVBQXJCOztBQUVBLFlBQUksS0FBSyxPQUFMLENBQWEsTUFBYixHQUFzQixLQUFLLFVBQS9CLEVBQTJDOztBQUV2QyxpQkFBSyxPQUFMLENBQWEsR0FBYjtBQUNIOztBQUVELGFBQUssTUFBTDtBQUNILEtBZEQ7O0FBZ0JBLFNBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0IsY0FBeEI7O0FBRUEsUUFBSSxRQUFKLEdBQWUsSUFBZjtBQUNQLENBakVEOztBQW9FQSxLQUFLLElBQUwsQ0FBVSxXQUFWLEVBQXVCLG1iQUF2QixFQUE0YyxFQUE1YyxFQUFnZCxFQUFoZCxFQUFvZCxVQUFTLElBQVQsRUFBZSxDQUNsZSxDQUREOztBQUlBLEtBQUssSUFBTCxDQUFVLE1BQVYsRUFBa0IsMkJBQWxCLEVBQStDLEVBQS9DLEVBQW1ELEVBQW5ELEVBQXVELFVBQVMsSUFBVCxFQUFlOztBQUVsRSxTQUFLLElBQUwsR0FBWSxPQUFPLElBQVAsQ0FBWSxLQUFLLElBQWpCLEVBQXVCLEdBQXZCLENBQTJCO0FBQUEsdUJBQVcsQ0FBWDtBQUFBLEtBQTNCLEVBQTJDLElBQTNDLENBQWdELEdBQWhELENBQVo7QUFDSCxDQUhEOztBQUtBLEtBQUssSUFBTCxDQUFVLEtBQVYsRUFBaUIsRUFBakIsRUFBcUIsRUFBckIsRUFBeUIsRUFBekIsRUFBNkIsVUFBUyxJQUFULEVBQWU7QUFDeEMsU0FBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLElBQUwsQ0FBVSxPQUFoQztBQUNILENBRkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4vbGliL29ic2VydmVyJztcbmltcG9ydCAqIGFzIEFjdGlvbkZvcm1zIGZyb20gJy4vbGliL2FjdGlvbi1mb3Jtcyc7XG5pbXBvcnQgJy4vdGFncyc7XG5cbmNvbnN0IFJpb3RVdGlscyA9IHtcblxuICAgIE9ic2VydmVyLFxuICAgIEFjdGlvbkZvcm1zXG59XG5cbmdsb2JhbC5SaW90VXRpbHMgPSBSaW90VXRpbHM7XG4iLCJpbXBvcnQgeyBPYnNlcnZlciB9IGZyb20gJy4uL29ic2VydmVyJztcbmltcG9ydCB7IHZhbGlkYXRlUmVnZXgsIGNvbmZpcm1WYWxpZGF0aW9uLCBmaW5kRmllbGRDb250YWluZXIsIGZvcm1hdFZhbHVlLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgY2xhc3NlcyA9IGNvbmZpZy5jbGFzc2VzO1xuXG4vKipcbiAqIEFkZHMgdmFsaWRhdGlvbiBmdW5jdGlvbmFsaXR5IHRvIGZvcm0gZmllbGRzXG4gKiB0byBkaXNwbGF5IGVycm9ycyBhbmQgaGVscCBmaWVsZHMuIEJpbmRzIGZpZWxkIHdpdGhcbiAqIFJpb3QgT2JzZXJ2YWJsZSBhbmQgZ2l2ZXMgZWxlbWVudHMgZXZlbnQgZmVhdHVyZXMuXG4gKlxuICogQHBhcmFtIHsgSFRNTEZvcm1FbGVtZW50IH0gZmllbGQgLSBGaWVsZCB3aG9zZSBwYXJlbnQgd2Ugd2lsbCByZXR1cm5cbiAqIEBwYXJhbSB7IE9iamVjdCB9IHZhbGlkYXRpb25zIC0gUGFyZW50IGZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kRmllbGQgKGZpZWxkLCB2YWxpZGF0aW9ucykge1xuXG4gICAgY29uc3QgcGFyZW50ID0gZmluZEZpZWxkQ29udGFpbmVyKGZpZWxkLCBjbGFzc2VzLmNvbnRhaW5lciB8fCAnLmZpZWxkJyApO1xuXG4gICAgY29uc3QgbmFtZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnbmFtZScpO1xuICAgIGNvbnN0IHR5cGUgPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKTtcbiAgICBjb25zdCByZXF1aXJlZCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVxdWlyZWQnKSAhPT0gdW5kZWZpbmVkO1xuXG4gICAgLy8gRm9ybWF0dGluZyBmdW5jdGlvblxuICAgIGNvbnN0IGZvcm1hdCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgnZm9ybWF0Jyk7XG5cbiAgICAvLyBWYWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgLy8gaW5wdXRbZGF0YS12YWxpZGF0ZV0gc2hvdWxkIGJlIGEgZnVuY3Rpb24gaW5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZpZWxkLmdldEF0dHJpYnV0ZSgndmFsaWRhdGUnKTtcblxuICAgIC8vIE1hdGNoIHZhbHVlIGFnYWluc3QgYW5vdGhlciBlbGVtZW50XG4gICAgLy8gU2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yXG4gICAgY29uc3QgZXF1YWxzID0gZmllbGQuZ2V0QXR0cmlidXRlKCdlcXVhbHMnKTtcblxuICAgIC8vIEN1c3RvbSByZWd1bGFyIGV4cHJlc3Npb25cbiAgICBjb25zdCByZWdleCA9IGZpZWxkLmdldEF0dHJpYnV0ZSgncmVnZXgnKTtcblxuICAgIC8vIEV2ZW50cyB0byBiaW5kIHRvXG4gICAgY29uc3Qgb24gPSBmaWVsZC5nZXRBdHRyaWJ1dGUoJ29uJykgfHwgJ2NoYW5nZSc7XG5cbiAgICAvLyBJbnB1dCB2YWxpZGF0aW9uIG9iamVjdCB0byBoYW5kbGUgbXVsdGlwbGUgbWV0aG9kc1xuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB7fTtcblxuICAgIGxldCBpc1ZhbGlkID0gZmFsc2U7XG5cbiAgICBpZiAoZmllbGQuZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpIHx8IHR5cGUgPT09ICdoaWRkZW4nKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9ic2VydmVyKGZpZWxkKTtcblxuICAgIC8vIEZvcm0gdmFsaWRhdGlvbiBvYmplY3RcbiAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG5cbiAgICBpZiAoZm9ybWF0KSB7XG5cbiAgICAgICAgZm9ybWF0VmFsdWUoZm9ybWF0LCBmaWVsZCk7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGVGbiA9IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBjb25zdCBrZXlDb2RlID0gKHdpbmRvdy5ldmVudCkgPyBlLndoaWNoIDogZS5rZXlDb2RlO1xuICAgICAgICBjb25zdCBpc0JsdXIgPSBlLnR5cGUgPT09J2JsdXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGZpZWxkLnZhbHVlO1xuICAgICAgICBjb25zdCBlbXB0eSA9ICF2YWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gSWYgaXQncyByZXF1aXJlZCwgaXQgY2FuJ3QgYmUgZW1wdHlcbiAgICAgICAgaWYgKHJlcXVpcmVkKSB7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVxdWlyZWQgPSAhIXZhbHVlO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvbi5jaGVja2VkID0gZmllbGQuY2hlY2tlZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBleGlzdGluZyB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgICAgIGlmICh2YWxpZGF0ZSkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnZhbGlkYXRlID0gdmFsaWRhdGVSZWdleCh2YWx1ZSwgdmFsaWRhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzZXJ0IGFnYWluc3QgY3VzdG9tIHJlZ2V4XG4gICAgICAgIGlmIChyZWdleCkge1xuXG4gICAgICAgICAgICBjb25zdCByZ3ggPSBuZXcgUmVnRXhwKHJlZ2V4KTtcbiAgICAgICAgICAgIHZhbGlkYXRpb24ucmVnZXggPSByZ3gudGVzdCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NlcnQgYWdhaW5zdCBhbm90aGVyIGZpZWxkJ3MgdmFsdWVcbiAgICAgICAgaWYgKGVxdWFscykge1xuXG4gICAgICAgICAgICBjb25zdCBlcXVhbHNFbGVtZW50ID0gZmllbGQuZm9ybS5xdWVyeVNlbGVjdG9yKGVxdWFscyk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRpb24uZXF1YWxzID0gdmFsdWUgPT09IGVxdWFsc0VsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgICAgIGlmICghZXF1YWxzRWxlbWVudC5pc1ZhbGlkKSB7XG5cbiAgICAgICAgICAgICAgICBlcXVhbHNFbGVtZW50LnRyaWdnZXIoJ3ZhbGlkYXRlJywge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBDaGVjayBpbnB1dCB2YWxpZGF0aW9uXG4gICAgICAgIGlzVmFsaWQgPSBjb25maXJtVmFsaWRhdGlvbih2YWxpZGF0aW9uKTtcblxuICAgICAgICAvLyBJbnB1dCBpcyBub3QgcmVxdWlyZWQgYW5kIGlzIGVtcHR5XG4gICAgICAgIGlmICghaXNWYWxpZCAmJiAhcmVxdWlyZWQgJiYgIXZhbHVlICYmIGlzQmx1cikge1xuXG4gICAgICAgICAgICBpc1ZhbGlkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbGlkYXRlZChpc1ZhbGlkKTtcbiAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XG5cbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVkID0gZnVuY3Rpb24oaXNWYWxpZCkge1xuXG4gICAgICAgIC8vIEJpbmQgdG8gdmFsaWRhdGlvbiBvYmplY3QgZm9yIGZvcm0gY2hlY2tcbiAgICAgICAgaWYgKHZhbGlkYXRlIHx8IHJlZ2V4IHx8IGVxdWFscyB8fCByZXF1aXJlZCkge1xuXG4gICAgICAgICAgICB2YWxpZGF0aW9uc1tuYW1lXSA9IGlzVmFsaWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kIHZhbGlkaXR5IHRvIGh0bWwgZWxlbWVudFxuICAgICAgICBmaWVsZC5pc1ZhbGlkID0gaXNWYWxpZDtcblxuICAgICAgICAvLyBJZiBpdCdzIHZhbGlkLCByZW1vdmUgZXJyb3IgY2xhc3NlcyBhbmQgaGlkZSB0aGUgaGVscCBibG9jay5cbiAgICAgICAgLy8gVGhpcyBpcyBtZWFudCB0byB3b3JrIHdpdGggYm9vdHN0cmFwIGZvcm1zLlxuICAgICAgICBpZiAoaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LmFkZChjbGFzc2VzLmVycm9yKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXMuc3VjY2Vzcyk7XG5cbiAgICAgICAgICAgIHBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc2VzLmhlbHB9YCkuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLmhpZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWxsb3cgZmllbGRzIHRoYXQgYXJlIG5vdCByZXF1aXJlZFxuICAgICAgICBpZiAoaXNWYWxpZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICBmaWVsZC5zZXRCbGFuaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgfTtcblxuICAgIC8vIEJpbmQgZXZlbnRzIHRvIHZhbGlkYXRpb24gZnVuY3Rpb25cbiAgICBvbi5zcGxpdCgnICcpLm1hcChvID0+IGZpZWxkW2BvbiR7b31gXSA9IHZhbGlkYXRlRm4pO1xuXG4gICAgZmllbGQub24oJ3ZhbGlkYXRlJywgdmFsaWRhdGVGbik7XG5cbiAgICBjb25zdCBzZXRCbGFuayA9ICgpID0+IHtcblxuICAgICAgICBwYXJlbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzLnN1Y2Nlc3MsIGNsYXNzZXMuZXJyb3IsIGNsYXNzZXMud2FybmluZywgY2xhc3Nlcy5pbmZvKTtcbiAgICAgICAgcGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke2NsYXNzZXMuaGVscH1gKS5jbGFzc0xpc3QuYWRkKGNsYXNzZXMuaGlkZSk7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IE9ic2VydmVyIH0gZnJvbSAnLi4vb2JzZXJ2ZXInO1xuaW1wb3J0IHsgYmluZEZpZWxkIH0gZnJvbSAnLi9iaW5kLWZpZWxkJztcbmltcG9ydCB7IGNvbmZpcm1WYWxpZGF0aW9uLCBjb25maWcgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc29sZS5sb2coY29uZmlnLmVsZW1lbnRzKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZm9ybSkge1xuXG4gICAgY29uc29sZS5sb2coZm9ybSk7XG5cbiAgICBsZXQgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKGNvbmZpZy5lbGVtZW50cyk7XG4gICAgY29uc3Qgc3VibWl0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgY29uc3QgdmFsaWRhdGlvbnMgPSB7fTtcblxuICAgIGZvcm0udmFsaWRhdGlvbnMgPSB2YWxpZGF0aW9ucztcbiAgICBmb3JtLmlzVmFsaWQgPSBmYWxzZTtcbiAgICBmb3JtLm5vVmFsaWRhdGUgPSB0cnVlO1xuXG4gICAgT2JzZXJ2ZXIoZm9ybSk7XG5cbiAgICBjb25zdCB2YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGZvcm0uaXNWYWxpZCA9IGNvbmZpcm1WYWxpZGF0aW9uKHZhbGlkYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIGZvcm0uaXNWYWxpZDtcbiAgICB9O1xuXG4gICAgY29uc3QgdmFsaWRhdGVBbGwgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhc3Nlc3NTdWJtaXQoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgdmFsaWRcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGUoKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dHMuZm9yRWFjaCgoZmllbGQsIGkpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpID09PSAoaW5wdXRzLmxlbmd0aC0xKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLm9uZSgndmFsaWRhdGVkJywgKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3Nlc3NTdWJtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmllbGQudHJpZ2dlcigndmFsaWRhdGUnLCB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9ybS5vbigndmFsaWRhdGUnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YWxpZGF0ZUFsbCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZm9ybS5vbigndmFsaWRhdGVkJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmIChmb3JtLmlzVmFsaWQpIHtcblxuICAgICAgICAgICAgZm9ybS50cmlnZ2VyKCdzdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGUgZm9ybSBpcyBzdWJtaXR0aW5nLCBpdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBmaWVsZHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICBmb3JtLm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAoIWZvcm0uaXNWYWxpZCkge1xuXG4gICAgICAgICAgICBmb3JtLnRyaWdnZXIoJ3ZhbGlkYXRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIGZvcm0udHJpZ2dlcigndmFsaWRhdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLyBBZGQgdmFsaWRhdGlvbiBmdW5jdGlvbmFsaXR5IHRvIGZvcm0gZWxlbWVudHNcbiAgICBmdW5jdGlvbiBiaW5kRmllbGRzKCkge1xuXG4gICAgICAgIGlucHV0cy5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG5cbiAgICAgICAgICAgIGJpbmRGaWVsZChmaWVsZCwgdmFsaWRhdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBiaW5kRmllbGRzKCk7XG5cbiAgICAvLyBSZWJpbmQgdmFsaWRhdGlvbnMgaW4gY2FzZSBvZiBuZXcgcmVxdWlyZWQgZmllbGRzXG4gICAgaWYgKCFmb3JtLnJlYmluZCkge1xuXG4gICAgICAgIGZvcm0ucmViaW5kID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlucHV0cyA9IGZvcm0uZmluZChjb25maWcuZWxlbWVudHMpO1xuICAgICAgICAgICAgYmluZEZpZWxkcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybS5vbigncmViaW5kJywgZm9ybS5yZWJpbmQpO1xuICAgIH1cblxuICAgIGZvcm0ub24oJ3Jlc2V0JywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZm9ybS5yZXNldCgpO1xuICAgICAgICBmb3JtLmlzVmFsaWQgPSBmYWxzZTtcblxuICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuXG4gICAgICAgICAgICBmaWVsZC5zZXRCbGFuaygpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG4iLCJleHBvcnQgeyBiaW5kIH0gZnJvbSAnLi9iaW5kLWZvcm0nO1xuZXhwb3J0ICogZnJvbSAnLi91dGlscyc7XG4iLCJleHBvcnQgY29uc3QgY29uZmlnID0ge1xuXG4gICAgLy8gRWxlbWVudHMgdG8gYmUgc2VsZWN0ZWQgZm9yIHZhbGlkYXRpb25cbiAgICBlbGVtZW50czogJ1tyZXF1aXJlZF0sW2RhdGEtdmFsaWRhdGVdLFtkYXRhLWVxdWFsc10sW2RhdGEtcmVnZXhdLFtkYXRhLWNjXScsXG5cbiAgICAvLyBSZWd1bGFyIGV4cHJlc3Npb25zIHVzZWQgdG8gdmFsaWRhdGVcbiAgICByZWdleGVzOiB7XG5cbiAgICAgICAgYWxwaGFudW06IC9eW2EtejAtOV0rJC9pLFxuICAgICAgICBhbHBoYW51bXNwYWNlOiAvXlthLXowLTlcXHNdKyQvaSxcbiAgICAgICAgbmFtZTogL15bYS16XFxzXFwtXFwsXFwuXSskL2ksXG4gICAgICAgIHVzZXJuYW1lOiAvXlthLXowLTldW2EtejAtOVxcc1xcLVxcX1xcK1xcLl0rW2EtejAtOV0kL2ksXG4gICAgICAgIGZxZG46IC9eW2EtejAtOV1bYS16MC05XFwtXFxfXFwuXStbYS16MC05XXsyLDIwfSQvaSxcbiAgICAgICAgdGxkOiAvXlthLXpdezIsMjB9L2ksXG4gICAgICAgIHBob25lOiAvXlxcKD8oWzAtOV17M30pXFwpP1stLiBdPyhbMC05XXszfSlbLS4gXT8oWzAtOV17NH0pJC8sXG4gICAgICAgIGVtYWlsOiAvLitALitcXC4uKy9pXG4gICAgfSxcblxuICAgIC8vIEZlZWRiYWNrLCBzdGF0ZSwgYW5kIGNvbnRhaW5lciBjbGFzc2VzXG4gICAgY2xhc3Nlczoge1xuXG4gICAgICAgIGNvbnRhaW5lcjogJ2ZpZWxkJyxcbiAgICAgICAgZXJyb3I6ICdlcnJvcicsXG4gICAgICAgIGhlbHA6ICdoZWxwJyxcbiAgICAgICAgaGlkZTogJ2hpZGUnLFxuICAgICAgICBpbmZvOiAnaW5mbycsXG4gICAgICAgIHN1Y2Nlc3M6ICdzdWNjZXNzJyxcbiAgICAgICAgd2FybmluZzogJ3dhcm5pbmcnXG4gICAgfSxcblxuICAgIC8vIEZpZWxkIGZvcm1hdHRpbmcgZnVuY3Rpb25zXG4gICAgZm9ybWF0OiB7XG4gICAgICAgIGNjOiBmdW5jdGlvbiAoKSB7fVxuICAgIH1cbn1cblxuLypcbiAqIEZvcm1hdCBhIGZpZWxkJ3MgdmFsdWUgYmFzZWQgb24gZnVuY3Rpb25zIGluIGBjb25maWcuZm9ybWF0YFxuICpcbiAqIEBwYXJhbSB7IFN0cmluZyB9IGZvcm1hdEZuIC0gTmFtZSBvZiBmdW5jdGlvbiBpbiBgY29uZmlnLmZvcm1hdGBcbiAqIEBwYXJhbSB7IEhUTUxGb3JtRWxlbWVudCB9IGZpZWxkIC0gRmllbGQgdG8gZm9ybWF0IHZhbHVlIG9mXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRWYWx1ZShmb3JtYXRGbiwgZmllbGQpIHtcblxuICAgIGlmICh0eXBlb2YgY29uZmlnLmZvcm1hdFtmb3JtYXRGbl0gPT09ICdmdW5jdGlvbicpIHtcblxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoYCR7Zm9ybWF0Rm59IGRvZXMgbm90IGV4aXN0IG9yIGlzIG5vdCBhIGZ1bmN0aW9uYCk7XG4gICAgfVxuXG4gICAgZmllbGQudmFsdWUgPSBjb25maWcuZm9ybWF0W2Zvcm1hdEZuXShmaWVsZC52YWx1ZSk7XG59XG5cbi8vIE92ZXJ3cml0ZSBjb25maWdcbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUob3B0cykge1xuXG4gICAgZm9yIChvcHQgaW4gb3B0cykge1xuXG4gICAgICAgIGlmIChjb25maWdbb3B0XS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG5cbiAgICAgICAgICAgIGNvbmZpZ1tvcHRdID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnW29wdF0sIG9wdHNbb3B0XSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIGNvbmZpZ1tvcHRdID0gb3B0c1tvcHRdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8qKlxuICogVmFsaWRhdGVzIGEgdmFsdWUgYW5kIHJldHVybnMgdHJ1ZSBvciBmYWxzZS5cbiAqIFRocm93cyBlcnJvciBpZiBpdCBjYW5ub3QgdmFsaWRhdGVcbiAqXG4gKiBAcGFyYW0geyBTdHJpbmcgfSB2YWx1ZSAtIFZhbHVlIHRvIGJlIHZhbGlkYXRlZFxuICogQHBhcmFtIHsgU3RyaW5nIHwgUmVnRXhwIH0gcmd4IC0gU3RyaW5nIHJlZmVyZW5jZSB0byBgcmVnZXhlc2Agb3IgYSBSZWdFeHBcbiAqXG4gKiBAcmV0dXJucyB7IEJvb2xlYW4gfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVSZWdleCh2YWx1ZSwgcmd4KSB7XG5cbiAgICAvLyBBY2NlcHRzIFJlZ0V4cCBhcyBzZWNvbmQgdmFsdWVcbiAgICBpZiAocmd4LmNvbnN0cnVjdG9yID09PSBSZWdFeHApIHtcblxuICAgICAgICByZXR1cm4gcmd4LnRlc3QodmFsdWUpO1xuICAgIH1cblxuICAgIC8vIFNlY29uZCB2YWx1ZSBpcyBhIHN0cmluZywgc28gaXQgbXVzdCBleGlzdFxuICAgIC8vIGluc2lkZSBvZiBgY29uZmlnLnJlZ2V4ZXNgIG9iamVjdFxuICAgIGlmICh0eXBlb2Ygcmd4ID09PSAnc3RyaW5nJyAmJiBjb25maWcucmVnZXhlc1tyZ3hdICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICByZXR1cm4gY29uZmlnLnJlZ2V4ZXNbcmd4XS50ZXN0KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBjb25kaXRpb25zIGFyZW4ndCBtZXQsIHRocm93IGVycm9yXG4gICAgdGhyb3cgRXJyb3IoJ3NlY29uZCBwYXJhbWV0ZXIgaXMgYW4gaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gb3IgZG9lcyBub3QgZXhpc3Qgd2l0aGluIHV0aWxpdGllcyBvYmplY3QnKTtcblxufVxuXG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBhbiBvYmplY3QgYW5kIGNoZWNrcyBmb3IgdHJ1ZSBvciBmYWxzZVxuICpcbiAqIEBwYXJhbSB7IE9iamVjdCB9IG9iaiAtIE9iamVjdCB0byBpdGVyYXRlXG4gKlxuICogQHJldHVybnMgeyBCb29sZWFuIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpcm1WYWxpZGF0aW9uKG9iaikge1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBvYmplY3RcbiAgICBmb3IgKHZhciB2IGluIG9iaikge1xuXG4gICAgICAgIC8vIEFuZCByZXR1cm4gZmFsc2UgaWYgYW55IGtleSBpcyBmYWxzZVxuICAgICAgICBpZiAob2JqW3ZdID09PSBmYWxzZSkge1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLyoqXG4gKiBDcmF3bHMgdXAgdGhlIERPTSBzdGFydGluZyBmcm9tIHRoZSBgZmllbGRgIGVsZW1lbnRcbiAqIGFuZCBmaW5kcyBjb250YWluaW5nIGVsZW1lbnQgd2l0aCBjbGFzcyBuYW1lcyBzcGVjaWZpZWRcbiAqIGluIHRoZSBgY2xhc3Nlc2Agb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7IEhUTUxGb3JtRWxlbWVudCB9IGZpZWxkIC0gRmllbGQgd2hvc2UgcGFyZW50IHdlIHdpbGwgcmV0dXJuXG4gKiBAcGFyYW0geyBPYmplY3QgfSBjb250YWluZXJDbGFzcyAtIE5hbWUgb2YgY2xhc3MgdGhlIGNvbnRhaW5lciB3aWxsIGhhdmVcbiAqXG4gKiBAcmV0dXJucyB7IEhUTUxFbGVtZW50IH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRGaWVsZENvbnRhaW5lciAoZmllbGQsIGNvbnRhaW5lckNsYXNzKSB7XG5cbiAgICBpZiAoZmllbGQgPT09IGRvY3VtZW50LmJvZHkpIHtcblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpZWxkIG5hbWVkICR7ZmllbGQubmFtZX0gaXMgbm90IGluc2lkZSBhIGZpZWxkIGNvbnRhaW5lcmApO1xuICAgIH1cblxuICAgIGxldCBwYXJlbnQgPSBmaWVsZC5wYXJlbnRFbGVtZW50O1xuXG4gICAgaWYgKCFwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNvbnRhaW5lckNsYXNzKSkge1xuXG4gICAgICAgIHBhcmVudCA9IGZpbmRGaWVsZENvbnRhaW5lcihwYXJlbnQsIGNvbnRhaW5lckNsYXNzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyZW50O1xufVxuIiwiY29uc3Qgb2JzZXJ2YWJsZSA9IHJpb3Qub2JzZXJ2YWJsZTtcclxuXHJcbmNvbnN0IG9wdHMgPSB7XHJcbiAgICBkZWJ1ZzogZmFsc2UsXHJcbiAgICBkZWJ1Z0ZuOiBmYWxzZVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gT2JzZXJ2ZXIgKG9iaiwgcHJvcHMpIHtcclxuXHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAvLyBPYnNlcnZlcmFibGUgb2JzZXJ2ZXIgZm9yIHRoaXMgaW5zdGFuY2VcclxuICAgIGNvbnN0IG9ic2VydmVyID0gb2JzZXJ2YWJsZSgpO1xyXG5cclxuICAgIC8vIFByb3BlcnRpZXMgb2JqZWN0IHRvIHJld3JhcFxyXG4gICAgY29uc3QgcHJvcGVydGllcyA9IHt9O1xyXG5cclxuICAgIC8vIFJld3JhcCBvYnNlcnZlciBmdW5jdGlvbnMgZm9yIGRlYnVnZ2luZ1xyXG4gICAgWydvbicsICdvbmUnLCAnb2ZmJywgJ3RyaWdnZXInXS5mb3JFYWNoKChmbikgPT4ge1xyXG5cclxuICAgICAgICAvLyBTaW1wbHkgcGFzcyBieSByZWZlcmVuY2UgaW4gcHJvZHVjdGlvblxyXG4gICAgICAgIGxldCBleGVjRm4gPSBvYnNlcnZlcltmbl07XHJcblxyXG4gICAgICAgIC8vIFJld3JhcCBhbmQgbG9nIGlmIGRlYnVnZ2luZ1xyXG4gICAgICAgIGlmIChvcHRzLmRlYnVnKSB7XHJcblxyXG4gICAgICAgICAgICBleGVjRm4gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXJbZm5dLmFwcGx5KG9ic2VydmVyW2ZuXSwgYXJndW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBIb29rIGludG8gZnVuY3Rpb24gZm9yIG1ha2luZyBkZWJ1Z2dpbmcgdG9vbHNcclxuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRlYnVnRm4gJiYgdHlwZW9mIG9wdHMuZGVidWdGbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gYXJncy5zaGlmdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBvcHRzLmRlYnVnRm4uYXBwbHkoe30sIFtvYmosIGZuLCBhY3Rpb24sIGFyZ3NdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aG9zZSBmdW5jdGlvbnMgY2Fubm90IGJlIG92ZXJ3cml0dGVuXHJcbiAgICAgICAgcHJvcGVydGllc1tmbl0gPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBleGVjRm4sXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEZWZpbmUgcHJvcGVydGllcyBpbiBgcHJvcHNgXHJcbiAgICBwcm9wcyAmJiBPYmplY3Qua2V5cyhwcm9wcykubWFwKChrZXkpID0+IHtcclxuXHJcbiAgICAgICAgcHJvcGVydGllc1trZXldID0gcHJvcHNba2V5XTtcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iaiwgcHJvcGVydGllcyk7XHJcbn1cclxuXHJcbk9ic2VydmVyLmNvbmZpZ3VyZSA9IChvYmopID0+IHtcclxuXHJcbiAgICBPYmplY3QuYXNzaWduKG9wdHMsIG9iaik7XHJcbn1cclxuIiwicmlvdC50YWcyKCdkZWJ1Z2dlcicsICc8YiBpZD1cInN0aWNrXCIgb25jbGljaz1cIntzdGlja1RvZ2dsZX1cIiBpZj1cIntvcGVufVwiPntzdGlja0luZGljYXRvcn08L2I+PHNlbGVjdCBvbmNoYW5nZT1cIntjaGFuZ2VQb3N9XCIgaWY9XCJ7b3Blbn1cIj48b3B0aW9uPnRvcC1yaWdodDwvb3B0aW9uPjxvcHRpb24+dG9wLWxlZnQ8L29wdGlvbj48b3B0aW9uIHNlbGVjdGVkPVwiXCI+Ym90dG9tLXJpZ2h0PC9vcHRpb24+PG9wdGlvbj5ib3R0b20tbGVmdDwvb3B0aW9uPjwvc2VsZWN0PjxiIGlkPVwiY2xlYXJcIiBvbmNsaWNrPVwie2NsZWFyfVwiIGlmPVwie29wZW59XCI+Y2xlYXI8L2I+PGgzIG9uY2xpY2s9XCJ7dG9nZ2xlfVwiPjxiIGlkPVwidG9nZ2xlXCI+e3RvZ2dsZUluZGljYXRvcn08L2I+IERlYnVnZ2VyIDwvaDM+PHNlY3Rpb24gaWQ9XCJhY3Rpb25zXCI+PGRlYnVnaXRlbSBlYWNoPVwie2FjdGlvbnN9XCI+PC9kZWJ1Z2l0ZW0+PHAgY2xhc3M9XCJtZXNzYWdlXCIgb25jbGljaz1cIntjaGFuZ2VOdW1BY3Rpb25zfVwiPiBTaG93aW5nIGxhc3Qge251bUFjdGlvbnN9IGFjdGlvbnMuLi4gPC9wPjwvc2VjdGlvbj4nLCAnZGVidWdnZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXXsgcG9zaXRpb246IGZpeGVkOyB6LWluZGV4OiA5OTk5OyBib3R0b206IDEwcHg7IHJpZ2h0OiAtMzAwcHg7IG9wYWNpdHk6IDAuMjU7IHdpZHRoOiA0MDBweDsgaGVpZ2h0OiA2MDBweDsgYmFja2dyb3VuZDogI2VlZTsgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsgZm9udC1zaXplOiAxMXB4OyB9IGRlYnVnZ2VyLnRvcC1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQsZGVidWdnZXIudG9wLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0eyB0b3A6IDEwcHg7IH0gZGVidWdnZXIuYm90dG9tLWxlZnQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tbGVmdCxkZWJ1Z2dlci5ib3R0b20tcmlnaHQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tcmlnaHR7IGJvdHRvbTogMTBweDsgfSBkZWJ1Z2dlci50b3AtbGVmdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1sZWZ0LGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnR7IGxlZnQ6IC0zMDBweDsgfSBkZWJ1Z2dlci50b3AtcmlnaHQsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtcmlnaHQsZGVidWdnZXIuYm90dG9tLXJpZ2h0LFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0eyByaWdodDogLTMwMHB4OyB9IGRlYnVnZ2VyLnRvcC1sZWZ0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLWxlZnQ6aG92ZXIsZGVidWdnZXIudG9wLWxlZnQuc3RpY2ssW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS50b3AtbGVmdC5zdGljayxkZWJ1Z2dlci5ib3R0b20tbGVmdDpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmJvdHRvbS1sZWZ0OmhvdmVyLGRlYnVnZ2VyLmJvdHRvbS1sZWZ0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLWxlZnQuc3RpY2t7IGxlZnQ6IDEwcHg7IG9wYWNpdHk6IDE7IH0gZGVidWdnZXIudG9wLXJpZ2h0OmhvdmVyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0udG9wLXJpZ2h0OmhvdmVyLGRlYnVnZ2VyLnRvcC1yaWdodC5zdGljayxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLnRvcC1yaWdodC5zdGljayxkZWJ1Z2dlci5ib3R0b20tcmlnaHQ6aG92ZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXS5ib3R0b20tcmlnaHQ6aG92ZXIsZGVidWdnZXIuYm90dG9tLXJpZ2h0LnN0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0uYm90dG9tLXJpZ2h0LnN0aWNreyByaWdodDogMTBweDsgb3BhY2l0eTogMTsgfSBkZWJ1Z2dlci5jbG9zZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdLmNsb3NleyBoZWlnaHQ6IDE1cHg7IH0gZGVidWdnZXIgI3RvZ2dsZSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICN0b2dnbGUsZGVidWdnZXIgI3N0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI3N0aWNrLGRlYnVnZ2VyIGgzLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gaDMsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBjdXJzb3I6IHBvaW50ZXI7IH0gZGVidWdnZXIgI3N0aWNrLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI3N0aWNrLGRlYnVnZ2VyIHNlbGVjdCxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdIHNlbGVjdCxkZWJ1Z2dlciAjY2xlYXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjY2xlYXJ7IGZsb2F0OiByaWdodDsgfSBkZWJ1Z2dlciBzZWxlY3QsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBzZWxlY3QsZGVidWdnZXIgI2NsZWFyLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2NsZWFyeyBtYXJnaW4tcmlnaHQ6IDIwcHg7IH0gZGVidWdnZXIgaDMsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSBoM3sgbWFyZ2luOiAwOyBmb250LXNpemU6IDE1cHg7IGxpbmUtaGVpZ2h0OiAxNXB4OyBwYWRkaW5nOiAwOyB9IGRlYnVnZ2VyICNhY3Rpb25zLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnN7IGRpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogNTBweDsgbGVmdDogMTBweDsgcmlnaHQ6IDEwcHg7IGJvdHRvbTogMTBweDsgb3ZlcmZsb3c6IGF1dG87IH0gZGVidWdnZXIsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSxkZWJ1Z2dlciAjYWN0aW9ucyBkZWJ1Z2l0ZW0sW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyBkZWJ1Z2l0ZW17IGRpc3BsYXk6IGJsb2NrOyBwYWRkaW5nOiAxMHB4OyBtYXJnaW4tYm90dG9tOiAxMHB4OyBib3JkZXI6IDFweCBzb2xpZCAjYWFhOyB0cmFuc2l0aW9uOiBhbGwgMjUwbXMgY3ViaWMtYmV6aWVyKDAuMjIsIDAuNjEsIDAuMzYsIDEpOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSxbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbXsgYmFja2dyb3VuZDogI2ZmZjsgcG9zaXRpb246IHJlbGF0aXZlOyBib3gtc2hhZG93OiAwOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbTpob3ZlcixbZGF0YS1pcz1cImRlYnVnZ2VyXCJdICNhY3Rpb25zIGRlYnVnaXRlbTpob3ZlcnsgYm9yZGVyLWNvbG9yOiAjZjcwOyBib3gtc2hhZG93OiAwcHggMTBweCA1cHggLThweCByZ2JhKDAsMCwwLDAuMjUpOyB9IGRlYnVnZ2VyICNhY3Rpb25zIGRlYnVnaXRlbSBjb2RlLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtIGNvZGV7IGJhY2tncm91bmQ6ICNlZWU7IHBhZGRpbmc6IDIuNXB4IDVweDsgbGluZS1oZWlnaHQ6IDExcHg7IH0gZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtIGkjbnVtLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtIGkjbnVteyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTBweDsgcmlnaHQ6IDEwcHg7IH0gZGVidWdnZXIgI2FjdGlvbnMgZGVidWdpdGVtICN0aW1lLFtkYXRhLWlzPVwiZGVidWdnZXJcIl0gI2FjdGlvbnMgZGVidWdpdGVtICN0aW1leyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTBweDsgcmlnaHQ6IDYwcHg7IG9wYWNpdHk6IDAuMjU7IH0gZGVidWdnZXIgI2FjdGlvbnMgLm1lc3NhZ2UsW2RhdGEtaXM9XCJkZWJ1Z2dlclwiXSAjYWN0aW9ucyAubWVzc2FnZXsgY3Vyc29yOiBwb2ludGVyOyB0ZXh0LWFsaWduOiBjZW50ZXI7IG9wYWNpdHk6IDAuMjU7IH0nLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmFjdGlvbnMgPSBbXTtcbiAgICAgICAgc2VsZi5pID0gMDtcbiAgICAgICAgc2VsZi50b2dnbGVJbmRpY2F0b3IgPSAnLSc7XG4gICAgICAgIHNlbGYuc3RpY2tJbmRpY2F0b3IgPSAnc3RpY2snO1xuICAgICAgICBzZWxmLm9wZW4gPSB0cnVlO1xuICAgICAgICBzZWxmLnN0aWNrID0gZmFsc2U7XG5cbiAgICAgICAgc2VsZi50b2dnbGUgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYub3BlbiA9ICFzZWxmLm9wZW47XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0W3NlbGYub3BlbiA/ICdyZW1vdmUnIDogJ2FkZCddKCdjbG9zZScpO1xuICAgICAgICAgICAgc2VsZi50b2dnbGVJbmRpY2F0b3IgPSBzZWxmLm9wZW4gPyAnLScgOiAnKyc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnN0aWNrVG9nZ2xlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBzZWxmLnN0aWNrID0gIXNlbGYuc3RpY2s7XG4gICAgICAgICAgICBzZWxmLnJvb3QuY2xhc3NMaXN0W3NlbGYuc3RpY2sgPyAnYWRkJyA6ICdyZW1vdmUnXSgnc3RpY2snKTtcbiAgICAgICAgICAgIHNlbGYuc3RpY2tJbmRpY2F0b3IgPSBzZWxmLnN0aWNrID8gJ2ZhZGUnIDogJ3N0aWNrJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuY2xlYXIgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHNlbGYuYWN0aW9ucyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5jaGFuZ2VQb3MgPSAoZXZlbnQpID0+IHtcblxuICAgICAgICAgICAgc2VsZi5yb290LmNsYXNzTGlzdC5yZW1vdmUoJ3RvcC1yaWdodCcsICd0b3AtbGVmdCcsICdib3R0b20tcmlnaHQnLCAnYm90dG9tLWxlZnQnKTtcbiAgICAgICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QuYWRkKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLm51bUFjdGlvbnMgPSAyMDtcbiAgICAgICAgc2VsZi5jaGFuZ2VOdW1BY3Rpb25zID0gKCkgPT4ge1xuXG4gICAgICAgICAgICBjb25zdCBhc2sgPSBwcm9tcHQoJ051bWJlciBvZiBhY3Rpb25zIHRvIHNob3c/Jyk7XG5cbiAgICAgICAgICAgIGlmIChhc2spIHtcblxuICAgICAgICAgICAgICAgIHNlbGYubnVtQWN0aW9ucyA9IHBhcnNlSW50KGFzay5yZXBsYWNlKC9bYS16XSsvaWcsICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLm9uKCdzdGF0ZScsIChvYmosIGZuLCBhY3Rpb24sIGFyZ3MpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgdGltZSA9ICtuZXcgRGF0ZTtcblxuICAgICAgICAgICAgc2VsZi5pKys7XG4gICAgICAgICAgICBjb25zdCBpID0gc2VsZi5pO1xuICAgICAgICAgICAgc2VsZi5hY3Rpb25zLnVuc2hpZnQoeyBvYmosIGZuLCBhY3Rpb24sIGFyZ3MsIHRpbWUsIGkgfSk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmFjdGlvbnMubGVuZ3RoID4gc2VsZi5udW1BY3Rpb25zKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLmFjdGlvbnMucG9wKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYudXBkYXRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYucm9vdC5jbGFzc0xpc3QuYWRkKCdib3R0b20tcmlnaHQnKTtcblxuICAgICAgICBhcHAuZGVidWdnZXIgPSBzZWxmO1xufSk7XG5cblxucmlvdC50YWcyKCdkZWJ1Z2l0ZW0nLCAnPHNwYW4gY2xhc3M9XCJuYW1lXCIgaWY9XCJ7b2JqICYmIG9iai5uYW1lfVwiPiB7b2JqLm5hbWV9IDwvc3Bhbj48Yj57Zm59PC9iPiAmbWRhc2g7IDxpPnthY3Rpb259PC9pPjxzcGFuIGlkPVwidGltZVwiPnt0aW1lfTwvc3Bhbj48aSBpZD1cIm51bVwiPntpfTwvaT48YnI+PHA+QXJndW1lbnRzPC9wPjxkaXYgZWFjaD1cInthcmcgaW4gYXJnc31cIj48aT57YXJnLmNvbnN0cnVjdG9yLm5hbWV9PC9pPiAmbWRhc2g7IDxzcGFuIGlmPVwie1tcXCdvYmplY3RcXCcsIFxcJ2Z1bmN0aW9uXFwnXS5pbmRleE9mKHR5cGVvZiBhcmcpID09PSAtMX1cIj57YXJnfTwvc3Bhbj48Y29kZSBpZj1cInt0eXBlb2YgYXJnID09PSBcXCdvYmplY3RcXCd9XCI+e0pTT04uc3RyaW5naWZ5KGFyZyl9PC9jb2RlPjxjb2RlIGlmPVwie3R5cGVvZiBhcmcgPT09IFxcJ2Z1bmN0aW9uXFwnfVwiPnthcmd9PC9jb2RlPjwvZGl2PicsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xufSk7XG5cblxucmlvdC50YWcyKCdpY29uJywgJzxpIGNsYXNzPVwiZmEge2ljb259XCI+PC9pPicsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuXG4gICAgdGhpcy5pY29uID0gT2JqZWN0LmtleXModGhpcy5vcHRzKS5tYXAoaSA9PiBgZmEtJHtpfWApLmpvaW4oJyAnKVxufSk7XG5cbnJpb3QudGFnMigncmF3JywgJycsICcnLCAnJywgZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMucm9vdC5pbm5lckhUTUwgPSB0aGlzLm9wdHMuY29udGVudFxufSk7XG5cbiJdfQ==
