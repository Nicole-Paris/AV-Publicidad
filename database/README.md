# Imagen Docker de la base de datos

Esta imagen crea MySQL con la base `AV` usando `init.sql`.

## Construir

Desde la raiz del proyecto:

```bash
docker build -t TU_USUARIO/av-db:5.0 ./database
```

Ejemplo:

```bash
docker build -t migue/av-db:5.0 ./database
```

## Probar localmente

Si ya existe un contenedor de prueba, borralo primero:

```bash
docker rm -f av-db-test
```

Luego ejecuta:

```bash
docker run --name av-db-test -p 3308:3306 -d TU_USUARIO/av-db:5.0
```

Verifica las tablas:

```bash
docker exec -it av-db-test mysql -uroot -p
```

Password:

```text
parde3
```

Dentro de MySQL:

```sql
USE AV;
SHOW TABLES;
```

## Subir a Docker Hub

```bash
docker login
docker push TU_USUARIO/av-db:5.0
```

## Usarla en docker-compose

En `docker-compose.yml`, cambia la imagen de MySQL:

```yaml
mysql:
  image: TU_USUARIO/av-db:5.0
  container_name: av-db
  ports:
    - "3308:3306"
  restart: always
```

Cuando cambies de imagen de BD, todos deben borrar el volumen anterior:

```bash
docker compose down -v
docker pull TU_USUARIO/av-db:5.0
docker compose up --build
```

`docker compose down -v` borra los datos actuales de MySQL.
