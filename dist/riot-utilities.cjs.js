'use strict';

var jsBeautify = require('js-beautify');

const observable = riot.observable;

const opts = {
    debug: false,
    debugFn: false
};

function Observer (obj) {

    const self = this;

    // Observerable observer for this instance
    const observer = observable();

    // Properties object to rewrap
    const properties = {};

    // Rewrap observer functions for debugging
    ['on', 'one', 'off', 'trigger'].forEach((fn) => {

        // Simply pass by reference in production
        let execFn = observer[fn];

        // Rewrap and log if debugging
        if (opts.debug) {

            execFn = function () {

                observer[fn].apply(observer[fn], arguments);

                // Hook into function for making debugging tools
                if (opts.debugFn && typeof opts.debugFn === 'function') {

                    const args = Array.prototype.slice.apply(arguments);
                    const action = args.shift();

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

Observer.configure = (obj) => {

    Object.assign(opts, obj);
};

const name = 'prettifier';


/** Used for escape and unescape HTML. */
const escElement = document.createElement('textarea');


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

Observer(module.exports);


var Beautify = Object.freeze({
	name: name,
	escapeHTML: escapeHTML,
	unescapeHTML: unescapeHTML,
	*js-beautify: jsBeautify
});

const config = {

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
        cc: function () {}
    }
};

/*
 * Format a field's value based on functions in `config.format`
 *
 * @param { String } formatFn - Name of function in `config.format`
 * @param { HTMLFormElement } field - Field to format value of
 */
function formatValue(formatFn, field) {

    if (typeof config.format[formatFn] === 'function') {

        throw TypeError(`${formatFn} does not exist or is not a function`);
    }

    field.value = config.format[formatFn](field.value);
}

// Overwrite config
function configure(opts) {

    for (opt in opts) {

        if (config[opt].constructor === Object) {

            config[opt] = Object.assign({}, config[opt], opts[opt]);
        }
        else {

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
}


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
function findFieldContainer (field, containerClass) {

    if (field === document.body) {

        throw new Error(`Field named ${field.name} is not inside a field container`);
    }

    let parent = field.parentElement;

    if (!parent.classList.contains(containerClass)) {

        parent = findFieldContainer(parent, containerClass);
    }

    return parent;
}

const classes = config.classes;

/**
 * Adds validation functionality to form fields
 * to display errors and help fields. Binds field with
 * Riot Observable and gives elements event features.
 *
 * @param { HTMLFormElement } field - Field whose parent we will return
 * @param { Object } validations - Parent form validation object
 *
 */
function bindField (field, validations) {

    const parent = findFieldContainer(field, classes.container || '.field' );

    const name = field.getAttribute('name');
    const type = field.getAttribute('type');
    const required = field.getAttribute('required') !== undefined;

    // Formatting function
    const format = field.getAttribute('format');

    // Validation function
    // input[data-validate] should be a function in
    const validate = field.getAttribute('validate');

    // Match value against another element
    // Should be a CSS selector
    const equals = field.getAttribute('equals');

    // Custom regular expression
    const regex = field.getAttribute('regex');

    // Events to bind to
    const on = field.getAttribute('on') || 'change';

    // Input validation object to handle multiple methods
    const validation = {};

    let isValid = false;

    if (field.getAttribute('disabled') || type === 'hidden') {

        return;
    }

    Observer(field);

    // Form validation object
    validations[name] = isValid;

    if (format) {

        formatValue(format, field);
    }

    const validateFn = function(e) {

        const keyCode = (window.event) ? e.which : e.keyCode;
        const isBlur = e.type ==='blur';
        const value = field.value;
        const empty = !value.length;

        // If it's required, it can't be empty
        if (required) {

            validation.required = !!value;

            if (type === 'checkbox') {

                validation.checked = field.checked;
            }

        }

        // Assert against existing validation function
        if (validate) {

            validation.validate = validateRegex(value, validate);
        }

        // Assert against custom regex
        if (regex) {

            const rgx = new RegExp(regex);
            validation.regex = rgx.test(value);
        }

        // Assert against another field's value
        if (equals) {

            const equalsElement = field.form.querySelector(equals);

            validation.equals = value === equalsElement.value;

            if (!equalsElement.isValid) {

                equalsElement.trigger('validate', {});
            }
        }


        // Check input validation
        isValid = confirmValidation(validation);

        // Input is not required and is empty
        if (!isValid && !required && !value && isBlur) {

            isValid = null;
        }

        validated(isValid);
        return isValid;

    };

    const validated = function(isValid) {

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

            parent.querySelector(`.${classes.help}`).classList.add(classes.hide);
        }
        else {

            parent.classList.add(classes.error);
            parent.classList.remove(classes.success);

            parent.querySelector(`.${classes.help}`).classList.remove(classes.hide);
        }

        // Allow fields that are not required
        if (isValid === null) {

            field.setBlank();
        }

        field.trigger('validated');
    };

    // Bind events to validation function
    on.split(' ').map(o => field[`on${o}`] = validateFn);

    field.on('validate', validateFn);

    const setBlank = () => {

        parent.classList.remove(classes.success, classes.error, classes.warning, classes.info);
        parent.querySelector(`.${classes.help}`).classList.add(classes.hide);
    };
}

function bind(form) {

    let inputs = form.querySelectorAll(config.elements);
    const submit = form.querySelector('[type=submit]');
    const validations = {};

    form.validations = validations;
    form.isValid = false;
    form.noValidate = true;

    Observer(form);

    const validate = function() {

        form.isValid = confirmValidation(validations);
        return form.isValid;
    };

    const validateAll = function() {

        return new Promise((resolve, reject) => {

            function assessSubmit() {

                // Returns true if valid
                if (validate()) {

                    resolve();
                }
                else {

                    reject();
                }
            }

            inputs.forEach((field, i) => {

                if (i === (inputs.length-1)) {

                    field.one('validated', () => {

                        assessSubmit();
                    });
                }

                field.trigger('validate', {});
            });
        });
    };

    form.on('validate', function() {

        validateAll().then(function() {

            form.trigger('validated');
        });
    });

    form.on('validated', function () {

        if (form.isValid) {

            form.trigger('submitted');
        }
    });

    // When the form is submitting, iterate through all the fields and validate them
    form.onsubmit = function(e) {

        e.preventDefault();

        if (!form.isValid) {

            form.trigger('validate');
        }
        else {

            form.trigger('validated');
            form.trigger('submitted');
        }
    };


    // Add validation functionality to form elements
    function bindFields() {

        inputs.forEach(function(field) {

            if (!field.on) {

                bindField(field, validations);
            }
        });
    }

    bindFields();

    // Rebind validations in case of new required fields
    if (!form.rebind) {

        form.rebind = function() {

            inputs = form.find(config.elements);
            bindFields();
        };

        form.on('rebind', form.rebind);
    }

    form.on('reset', function() {

        form.reset();
        form.isValid = false;

        inputs.forEach(function(field) {

            field.setBlank();
        });
    });
}



var ActionForms = Object.freeze({
	bind: bind,
	config: config,
	formatValue: formatValue,
	configure: configure,
	validateRegex: validateRegex,
	confirmValidation: confirmValidation,
	findFieldContainer: findFieldContainer
});

// import './tags';


var index = {

    ActionForms,
    Observer,
    Beautify
};

module.exports = index;
