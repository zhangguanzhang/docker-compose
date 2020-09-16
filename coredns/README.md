## deploy(coredns docker-compose.yml)

这里使用docker-compose起coredns作为dns server，由于这里需要添加 SRV 记录，所以需要 CoreDNS 结合 etcd 插件使用

创建相关目录

```shell
mkdir -p /data/coredns/config/ \
    /data/coredns/etcd/data \
    /data/coredns/etcd/conf

# etcd 3.4.10后data目录权限必须是0700
chmod 0700 /data/coredns/etcd/data
```

创建coredns的配置文件

```shell
cat > /data/coredns/config/Corefile <<'EOF'
.:53 {  # 监听 TCP 和 UDP 的 53 端口
    template IN A apps.openshift4.example.com {
    match .*apps\.openshift4\.example\.com # 匹配请求 DNS 名称的正则表达式
    answer "{{ .Name }} 60 IN A 10.226.45.251" # DNS 应答
    fallthrough
    }
    etcd {   # 配置启用 etcd 插件,后面可以指定域名,例如 etcd test.com {
        path /skydns # etcd 里面的路径 默认为 /skydns，以后所有的 dns 记录都存储在该路径下
        endpoint http://etcd:2379 # etcd 访问地址，多个空格分开
        fallthrough # 如果区域匹配但不能生成记录，则将请求传递给下一个插件
        # tls CERT KEY CACERT # 可选参数，etcd 认证证书设置
    }
    prometheus  # 监控插件
    cache 160
    loadbalance   # 负载均衡，开启 DNS 记录轮询策略
    forward . 114.114.114.114 #上游 dns server,或者使用挂载进来的/etc/hosts
    log # 打印日志
}
EOF
```

创建etcd的配置文件

```shell
cat > /data/coredns/etcd/conf/etcd.config.yml <<'EOF'
name: coredns-etcd
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
auto-compaction-mode: periodic
auto-compaction-retention: "1"
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'http://127.0.0.1:2380'
listen-client-urls: 'http://0.0.0.0:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'http://127.0.0.1:2380'
advertise-client-urls: 'http://0.0.0.0:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'coredns-etcd=http://127.0.0.1:2380' #和上面的name一致
initial-cluster-token: 'etcd-coredns'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: false
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
force-new-cluster: false
EOF
```

确保宿主机上的53没有其他dns server进程使用

```shell
docker-compose up -d
```

自带了一个通配符解析，验证下解析

```shell
$ dig +short apps.openshift4.example.com @127.0.0.1
10.226.45.251

$ dig +short x.apps.openshift4.example.com @127.0.0.1
10.226.45.251
```
