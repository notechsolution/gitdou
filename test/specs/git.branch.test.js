import test from 'ava';
import testUtil from './test-util'
import gitdou from '../../src/gitdou';
import fs from 'fs'

test.beforeEach(()=> {
    testUtil.initTestDataDir({repo:'branchRepo'});
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
    gitdou.branch('DEV1.0');
    t.is(fs.readFileSync('.gitdou/refs/heads/DEV1.0','utf8'),'3bd85bc7');
});