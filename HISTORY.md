# HISTORY

---

## 0.10.2

Deps: upgrade father to 0.11

## 0.10.1

修复 win 下的路径问题, [#32](https://github.com/spmjs/serve-spm/issues/32)

## 0.10.0

- 支持 es6，通过 spm.6to5 开启
- 支持 `--sea`, `--standalone` 和 `--umd`

## 0.9.1

fix(standalonify) unique id in define and spm_init, Fix [#28](https://github.com/spmjs/serve-spm/issues/28)

## 0.9.0

add base opt to set seajs's base

## 0.8.1

- feat(util) add red color for console.error msg, Fix [spmjs/spm-server#15](https://github.com/spmjs/spm-server/issues/15)
- fix(util) resolve output dymatically, Fix [spmjs/spm-server#14](https://github.com/spmjs/spm-server/issues/14)

## 0.8.0

- feat(middleware) no cache by default, enable using `cache` opt, Fix [#25](https://github.com/spmjs/serve-spm/issues/25)
- feat(xhr) don't wrap xhr requests, Fix [#24](https://github.com/spmjs/serve-spm/issues/24)
- fix(parser) path wrong in win7 when parsing pkg inner files, Fix [spmjs/spm#1142](https://github.com/spmjs/spm/issues/1142)
- fix(parser) path wrong when has same name file and directory, Fix [#23](https://github.com/spmjs/serve-spm/issues/23)

## 0.7.15

fix(css) fix css path prefix

## 0.7.14

feat(parser) test require files like nodejs

## 0.7.13

- test coffee and less file before itself

## 0.7.12

- fix buildArgs parse broken with father@0.10.4, [#22](https://github.com/spmjs/serve-spm/pull/22)

## 0.7.10

- custom rule have high priority than default rules
- support ignore for replacing package name

## 0.7.9

- upgrade father to 0.10

## 0.7.8

- support jsx transform (react)

## 0.7.7

- through error when parse pkg error
- fix(middleware): file path may not exist

## 0.7.6

- support body pass in (koa only)

## 0.7.5

- support multiple entry with standalone mode, Fix spmjs/spm-server/issues/10

## 0.7.4

- add rootPkg param to rule function

## 0.7.3

- don't handle directory

## 0.7.2

- fix testcase failed in koa (node 11)

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



