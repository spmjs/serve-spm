# Serve SPM

[![Build Status](https://travis-ci.org/spmjs/serve-spm.png)](https://travis-ci.org/spmjs/serve-spm)

spm@3x middleware.

## Usage

```javascript
var express = require('express');
var serveSPM = require('serve-spm');

var app = express();
app.use(serveSPM(__dirname, 'public'));
```

## LICENSE

The MIT License (MIT)
