const _ = require('lodash');
const fs = require('fs');
const nodepath = require('path');
const eol = require('os').EOL;
const encode = 'utf8'

const gitdou = {
    init: () => {
        const gitdouStructure = {
            HEAD: 'ref: refs/heads/master\n',
            objects: {},
            refs: {
                heads: {}
            },
            config: JSON.stringify({core: {bare: false}}, null, 2)
        }
        files.writeFilesFromTree({'.gitdou': gitdouStructure}, process.cwd());
    },
    add: path => {
        const addedFiles = files.listAllMatchedFiles(path);
        // console.log(addedFiles);
        index.updateFilesIntoIndex(addedFiles, {add: true});
    },
    rm: path => {
        const deletedFiles = files.listAllMatchedFiles(path);
        index.updateFilesIntoIndex(deletedFiles, {remove: true});
        files.removeFiles(deletedFiles);
    },
    commit: option => {
        // write current index into tree object
        const treeHash = gitdou.write_tree();
        // create commit object based on the tree hash
        const parentHash = "";
        const commitHash = objects.createCommit({treeHash, parentHash, option});
        // console.log(`commitHash ${commitHash}`);
        // point the HEAD to commit hash
        refs.updateRef({updateToRef: 'HEAD', hash: commitHash})
    },
    checkout: (ref) => {
        const targetCommitHash = refs.hash(ref);
        const diffs = diff.diff(refs.hash('HEAD'), targetCommitHash);
        workingCopy.write(diffs);
    },
    status: () => {
        return status.getStatus();
    },
    branch : (name, opts) => {
        const hash = refs.hash('HEAD');
        refs.updateRef({updateToRef:name, hash});
    },
    remote : (command, name, path) => {
        const cfg = config.read();
        cfg['remote'] = cfg['remote'] || {};
        cfg['remote'][name] = path;
        config.write(cfg);
    },
    fetch : (remote, branch) => {
        const remoteUrl = config.read()['remote'][remote];
        const remoteHash = refs.getRemoteHash(remoteUrl, branch);

        const remoteObjects = refs.getRemoteObjects(remoteUrl);
        _.each(remoteObjects, content => objects.write(content));

        refs.updateRef({updateToRef:refs.getRemoteRef(remote, branch), hash:remoteHash});
        refs.write("FETCH_HEAD", `${remoteHash} branch '${branch}' of ${remoteUrl}`);

        return ["From " + remoteUrl,
            "Count " + remoteObjects.length,
            branch + " -> " + remote + "/" + branch].join("\n") + "\n";

    },
    merge: (ref) => {
        // return 'Fast-forward';
    },
    write_tree: () => {
        const idx = index.read(false);
        const tree = files.nestFlatTree(idx);
        // console.log(`tree:${JSON.stringify(tree)}, hash:${objects.writeTree(tree)}`)
        return objects.writeTree(tree, true);
    }
};

module.exports = gitdou;


