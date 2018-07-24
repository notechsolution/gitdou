import test from 'ava';
import gitdou from '../../src/gitdou';
import fs from 'fs';
import testUtil from './test-util'

test.beforeEach(() => {
    testUtil.initTestDataDir({repo:'remoteRepo'});
});


test('remote add origin should the saved into config', t => {
    gitdou.init();
    gitdou.remote('add','origin','git@github');
    const expectedContent = '{\n' +
        '  "core": {\n' +
        '    "bare": false\n' +
        '  },\n' +
        '  "remote": {\n' +
        '    "origin": "git@github"\n' +
        '  }\n' +
        '}';

    t.is(fs.readFileSync(__dirname + "/testData/remoteRepo/.gitdou/config",'utf8'),expectedContent);
});
