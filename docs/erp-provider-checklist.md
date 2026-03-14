# Checklist para pedirle al proveedor del sistema de gestion

## Objetivo

Pedirle al proveedor exactamente lo necesario para conectar su sistema con este ecommerce por API.

## Lo que tenes que pedirle

### 1. Integracion por API

Pedirle que la integracion se haga por API HTTP y no por acceso directo a la base del ecommerce.

Deben consumir:

- `GET /api/v1/integrations/ping`
- `POST /api/v1/integrations/products/sync`

### 2. Lectura desde su propia base de datos

Pedirle que el sistema de gestion lea productos desde su propia base.

Campos minimos que deben poder extraer:

- codigo unico del producto
- SKU
- nombre
- precio minorista
- precio mayorista si existe
- stock
- estado activo/inactivo
- marca
- descripcion
- imagen o URL de imagen si la tienen

### 3. Identificador estable

Pedirle un identificador que nunca cambie para cada producto:

- `external_id`

Ese campo es obligatorio para crear o actualizar correctamente.

### 4. Pantalla o modulo interno

Pedirle que dentro del sistema de gestion agreguen un modulo con:

- URL API ecommerce
- token
- tenant UUID
- source system
- boton `Probar conexion`
- boton `Sincronizar productos`
- log de respuesta y errores

### 5. Modo de ejecucion

Pedirle que te confirmen desde donde van a ejecutar la integracion:

- backend del sistema
- aplicacion de escritorio
- panel interno
- frontend web

Si fuera frontend web publico, no es recomendable exponer el token ahi.

### 6. Estrategia de sincronizacion

Pedirle que definan:

- sync manual con boton
- sync automatico cada X minutos
- sync total
- sync incremental solo de modificados

### 7. Payload esperado

Pedirle que te confirmen que pueden enviar este formato:

```json
{
  "source_system": "sistema-gestion-av",
  "items": [
    {
      "external_id": "PROD-1001",
      "sku": "PROD-1001",
      "name": "Producto",
      "price_retail": 1000,
      "price_wholesale": 900,
      "stock": 20,
      "is_active": true,
      "brand": "Marca",
      "description": "Descripcion",
      "images": [
        "https://..."
      ]
    }
  ]
}
```

Aclara tambien esto:

- el `stock` debe viajar dentro del mismo item del producto
- no hace falta una URL separada de stock si ya envian el JSON de productos

### 8. Headers obligatorios

Pedirle que puedan mandar:

```http
x-api-key: erp-sync-local-001
x-tenant-id: 636736e2-e135-44cd-ac5c-5d4ccb839a73
Content-Type: application/json
```

### 9. Prueba de conexion

Pedirle que antes del sync prueben:

`GET /api/v1/integrations/ping`

### 10. Manejo de errores y log

Pedirle que registren:

- fecha y hora de sync
- cantidad de productos enviados
- cantidad creados
- cantidad actualizados
- errores devueltos por la API

## Texto listo para copiar y enviar

Necesito que integren el sistema de gestion con mi ecommerce por API. La integracion debe leer productos desde su propia base de datos y consumir dos endpoints: `GET /api/v1/integrations/ping` para probar conexion y `POST /api/v1/integrations/products/sync` para sincronizar productos. No deben escribir directamente en la base del ecommerce. Cada producto debe enviarse con un identificador estable `external_id`, junto con `sku`, `name`, `price_retail`, `price_wholesale` si existe, `stock`, `is_active`, `brand`, `description` e `images` si tienen URLs. Tambien necesito que el sistema permita configurar `x-api-key`, `x-tenant-id` y `source_system`, y que guarde log de resultados y errores.
