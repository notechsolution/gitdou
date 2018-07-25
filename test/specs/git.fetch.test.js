import test from 'ava';
import gitdou from '../../src/gitdou';
import fs from 'fs';
import testUtil from './test-util';
const nodepath = require('path');
import _ from 'lodash';

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
        "48028ed8", "794ea686", "507bf191", "5ceba66"] // second commit
        .forEach(function(h) {
            var exp = fs.readFileSync(nodepath.join(remoteRepo, ".gitdou", "objects", h), "utf8");
            t.is(fs.readFileSync(nodepath.join(".gitdou/objects", h),'utf8'), exp);
        });
});

test('should update FETCH_HEAD after fetch', t=> {
    testUtil.initTestDataDir({repo:'fetchRepo2'});
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

    t.true(_.startsWith(fs.readFileSync(nodepath.join('.gitdou','FETCH_HEAD'),'utf8'),'48028ed8 branch \'master\' of '));
})

test('refs/remotes/origin should point to latest commit after fetch', t=> {
    testUtil.initTestDataDir({repo:'fetchRepo2'});
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

    t.true(_.startsWith(fs.readFileSync(nodepath.join('.gitdou/refs/remotes/origin','master'),'utf8'),'48028ed8'));
})