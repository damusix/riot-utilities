const observable = riot.observable;

const opts = {
    debug: false,
}

const debugFn = function (obj, fn, action, args) {

    if (app.debugger && app.debugger.on) {

        app.debugger.trigger('state', obj, fn, action, args);
    }
}

export function Observer (obj) {

    obj = obj || {};

    if (obj.ELEMENT_NODE) {

        obj.__name = obj.id || obj.getAttribute('name') || obj.localName;
        console.log(obj.__name);
    }

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


                const args = Array.prototype.slice.apply(arguments);
                const action = args.shift();

                debugFn.apply({}, [obj, fn, action, args]);

                observer[fn].apply(observer[fn], arguments);
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

    return obj;
}

Observer.configure = (obj) => {

    Object.assign(opts, obj);
    riot.observable = Observer;
}
