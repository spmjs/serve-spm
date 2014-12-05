var join = require('path').join;
var should = require('should');
var request = require('supertest');
var spy = require('spy');
var util = require('../lib/util');
var express = require('express');
var expressMiddleware = require('../');
var fixtures = join(__dirname, 'fixtures');
var isSupportGenerator = require('generator-support');

describe('express', function() {
  wrap(express, expressMiddleware);
});

if (isSupportGenerator) {
  var koa = require('koa');
  var koaMiddleware = require('../lib/koa');
  describe('koa', function() {
    wrap(koa, koaMiddleware);
  });
}

function wrap(server, middleware) {
  var app;

  describe('html', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'htm')));
    });

    it('should match index.html when request /', function(done) {
      request(app.listen())
      .get('/')
      .expect('<div>html</div>\n')
      .expect(200, done);
    });

    it('should match index.htm when request /htm/', function(done) {
      request(app.listen())
      .get('/htm/')
      .expect('<div>htm</div>\n')
      .expect(200, done);
    });
  });

  describe('self package', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'parser')));
    });

    it('should not handle directory', function(done) {
      request(app.listen())
      .get('/')
      .expect(404, done);
    });

    it('should match /index.js -> /index.js, wrap', function(done) {
      request(app.listen())
      .get('/index.js')
      .expect(util.define('index', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });

    it('should match /camelCase.js -> /camelCase.js, wrap', function(done) {
      request(app.listen())
      .get('/camelCase.js')
      .expect(util.define('camelCase', 'console.log(\'camelCase\');\n'))
      .expect(200, done);
    });

    it('should match /dist/a/0.1.0/index.js -> /index.js, wrap', function(done) {
      request(app.listen())
      .get('/dist/a/0.1.0/index.js')
      .expect(util.define('dist/a/0.1.0/index', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });

    it('should match /a/0.1.0/index.js -> /index.js, wrap', function(done) {
      request(app.listen())
      .get('/a/0.1.0/index.js')
      .expect(util.define('a/0.1.0/index', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });

    it('should match /a/0.1.0/i.js -> /dist/a/0.1.0/i.js, nowrap', function(done) {
      request(app.listen())
      .get('/a/0.1.0/i.js')
      .expect('define(\'a/0.1.0/i\', function(require, exports, module){\n  console.log(\'i\');\n});\n')
      .expect(200, done);
    });

    it('should match /pkg-file.js -> /pkg-file.js, required package in dependencies', function(done) {
      request(app.listen())
      .get('/pkg-file.js')
      .expect(util.define('pkg-file', 'require("b/0.1.0/path/to/file");\n'))
      .expect(200, done);
    });

    it('should match /pkg-file-dev.js -> /pkg-file-dev.js, required package in devDependencies', function(done) {
      request(app.listen())
      .get('/pkg-file-dev.js')
      .expect(util.define('pkg-file-dev', 'require("c/0.1.0/path/to/file");\n'))
      .expect(200, done);
    });

    it('should match /pkg-file.css -> /pkg-file.css, required package in dependencies', function(done) {
      request(app.listen())
      .get('/pkg-file.css')
      .expect('@import "../../b/0.1.0/a/b.css";\n')
      .expect(200, done);
    });

    it('should match /pkg-file-dev.css -> /pkg-file-dev.css, required package in devDependencies', function(done) {
      request(app.listen())
      .get('/pkg-file-dev.css')
      .expect('@import "../../c/0.1.0/a/b.css";\n')
      .expect(200, done);
    });

    it('should match .json', function(done) {
      request(app.listen())
      .get('/a/0.1.0/g.json')
      .expect(util.define('a/0.1.0/g.json', 'module.exports = {"a":1};'))
      .expect(200, done);
    });

    it('should match .tpl', function(done) {
      request(app.listen())
      .get('/a/0.1.0/h.tpl')
      .expect(util.define('a/0.1.0/h.tpl', 'module.exports = \'<div id="h">\'</div>\';'))
      .expect(200, done);
    });

    it('should match .handlebars', function(done) {
      request(app.listen())
      .get('/a/0.1.0/i.handlebars')
      .expect(/^define\(\'a\/0\.1\.0\/i\.handlebars\', function\(/)
      .expect(/Handlebars = require\(\"handlebars-runtime\/1\.3\.0\/dist\/cjs\/handlebars\.runtime\.js\"\)\[\"default\"\];/)
      .expect(200, done);
    });

    it('should match .css.js', function(done) {
      request(app.listen())
      .get('/a/0.1.0/a.css.js')
      .expect(util.define('a/0.1.0/a.css.js' , 'seajs.importStyle(\'h1{color:red;}\');'))
      .expect(200, done);
    });

    it('should match .less', function(done) {
      request(app.listen())
      .get('/a/0.1.0/c.css')
      .expect('a {\n  color: #428bca;\n}\n')
      .expect(200, done);
    });

    it('should not match notfound.js', function(done) {
      request(app.listen())
      .get('/notfound.js')
      .expect(404, done);
    });

    it('should not match notfound.css.js', function(done) {
      request(app.listen())
      .get('/notfound.css.js')
      .expect(404, done);
    });
  });

  describe('dependent package', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'parser')));
    });

    it('should match /b/0.1.0/index.js -> /spm_modules/b/0.1.0/index.js', function(done) {
      request(app.listen())
      .get('/b/0.1.0/index.js')
      .expect(util.define('b/0.1.0/index', 'console.log(\'b\');\n'))
      .expect(200, done);
    });

    it('should not match no exist file', function(done) {
      request(app.listen())
      .get('/notfound/0.1.0/index.js')
      .expect(404, done);
    });

    it('should match /b/0.1.0/b.tpl -> /spm_modules/b/0.1.0/b.tpl', function(done) {
      request(app.listen())
      .get('/b/0.1.0/b.tpl')
      .expect(util.define('b/0.1.0/b.tpl', 'module.exports = \'<div></div>\';'))
      .expect(200, done);
    });

    it('should match handlebars', function(done) {
      request(app.listen())
      .get('/handlebars-runtime/1.3.0/dist/cjs/handlebars.runtime.js')
      .expect(/^define\(\'handlebars-runtime\/1\.3\.0\/dist\/cjs\/handlebars\.runtime\', function/)
      .expect(200, done);
    });
  });

  describe('indirect dependent package', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'indirect-dep')));
    });

    it('should transport id for css', function(done) {
      request(app.listen())
      .get('/b/0.1.0/index.css')
      .expect(/^@import \"\.\.\/\.\.\/c\/0\.1\.0\/index.js\";/)
      .expect(200, done);
    });

    it('should transport id for js', function(done) {
      request(app.listen())
      .get('/b/0.1.0/index.js')
      .expect(/require\(\"c\/0\.1\.0\/index.js\"\);/)
      .expect(200, done);
    });

  });

  describe('paths', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'parser'), {
        paths: [
          ['/docs', '']
        ]
      }));
    });

    it('should match /docs/index.js -> /index.js, wrap', function(done) {
      request(app.listen())
      .get('/docs/index.js')
      .expect(util.define('index', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });

  });

  describe('nowrap', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'parser')));
    });

    it('should not contain define', function(done) {
      request(app.listen())
      .get('/index.js?nowrap')
      .expect('var b = require(\'b\');\nconsole.log(\'a\');\n')
      .expect(200, done);
    });
  });

  describe('log option', function() {

    it('normal', function(done) {
      var log = spy();
      app = server();
      app.use(middleware(join(fixtures, 'parser'), {
        log: log
      }));
      request(app.listen())
      .get('/index.js')
      .end(function(err) {
        should.not.exist(err);
        log.called.should.be.true;
        log.restore();
        done();
      });
    });
  });

  describe('sea-modules', function() {

    it('should return correct', function(done) {
      app = server();
      app.use(middleware(join(fixtures, 'parser_seamodules')));
      request(app.listen())
      .get('/index.js')
      .expect(util.define('index.js', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });
  });

  describe('root not exist', function() {
    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'notfound')));
    });

    it('normal', function(done) {
      request(app.listen())
      .get('/index.js')
      .expect(404, done);
    });
  });

  describe('custom rules', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'parser'), {
        rules: [function(url, pkg) {
          return {
            path: join(pkg.dest, url.pathname.substring(4))
          };
        }]
      }));
    });

    it('should match /app/index.js -> /index.js', function(done) {
      request(app.listen())
      .get('/app/index.js')
      .expect(util.define('app/index', 'var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
      .expect(200, done);
    });
  });

  describe('standalone', function() {

    before(function() {
      app = server();
      app.use(middleware(join(fixtures, 'standalone')));
    });

    it('with standalone', function(done) {
      request(app.listen())
      .get('/index.js')
      .expect(/\ndefine\(\'index\', function\(require, exports, module\)\{\nmodule.exports = function\(\) \{\n  require\(\'.\/noentry\'\);\n  console.log\(\'standalone\'\);\n\};\n\n\}\);\n/)
      .expect(/\/\*\! Init \*\/\ng_spm_init\(\'\/index.js\'\);\n$/)
      .expect(200, done);
    });

    it('no entry', function(done) {
      request(app.listen())
      .get('/noentry.js')
      .expect('define(\'noentry\', function(require, exports, module){\nconsole.log(\'no entry\');\n\n});\n')
      .expect(200, done);
    });
  });

  it('isModified', function(done) {
    app = server();
    app.use(middleware(join(fixtures, 'parser')));
    request(app.listen())
    .get('/index.js')
    .set('if-modified-since', '2046 8-14 13:52:38')
    .expect(304, done);
  });

  it('jsx', function(done) {
    app = server();
    app.use(middleware(join(fixtures, 'parser')));
    request(app.listen())
    .get('/react.js')
    .expect('define(\'react\', function(require, exports, module){\n/** @jsx React.DOM */\n\n(React.createElement("li", {onClick: this.handlClick}));\n\n});\n')
    .expect(200, done);
  });
}
