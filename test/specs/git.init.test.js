import test from 'ava';
import gitdou from '../../src/gitdou';
import fs from 'fs';
import testUtil from './test-util'

test.beforeEach(() => {
    testUtil.initTestDataDir();
});

test('hello world', t=> {
    t.is("I am Hello World", "I am Hello World");
})

test('git.init() should create all related files under /.gitdou', t => {
    gitdou.init();
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou`));
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou/objects/`));
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou/refs/heads/`));
    t.is(fs.readFileSync(`${__dirname}/testdata/repo1/.gitdou/HEAD`,'utf-8'), 'ref: refs/heads/master\n');
    t.is(fs.readFileSync(__dirname + "/testData/repo1/.gitdou/config",'utf-8'),
       "{\n" +
        "  \"core\": {\n" +
        "    \"bare\": false\n" +
        "  }\n" +
        "}");
});

test('git.init() should not crash when call twice', t => {
    gitdou.init();
    gitdou.init();
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou`));
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou/objects/`));
    t.true(fs.existsSync(`${__dirname}/testdata/repo1/.gitdou/refs/heads/`));
    t.is(fs.readFileSync(`${__dirname}/testdata/repo1/.gitdou/HEAD`,'utf-8'), 'ref: refs/heads/master\n');
    t.is(fs.readFileSync(__dirname + "/testData/repo1/.gitdou/config",'utf-8'),
        "{\n" +
        "  \"core\": {\n" +
        "    \"bare\": false\n" +
        "  }\n" +
        "}");
})