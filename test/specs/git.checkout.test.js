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

test("file change should show after checkout", t => {
    testUtil.initTestDataDir({repo:'checkoutRepo1'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7
    var commitFile = fs.readFileSync(".gitdou/objects/3bd85bc7", "utf8");
    t.is(commitFile.split("\n")[0], "commit 391566d4");
    t.is(commitFile.split("\n")[1],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[2],"");
    t.is(commitFile.split("\n")[3],"first commit");

    fs.writeFileSync('1b/fileb', 'modified content');
    gitdou.add("1b");
    gitdou.commit({ m: "second commit" });

    gitdou.checkout('3bd85bc7') // checkout first commit;
    t.is(fs.readFileSync('1b/fileb','utf8'),'fileb');
});

test("deleted file should not show after checkout", t => {
    testUtil.initTestDataDir({repo:'checkoutRepo2'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7
    var commitFile = fs.readFileSync(".gitdou/objects/3bd85bc7", "utf8");
    t.is(commitFile.split("\n")[0], "commit 391566d4");
    t.is(commitFile.split("\n")[1],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[2],"");
    t.is(commitFile.split("\n")[3],"first commit");

    fs.unlinkSync('1b/fileb');
    gitdou.add("1b");
    gitdou.commit({ m: "second commit" });

    gitdou.checkout('3bd85bc7') // checkout first commit;
    t.false(fs.existsSync('1b/fileb'));
});

test("HEAD should point to latest branch", t => {
    testUtil.initTestDataDir({repo:'checkoutRepo3'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7
    gitdou.branch('other');

    fs.writeFileSync('1b/fileabcd', 'something in fileabcd');
    gitdou.add("1b");
    gitdou.commit({ m: "second commit" });

    gitdou.checkout('other') // checkout first commit;
    t.is(fs.readFileSync('.gitdou/HEAD','utf8'),'ref: refs/heads/other');
});

test("added file should show after checkout", t => {
    testUtil.initTestDataDir({repo:'checkoutRepo3'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7
    var commitFile = fs.readFileSync(".gitdou/objects/3bd85bc7", "utf8");
    t.is(commitFile.split("\n")[0], "commit 391566d4");
    t.is(commitFile.split("\n")[1],
        "Date:  Sat Aug 30 2014 09:16:45 GMT-0400 (EDT)");
    t.is(commitFile.split("\n")[2],"");
    t.is(commitFile.split("\n")[3],"first commit");

    fs.writeFileSync('1b/fileabcd', 'something in fileabcd');
    gitdou.add("1b");
    gitdou.commit({ m: "second commit" });

    gitdou.checkout('3bd85bc7') // checkout first commit;
    t.false(fs.existsSync('1b/fileabcd'));
});