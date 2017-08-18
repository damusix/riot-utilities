<pretty-code>

    <script>

        const self = this;
        const defaultOpts = {

            "indent_size": 4,
            "indent_char": " "
        };

        const type = self.opts.type || 'js';
        const beautifyOpts = Object.assign({}, defaultOpts, self.opts);

        this.on('mount', () => {

            RiotUtils.Beautify[type];
        })
    </script>
</pretty-code>
