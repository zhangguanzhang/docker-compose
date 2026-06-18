
## about

登陆方式：

```shell
psql -U <pg_user> -p 5432 -d <db_name> -W
# or
docker exec -ti postgresql bash
PGPASSWORD=$POSTGRES_PASSWORD psql -U <pg_user> -p 5432 -d <db_name>
```
