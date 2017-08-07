riot.tag2('icon', '<i class="fa {icon}"></i>', '', '', function(opts) {

    this.icon = Object.keys(this.opts).map(i => `fa-${i}`).join(' ')
});

riot.tag2('raw', '', '', '', function(opts) {

        this.root.innerHTML = this.opts.content
});

