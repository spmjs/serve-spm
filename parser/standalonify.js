var join = require('path').join;
var fs = require('fs');
var through = require('through2');

module.exports = function(url, options) {
  return through.obj(function(file) {
    this.push(parser(file, url, options));
  });
};

function parser(file, url, options) {
  var code = String(file.contents);
  var sea = fs.readFileSync(join(__dirname, '../sea.js'), 'utf-8');
  var seaconfig = '/* Config Base */\nseajs.config({base:\'/\'});\n';
  var init = '\n/*! Sea.js Init */\nseajs.use(\''+url+'\');\n';

  // code = sea + seaconfig + code + init;
  code = sea + seaconfig + code + init;
  file.contents = new Buffer(code);
  return file;
}
