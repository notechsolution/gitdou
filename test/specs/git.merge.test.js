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

test('should report it is fast forward', t => {
    testUtil.initTestDataDir({repo:'mergeRepo'});

    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1a");
    gitdou.commit({ m: "first" });
    gitdou.branch("other");

    gitdou.add("1b");
    gitdou.commit({ m: "second" });
    console.log('ready to checkout')
    gitdou.checkout("other");
    const mergeMsg = gitdou.merge("master");
    t.is(mergeMsg,"Fast-forward");

});

test("should update working copy after merge", t => {
    testUtil.initTestDataDir({repo:'mergeRepo2'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1a");
    gitdou.commit({ m: "first" });
    gitdou.branch("other");
    t.is(fs.readFileSync(".gitdou/refs/heads/other",'utf8'),"552f010a");

    gitdou.add("1b");
    gitdou.commit({ m: "second" });
    t.is(fs.readFileSync(".gitdou/refs/heads/master",'utf8'),"44bf0b73");

    gitdou.checkout("other");
    gitdou.merge("master");
    t.true(fs.existsSync('1a/filea'));
    t.true(fs.existsSync('1b/fileb'));
    t.is(fs.readFileSync('1a/filea','utf8'),'filea');
    t.is(fs.readFileSync('1b/fileb','utf8'),'fileb');
});

test("current branch should point to latest commit", t => {
    testUtil.initTestDataDir({repo:'mergeRepo3'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1a");
    gitdou.commit({ m: "first" });
    gitdou.branch("other");
    t.is(fs.readFileSync(".gitdou/refs/heads/other",'utf8'),"552f010a");

    gitdou.add("1b");
    gitdou.commit({ m: "second" });
    t.is(fs.readFileSync(".gitdou/refs/heads/master",'utf8'),"44bf0b73");

    gitdou.checkout("other");
    gitdou.merge("master");
    t.is(fs.readFileSync(".gitdou/refs/heads/other",'utf8'),"44bf0b73");
});

test("should update index to latest status", t => {
    testUtil.initTestDataDir({repo:'mergeRepo4'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1a");
    gitdou.commit({ m: "first" });
    gitdou.branch("other");
    t.is(fs.readFileSync(".gitdou/refs/heads/other",'utf8'),"552f010a");

    gitdou.add("1b");
    gitdou.commit({ m: "second" });
    t.is(fs.readFileSync(".gitdou/refs/heads/master",'utf8'),"44bf0b73");

    gitdou.checkout("other");
    gitdou.merge("master");
    const index = testUtil.index().map(item=> item.path);

    t.true(_.includes(index,'1b\\fileb'));
    t.true(_.includes(index,'1b\\2b\\filec'));
    t.true(_.includes(index,'1b\\2b\\3b\\4b\\filed'));
});