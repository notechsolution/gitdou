const _ = require('lodash');
const fs = require('fs');
const nodepath = require('path');

const gitdou = {
    init: () => {
        const gitdouStructure = {
            HEAD:'ref: refs/heads/master\n',
            objects:{},
            refs: {
                heads: {}
            },
            config: JSON.stringify({core: {bare: false}}, null, 2)
        }
        writeFilesFromTree({'.gitdou': gitdouStructure}, process.cwd());
    }

};

module.exports = gitdou;

const writeFilesFromTree = (tree, prefix) => {
    _.each(Object.keys(tree), name => {
        const path = nodepath.join(prefix, name);
        if (_.isString(tree[name])) {
            fs.writeFileSync(path, tree[name]);
        } else {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, 777);
            }
            writeFilesFromTree(tree[name], path);
        }
    });
}