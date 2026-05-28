# Imagen Docker de la base de datos AV

Esta imagen crea MySQL con la base `AV` usando `init.sql`.

## Construir

Desde la raiz del proyecto:

```bash
docker build -t patracamiguel/av-db:5.0 ./database
```

## Probar localmente

```bash
docker rm -f av-db-test
docker run --name av-db-test -p 3308:3306 -d patracamiguel/av-db:5.0
```

Espera unos segundos y verifica:

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

Debe mostrar tablas como:

```text
cliente
material
servicio
inventario
global_values
empleado
pedido
pago
```

## Subir a Docker Hub

```bash
docker login
docker push patracamiguel/av-db:5.0
```

## Usar en Windows y Mac

El proyecto ya usa esta imagen en `docker-compose.yml`:

```yaml
mysql:
  image: patracamiguel/av-db:5.0
  container_name: av-db
  ports:
    - "3308:3306"
  restart: always
```

En Windows o Mac, desde la raiz del proyecto:

```bash
docker compose down -v
docker pull patracamiguel/av-db:5.0
docker compose up --build
```

`docker compose down -v` borra la base anterior para que MySQL cree `AV` desde el `init.sql` incluido en la imagen.

## Verificar la BD del proyecto

```bash
docker exec -it av-db mysql -uroot -p
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

## Cambiar version de la imagen

Cuando cambie `init.sql`, sube una nueva version:

```bash
docker build -t patracamiguel/av-db:5.1 ./database
docker push patracamiguel/av-db:5.1
```

Luego cambia `docker-compose.yml`:

```yaml
mysql:
  image: patracamiguel/av-db:5.1
```

Y todos vuelven a levantar limpio:

```bash
docker compose down -v
docker pull patracamiguel/av-db:5.1
docker compose up --build
```
