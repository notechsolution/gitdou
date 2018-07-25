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
