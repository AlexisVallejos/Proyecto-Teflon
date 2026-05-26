# Variables de produccion para editor.vase.ar

Usar estas variables si el servicio unico central vive en `editor.vase.ar` y los clientes se resuelven por tenant/dominio.

## Email / verificacion

```env
EMAIL_COMPANY_NAME=Vase
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alexisvallejos803@gmail.com
SMTP_FROM=Vase <alexisvallejos803@gmail.com>
EMAIL_VERIFICATION_TTL_MINUTES=15
EMAIL_VERIFICATION_MAX_ATTEMPTS=5
```

## Editor, API e integraciones

```env
CORS_ORIGIN=https://editor.vase.ar,https://vase.ar,https://*.vase.ar
PUBLIC_ADMIN_URL=https://editor.vase.ar/admin/evolution
PUBLIC_API_URL=https://editor.vase.ar
INTEGRATIONS_PUBLIC_BASE_URL=https://editor.vase.ar
PIQUIM_TENANT_ID=636736e2-e135-44cd-ac5c-5d4ccb839a73
PLATFORM_BASE_DOMAIN=vase.ar
PLATFORM_CNAME_TARGET=editor.vase.ar
AUTO_PROVISION_CUSTOM_DOMAINS=true
PLATFORM_APEX_IP=76.13.231.188
CLOUDFLARE_API_TOKEN=token_con_permiso_dns_edit
VERCEL_PROJECT_ID=tu_project_id
VERCEL_TEAM_ID=tu_team_id_opcional
DISABLE_AUTH=false
```

## Frontend build args

```env
VITE_API_URL=
VITE_EDITOR_HOST=editor.vase.ar
VITE_EXTERNAL_AUTH=true
VITE_VASE_APP_URL=https://vase.ar
VITE_VASE_APP_LAUNCH_URL=https://vase.ar/app/business/launch
VITE_VASE_APP_LOGIN_URL=https://vase.ar/signin
VITE_VASE_APP_SIGNUP_URL=https://vase.ar/register
```

Notas:

- `VITE_API_URL` debe quedar vacio en el deploy central para que cada storefront use su propio host (`piquim.vase.ar`, `teflon.vase.ar`, dominios propios) y el backend resuelva el tenant por dominio.
- `VITE_TENANT_ID` no debe configurarse en produccion central multi-cliente.
- `VITE_EDITOR_HOST` hace que `/` en `editor.vase.ar` redirija al admin.

## Secretos

Estos no deben hardcodearse en el repo. Cargarlos manualmente en Render:

```env
SMTP_PASS=usar_el_mismo_valor_actual_que_ya_tenes_en_server_env_local
JWT_SECRET=rotar_y_cargar_un_valor_nuevo
BOOTSTRAP_TOKEN=rotar_y_cargar_un_valor_nuevo
MP_ACCESS_TOKEN=rotar_y_cargar_un_valor_nuevo_si_sigue_vigente
DATABASE_URL=usar_la_url_productiva_actual
VERCEL_API_TOKEN=token_con_permiso_domains_write
```

## Importante

- `SMTP_PASS` no va en Vercel
- `SMTP_PASS` no debe subirse al repo
- el envio de codigo sale desde el backend productivo
- si en Render falta SMTP, el frontend no puede mandar ningun gmail aunque Vercel funcione bien

## Checklist

1. cargar estas variables en Render
2. guardar
3. redeploy del backend
4. crear una cuenta nueva desde Vercel
5. revisar logs de Render si el correo no llega
