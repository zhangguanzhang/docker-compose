## deploy

1.
这里数据都存放在`/data/quay/xxx`，创建目录

```shell
mkdir -p /data/quay/lib/mysql \
  /data/quay/lib/redis \
  /data/quay/config \
  /data/quay/storage
# 容器权限问题，容器的user都在root组下，但是默认umask下组没有w权限，所以这里加下
chmod g+w /data/quay/lib/mysql/ \
  /data/quay/lib/redis/ \
  /data/quay/config \
  /data/quay/storage

```

2.
注意，其中的镜像`quay.io/redhat/quay:v3.3.1`是无法拉取的，需要获取Red Hat Quay v3 镜像的访问权才可以拉取，参考[官方链接](https://access.redhat.com/solutions/3533201)

```shell
docker login -u="redhat+quay" -p="O81WSHRSJR14UAZBK54GQHJS0P1V4CLWAJV1X2C4SD7KO59CQ9N3RE12612XU1HR" quay.io
```

这个镜像我已经同步到阿里云上的镜像仓库上，也方便拉取，另外这个镜像的运行命令 `config redhat`的 redhat 是quay的配置web的时候用到的密码，先拉取上面所需要的镜像。后续部署的话推荐提前docker拉取后把这三个镜像`docker save -o`成一个tar包`docker load -i`导入

```shell
docker-compose pull
docker-compose up -d
```

3.
起来后访问`https://ip` basic auth信息为`quayconfig/redhat`，选择`Start New Registry Setup`，数据库类型选择mysql，连接信息按照上面的docker-compose里的环境变量写，`ssl certificate`先别管。

下一步设置超级管理员密码，然后页面往下滑动，在`Server Configuration`段里设置`Server Hostname`，例如为`registry.openshift4.example.com`，往下滑动，配置redis信息。点击左下角的Save，弹出的`Checking`全绿后点击`Next`然后点击`Download Configuration`下载生成的`quay-config.tar.gz`，将其上传到quay的镜像机器上

```shell

cp quay-config.tar.gz /data/quay/config/
cd /data/quay/config/
tar zxvf quay-config.tar.gz
```

接下来为仓库生成域名自签名证书

```shell
# 生成私钥
openssl genrsa -out ssl.key 1024

# 生成证书，最好使用通配符
openssl req \
  -newkey rsa:2048 -nodes -keyout ssl.key \
  -x509 -days 36500 -out ssl.cert -subj \
  "/C=CN/ST=Wuhan/L=Wuhan/O=quay/OU=quay/CN=*.openshift4.example.com"
```

证书搞定后修改成https

```shell
sed -ri '/^PREFERRED_URL_SCHEME:/s#\S+$#https#' config.yaml
```

然后停掉服务，注释掉command后再启动，web打开看看是不是镜像仓库，是的话添加下hosts
```shell
cd # 回到家目录下
docker-compose down
sed -ri '/^\s*command: \["config"/s@^@#@' docker-compose.yml
docker-compose up -d
grep -qw 'registry.openshift4.example.com' /etc/hosts || 
    echo '127.0.0.1 registry.openshift4.example.com' >> /etc/hosts
```
