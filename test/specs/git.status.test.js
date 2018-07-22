import test from 'ava';
import testUtil from './test-util'
import gitdou from '../../src/gitdou';
import fs from 'fs'
import nodePath from 'path'

test.beforeEach(()=> {
    testUtil.pinDate();
});
test.afterEach(() => {
    testUtil.unpinDate();
})

test("should mention that there is untrack files", t => {
    testUtil.initTestDataDir({repo:'statusRepo1'});
    gitdou.init();
    testUtil.createFilesFromTree({ "1a": { filea: "filea" }});
    gitdou.add("1a");
    gitdou.commit({ m: "first commit" });
    fs.writeFileSync('new file 1');
    testUtil.createFilesFromTree({ "1b": { fileb: "fileb" }})
    const status = gitdou.status();
    const expectedContent = "Untracked files:\n1b\\\\fileb\nnew file 1"
    t.true(new RegExp(expectedContent).test(status));
});


test("should mention that there is change to commit", t => {
    testUtil.initTestDataDir({repo:'statusRepo2'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add("1b");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7

    fs.writeFileSync('1b/fileb', 'modified content');
    gitdou.rm("1b/2b/filec");
    gitdou.add(".");
    const status = gitdou.status();
    const expectedContent = "Changes to be committed:\n" +
        "D 1b\\\\2b\\\\filec\n"+
        "M 1b\\\\fileb\n" +
        "A 1a\\\\filea";

    t.true(new RegExp(expectedContent).test(status));

});

test("should mention unstage change", t=>{
    testUtil.initTestDataDir({repo:'statusRepo3'});
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add(".");
    gitdou.commit({ m: "first commit" }); // commit hash should be 3bd85bc7

    fs.writeFileSync('1b/fileb', 'modified content');
    fs.unlinkSync('1b/2b/filec')
    const status = gitdou.status();
    const expectedContent = 'Changes not staged for commit:\n' +
        'D 1b\\\\2b\\\\filec\n'+
        'M 1b\\\\fileb';

    t.true(new RegExp(expectedContent).test(status));
});