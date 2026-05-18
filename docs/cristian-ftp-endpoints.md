# Endpoints FTP para Cristian

Base API:

```txt
https://editor.vase.ar
```

Base publica de imagenes:

```txt
https://uploads.vase.ar
```

## Credenciales necesarias

Desde el panel admin, entrar a:

```txt
Integraciones -> Product Sync
```

Copiar estos datos:

```txt
TENANT_ID
API_TOKEN
CONSUMER_KEY
CONSUMER_SECRET
```

Para Cristian hay dos formas de autenticarse. Usar solo una.

## Opcion A: headers con x-api-key

### 1. Probar conexion

```bash
curl -X GET "https://editor.vase.ar/api/v1/integrations/ping" \
  -H "x-api-key: API_TOKEN" \
  -H "x-tenant-id: TENANT_ID"
```

Respuesta esperada:

```json
{
  "ok": true,
  "tenant_id": "TENANT_ID",
  "scope": "products:sync"
}
```

### 2. Sincronizar imagenes desde FTP

```bash
curl -X POST "https://editor.vase.ar/api/v1/integrations/images/ftp/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: API_TOKEN" \
  -H "x-tenant-id: TENANT_ID" \
  -d '{
    "host": "FTP_HOST",
    "user": "FTP_USER",
    "password": "FTP_PASSWORD",
    "port": 21,
    "secure": false,
    "remote_dir": "/imagenes-productos",
    "options": {
      "dry_run": false,
      "replace_existing_images": false,
      "delete_remote_after_sync": false,
      "skip_admin_locked": true,
      "max_files": 300
    }
  }'
```

## Opcion B: compatibilidad consumer key / secret

Usar esta opcion si el sistema de Cristian no permite headers custom y trabaja con Consumer Key y Consumer Secret.

### 1. Probar conexion

```bash
curl -X GET "https://editor.vase.ar/api/v1/integrations/gestion/ping?consumer_key=CONSUMER_KEY&consumer_secret=CONSUMER_SECRET"
```

### 2. Sincronizar imagenes desde FTP

```bash
curl -X POST "https://editor.vase.ar/api/v1/integrations/gestion/imagenes/ftp" \
  -H "Content-Type: application/json" \
  -d '{
    "consumer_key": "CONSUMER_KEY",
    "consumer_secret": "CONSUMER_SECRET",
    "host": "FTP_HOST",
    "user": "FTP_USER",
    "password": "FTP_PASSWORD",
    "port": 21,
    "secure": false,
    "remote_dir": "/imagenes-productos",
    "options": {
      "dry_run": false,
      "replace_existing_images": false,
      "delete_remote_after_sync": false,
      "skip_admin_locked": true,
      "max_files": 300
    }
  }'
```

## Reglas de nombres de archivo

El sistema busca el producto por codigo usando:

```txt
sku
erp_id
external_id
```

Nombres recomendados:

```txt
SKU_1.jpg
SKU_2.jpg
SKU__principal.png
```

Ejemplos:

```txt
ABC-100_1.jpg
ABC-100_2.webp
789__principal.png
```

Si el archivo se llama:

```txt
ABC-100_1.jpg
```

el sistema busca un producto con:

```txt
sku = ABC-100
```

## Resultado esperado

Cuando termina bien, el backend:

1. Se conecta al FTP.
2. Descarga las imagenes a:

```txt
/app/server/uploads/products
```

3. Guarda en el producto una URL publica como:

```txt
https://uploads.vase.ar/uploads/products/archivo.jpg
```

Ejemplo de respuesta:

```json
{
  "ok": true,
  "tenant_id": "TENANT_ID",
  "downloaded_files": 10,
  "updated_products": 8,
  "failed": 0,
  "skipped": {
    "no_code": 0,
    "no_product": 2,
    "ambiguous_code": 0,
    "admin_locked": 0,
    "not_image": 0
  }
}
```

## Prueba sin modificar datos

Para probar conexion y matching sin guardar cambios, usar:

```json
"dry_run": true
```

Ejemplo:

```bash
curl -X POST "https://editor.vase.ar/api/v1/integrations/images/ftp/sync" \
  -H "Content-Type: application/json" \
  -H "x-api-key: API_TOKEN" \
  -H "x-tenant-id: TENANT_ID" \
  -d '{
    "host": "FTP_HOST",
    "user": "FTP_USER",
    "password": "FTP_PASSWORD",
    "remote_dir": "/imagenes-productos",
    "options": {
      "dry_run": true,
      "max_files": 20
    }
  }'
```

