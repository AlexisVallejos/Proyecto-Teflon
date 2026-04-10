# Relevamiento de audios 2026-04-10

## Resumen ejecutivo

Los audios traen cuatro frentes distintos:

1. Integracion ERP
2. Dos dominios con un solo checkout
3. Legal: terminos, privacidad y QR ARCA
4. Generalizacion de precios a multiples slots

No tienen el mismo costo ni el mismo riesgo. Conviene separar cambios rapidos de refactor estructural.

## 1. Integracion ERP

### Pedido

- soportar `Gran Familia`
- permitir que `description`, `brand` y `category` no frenen la primera carga
- permitir `short_description`
- si no llega categoria en update, no recategorizar
- error por item legible, no codigos crudos como `22P02`

### Estado

Esto ya quedo cubierto en la API:

- `short_description` soportado
- `gran_familia`, `categoria_padre`, `category_path` soportados
- update parcial
- categoria faltante en create => `Sin definir`
- categoria faltante en update => conserva la actual
- `22P02` mapeado a `invalid_value_format`
- stock decimal normalizado antes de guardar

### Riesgo

Bajo. Ya esta implementado y solo requiere redeploy de backend.

## 2. Dos dominios con un solo checkout

### Pedido

- dominio mayorista con nombre/marca propia
- dominio minorista con nombre/marca propia
- ambos deben terminar en el carrito/checkout del minorista

### Implicancia tecnica real

Hoy el carrito vive en storage del navegador por dominio. Eso significa:

- `mayorista.com` y `minorista.com` no comparten carrito por defecto
- no alcanza con “agregar otro dominio”

### Opciones correctas

#### Opcion A. Checkout canonico en dominio minorista

- el dominio mayorista muestra catalogo y precios
- al tocar `Agregar al carrito` o `Ir al checkout`, redirige al dominio minorista
- se transfiere el carrito por URL firmada o por token de handoff guardado en backend

Ventaja:

- resuelve exactamente lo que pidieron

Costo:

- medio

#### Opcion B. Carrito centralizado en backend

- el carrito deja de vivir solo en localStorage
- ambos dominios leen/escriben el mismo carrito remoto

Ventaja:

- mas solido a largo plazo

Costo:

- alto

### Recomendacion

Implementar primero la opcion A.

## 3. Terminos, privacidad y QR ARCA

### Pedido

- terminos y condiciones
- politica de privacidad / seguridad
- espacio para QR ARCA cargable por cliente

### Implicancia tecnica

Esto es simple con la arquitectura actual porque ya existe el sistema de paginas publicas.

### Solucion recomendada

- agregar paginas publicas:
  - `/terminos`
  - `/privacidad`
- permitir editar contenido desde admin
- agregar en admin un campo para:
  - imagen QR ARCA
  - texto legal opcional
  - link de validacion si el cliente lo tiene
- mostrarlo en footer o en una seccion legal fija

### Riesgo

Bajo a medio.

## 4. Precios 1 a 5

### Pedido

Reemplazar el esquema `minorista / mayorista` por slots genericos:

- `price_1`
- `price_2`
- `price_3`
- `price_4`
- `price_5`

Y que cada tenant pueda renombrarlos:

- Minorista
- Mayorista
- Gremio
- Distribuidor
- Lista especial

### Implicancia tecnica real

Esto hoy toca varias capas:

- integracion ERP
- persistencia de productos
- pricing publico
- pricing de usuarios
- admin panel
- storefront
- pedidos y carrito

No es un cambio cosmetico. Es una refactorizacion del modelo de precios.

### Recomendacion

No mezclarlo con los cambios chicos.

Hacerlo como proyecto aparte, en dos etapas:

#### Etapa 1

- agregar `price_slots` al producto
- labels configurables por tenant
- integracion acepta `price_1..price_5`

#### Etapa 2

- storefront y checkout resuelven el slot correcto segun usuario, tenant o dominio

### Riesgo

Alto.

## Orden recomendado de implementacion

1. Redeploy de la integracion ERP ya corregida
2. Paginas legales + QR ARCA
3. Doble dominio con checkout canonico en dominio minorista
4. Refactor de precios a slots `price_1..price_5`

## Decision tecnica sugerida

Si hay que mostrar avance rapido en la reunion:

- llevar cerrado ERP
- mostrar mock o primer version de legal + QR
- definir funcionalmente el flujo de doble dominio

No conviene prometer `price_1..price_5` como cambio inmediato sin separar alcance y presupuesto.
