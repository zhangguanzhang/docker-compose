## about

```shell
mkdir -p rocketmq_data
chown -R 3000:3000 rocketmq_data
docker compose up -d
```

## 查询

需要配置 `/home/rocketmq/rocketmq-5.5.0/conf/tools.yml`，更多子命令见 [rocketmq/tools/command](https://github.com/apache/rocketmq/tree/develop/tools/src/main/java/org/apache/rocketmq/tools/command)

```shell
docker exec -ti rmqproxy bash
sh mqadmin clusterList  -n rmqnamesrv:9876

sh mqadmin listUser -n rmqnamesrv:9876 -c DefaultCluster
#UserName         #Password               #UserType               #UserStatus           
rocketmq2         12345678                Super                   enable                
get user from 172.18.0.3:10911 success.
```

## 授权

建议阅读 [访问控制2.0](https://rocketmq.apache.org/zh/docs/bestPractice/06access/)

```shell
# 创建 Super/Normal 的用户
sh mqadmin createUser -n rmqnamesrv:9876 -c DefaultCluster -u user1 -p password1 -t Normal
sh mqadmin createAcl -n rmqnamesrv:9876 -c DefaultCluster \
  -s User:user1 \
  -r Topic:TestTopic \
  -a Pub \
  -d Allow
```
