起来后需要等待数据库初始化完成

不然进首页会报错

环境变量参考下面
https://www.zabbix.com/documentation/3.4/zh/manual/installation/containers

把默认的那个zabbix server属性的ip设置为dns,域名设置成agent的网络里的别名update后就能看到了