const files = {
    writeFilesFromTree: (tree, prefix) => {
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
    listAllMatchedFiles: path => {
        if (path === files.getGitdouPath()) {
            return [];
        }
        if (!fs.existsSync(path)) {
            return [];
        }

        if (fs.statSync(path).isFile()) {
            return [nodepath.normalize(path)];
        }
        return fs.readdirSync(path).reduce((fileList, childDir) => {
            if (childDir === '.gitdou') {
                return fileList;
            }
            return fileList.concat(files.listAllMatchedFiles(nodepath.join(path, childDir)));
        }, []);
    },
    getGitdouPath: () => {
        return nodepath.join(process.cwd(), '.gitdou');
    },

    nestFlatTree: object => {
        return Object.keys(object).reduce((tree, key) => {
            return _.set(tree, _.replace(key, /\\/g, '.'), object[key]);
        }, {});
    },
    fileTree: (treeHash, tree) => {
        if (!tree) {
            return files.fileTree(treeHash, {});
        }
        const lines = util.lines(objects.read(treeHash));
        _.each(lines, line => {
            const [type, hash, path] = line.split(' ');
            if (type === 'blob') {
                tree[path] = hash;
            } else {
                tree[path] = {};
                files.fileTree(hash, tree[path]);
            }
        })
        return tree;
    },
    flattenTree: (tree, flattenObject, prefix) => {
        if (!flattenObject) {
            return files.flattenTree(tree, {}, '');
        }
        Object.keys(tree).forEach(key => {
            const path = nodepath.join(prefix, key);
            if (_.isString(tree[key])) {
                flattenObject[path] = tree[key];
            } else {
                return files.flattenTree(tree[key], flattenObject, path);
            }
        })
        return flattenObject;
    },
    removeFiles: paths => {
        _.each(paths, path => fs.unlinkSync(path));
    },
    hash : filePath => {
        return util.hash(fs.readFileSync(filePath,'utf8'));
    }
}

const index = {
    updateFilesIntoIndex: (files, opts) => {
        // read existing index list from index file
        // calculate addedFiles hash
        // add new hash into index
        const allIndex = index.read();
        if (opts.add) {
            _.each(files, addedFile => {
                allIndex[`${addedFile},0`] = objects.write(fs.readFileSync(addedFile, "utf8"));
            });
        }
        if (opts.remove) {
            _.each(files, deletedFile => {
                delete allIndex[`${deletedFile},0`];
            });
        }

        index.write(allIndex);
    },
    read: (withFileState = true) => {
        const indexPath = nodepath.join(files.getGitdouPath(), 'index');
        if (!fs.existsSync(indexPath)) {
            console.log('no index file found yet');
            return [];
        }
        const indexLines = fs.readFileSync(indexPath, 'utf8').split(eol).filter(line => !_.isEmpty(line));
        return indexLines.reduce((allIndex, line) => {
            const blobData = line.split(/ /);
            const key = withFileState ? `${blobData[0]},${blobData[1]}` : blobData[0];
            allIndex[key] = blobData[2];
            return allIndex;
        }, {});
    },
    write: allIndex => {
        const content = Object.keys(allIndex).map(key => key.split(',')[0] + ' ' + key.split(',')[1] + ' ' + allIndex[key])
            .join(eol) + eol;
        fs.writeFileSync(nodepath.join(files.getGitdouPath(), 'index'), content);
    },
}

const objects = {
    write: content => {
        // calculate hash
        const hash = util.hash(content);
        // save content into file
        const objectPath = nodepath.join(files.getGitdouPath(), 'objects', hash);
        fs.writeFileSync(objectPath, content);
        return hash;
        // return hash
    },
    writeTree: (tree, first = false) => {
        // first && console.log(`tree: ${JSON.stringify(tree)}`);
        const items = Object.keys(tree).map(key => {
            if (_.isString(tree[key])) {
                return `blob ${tree[key]} ${key}`;
            } else {
                return `tree ${objects.writeTree(tree[key])} ${key}`;
            }
        });
        const treeContent = items.join('\n') + '\n';

        // tree['fileb'] && console.log(`treeContent:${treeContent} | commitHash:${objects.write(treeContent)}`)
        return objects.write(treeContent);
    },
    createCommit: ({treeHash, parentHash, option}) => {
        const content = [];
        content.push(`commit ${treeHash}`);
        _.each(parentHash, hash => content.push(`parent ${hash}`));
        content.push(`Date:  ${new Date().toString()}`);
        content.push(`\n${option.m}`);
        return objects.write(content.join('\n'));
    },
    read: hash => {
        const objectPath = nodepath.join(files.getGitdouPath(), 'objects', hash);
        return fs.readFileSync(objectPath, 'utf8');
    },
    type: content => {
        const typeIndicator = _.split(content, ' ')[0];
        return {commit: 'commit', tree: 'tree', blob: 'blob'}[typeIndicator];
    },
    treeHash: content => {
        if (objects.type(content) === 'commit') {
            const firstLine = _.split(content, '\n')[0];
            return _.split(firstLine, ' ')[1];
        }
    },

    commitToContent: hash => {
        const detail = objects.read(hash);
        const treeHash = objects.treeHash(detail);
        // console.log(`treeHash: ${treeHash}`);
        const fileTree = files.fileTree(treeHash);
        // console.log(`fileTree : ${JSON.stringify(fileTree)}`);
        const flattenObject = files.flattenTree(fileTree);
        // console.log(`flattenObject:${JSON.stringify(flattenObject)}`);
        return flattenObject;
    },
    allObjects : () => {
        return fs.readdirSync(nodepath.join(files.getGitdouPath(), 'objects')).map(objects.read);
    },
    exists: hash => {
        return fs.existsSync(nodepath.join(files.getGitdouPath(),'objects', hash));
    }
}

const refs = {
    updateRef: ({updateToRef, hash}) => {
        const ref = refs.resolveRef(updateToRef);
        refs.write(ref, hash);
    },
    resolveRef: ref => {
        if (ref === 'HEAD') {
            const matched = fs.readFileSync(nodepath.join(files.getGitdouPath(), ref), 'utf8').match('ref: (refs/heads/.+)');
            return matched[1];
        } else if (refs.isValidRef(ref)){
            return ref;
        } else {
            return `refs/heads/${ref}`;
        }
    },
    isValidRef: ref => {
      return _.startsWith(ref, 'refs/heads/') || _.startsWith(ref, 'refs/remotes/');
    },

    write: (path, content) => {
        const tree = util.setIn({},path.split("/").concat(content));
        files.writeFilesFromTree(tree,files.getGitdouPath())
    },
    hash: ref => {
        if(objects.exists(ref)){
            return ref;
        }
        const refFile = refs.resolveRef(ref);
        const prefix = objects.exists(ref)?nodepath.join(files.getGitdouPath(),'objects'):files.getGitdouPath();
        return fs.readFileSync(nodepath.join(prefix, refFile), 'utf8');
    },
    getRemoteHash: (remoteUrl, branch)=> {
        return util.onRemote(remoteUrl)(refs.hash, branch);
    },
    getRemoteObjects : (remoteUrl) => {
        return util.onRemote(remoteUrl)(objects.allObjects)
    },
    getRemoteRef: (remote, branch) => {
        return `refs/remotes/${remote}/${branch}`;
    }
}
const util = {
    // hash : string => {
    //     let hashInt = 0;
    //
    //     for(let i=0; i< string.length; i++){
    //         (hashInt<<5) may cause hash conflict
    //         hashInt = (hashInt << 5) + string.charCodeAt(i);
    //         hashInt = hashInt | 0;
    //     }
    //     return Math.abs(hashInt).toString(16);
    // },
    hash: function (string) {
        var hashInt = 0;
        for (var i = 0; i < string.length; i++) {
            hashInt = hashInt * 31 + string.charCodeAt(i);
            hashInt = hashInt | 0;
        }

        return Math.abs(hashInt).toString(16);
    },
    lines: content => {
        return content.split('\n').filter(line => line !== '');
    },
    onRemote: remoteUrl => {
        // ES6 function define here not work, fn => {}
        return function (fn) {
            const oldWorkspace = process.cwd();
            process.chdir(remoteUrl);
            const result = fn.apply(null, Array.prototype.slice.call(arguments,1));
            process.chdir(oldWorkspace);
            return result;
        }
    },
    setIn: function(obj, arr) {
        if (arr.length === 2) {
            obj[arr[0]] = arr[1];
        } else if (arr.length > 2) {
            obj[arr[0]] = obj[arr[0]] || {};
            util.setIn(obj[arr[0]], arr.slice(1));
        }

        return obj;
    },
}

const diff = {
    FILE_STATUS: {ADD: 'A', MODIFY: 'M', DELETE: 'D', SAME: 'SAME', CONFLICT: 'CONFLICT'},
    diff: (receiverHash, giverHash) => {
        const receiver = objects.commitToContent(receiverHash);
        const giver = objects.commitToContent(giverHash);
        // console.log(`headTree:${JSON.stringify(receiver)}`);
        // console.log(`targetContent:${JSON.stringify(giver)}`);
        return diff.treeContentDiff(receiver, giver);
    },
    treeContentDiff: (receiver, giver) => {
        const paths = _.uniq(Object.keys(receiver).concat(Object.keys(giver)));
        return paths.reduce((diffs, path) => {
            diffs[path] = {
                status: diff.fileStatus(receiver[path], giver[path]),
                receiver: receiver[path],
                path: path,
                giver: giver[path]
            };
            return diffs;
        }, {})

    },
    fileStatus: (receiver, giver) => {
        if (receiver === giver) {
            return diff.FILE_STATUS.SAME;
        }
        if (!receiver && giver) {
            return diff.FILE_STATUS.ADD;
        }
        if (receiver && !giver) {
            return diff.FILE_STATUS.DELETE
        }
        if (receiver && giver) {
            return diff.FILE_STATUS.MODIFY;
        }
    }
}

const workingCopy = {
    write: diffs => {
        _.values(diffs).filter(item => item.status !== diff.FILE_STATUS.SAME).forEach(item => {
            const filePath = workingCopy.getPath(item.path);
            if (item.status === diff.FILE_STATUS.ADD || item.status === diff.FILE_STATUS.MODIFY) {
                fs.writeFileSync(filePath, objects.read(item.giver));
            }
            else if (item.status === diff.FILE_STATUS.DELETE) {
                fs.unlinkSync(filePath);
            }
        });
    },
    getPath: (path) => {
        return nodepath.join(files.getGitdouPath(), '..', path);
    },
    toContent : (idx) => {
        return Object.keys(idx).filter(filePath => fs.existsSync(filePath)).reduce((index, filePath) => {
            index[filePath] = files.hash(filePath);
            return index;
        }, {})
    }
}

const status = {
    getStatus: () => {
        const allFiles = files.listAllMatchedFiles('.');
        const idx = index.read(false);
        const untrackedFiles = () => {
            return allFiles.reduce((untracks, path) => {
                !idx[path] && untracks.push(path);
                return untracks;
            }, []).join('\n');

        }
        const toBeCommitted = () => {
            const headContent = objects.commitToContent(refs.hash('HEAD'));
            const diffs = diff.treeContentDiff(headContent, idx);
            return _.values(diffs).filter(diffItem => diffItem.status !== diff.FILE_STATUS.SAME)
                .map(item => `${item.status} ${item.path}`).join('\n');
        }
        const notStagedForCommit = ()=>{
            const workingCopyContent = workingCopy.toContent(idx);
            const diffs = diff.treeContentDiff(idx, workingCopyContent);
            return _.values(diffs).filter(diffItem => diffItem.status !== diff.FILE_STATUS.SAME)
                .map(item => `${item.status} ${item.path}`).join('\n');
        }
        return 'Untracked files:\n' + untrackedFiles() + '\n'
            + 'Changes to be committed:\n' + toBeCommitted()+'\n'
            + 'Changes not staged for commit:\n' + notStagedForCommit();
    }
}

const config = {
    read : ()=>{
        const content = JSON.parse(fs.readFileSync(nodepath.join(files.getGitdouPath(),'config'), 'utf8'));
        return content;
    },
    write: cfg => {
        const content = JSON.stringify(cfg, null, 2);
        fs.writeFileSync(nodepath.join(files.getGitdouPath(),'config'),content);
    }
}