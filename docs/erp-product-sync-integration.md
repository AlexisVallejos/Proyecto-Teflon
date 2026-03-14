# Integracion ERP / Sistema de Gestion con Ecommerce

## Objetivo

Integrar un sistema de gestion externo con el ecommerce para sincronizar productos, stock y precios mediante API.

El sistema de gestion actua como cliente de la API del ecommerce:

1. Lee productos desde su propia base de datos.
2. Arma un payload JSON.
3. Hace `POST` al endpoint de sincronizacion.
4. El ecommerce crea o actualiza productos en `product_cache`.

## Endpoint

`POST /api/v1/integrations/products/sync`

Ejemplo local:

`http://localhost:4000/api/v1/integrations/products/sync`

Endpoint de prueba de conexion:

`GET /api/v1/integrations/ping`

## Autenticacion

Headers requeridos:

```http
x-api-key: TU_TOKEN
x-tenant-id: TU_TENANT_UUID
Content-Type: application/json
```

Tambien se acepta:

```http
Authorization: Bearer TU_TOKEN
```

El token debe tener scope:

`products:sync`

## Datos de acceso de este tenant

- `tenant_id`: `636736e2-e135-44cd-ac5c-5d4ccb839a73`
- `token`: `erp-sync-local-001`

## Prueba de conexion

Antes de sincronizar productos, el sistema de gestion deberia probar:

`GET /api/v1/integrations/ping`

Ejemplo de respuesta:

```json
{
  "ok": true,
  "tenant_id": "636736e2-e135-44cd-ac5c-5d4ccb839a73",
  "token_name": "ERP Sync Local",
  "scope": "products:sync",
  "server_time": "2026-03-13T18:00:00.000Z"
}
```

## Formato del request

```json
{
  "source_system": "sistema-gestion-av",
  "items": [
    {
      "external_id": "PROD-1001",
      "sku": "PROD-1001",
      "name": "Notebook Lenovo 15",
      "price_retail": 1250000,
      "price_wholesale": 1170000,
      "stock": 6,
      "is_active": true,
      "brand": "Lenovo",
      "description": "Notebook 15 pulgadas",
      "images": [
        "https://sistema.local/media/prod-1001.jpg"
      ]
    }
  ]
}
```

## Campos soportados por item

Campos recomendados:

- `external_id`: identificador unico y estable del sistema de gestion. Obligatorio.
- `sku`: codigo comercial del producto.
- `name`: nombre del producto.
- `price_retail`: precio minorista.
- `price_wholesale`: precio mayorista.
- `stock`: stock disponible.
- `is_active`: estado base en el sistema de gestion.
- `brand`: marca.
- `description`: descripcion base.
- `images`: array de URLs o imagenes.

Importante:

- `stock` viaja dentro del mismo item de producto.
- No hace falta una URL o endpoint separado para stock si el sistema ya arma el JSON de productos.

## Reglas de negocio

- `external_id` debe ser unico por tenant y no debe cambiar con el tiempo.
- Si el producto no existe, se crea.
- Si ya existe por `external_id`, se actualiza.
- No se hace borrado fisico desde la integracion.
- Si `is_active = false`, el producto queda inactivo a nivel origen.
- El admin del ecommerce mantiene control sobre visibilidad final y bloqueo manual.

## Que controla el sistema de gestion

El sistema de gestion es fuente de verdad para:

- stock
- precio base
- estado base del producto
- codigo externo

## Que controla el ecommerce

El admin del ecommerce mantiene control sobre:

- `Visible en web`
- contenido editorial/manual
- `Bloquear sync admin`

Eso significa:

- si el admin oculta un producto, el sync no lo vuelve a publicar automaticamente
- si el admin activa `admin_locked`, el sync no debe pisar contenido editorial/manual

## Mapeo sugerido desde la base del sistema de gestion

Ejemplo de mapeo:

| Base sistema de gestion | Campo API ecommerce |
| --- | --- |
| `codigo_producto` | `external_id` |
| `codigo_producto` | `sku` |
| `nombre` | `name` |
| `precio_venta` | `price_retail` |
| `precio_mayorista` | `price_wholesale` |
| `stock_actual` | `stock` |
| `activo` | `is_active` |
| `marca` | `brand` |
| `descripcion` | `description` |
| `imagen_url` | `images[0]` |

## Respuesta esperada

Creacion:

```json
{
  "ok": true,
  "tenant_id": "636736e2-e135-44cd-ac5c-5d4ccb839a73",
  "source_system": "sistema-gestion-av",
  "total": 1,
  "created": 1,
  "updated": 0
}
```

Actualizacion:

```json
{
  "ok": true,
  "tenant_id": "636736e2-e135-44cd-ac5c-5d4ccb839a73",
  "source_system": "sistema-gestion-av",
  "total": 1,
  "created": 0,
  "updated": 1
}
```

## Errores comunes

`401 api_key_required`
- falta token

`403 invalid_api_key`
- token invalido

`403 tenant_mismatch`
- el `tenant_id` enviado no coincide con el token

`400 products_array_required`
- el body no contiene `items` o `products`

`400 invalid_products_payload`
- falta `external_id` o hay items invalidos

## Recomendacion de implementacion en el sistema de gestion

Agregar un modulo o pantalla interna con:

- URL API ecommerce
- Token
- Tenant UUID
- Source system
- Boton `Probar conexion`
- Boton `Sincronizar ahora`
- Log de resultado

## Ejemplo de implementacion en JavaScript

```js
async function syncProducts(products) {
  const response = await fetch("http://localhost:4000/api/v1/integrations/products/sync", {
    method: "POST",
    headers: {
      "x-api-key": "erp-sync-local-001",
      "x-tenant-id": "636736e2-e135-44cd-ac5c-5d4ccb839a73",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_system: "sistema-gestion-av",
      items: products
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "sync_failed");
  }
  return data;
}
```

## Ejemplo de consulta SQL del lado del sistema de gestion

Ejemplo conceptual:

```sql
select
  codigo_producto as external_id,
  codigo_producto as sku,
  nombre as name,
  precio_venta as price_retail,
  precio_mayorista as price_wholesale,
  stock_actual as stock,
  activo as is_active,
  marca as brand,
  descripcion as description,
  imagen_url
from productos
where eliminado = 0;
```

Luego cada fila debe transformarse a este formato:

```json
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
```

## Recomendaciones tecnicas

- No escribir directamente en la base del ecommerce.
- No usar `name` como identificador.
- No cambiar `external_id` para el mismo producto.
- Preferir sync por lotes.
- Si hay imagenes, enviar URLs publicas o accesibles por el ecommerce.

## Texto corto para pasar al proveedor del sistema de gestion

Necesitamos que el sistema de gestion lea productos desde su propia base de datos y los envie por API al ecommerce. El endpoint es `POST /api/v1/integrations/products/sync`. Deben enviar `x-api-key`, `x-tenant-id` y un JSON con `source_system` + `items`. Cada item debe incluir como minimo `external_id`, `sku`, `name`, `price_retail`, `stock` e `is_active`. El `external_id` debe ser estable y unico, porque se usa para crear o actualizar productos. No deben escribir directamente en la base del ecommerce; toda la integracion debe hacerse por API.
