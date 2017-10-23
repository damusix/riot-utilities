export const config = {

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
        creditcard: function (value) {

            const formatted = value.match(/([0-9]{4})|([0-9]+)/ig);
            console.log(formatted);
            return formatted ? formatted.join(' ') : '';
        }
    }
}

/*
 * Format a field's value based on functions in `config.format`
 *
 * @param { String } formatFn - Name of function in `config.format`
 * @param { HTMLFormElement } field - Field to format value of
 */
export function formatValue(formatFn, field) {

    console.log(config.format);
    console.log(typeof config.format[formatFn] === 'function');
    console.log(formatFn);

    if (typeof config.format[formatFn] !== 'function') {

        throw TypeError(`${formatFn} does not exist or is not a function`);
    }

    field.value = config.format[formatFn](field.value);
}

// Overwrite config
export function configure(opts) {

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
export function validateRegex(value, rgx) {

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
export function confirmValidation(obj) {

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
export function findFieldContainer (field, containerClass) {

    if (field === document.body) {

        throw new Error(`Field named ${field.name} is not inside a field container`);
    }

    let parent = field.parentElement;

    if (!parent.classList.contains(containerClass)) {

        parent = findFieldContainer(parent, containerClass);
    }

    return parent;
}
