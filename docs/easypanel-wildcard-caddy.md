# EasyPanel + Caddy: Wildcard `*.vase.ar` automatico (Fase 1)

Esta guia deja `editor.vase.ar` y cualquier `<tenant>.vase.ar` entrando por el mismo backend, sin alta manual de cada subdominio en EasyPanel.

## 1) DNS base

Configura en tu proveedor DNS:

- `A editor.vase.ar -> 76.13.231.188`
- `A *.vase.ar -> 76.13.231.188`
- TTL: `300` durante pruebas

## 2) Preparar el servicio `vase-business` en EasyPanel

En el servicio App:

- replicas: `1`
- puerto interno: el que usa el backend (`PORT=3000` en este proyecto)
- volumen persistente: `/app/server/uploads`

Variables recomendadas:

```env
PORT=3000
PLATFORM_BASE_DOMAIN=vase.ar
PLATFORM_CNAME_TARGET=editor.vase.ar
PLATFORM_APEX_IP=76.13.231.188
```

Importante:

- no configurar `VERCEL_API_TOKEN` ni `VERCEL_PROJECT_ID` en esta fase
- el backend ya trata Vercel como `not_required` cuando esas variables faltan

## 3) Instalar Caddy en el host (root)

Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y caddy
```

## 4) Configurar Caddy como frontal en 80/443

Crear/editar `/etc/caddy/Caddyfile`:

```caddy
{
  email tu-email@dominio.com
}

editor.vase.ar, *.vase.ar {
  reverse_proxy 127.0.0.1:3000 {
    header_up Host {host}
    header_up X-Forwarded-Host {host}
    header_up X-Forwarded-Proto {scheme}
    header_up X-Real-IP {remote_host}
  }
}
```

Validar config:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

Aplicar:

```bash
sudo systemctl enable caddy
sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```

## 5) Evitar conflicto de puertos con EasyPanel

Caddy debe ser el unico proceso escuchando `80/443` publicos.

Revisar:

```bash
sudo ss -ltnp | grep -E ':80|:443'
```

Si EasyPanel/Traefik esta ocupando esos puertos:

- mover su exposicion publica a otro entrypoint, o
- dejar EasyPanel sin publicar 80/443 externamente

Objetivo: trafico publico -> Caddy -> `vase-business` interno.

## 6) Verificar que el backend resuelve tenant por host

Probar:

- `https://editor.vase.ar/health`
- `https://teflon.vase.ar`

Esperado:

- `health` responde `{ "ok": true }`
- `teflon.vase.ar` abre la tienda del tenant correcto

## 7) Alta de subdominios en la app (no en EasyPanel)

Para cada tenant, debe existir su dominio en `tenant_domains`:

- ejemplo: `teflon.vase.ar`
- ejemplo: `nuevo.vase.ar`

Se puede hacer desde el modal de dominios del admin (`/tenant/domains/platform` o `/tenant/domains/platform/ensure`).

## 8) Checklist final

1. DNS `editor.vase.ar` y `*.vase.ar` apuntan a `76.13.231.188`
2. Caddy activo en `80/443`
3. `vase-business` corriendo en `3000` interno
4. `editor.vase.ar` funciona
5. `<tenant>.vase.ar` funciona sin alta manual en EasyPanel
6. Uploads persisten luego de reinicio

## 9) Troubleshooting rapido

- Si aparece 404 con branding EasyPanel:
  - el request no esta entrando por Caddy o hay conflicto en 80/443
- Si `*.vase.ar` no resuelve tenant:
  - revisar `tenant_domains` y logs `Tenant resolution by host`
- Si TLS falla en wildcard:
  - revisar logs de Caddy: `sudo journalctl -u caddy -n 200 --no-pager`
