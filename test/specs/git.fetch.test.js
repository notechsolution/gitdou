import test from 'ava';
import gitdou from '../../src/gitdou';
import fs from 'fs';
import testUtil from './test-util';
const nodepath = require('path');

test.beforeEach(() => {
    testUtil.pinDate();
});

test.afterEach(() => {
    testUtil.unpinDate();
})

test('should fetch objects in the main branch of origin', t => {
    testUtil.initTestDataDir({repo:'fetchRepo'});
    const gitLocal = gitdou;
    const gitRemote = gitdou;

    const localRepo = process.cwd();
    const remoteRepo = testUtil.makeRemoteRepo();

    gitRemote.init();
    testUtil.createStandardFileStructure();
    gitRemote.add(nodepath.normalize("1a/filea"));
    gitRemote.commit({ m: "first" });
    gitRemote.add(nodepath.normalize("1b/fileb"));
    gitRemote.commit({ m: "second" });

    process.chdir(localRepo);
    gitLocal.init();
    gitLocal.remote('add','origin',remoteRepo);
    gitLocal.fetch('origin','master');

    ["552f010a", "63e0627e", "17653b6d", "5ceba65", // first commit
        "509d4826", "794ea686", "507bf191", "5ceba66"] // second commit
        .forEach(function(h) {
            var exp = fs.readFileSync(nodepath.join(remoteRepo, ".gitdou", "objects", h), "utf8");
            t.is(fs.readFileSync(nodepath.join(".gitdou/objects", h),'utf8'), exp);
        });
});
