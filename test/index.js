var join = require('path').join;
var serveSPM = require('../');
var should = require('should');
var http = require('http');
var request = require('supertest');
var util = require('../util');
var spy = require('spy');
var express = require('express');

var app;
var root = join(__dirname, 'fixtures/parser');

describe('index', function() {

  before(function() {
    app = http.createServer(serveSPM(root));
  });

  it('normal', function(done) {
    request(app.listen())
    .get('/index.js')
    .expect(util.define('var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'))
    .expect(200, done);
  });

  it('transportId only in root entries and with id_leading prefix request', function(done) {
    var id = 'a/0.1.0/index.js';
    request(app.listen())
    .get('/' + id)
    .expect(util.define('var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n', id))
    .expect(200, done);
  });

  it('require pkg file in js', function(done) {
    request(app.listen())
    .get('/pkg-file.js')
    .expect(util.define('require("b/0.1.0/path/to/file");\n'))
    .expect(200, done);
  });

  it('require pkg file in js (devDependencies)', function(done) {
    request(app.listen())
    .get('/pkg-file-dev.js')
    .expect(util.define('require("c/0.1.0/path/to/file");\n'))
    .expect(200, done);
  });

  it('import pkg file in css', function(done) {
    request(app.listen())
    .get('/pkg-file.css')
    .expect('@import "/b/0.1.0/a/b.css";\n')
    .expect(200, done);
  });

  it('import pkg file in css (devDependencies)', function(done) {
    request(app.listen())
    .get('/pkg-file-dev.css')
    .expect('@import "/c/0.1.0/a/b.css";\n')
    .expect(200, done);
  });

  it('nowrap', function(done) {
    request(app.listen())
    .get('/index.js?nowrap')
    .expect('var b = require(\'b\');\nconsole.log(\'a\');\n')
    .expect(200, done);
  });

  it('dep pkg', function(done) {
    request(app.listen())
    .get('/b/0.1.0/index.js')
    .expect(util.define('console.log(\'b\');\n'))
    .expect(200, done);
  });

  it('dep pkg but not found', function(done) {
    request(app.listen())
    .get('/notfound/0.1.0/index.js')
    .expect(404, done);
  });

  it('file not found', function(done) {
    request(app.listen())
    .get('/notfound.js')
    .expect(404, done);
  });

  it('handlebars', function(done) {
    request(app.listen())
    .get('/dist/cjs/handlebars.runtime.js')
    .expect(/^define\("dist\/cjs\/handlebars.runtime"/)
    .expect(200, done);
  });

  it('handlebars2', function(done) {
    request(app.listen())
    .get('/handlebars-runtime.js')
    .expect(/^define\("handlebars-runtime"/)
    .expect(200, done);
  });

  it('tpl', function(done) {
    request(app.listen())
    .get('/g.json')
    .expect(util.define('module.exports = {"a":1};'))
    .expect(200, done);
  });

  it('css.js', function(done) {
    request(app.listen())
    .get('/a.css.js')
    .expect(util.define('seajs.importStyle(\'h1{color:red;}\');'))
    .expect(200, done);
  });

  it('isModified', function(done) {
    request(app.listen())
    .get('/index.js')
    .set('if-modified-since', '2046 8-14 13:52:38')
    .expect(304, done);
  });

  it('isDir', function(done) {
    request(app.listen())
    .get('')
    .expect(404, done);
  });
});

describe('log option', function() {
  before(function() {
    app = http.createServer(serveSPM(root, {
      log: true
    }));
  });

  it('normal', function(done) {
    var log = spy(console, 'log');
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

describe('servespmexit', function() {
  var ep = express();
  ep.use(serveSPM(root, {
    log: true
  }));
  ep.use(function(req, res) {
    res.end('ok');
  });

  before(function() {
    app = http.createServer(ep);
  });

  it('without servespmexit header', function(done) {
    request(app.listen())
    .get('/a/0.1.0/notfound.js')
    .expect('ok')
    .expect(200, done);
  });

  it('with servespmexit header', function(done) {
    request(app.listen())
    .get('/a/0.1.0/notfound.js')
    .set('servespmexit', '1')
    .expect(404, done);
  });
});

describe('root not exist', function() {
  before(function() {
    app = http.createServer(serveSPM(join(root, 'notfound'), {
      log: true
    }));
  });

  it('normal', function(done) {
    request(app.listen())
    .get('/index.js')
    .expect(404, done);
  });
});
