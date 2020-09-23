## deploy

容器 nginx 提供目录下载

```shell
cat> /data/install-nginx/conf.d/default.conf <<'EOF'
server {
    listen       80;
    server_name  localhost;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        autoindex    on;
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOF
```


