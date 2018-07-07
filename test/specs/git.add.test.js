import test from 'ava';
import path from 'path';
import gitdou from '../../src/gitdou';
import testUtil from './test-util';

test.beforeEach(()=>{
    testUtil.initTestDataDir({repo:'addRepo'});
});

test.serial('adding single file', t => {
    gitdou.init();
    testUtil.createFilesFromTree({'1':{'filea':'filea'}});
    gitdou.add(path.normalize('1/filea'));
    t.is(testUtil.index()[0].path, path.normalize('1/filea'));
    t.is(testUtil.index().length, 1);
})

test.serial('adding multiple file under the same folder', t => {
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add('1b');
    t.is(testUtil.index().length, 3);
    t.is(testUtil.index()[0].path, path.normalize('1b/2b/3b/4b/filed'));
    t.is(testUtil.index()[1].path, path.normalize('1b/2b/filec'));
    t.is(testUtil.index()[2].path, path.normalize('1b/fileb'));
})

test.serial('adding all file with current path', t => {
    gitdou.init();
    testUtil.createStandardFileStructure();
    gitdou.add('.');
    t.is(testUtil.index().length, 4);
    t.is(testUtil.index()[0].path, path.normalize('1a/filea'));
    t.is(testUtil.index()[1].path, path.normalize('1b/2b/3b/4b/filed'));
    t.is(testUtil.index()[2].path, path.normalize('1b/2b/filec'));
    t.is(testUtil.index()[3].path, path.normalize('1b/fileb'));

})