import { util } from 'riot';

const check = util.check

export function ObjectTree(obj) {

    const tree = [];

    for (let name in obj) {

        let value = obj[name];
        const type = obj[name].constructor.name;

        if (check.isObject(obj[name])) {

            if (Object.keys(obj[name]).length) {

                value = ObjectTree(obj[name]);
            }
        }

        tree.push({
            name,
            value,
            type
        });
    }

    return tree;
}
