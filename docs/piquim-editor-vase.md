# Piquim en editor.vase.ar

## Decision

`editor.vase.ar` sigue siendo el panel/editor de Vase. Piquim no reemplaza a Vase ni al motor multi-tenant: Piquim es un ecommerce personalizado montado sobre el tenant:

```text
636736e2-e135-44cd-ac5c-5d4ccb839a73
```

## URLs

- Admin/editor: `https://editor.vase.ar/admin/evolution`
- API e integraciones: `https://editor.vase.ar`
- Storefront Piquim: usa el mismo backend y el tenant de Piquim. Si se agrega dominio propio despues, debe apuntar al mismo servicio y resolver por `tenant_domains`.

## Variables clave

Backend:

```env
PUBLIC_API_URL=https://editor.vase.ar
INTEGRATIONS_PUBLIC_BASE_URL=https://editor.vase.ar
PUBLIC_ADMIN_URL=https://editor.vase.ar/admin/evolution
PIQUIM_TENANT_ID=636736e2-e135-44cd-ac5c-5d4ccb839a73
PLATFORM_CNAME_TARGET=editor.vase.ar
```

Frontend:

```env
VITE_API_URL=
VITE_EDITOR_HOST=editor.vase.ar
```

`VITE_API_URL` vacio significa same-origin en produccion. `VITE_TENANT_ID` debe quedar vacio en el deploy central multi-cliente; Piquim se resuelve por `tenant_domains` y por `PIQUIM_TENANT_ID` solo para sus reglas especiales.

## Reglas Piquim

- Categorias raiz publicas: `Heladeria` y `Panaderia/Confiteria`.
- `Confiteria` no existe como raiz separada.
- En integraciones, Piquim no pide imagenes al sistema de gestion; las imagenes se cargan desde el panel y se preservan por SKU.
- Si el sistema de gestion envia categorias de heladeria y panaderia para el mismo producto, se publica en ambas raices.
