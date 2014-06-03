
var http = require('http');
var join = require('path').join;
var request = require('request');
var serveSPM = require('../');

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

  it('main', function(done) {
    request('http://localhost:'+port+'/css-relative-import/a.css', function(err, res, body) {
      body.should.be.eql('body {background: red;}\n\nbody {background: green;}\n');
      done();
    });
  });

});
