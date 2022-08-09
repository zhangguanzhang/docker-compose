
## about

```
docker-compose up -d
```

### add requirement

```
docker exec -it qinglong bash

apk add ca-certificates
cd /ql
pnpm install

```

## use

### 添加任务

go to the `ip:5700`, the password is `admin/admin`, or could get it: `docker exec qinglong jq .password /ql/config/auth.json` , add a crontab on the dashboard: 

```
*/4 * * * * ql repo https://ghproxy.com/https://github.com/shufflewzc/faker2.git "jd_|jx_|gua_|jddj_|getJDCookie" "activity|backUp" "^jd[^_]|USER|utils|ZooFaker_Necklace.js|JDJRValidator_Pure|sign_graphics_validate"
```

the command could get from [fakaer2](https://github.com/shufflewzc/faker2.git) .

去面板 `配置文件` 去配置下 `pushplus`

添加的脚本运行日志报错的话，`docker exec -it -w /ql/scripts/ qinglong pnpm install`

### 登录

chrome browser go to `m.jd.com` get cookies: `xx_key` and `xx_pin` , go to the dashboard add envirment `JD_COOKIE`, value is `xx_key=xxx;xx_pin=xxx`

## 问题

jing喜工厂 啥的没激活的话下 `jing喜` apk，然后进去激活下相关的

## 参考

- https://www.cnblogs.com/iangel/p/15131134.html
