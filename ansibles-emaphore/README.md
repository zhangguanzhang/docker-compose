## usage

```shell
mkdir -p data/{mysql,semaphore-conf}
docker run --rm -ti -u root   --net container:dcac50579776 -v $PWD/data/semaphore-conf/:/home/semaphore   ansiblesemaphore/semaphore:v2.6.7 sh -c 'echo "127.0.0.1 mysql" >> /etc/hosts;semaphore -setup'
```
