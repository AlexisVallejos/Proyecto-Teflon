# Bridge de Auth Vase -> Vase Business

Este repo ya soporta acceso al editor usando el mismo usuario autenticado en `vase-app`.

## Flujo real

1. El usuario inicia sesion en `vase-app`.
2. Entra a `https://vase.ar/app/business/launch`.
3. `vase-app` firma un token corto HS256 con usuario, tenant y rol.
4. Redirige a `https://editor.vase.ar/admin/evolution?vase_token=...`.
5. `vase-business` llama a `/auth/exchange-vase`.
6. El backend valida la firma, crea o reutiliza shadow records locales y emite su JWT interno.
7. El editor sigue funcionando con su auth actual, pero la identidad fuente viene de `vase-app`.

## Variables necesarias en `vase-business`

En `server`:

```env
DATABASE_URL=postgres://postgres:TU_PASSWORD@vase_vase-business-pg:5432/vase?sslmode=disable
JWT_SECRET=TU_JWT_INTERNO
BOOTSTRAP_TOKEN=TU_BOOTSTRAP_TOKEN
VASE_BUSINESS_SSO_SECRET=vase091218
VASE_BUSINESS_SSO_ISSUER=vase-app
VASE_BUSINESS_SSO_AUDIENCE=vase-business
```

En `web` o Build Args:

```env
VITE_EDITOR_HOST=editor.vase.ar
VITE_EXTERNAL_AUTH=true
VITE_VASE_APP_URL=https://vase.ar
VITE_VASE_APP_LAUNCH_URL=https://vase.ar/app/business/launch
VITE_VASE_APP_LOGIN_URL=https://vase.ar/signin
VITE_VASE_APP_SIGNUP_URL=https://vase.ar/register
```

## Qué crea localmente el exchange

El exchange no intenta reutilizar el schema de `vase-app` directamente. En cambio:

- vincula `users.external_source = 'vase'`
- vincula `users.external_user_id`
- vincula `tenants.external_source = 'vase'`
- vincula `tenants.external_tenant_id`
- vincula `tenants.external_tenant_slug`
- asegura `tenant_settings`
- asegura `user_tenants`

Eso permite mantener el editor actual sin reescribir todo el backend.

## Prueba end-to-end

1. Configura el mismo `VASE_BUSINESS_SSO_SECRET=vase091218` en `vase-app` y `vase-business`.
2. Despliega `vase-app`.
3. Despliega `vase-business`.
4. Inicia sesion en `https://vase.ar/signin`.
5. Abre `https://vase.ar/app/business/launch`.
6. Verifica que termines en `https://editor.vase.ar/admin/evolution`.
7. Verifica que exista `teflon_token` en `localStorage`.
8. Verifica que `/api/me` responda el usuario shadow con `tenant_id`.

## Errores esperables

- `business_sso_secret_missing`
  El secreto no esta configurado en `vase-app`.

- `sso_secret_not_configured`
  El secreto no esta configurado en `vase-business`.

- `invalid_launch_token`
  El token fue firmado con otro secreto o llego corrupto.

- `launch_token_expired`
  El token corto ya vencio. Vuelve a lanzar desde `vase.ar`.

- `membership_forbidden`
  El usuario no tiene rol `OWNER` ni `MANAGER` en el tenant de `vase-app`.
