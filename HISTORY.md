# HISTORY

---

## 0.7.1

- add paths feature back, which is missed in `parser refactor`

## 0.7.0

- refactor and abstract parser, #14
- fix indirect dep id transport, spmjs/spm/issues/1069

## 0.6.0

- add support for koa, #9

## 0.5.11

- fix require pkg file in devDependencies

## 0.5.10

- update father to 0.9.x

## 0.5.9

- add support for pkg file require, #7

## 0.5.8

- fix @import path error, #5

## 0.5.7

- fix file not found in dep pkgs
- fix crash when no handlebars-runtime dependency

## 0.5.6

- fix single quote marks missing, #4

## 0.5.5

- support umd include mode

## 0.5.4

- don't transform file to string, for bin files like image

## 0.5.3

- find precompiler language file first

## 0.5.2

- add semver version validation

## 0.5.1

- return next if package can't be parsed correctly

## 0.5.0

- speedup (eg. a project required acharts, from 6000ms+ to 774ms, and 180ms with deps built)
- add testcase, 100% test coverage
- add more map rules
- compatible with old sea-modules package
- add paths support
- add coffee support

## 0.4.0

- sea-modules to spm_modules

## 0.3.11

- add cache again, :sweat_smile:

## 0.3.10

- add log opts to enable request log

## 0.3.9

- remove cache temporary, [problem](https://github.com/spmjs/serve-spm/issues/1#issuecomment-51144678)

## 0.3.8

- add nowrap support for json, handlebars and tpl

## 0.3.7

- add cache

## 0.3.5

- upgrade father to 0.7.x

## 0.3.4

- fix bug in standalone mode

## 0.3.3

- add seajs-mini for main and output files in standalone mode
- deps update: father2 -> father

## 0.3.2

- don't resolve packages that can't be found
- deps update: node-requires -> searequire

## 0.3.1

- fix pkg parse issue

## 0.3.0

- refactor with gulp and stream

## 0.2.0

- bugfix

## 0.1.0

- init commit



