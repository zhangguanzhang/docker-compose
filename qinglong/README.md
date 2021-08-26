
## about

```
docker-compose up -d
```

### add Ninjia

```
docker exec -it qinglong bash

apk add ca-certificates
cd /ql
pnpm install

git clone https://github.com/MoonBegonia/ninja.git /ql/ninja
cd /ql/ninja/backend

cp .env.example .env
echo 'NINJA_UA="Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5 UCBrowser/13.4.2.1122"' >> .env

pnpm install
pm2 start
cp sendNotify.js /ql/scripts/sendNotify.js
```

### keep Ninjia start after add the Ninjia

just run once

```
docker exec -it qinglong bash

cat >> /ql/config/extra.sh << EOF

cd /ql/ninja/backend
git pull -f
pnpm install
pm2 start
cp sendNotify.js /ql/scripts/sendNotify.js
EOF

```

### Ninjia update

```
docker exec -it -w /ql/ninja/backend qinglong sh -c 'git pull && pm2 start'
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

### 扫码登录

go to the `ip:5701`

or `bean.m.jd.com` get cookies: `key` and `pin`

## 问题

jing喜工厂 啥的没激活的话下 `jing喜` apk，然后进去激活下相关的

## 参考

- https://www.cnblogs.com/iangel/p/15131134.html
