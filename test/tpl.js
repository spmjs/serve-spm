var tplParser = require('../lib/parser/tpl');
var util = require('../lib/util');

describe('tpl', function() {

  it('normal', function(done) {

    var origin = '{{a}}\n\r\'\"';
    var expected = util.define('module.exports = \'' +
      '{{a}}\'\"\';');

    var stream = tplParser();
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
