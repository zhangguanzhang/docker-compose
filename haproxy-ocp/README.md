## deploy

建议`docker-compose.yml`放在 `/data/haproxy` 目录里和下面一起存放

```shell
mkdir -p /data/haproxy/config/
cat >/data/haproxy/config/haproxy.cfg<<'EOF'
global
  maxconn  2000
  ulimit-n  16384
  log  127.0.0.1 local0 err

defaults
  log global
  mode  http
  option  httplog
  timeout connect 5000
  timeout client  50000
  timeout server  50000
  timeout http-request 15s
  timeout http-keep-alive 15s

listen stats
    bind         :9000
    mode         http
    stats        enable
    stats        uri /
    stats        refresh   30s
    stats        auth      admin:openshift #web页面登录
    monitor-uri  /healthz

frontend openshift-api-server
    bind :6443
    default_backend openshift-api-server
    mode tcp
    option tcplog

backend openshift-api-server
    balance roundrobin
    mode tcp
    option httpchk GET /healthz
    http-check expect string ok
    default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
    server bootstrap 10.226.45.223:6443 check check-ssl verify none #安装结束后删掉此行
    server master1 10.226.45.251:6443 check check-ssl verify none
    server master2 10.226.45.252:6443 check check-ssl verify none
    server master3 10.226.45.222:6443 check check-ssl verify none

frontend machine-config-server
    bind :22623
    default_backend machine-config-server
    mode tcp
    option tcplog

backend machine-config-server
    balance roundrobin
    mode tcp
    server bootstrap 10.226.45.223:22623 check #安装结束后删掉此行
    server master1 10.226.45.251:22623 check
    server master2 10.226.45.252:22623 check
    server master3 10.226.45.222:22623 check

frontend ingress-http
    bind :80
    default_backend ingress-http
    mode tcp
    option tcplog

backend ingress-http
    balance roundrobin
    mode tcp
    server master1 10.226.45.251:80 check
    server master2 10.226.45.252:80 check
    server master3 10.226.45.222:80 check

frontend ingress-https
    bind :443
    default_backend ingress-https
    mode tcp
    option tcplog

backend ingress-https
    balance roundrobin
    mode tcp
    server master1 10.226.45.251:443 check
    server master2 10.226.45.252:443 check
    server master3 10.226.45.222:443 check
EOF
```

启动

```shell
cd /data/haproxy
docker-compose up -d
```

