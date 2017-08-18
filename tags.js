riot.tag2('debugger', '<b id="stick" onclick="{stickToggle}" if="{open}">{stickIndicator}</b><select onchange="{changePos}" if="{open}"><option>top-right</option><option>top-left</option><option selected="">bottom-right</option><option>bottom-left</option></select><b id="clear" onclick="{clear}" if="{open}">clear</b><h3 onclick="{toggle}"><b id="toggle">{toggleIndicator}</b> Debugger </h3><section id="actions"><debugitem each="{actions}"></debugitem><p class="message" onclick="{changeNumActions}"> Showing last {numActions} actions... </p></section>', 'debugger,[data-is="debugger"]{ position: fixed; z-index: 9999; bottom: 10px; right: -300px; opacity: 0.25; width: 400px; height: 600px; background: #eee; font-family: monospace; font-size: 11px; } debugger.top-left,[data-is="debugger"].top-left,debugger.top-right,[data-is="debugger"].top-right{ top: 10px; } debugger.bottom-left,[data-is="debugger"].bottom-left,debugger.bottom-right,[data-is="debugger"].bottom-right{ bottom: 10px; } debugger.top-left,[data-is="debugger"].top-left,debugger.bottom-left,[data-is="debugger"].bottom-left{ left: -300px; } debugger.top-right,[data-is="debugger"].top-right,debugger.bottom-right,[data-is="debugger"].bottom-right{ right: -300px; } debugger.top-left:hover,[data-is="debugger"].top-left:hover,debugger.top-left.stick,[data-is="debugger"].top-left.stick,debugger.bottom-left:hover,[data-is="debugger"].bottom-left:hover,debugger.bottom-left.stick,[data-is="debugger"].bottom-left.stick{ left: 10px; opacity: 1; } debugger.top-right:hover,[data-is="debugger"].top-right:hover,debugger.top-right.stick,[data-is="debugger"].top-right.stick,debugger.bottom-right:hover,[data-is="debugger"].bottom-right:hover,debugger.bottom-right.stick,[data-is="debugger"].bottom-right.stick{ right: 10px; opacity: 1; } debugger.close,[data-is="debugger"].close{ height: 15px; } debugger #toggle,[data-is="debugger"] #toggle,debugger #stick,[data-is="debugger"] #stick,debugger h3,[data-is="debugger"] h3,debugger #clear,[data-is="debugger"] #clear{ cursor: pointer; } debugger #stick,[data-is="debugger"] #stick,debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ float: right; } debugger select,[data-is="debugger"] select,debugger #clear,[data-is="debugger"] #clear{ margin-right: 20px; } debugger h3,[data-is="debugger"] h3{ margin: 0; font-size: 15px; line-height: 15px; padding: 0; } debugger #actions,[data-is="debugger"] #actions{ display: block; position: absolute; top: 50px; left: 10px; right: 10px; bottom: 10px; overflow: auto; } debugger,[data-is="debugger"],debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ display: block; padding: 10px; margin-bottom: 10px; border: 1px solid #aaa; transition: all 250ms cubic-bezier(0.22, 0.61, 0.36, 1); } debugger #actions debugitem,[data-is="debugger"] #actions debugitem{ background: #fff; position: relative; box-shadow: 0; } debugger #actions debugitem:hover,[data-is="debugger"] #actions debugitem:hover{ border-color: #f70; box-shadow: 0px 10px 5px -8px rgba(0,0,0,0.25); } debugger #actions debugitem code,[data-is="debugger"] #actions debugitem code{ background: #eee; padding: 2.5px 5px; line-height: 11px; } debugger #actions debugitem i#num,[data-is="debugger"] #actions debugitem i#num{ position: absolute; top: 10px; right: 10px; } debugger #actions debugitem #time,[data-is="debugger"] #actions debugitem #time{ position: absolute; top: 10px; right: 60px; opacity: 0.25; } debugger #actions .message,[data-is="debugger"] #actions .message{ cursor: pointer; text-align: center; opacity: 0.25; }', '', function(opts) {

        const self = this;
        self.actions = [];
        self.i = 0;
        self.toggleIndicator = '-';
        self.stickIndicator = 'stick';
        self.open = true;
        self.stick = false;

        self.toggle = () => {

            self.open = !self.open;
            self.root.classList[self.open ? 'remove' : 'add']('close');
            self.toggleIndicator = self.open ? '-' : '+';
        }

        self.stickToggle = () => {

            self.stick = !self.stick;
            self.root.classList[self.stick ? 'add' : 'remove']('stick');
            self.stickIndicator = self.stick ? 'fade' : 'stick';
        }

        self.clear = () => {

            self.actions = [];
        }

        self.changePos = (event) => {

            self.root.classList.remove('top-right', 'top-left', 'bottom-right', 'bottom-left');
            self.root.classList.add(event.target.value);
        }

        self.numActions = 20;
        self.changeNumActions = () => {

            const ask = prompt('Number of actions to show?');

            if (ask) {

                self.numActions = parseInt(ask.replace(/[a-z]+/ig, ''));
            }
        }

        self.on('state', (obj, fn, action, args) => {

            const time = +new Date;

            self.i++;
            const i = self.i;
            self.actions.unshift({ obj, fn, action, args, time, i });

            if (self.actions.length > self.numActions) {

                self.actions.pop();
            }

            self.update();
        });

        self.root.classList.add('bottom-right');

        app.debugger = self;
});


riot.tag2('debugitem', '<span class="name" if="{obj && obj.name}"> {obj.name} </span><b>{fn}</b> &mdash; <i>{action}</i><span id="time">{time}</span><i id="num">{i}</i><br><p>Arguments</p><div each="{arg in args}"><i>{arg.constructor.name}</i> &mdash; <span if="{[\'object\', \'function\'].indexOf(typeof arg) === -1}">{arg}</span><code if="{typeof arg === \'object\'}">{JSON.stringify(arg)}</code><code if="{typeof arg === \'function\'}">{arg}</code></div>', '', '', function(opts) {
});


riot.tag2('icon', '<i class="fa {icon}"></i>', '', '', function(opts) {

    this.icon = Object.keys(this.opts).map(i => `fa-${i}`).join(' ')
});

riot.tag2('pretty-code', '<pre><code ref="code"></code></pre>', '', '', function(opts) {

        const self = this;
        const defaultOpts = {

            "indent_size": 4,
            "indent_char": " "
        };

        const before = RiotUtils.Beautify.before;
        const after = RiotUtils.Beautify.after;

        const type = self.opts.type || 'js';
        const decode = self.opts.decode !== undefined;
        const beautifyOpts = Object.assign({}, defaultOpts, self.opts);

        let raw = self.__.innerHTML;

        this.on('mount', () => {

            const prettify = {
                prettified: RiotUtils.Beautify[type](raw, beautifyOpts),
                raw
            }

            if (before && before.constructor === Function) {

                before(prettify);
            }

            if (decode && type === 'html') {

                prettify.prettified = prettify.prettified.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                   return '&#'+i.charCodeAt(0)+';';
                });
            }

            self.refs.code.innerHTML = prettify.prettified;

            if (after && after.constructor === Function) {

                after(prettify);
            }

            RiotUtils.Beautify.trigger('prettified', prettify);
        })
});

riot.tag2('raw', '', '', '', function(opts) {
    this.root.innerHTML = this.__.innerHTML
});

