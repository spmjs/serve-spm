var join = require('path').join;
var serveSPM = require('../');
var http = require('http');
var request = require('request');
var util = require('../util');
var spy = require('spy');
var extend = require('extend');
var express = require('express');

var port = 12345;
var server;
var root = join(__dirname, 'fixtures/parser');

describe('index', function() {
  before(function(done) {
    server = http.createServer(serveSPM(root));
    server.listen(port, done);
  });
  after(function() {
    server && server.close();
  });

  it('normal', function(done) {
    local('index.js', function(err, res, body) {
      body.should.be.equal(util.define('var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n'));
      done();
    });
  });

  it('transportId only in root entries and with id_leading prefix request', function(done) {
    local('a/0.1.0/index.js', function(err, res, body) {
      var id = 'a/0.1.0/index.js';
      body.should.be.equal(util.define('var b = require("b/0.1.0/index.js");\nconsole.log(\'a\');\n', id));
      done();
    });
  });

  it('nowrap', function(done) {
    local('index.js?nowrap', function(err, res, body) {
      body.should.be.equal('var b = require(\'b\');\nconsole.log(\'a\');\n');
      done();
    });
  });

  it('dep pkg', function(done) {
    local('b/0.1.0/index.js', function(err, res, body) {
      body.should.be.equal(util.define('console.log(\'b\');\n'));
      done();
    });
  });

  it('dep pkg but not found', function(done) {
    local('notfound/0.1.0/index.js', function(err, res, body) {
      res.statusCode.should.be.equal(404);
      done();
    });
  });

  it('file not found', function(done) {
    local('notfound.js', function(err, res, body) {
      res.statusCode.should.be.equal(404);
      done();
    });
  });

  it('handlebars', function(done) {
    local('dist/cjs/handlebars.runtime.js', function(err, res, body) {
      body.should.startWith('define("dist/cjs/handlebars.runtime"');
      done();
    });
  });

  it('handlebars2', function(done) {
    local('handlebars-runtime.js', function(err, res, body) {
      body.should.startWith('define("handlebars-runtime"');
      done();
    });
  });

  it('tpl', function(done) {
    local('g.json', function(err, res, body) {
      body.should.be.equal(util.define('module.exports = {"a":1};'));
      done();
    });
  });

  it('css.js', function(done) {
    local('a.css.js', function(err, res, body) {
      body.should.be.equal(util.define('seajs.importStyle(\'h1{color:red;}\');'));
      done();
    });
  });

  it('isModified', function(done) {
    local('index.js', function(err, res) {
      res.statusCode.should.be.equal(304);
      done();
    }, {headers:{'if-modified-since':'2046 8-14 13:52:38'}});
  });

  it('isDir', function(done) {
    local('', function(err, res) {
      res.statusCode.should.be.equal(404);
      done();
    });
  });
});

describe('log option', function() {
  before(function(done) {
    server = http.createServer(serveSPM(root, {
      log: true
    }));
    server.listen(port, done);
  });
  after(function() {
    server && server.close();
  });

  it('normal', function(done) {
    var log = console.log;
    console.log = spy();
    local('index.js', function() {
      console.log.called.should.be.true;
      console.log = log;
      done();
    });
  });
});

describe('spmserver', function() {
  var app = express();

  app.use(serveSPM(root, {
    log: true
  }));
  app.use(function(req, res, next) {
    res.end('ok');
  });

  before(function(done) {
    server = http.createServer(app);
    server.listen(port, done);
  });
  after(function() {
    server && server.close();
  });

  it('without spmserver header', function(done) {
    local('a/0.1.0/notfound.js', function(err, res, body) {
      res.statusCode.should.be.equal(200);
      body.should.be.equal('ok');
      done();
    });
  });

  it('with spmserver header', function(done) {
    local('a/0.1.0/notfound.js', function(err, res) {
      res.statusCode.should.be.equal(404);
      done();
    }, {headers:{'spmserver':'1'}});
  });
});

function local(pathname, cb, opts) {
  var args = {
    url: 'http://localhost:'+port+'/'+pathname
  };
  request(extend(args, opts), cb);
}