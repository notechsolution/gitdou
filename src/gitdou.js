const _ = require('lodash');
const fs = require('fs');
const nodepath = require('path');
const eol = require('os').EOL;

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
        files.writeFilesFromTree({'.gitdou': gitdouStructure}, process.cwd());
    },
    add : path => {
        const addedFiles = files.listAllMatchedFiles(path);
        console.log(addedFiles);
        index.updateFilesIntoIndex(addedFiles);
    }
};

module.exports = gitdou;


const files = {
    writeFilesFromTree : (tree, prefix) => {
        _.each(Object.keys(tree), name => {
            const path = nodepath.join(prefix, name);
            if (_.isString(tree[name])) {
                fs.writeFileSync(path, tree[name]);
            } else {
                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path, 777);
                }
                files.writeFilesFromTree(tree[name], path);
            }
        });
    },
    listAllMatchedFiles : path => {
        if(path === files.getGitdouPath()){
            return [];
        }
        if(!fs.existsSync(path)){
            return [];
        }

        if(fs.statSync(path).isFile()){
            return [path];
        }
        return fs.readdirSync(path).reduce((fileList,childDir) => {
            if(childDir === '.gitdou'){
                return fileList;
            }
            return fileList.concat(files.listAllMatchedFiles(nodepath.join(path, childDir)));
        }, []);
    },
    getGitdouPath : ()=>{
        return nodepath.join(process.cwd(), '.gitdou');
    }

}

const index = {
    updateFilesIntoIndex : addedFiles => {
        // read existing index list from index file
        // calculate addedFiles hash
        // add new hash into index
        const allIndex = index.read();
        _.each(addedFiles, addedFile => {
            allIndex[`${addedFile},0`] = objects.write(addedFile);
        });
        index.write(allIndex);
    },
    read : () => {
        const indexPath = nodepath.join(files.getGitdouPath(),'index');
        if(!fs.existsSync(indexPath)){
            console.warn('strange, no index file found');
            return [];
        }
        const indexLines = fs.readFileSync(indexPath).split(eol).filter(line => !_.isEmpty(line));
        return indexLines.reduce((allIndex, line) => {
            const blobData = line.split(/ /);
            allIndex[`${blobData[0]},${blobData[1]}`] = blobData[2];
         }, {});
    },
    write : allIndex => {
        const content = Object.keys(allIndex).map(key=> key.split(',')[0]+' '+key.split(',')[1]+' '+allIndex[key])
            .join('\n')+'\n';
        fs.writeFileSync(nodepath.join(files.getGitdouPath(), 'index'), content);
    }
}

const objects = {
    write : path => {
        // calculate hash
        const content = fs.readFileSync(path,"utf8");
        const hash = util.hash(content);
        // save content into file
        const objectPath = nodepath.join(files.getGitdouPath(), 'objects', hash);
        fs.writeFileSync(objectPath,content);
        return hash;
        // return hash
    }
}
const util = {
    hash : string => {
        let hashInt = 0;
        console.log('string:',string);
        for(let i=0; i< string.length; i++){
            hashInt = (hashInt << 5) + string.charCodeAt(i);
            hashInt = hashInt | 0;
        }
        return Math.abs(hashInt).toString(16);

        // var hashInt = 0;
        // for (var i = 0; i < string.length; i++) {
        //     hashInt = hashInt * 31 + string.charCodeAt(i);
        //     hashInt = hashInt | 0;
        // }
        //
        // return Math.abs(hashInt).toString(16);
    }
}