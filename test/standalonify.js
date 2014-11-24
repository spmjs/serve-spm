var join = require('path').join;
var fs = require('fs');
var standalonifyParser = require('../lib/parser/standalonify');

describe('standalonify', function() {

  it('normal', function(done) {

    var origin = 'alert(1);';
    var sea = fs.readFileSync(join(__dirname, '../sea.js'), 'utf-8');
    var expected = sea + '\n/* Config Base */\nseajs.config({base:\'/\'});\n\nalert(1);\n\n/*! Init */\ng_spm_init(\'/a\');\n';

    var stream = standalonifyParser('/a');
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
