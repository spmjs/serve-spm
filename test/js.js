var jsParser = require('../lib/parser/js');
var util = require('../lib/util');

describe('js', function() {

  it('normal', function(done) {

    var origin = '@require("b");' +
      '@require("f");' +
      '@require("./d.less");' +
      '@require("./e.css");' +
      '@require("./d.scss");' +
      '@require("./d.sass");' +
      '@require("./d.styl");' +
      '@require("./c");';
    var expected = util.define('@require("b/0.1.0/index.js");' +
      '@require("f");' +
      '@require("./d.css");' +
      '@require("./e.css");' +
      '@require("./d.css");' +
      '@require("./d.css");' +
      '@require("./d.css");' +
      '@require("./c");');

    var pkg = {
      dependencies: {
        'b': {
          name: 'b',
          version: '0.1.0',
          main: 'index.js',
          dest: '/tmp'
        }
      }
    };

    var stream = jsParser({
      pkg: pkg,
      ignore: []
    });
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write({
      url: {pathname: ''},
      contents: new Buffer(origin),
      path: '/tmp'
    });
    stream.end();
  });
});
