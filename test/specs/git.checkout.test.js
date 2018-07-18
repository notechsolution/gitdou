import test from 'ava';
import testUtil from './test-util'
import gitdou from '../../src/gitdou';
import fs from 'fs'

test.beforeEach(()=> {
    testUtil.initTestDataDir({repo:'checkoutRepo'});
    testUtil.pinDate();
});
test.afterEach(() => {
  testUtil.unpinDate();
})

test("working space refer to target commit snapshot", t => {
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 41a09aa
    var commitFile = fs.readFileSync(".gitdou/objects/3bd85bc7", "utf8");
    t.is(commitFile.split("\n")[0], "commit 391566d4");
    t.is(commitFile.split("\n")[1],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[2],"");
    t.is(commitFile.split("\n")[3],"first commit");

    fs.writeFileSync('1b/fileb', 'modified content');
    gitdou.add("1b");
    gitdou.commit({ m: "second commit" });

    gitdou.checkout('41a09aa') // checkout first commit;
    t.is(fs.readFileSync('1b/fileb','utf8'),'fileb');
});