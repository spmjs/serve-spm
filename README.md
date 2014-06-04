# Serve SPM

[![Build Status](https://travis-ci.org/spmjs/spm-serve.png)](https://travis-ci.org/spmjs/spm-serve)

SPM@3x build middleware.

---

## Usage

```javascript
var express = require('express');
var serveSPM = require('serve-spm');

var app = express();
app.use(serveSPM('public'));
```

## LICENSE

The MIT License (MIT)
