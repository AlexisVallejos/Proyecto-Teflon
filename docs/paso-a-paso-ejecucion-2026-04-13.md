# Paso a paso de ejecucion (13-04-2026)

## Objetivo

Tener una guia unica, ordenada y ejecutable para no perder instrucciones entre mensajes, audios y cambios tecnicos.

## Orden recomendado de trabajo

1. Cerrar Integracion ERP (backend)
2. Publicar cambios y validar con proveedor
3. Agregar legal (terminos, privacidad, QR ARCA)
4. Implementar doble dominio con checkout canonico
5. Evaluar y planificar refactor de precios `price_1..price_5`

---

## 1) Integracion ERP

### 1.1 Deploy backend con ajustes ya implementados

1. Ir a `Render > proyecto-teflon`.
2. Hacer `Manual Deploy > Deploy latest commit`.
3. Confirmar que `/health` responda `{"ok":true}`.

### 1.2 Validacion tecnica minima

1. Probar `GET /api/v1/integrations/ping`.
2. Enviar un lote de 3 items mixto con `POST /api/v1/integrations/products/sync`:
3. Verificar respuesta por item en `item_results`.
4. Confirmar estos casos:
5. `create` nuevo => `status: created` + `product_id`
6. `update` existente parcial => `status: updated`
7. `update` inexistente => `error: product_not_found`

### 1.3 Validacion funcional pedida por gestion

1. Enviar un item sin `brand` y sin `description`.
2. Confirmar que no falle por campos faltantes.
3. Enviar un item con `category: "Ninguno"`.
4. Confirmar que se asigne categoria `Sin definir`.
5. Enviar `short_description`.
6. Confirmar que se vea en catalogo/destacados.
7. Enviar `gran_familia`/`category_path`.
8. Confirmar creacion/uso de jerarquia.

### 1.4 Mensaje de cierre a proveedor

1. Compartir doc:
2. `docs/documento-para-proveedor-sistema-gestion.md`
3. Aclarar que el parseo de errores ahora es legible (`invalid_value_format` en vez de `22P02`).

---

## 2) Publicacion y verificacion cruzada

### 2.1 Backend (Render)

1. Confirmar variables de produccion.
2. Confirmar que no haya `localhost` en URLs publicas.
3. Verificar logs del sync durante pruebas de Darian.

### 2.2 Frontend (Vercel)

1. Redeploy del proyecto web.
2. Validar storefront en:
3. `/catalog`
4. `/product/:id`
5. `short_description` visible cuando exista.

---

## 3) Legal: terminos, privacidad y QR ARCA

### 3.1 Alcance funcional

1. Crear seccion legal publica:
2. `/terminos`
3. `/privacidad`
4. Agregar bloque editable para QR ARCA en admin.
5. Mostrar QR en footer/legal del storefront.

### 3.2 Implementacion

1. Crear/usar paginas en `pages/page_sections` para legal.
2. Agregar editor en admin para:
3. titulo legal
4. texto legal
5. imagen QR
6. link de validacion opcional
7. Renderizar en storefront.

### 3.3 QA

1. Verificar que cada tenant pueda subir su QR.
2. Verificar que QR se vea en mobile y desktop.
3. Verificar que links legales esten accesibles desde footer.

---

## 4) Doble dominio con checkout canonico

### 4.1 Definicion funcional

1. Dominio A: mayorista.
2. Dominio B: minorista.
3. Checkout canonico: dominio B.
4. Desde dominio A, al finalizar compra, redirigir a carrito/checkout de B.

### 4.2 Implementacion recomendada (fase 1)

1. Mantener catalogo/visual por dominio.
2. Crear mecanismo de `handoff` de carrito:
3. generar token de carrito temporal en backend
4. redirigir a dominio canonico con token
5. en dominio canonico, reconstruir carrito desde token
6. continuar checkout normal

### 4.3 QA

1. Agregar productos en dominio A.
2. Ir a checkout.
3. Confirmar redireccion a dominio B.
4. Confirmar carrito intacto en dominio B.

---

## 5) Precios `price_1..price_5` (proyecto separado)

### 5.1 No mezclar con fixes rapidos

1. Tratar esto como refactor de modelo de precios.
2. Requiere diseno tecnico previo.

### 5.2 Diseno minimo

1. Agregar estructura de slots por producto (`price_1..price_5` o `price_slots`).
2. Permitir labels configurables por tenant.
3. Adaptar integracion ERP para recibir slots.
4. Definir como storefront elige el slot activo.
5. Adaptar carrito/checkout/pedidos para persistir precio seleccionado.

### 5.3 Entrega por fases

1. Fase A: backend + integracion + admin labels
2. Fase B: storefront + checkout + pedidos
3. Fase C: migracion de datos y convivencia con `price` / `price_wholesale`

---

## Checklist operativo rapido

1. Deploy backend en Render.
2. Probar lote ERP de 3 items con respuesta por item.
3. Confirmar con Darian el cierre del punto ERP.
4. Ejecutar bloque legal (terminos/privacidad/QR).
5. Ejecutar doble dominio con checkout canonico.
6. Abrir ticket/proyecto separado para `price_1..price_5`.

---

## Estado de referencia

Documento de relevamiento previo:

- `docs/relevamiento-audios-2026-04-10.md`

