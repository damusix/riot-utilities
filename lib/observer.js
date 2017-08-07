import {observable} from 'riot';

export default function Observer (obj, props) {

    const self = this;

    // Global observer
    const observer = observable();

    // Properties object to rewrap
    const properties = {};

    // Rewrap observer functions for debugging
    ['on', 'one', 'off', 'trigger'].forEach((fn) => {

        properties[fn] = {
            value: function() {

                observer[fn].apply(observer[fn], arguments);

                if (global.APP_DEBUG_MODE) {
                    if (obj.name) {

                        console.log.apply(console.log, [obj.name, fn, arguments]);
                    }
                    else {

                        console.log.apply(console.log, [fn, arguments]);
                    }
                }

            },
            writable: false
        };
    });

    // Define properties in `props`
    props && Object.keys(props).map((key) => {

        properties[key] = props[key];
    });

    Object.defineProperties(obj, properties);
}
