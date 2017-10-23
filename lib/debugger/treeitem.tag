<treeitem>

    <a if={ hasNested } href="#" onclick={ toggle }>
        <span ref='sign'>+</span>
        <b>{ argument.name }</b> (<i>{ argument.type }</i>)
    </a>

    <span if={ !hasNested && !encodeValue }>
        <b>{ argument.name }</b> (<i>{ argument.type }</i>)
        <br />
        { JSON.stringify(argument.value) }
    </span>

    <div if={ !hasNested && encodeValue }>
        <b>{ argument.name }</b> (<i>{ argument.type }</i>)
        <br />

        <pre if={ argument.type === 'Function' }><code>{ argument.value }</code></pre>

        <pre if={ argument.type !== 'Function' }><code>{ JSON.stringify(argument.value) }</code></pre>
    </div>

    <ul if={ isOpen && hasNested }>

        <li data-is='treeitem' each={ a in argument.value }></li>
    </ul>

    <script>
        const self = this;

        const signs = ['+', '-'];

        self.argument = self.argument || self.a

        self.toggle = () => {

            self.isOpen = !self.isOpen
            self.refs.sign.innerHTML = signs[self.isOpen*1];
        }

        self.isOpen = false;

        self.hasNested = self.argument.value &&
                         self.argument.value.length &&
                         self.argument.value[0] &&
                         self.argument.value[0].name &&
                         self.argument.value[0].type

        self.encodeValue = !self.hasNested &&
                           ['Object', 'Array', 'Function'].indexOf(self.argument.type) > -1
    </script>

    <style>

        :scope pre {

            max-width: 100%;
            max-height: 250px;
            overflow: auto;

        }
    </style>

</treeitem>
