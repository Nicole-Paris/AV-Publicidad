FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=parde3
ENV MYSQL_DATABASE=AV

COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
