import test from 'ava';
import testUtil from './test-util'
import gitdou from '../../src/gitdou';
import fs from 'fs'

test.beforeEach(()=> {
    testUtil.pinDate();
});
test.afterEach(() => {
  testUtil.unpinDate();
})

test("first commit", t => {
    testUtil.initTestDataDir({repo:'commitRepo'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" });

    var commitFile = fs.readFileSync(".gitdou/objects/3bd85bc7", "utf8");
    t.is(commitFile.split("\n")[0], "commit 391566d4");
    t.is(commitFile.split("\n")[1],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[2],"");
    t.is(commitFile.split("\n")[3],"first commit");
});

test("non-fisrt commit should have parent hash", t => {
    testUtil.initTestDataDir({repo:'commitRepo2'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" });

    // second commit
    gitdou.add("1a");
    gitdou.commit({m:'second commit'});
    // second commit hash
    var commitFile = fs.readFileSync(".gitdou/objects/9fd4c70", "utf8");
    t.is(commitFile.split("\n")[0], "commit 3fad01d6");
    t.is(commitFile.split("\n")[1], "parent 3bd85bc7");
    t.is(commitFile.split("\n")[2],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[3],"");
    t.is(commitFile.split("\n")[4],"second commit");
});