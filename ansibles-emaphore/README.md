## usage

```shell
mkdir -p data/{mysql,semaphore-conf}
docker-compose up -d

# 第一次需要设置下数据库信息，后续可以直接在 data/semaphore-conf 下放配置文件即可启动
docker run --rm -ti -u root   --net container:semaphore_semaphore-mysql_1 \
     -v $PWD/data/semaphore-conf/:/home/semaphore  \
      ansiblesemaphore/semaphore:v2.6.7 semaphore -setup

 > DB Hostname (default 127.0.0.1:3306): mysql:3306
  > DB User (default root): 
WARN[0005] An input error occured:unexpected newline    
 > DB Password: semaphore
...
```

最开始没配置文件，所以它会启动失败，上面已经生成配置文件了，这里需要启动下它
```
docker start semaphore_semaphore_1
```
