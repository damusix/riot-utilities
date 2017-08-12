# riot-utilities
RiotJS Javascript Utilities

### Initiate Observer with debug features

``` javascript
Observer.setOpts({
    debug: true,
    debugFn: function(obj, fn, action, args) {

        if (app.debugger && app.debugger.on) {

            app.debugger.trigger('state', obj, fn, action, args);
        }
    }
});
```
