docker-compose up -d
GF_SECURITY_ADMIN_PASSWORD=pass 环境变量设置 admin 的密码
起来后访问http://host-ip:3000

数据源按照下面配置,
![cmd-markdown-logo](https://raw.githubusercontent.com/zhangguanzhang/docker-compose/master/prometheus/prometheus.png)

然后创建一个 dashboard:
并里面添加 graph（为了简单，我用了 test dashboard 这个名字），在 graph 中添加一个 panel，我们用这个 panel 展示系统的 load 数据。编辑 panel 数据，选择 data source 为之前添加的 promethues，然后填写 query，系统 node 比较简单，一共是 node_load1、node_load5 和 node_load15，分别是系统最近一分钟、五分钟和十五分钟的 load 数值。输入完成后点击输入框之外，grafana 会自动更新上面的图表：
图片借用下别人的
![cmd-markdown-logo](https://ws1.sinaimg.cn/large/006tKfTcgy1fnhhktp3i4j313a0ut43t.jpg)
