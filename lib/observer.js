const observable = riot.observable;

const opts = {
    debug: false,
    debugFn: false
}

export function Observer (obj, props) {

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
            writable: false
        };
    });

    // Define properties in `props`
    props && Object.keys(props).map((key) => {

        properties[key] = props[key];
    });

    Object.defineProperties(obj, properties);
}

Observer.configure = (obj) => {

    Object.assign(opts, obj);
}
