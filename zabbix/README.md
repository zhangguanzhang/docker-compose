起来后需要等待数据库初始化完成

不然进首页会报错

环境变量参考下面
https://www.zabbix.com/documentation/3.4/zh/manual/installation/containers

官方configure->hosts里默认自带一个127.0.0.1的agent,把默认这个属性的ip设置为dns,域名设置成agent的网络里的别名
然后update后enable一下就能看到了
