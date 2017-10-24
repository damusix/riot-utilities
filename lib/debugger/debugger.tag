<debugger>

    <b id="stick" onclick={ stickToggle } if={ open }>{ stickIndicator }</b>

    <select onchange={ changePos } if={ open }>

        <option>top-right</option>
        <option>top-left</option>
        <option selected="">bottom-right</option>
        <option>bottom-left</option>
    </select>

    <b id="clear" onclick={ clear } if={ open }>clear</b>

    <h3 onclick={ toggle }>
        <b id="toggle">{ toggleIndicator }</b>
        Debugger
    </h3>

    <section id='actions'>

        <treeview each={ actions }></treeview>

        <p class='message' onclick={ changeNumActions }>

            Showing last {numActions} actions...
        </p>
    </section>

    <script>

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
    </script>

    <style>

        :scope {

            position: fixed;
            z-index: 9999;
            bottom: 10px;
            right: -300px;
            opacity: 0.25;
            width: 400px;
            height: 600px;
            background: #eee;
            font-family: monospace;
            font-size: 11px;

        }

        :scope.top-left, :scope.top-right { top: 10px; }
        :scope.bottom-left, :scope.bottom-right { bottom: 10px; }
        :scope.top-left, :scope.bottom-left { left: -300px; }
        :scope.top-right, :scope.bottom-right { right: -300px; }

        :scope.top-left:hover,
        :scope.top-left.stick,
        :scope.bottom-left:hover,
        :scope.bottom-left.stick {

            left: 10px;
            opacity: 1;
        }

        :scope.top-right:hover,
        :scope.top-right.stick,
        :scope.bottom-right:hover,
        :scope.bottom-right.stick {

            right: 10px;
            opacity: 1;
        }

        :scope select {

            width: auto;
        }

        :scope.close {

            height: 15px;
        }

        :scope #toggle, :scope #stick, :scope h3, :scope #clear {

            cursor: pointer;
        }

        :scope #stick, :scope select, :scope #clear {

            float: right;
        }

        :scope select, :scope #clear { margin-right: 20px; }


        :scope h3 {

            margin: 0;
            font-size: 15px;
            line-height: 15px;
            padding: 0;
        }

        :scope #actions {

            display: block;
            position: absolute;
            top: 50px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            overflow: auto;
        }

        :scope,
        :scope #actions treeview  {

            display: block;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #aaa;

            transition: all 250ms cubic-bezier(0.22, 0.61, 0.36, 1);

        }

        :scope #actions treeview {

            background: #fff;
            position: relative;
            box-shadow: 0;
        }

        :scope #actions treeview:hover {

            border-color: #f70;
            box-shadow: 0px 10px 5px -8px rgba(0,0,0,0.25);
        }

        :scope #actions treeview code {

            background: #eee;
            padding: 2.5px 5px;
            line-height: 11px;
        }

        :scope #actions treeview i#num {

            position: absolute;
            top: 10px;
            right: 10px;
        }

        :scope #actions treeview #time {

            position: absolute;
            top: 10px;
            right: 60px;
            opacity: 0.25;
        }

        :scope #actions .message {

            cursor: pointer;
            text-align: center;
            opacity: 0.25;
        }
    </style>
</debugger>
