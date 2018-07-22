import test from 'ava';
import testUtil from './test-util'
import gitdou from '../../src/gitdou';
import fs from 'fs'

test.beforeEach(()=> {
    testUtil.initTestDataDir({repo:'commitRepo'});
    testUtil.pinDate();
});
test.afterEach(() => {
  testUtil.unpinDate();
})

test("should throw if nothing to commit now, but there were previous commits", t => {
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