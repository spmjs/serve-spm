var express = require('express');
var app = express();

app.use(require('../../../index')(__dirname));

app.listen('3000');
console.log('listen at 3000');
