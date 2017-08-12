import { Observer } from '../observer';
import { bindField } from './bind-field';
import { confirmValidation, config } from './utils';

console.log(config.elements);

export function bind(form) {

    console.log(form);

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
    }

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

            bindField(field, validations);
        });
    }

    bindFields();

    // Rebind validations in case of new required fields
    if (!form.rebind) {

        form.rebind = function() {

            inputs = form.find(config.elements);
            bindFields();
        }

        form.on('rebind', form.rebind);
    }

    form.on('reset', function() {

        form.reset();
        form.isValid = false;

        inputs.forEach(function(field) {

            field.setBlank();
        });
    });
};
