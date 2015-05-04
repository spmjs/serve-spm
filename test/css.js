var cssParser = require('../lib/parser/css');

describe('css', function() {

  it('normal', function(done) {

    var origin = '@import "~b";@import "./c";';
    var expected = '@import "b/0.1.0/index.css";@import "./c";';

    var pkg = {
      dependencies: {
        'b': {
          "name": "b",
          "version": "0.1.0",
          "main": "index.css"
        }
      }
    };

    var stream = cssParser({
      pkg: pkg
    });
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write({
      url: {pathname: ''},
      contents: new Buffer(origin)
    });
    stream.end();

  });
});
