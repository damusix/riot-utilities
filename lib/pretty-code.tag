<pretty-code>

    <pre><code ref='code'></code></pre>

    <script>

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

            const prettified = RiotUtils.Beautify[type](raw, beautifyOpts);

            const prettify = { prettified, raw }

            if (before && before.constructor === Function) {

                before(prettify);
            }

            // Escape HTML to HTMLEntities when passing raw HTML
            if (decode && type === 'html') {

                prettify.prettified = RiotUtils.Beautify.escapeHTML(prettify.prettified)
            }

            self.refs.code.innerHTML = prettify.prettified;

            if (after && after.constructor === Function) {

                after(prettify);
            }

            RiotUtils.Beautify.trigger('prettified', prettify);
        })
    </script>
</pretty-code>
