<treeview>

    <span class="name" if={ obj && obj.__name }>
        { obj.__name }
    </span>
    <b>{ fn }</b>
    &mdash;
    <i>{ action }</i>

    <span id="time">{ time }</span>
    <i id="num">{ i }</i>


    <hr if={ hasArgs }>
    <ul if={ hasArgs }>

        <li data-is='treeitem' each={ argument in arguments }></li>
    </ul>

    <script>

        const self = this;

        self.on('mount', () => {

            self.arguments = RiotUtils.ObjectTree(self.args);

            self.hasArgs = (self.arguments && self.arguments.length)

            self.update();
        });
    </script>

    <style>

        :scope ul {

            padding-left: 20px;
            margin: 10px;
            border: 1px dashed #ddd;
        }
        :scope ul li {

            margin-top: 10px;
            margin-bottom: 10px;
        }
    </style>

</treeview>
