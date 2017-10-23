// import { Observer } from '../observer';
import { validateRegex, confirmValidation, findFieldContainer, formatValue, config } from './utils';

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
export function bindField (field, validations) {

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

    // Observer(field);
    riot.observable(field);

    // Form validation object
    validations[name] = isValid;

    const validateFn = function(e) {

        const keyCode = (window.event) ? e.which : e.keyCode;
        const isBlur = e.type ==='blur';
        const value = field.value;
        const empty = !value.length;

        // If it's required, it can't be empty
        if (required) {

            validation.required = !!value;

            if (type === 'checkbox') {

                validation.checked = field.checked
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

        field.trigger('validated', { isValid, value: field.value });
    };

    field.on('validate', validateFn);

    // Bind events to validation function
    on.split(' ').map((o) => {

        field[`on${o}`] = (e) => {

            if (format) {

                formatValue(format, field);
            }

            validateFn(e);
        }
    });


    const setBlank = () => {

        parent.classList.remove(classes.success, classes.error, classes.warning, classes.info);
        parent.querySelector(`.${classes.help}`).classList.add(classes.hide);
    };
}
