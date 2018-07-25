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

test.only('should report it is fast forward', t => {
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
    t.true(fs.existsSync('filea'));
    t.true(fs.existsSync('fileb'));
    t.is(fs.readFileSync('filea','utf8'),'filea');
    t.is(fs.readFileSync('fileb','utf8'),'fileb');
});
