var http = require('http');
var join = require('path').join;
var request = require('request');
var serveSPM = require('../');
var readFileSync = require('fs').readFileSync;

var port = 12345;
var server;

describe('serve spm', function() {

  before(function(done) {
    var publicPath = join(__dirname, './fixtures/site/public/');
    server = http.createServer(serveSPM(publicPath));
    server.listen(port, done);
  });

  after(function() {
    server && server.close();
    server = null;
  });

  it('css local import', function(done) {
    request('http://localhost:'+port+'/css-local-import/a.css', function(err, res, body) {
      body.should.be.eql('body {background: red;}\n\nbody {background: green;}\n');
      done();
    });
  });

  it('js local require', function(done) {
    request('http://localhost:'+port+'/js-local-require/a.js', function(err, res, body) {
      var a = readFileSync(join(__dirname, 'fixtures/site/public/js-local-require/dist/a.js'), 'utf-8');
      var b = readFileSync(join(__dirname, '../seajs-mini.js'), 'utf-8');
      var c = readFileSync(join(__dirname, '../seajs-style.js'), 'utf-8');
      body.should.be.containEql(a);
      body.should.be.containEql(b);
      body.should.be.containEql(c);
      done();
    });
  });

  it('css remote import', function(done) {
    request('http://localhost:'+port+'/css-remote-import/a.css', function(err, res, body) {
      body.should.be.containEql('/*! normalize.css v3.0.1 | MIT License | git.io/normalize */');
      body.should.be.containEql('body {background:red;}');
      done();
    });
  });

  it('js remote require', function(done) {
    request('http://localhost:'+port+'/js-remote-require/a.js', function(err, res, body) {
      var a = readFileSync(join(__dirname, 'fixtures/site/public/js-remote-require/dist/a.js'), 'utf-8');
      body.should.be.containEql(a);
      body.should.be.containEql(' * Return the type of `val`.');
      done();
    });
  });

});
