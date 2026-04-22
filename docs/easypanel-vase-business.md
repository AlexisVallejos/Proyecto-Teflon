# Vase Business en EasyPanel

Esta guia deja claro que este repo ya puede desplegarse como un solo servicio web en EasyPanel, pero no esta migrado todavia a MySQL ni a auth compartida real con `vase-app`.

## Lo que ya quedo adaptado en este repo

- Hay `Dockerfile` raiz para que EasyPanel construya un solo contenedor desde este repo.
- El backend Express ahora sirve el build del frontend y puede correr como un unico servicio `vase-business`.
- El frontend usa mismo origen por defecto, asi que no hace falta separar `web` y `server` en V1.
- La API de admin general se movio de `/admin` a `/api/platform/admin` para no chocar con la SPA del editor.
- En `editor.vase.ar`, entrar a `/` redirige al panel en `/admin/evolution`.
- Login y registro del frontend ya se pueden delegar por configuracion a `vase.ar`, pero eso no reemplaza todavia una integracion real de sesion.

## Limites actuales que no hay que esconder

- El backend sigue usando PostgreSQL (`pg`, schema SQL y queries Postgres). No esta listo para conectarse a `vase-db` MySQL.
- Si hoy apuntas este servicio a `vase-db`, el deploy puede levantar, pero las rutas que pegan a la DB van a fallar.
- Auth compartida completa con `vase-app` todavia no existe en backend. El frontend ya puede redirigir a `vase.ar`, pero `vase-business` aun no consume una sesion emitida por `vase-app`.
- El servicio guarda uploads en disco local (`/app/server/uploads`), asi que en EasyPanel necesitas un mount persistente y una sola replica por ahora.

## Decision operativa recomendada

Hay dos caminos y no conviene mezclarlos:

1. Validacion tecnica de `vase-business` en EasyPanel ahora:
   usar este repo como servicio unico, con dominio `editor.vase.ar`, y si necesitas probarlo end to end hacerlo contra una base PostgreSQL temporal.
2. Paso a arquitectura Vase final:
   primero portar base de datos a MySQL y definir el bridge de auth con `vase-app`; despues recien conectar este servicio a `vase-db` y activar auth externa obligatoria.

Si tu objetivo inmediato es dejar `vase-business` desplegado y verificable en EasyPanel, hace el camino 1.

## Paso a paso detallado en EasyPanel

### 1. Preparar DNS antes del deploy

1. Asegura que `editor.vase.ar` apunte a la IP del servidor donde corre EasyPanel.
2. Si despues vas a usar storefronts `*.vase.ar`, crea tambien el wildcard DNS correspondiente.
3. Si quieres TLS automatico para wildcard, configura antes el resolver DNS challenge de Traefik segun la guia oficial de EasyPanel:
   - App Service: https://easypanel.io/docs/services/app
   - Wildcard domain: https://easypanel.io/docs/guides/wildcard-domain

Nota: la guia oficial de wildcard indica que para cubrir dominio raiz y wildcard debes crear dos dominios separados y que primero hay que crear un certificate resolver en Traefik.

### 2. Crear el servicio `vase-business`

1. Entra al proyecto `vase` en EasyPanel.
2. Crea un servicio nuevo de tipo `App Service`.
3. Nombre del servicio: `vase-business`.
4. Fuente: repositorio GitHub de `Proyecto-Teflon`.
5. Branch: la branch que vayas a usar para deploy.

EasyPanel detecta automaticamente el `Dockerfile` del repo y lo usa para construir la imagen. Eso esta documentado en la doc oficial de App Service.

### 3. Configurar build y runtime

No cambies el comando de inicio salvo que tengas una necesidad puntual. El `Dockerfile` nuevo ya:

- construye `web/`
- instala dependencias de `server/`
- copia `web/dist`
- arranca `node src/index.js`

Configuracion recomendada del servicio:

- Replicas: `1`
- Proxy port / Target port: `3000`
- Published ports: ninguno
- Auto deploy: opcional, solo despues de validar el primer deploy

### 4. Crear el mount persistente para uploads

Este paso es obligatorio si no quieres perder imagenes y comprobantes al reiniciar el contenedor.

Agrega un mount tipo `Volume`:

- Name: `uploads`
- Mount path: `/app/server/uploads`

No subas replicas mientras los uploads sigan siendo disco local compartido del contenedor.

### 5. Cargar variables de entorno

#### Opcion A: despliegue tecnico hoy, sin auth compartida real

Usa esta opcion si quieres levantar `vase-business` ahora mismo y probarlo con auth local del repo.

```env
NODE_ENV=production
PORT=3000
DISABLE_AUTH=false
JWT_SECRET=CAMBIAR_ESTE_SECRETO
BOOTSTRAP_TOKEN=CAMBIAR_ESTE_TOKEN
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:5432/DBNAME
VITE_EDITOR_HOST=editor.vase.ar
```

Puntos importantes:

- `VITE_API_URL` no hace falta en produccion; el frontend ya usa mismo origen por defecto.
- `CORS_ORIGIN` puedes dejarlo vacio mientras frontend y backend vivan en el mismo host.
- Esta opcion requiere una base PostgreSQL funcional. Si no tienes una, crea una temporal solo para validar este servicio.

#### Opcion B: dejar el frontend apuntando a auth de `vase-app`

Usa esto solo cuando `vase-app` ya pueda devolverte una sesion/token que `vase-business` entienda.

```env
NODE_ENV=production
PORT=3000
DISABLE_AUTH=false
JWT_SECRET=CAMBIAR_ESTE_SECRETO
BOOTSTRAP_TOKEN=CAMBIAR_ESTE_TOKEN
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:5432/DBNAME
VITE_EDITOR_HOST=editor.vase.ar
VITE_EXTERNAL_AUTH=true
VITE_VASE_APP_URL=https://vase.ar
VITE_VASE_APP_LOGIN_URL=https://vase.ar/login
VITE_VASE_APP_SIGNUP_URL=https://vase.ar/register
VITE_VASE_APP_REDIRECT_PARAM=redirect
VITE_VASE_APP_REDIRECT_URL=https://editor.vase.ar/admin/evolution
```

Importante:

- Estas variables solo cambian el frontend de login/registro para enviar al usuario a `vase.ar`.
- No resuelven por si solas el intercambio de sesion con `vase-business`.

### 6. Base de datos: que hacer hoy y que no hacer

Hoy este repo no puede usar `vase-db` MySQL como base operativa.

Haz esto:

- Si quieres validar deploy, usa una PostgreSQL temporal para `vase-business`.
- Si tu objetivo es produccion real alineada a Vase, frena aca y porta primero el backend a MySQL.

No hagas esto:

- No apuntes este repo directo a `vase-db` esperando que funcione.
- No mezcles en la misma base MySQL tablas de `vase-app` con este backend Postgres-like sin un rediseo previo.

### 7. Agregar dominios al servicio

Primero agrega:

- `editor.vase.ar`

Marcala como primary domain del servicio.

Despues, cuando tengas resuelto wildcard y hostname routing:

- `*.vase.ar`

Si usas wildcard, en EasyPanel debes agregarlo como un dominio separado con la opcion de wildcard habilitada y el resolver configurado en Traefik.

### 8. Primer deploy

1. Guarda configuracion y ejecuta el deploy.
2. Abre logs del servicio.
3. Verifica que el contenedor termine en estado healthy y sin errores de build.
4. Si falla por DB, el problema no es EasyPanel: el backend necesita una PostgreSQL operativa o una migracion real a MySQL.

### 9. Verificacion post deploy

Haz estas pruebas en este orden:

1. `https://editor.vase.ar/health`
   - Debe responder `{"ok":true}`.
2. `https://editor.vase.ar/`
   - Debe abrir el frontend y redirigir a `/admin/evolution`.
3. `https://editor.vase.ar/admin/evolution`
   - Debe cargar la SPA del editor.
4. Login:
   - si dejaste auth local, prueba con el usuario admin del entorno que corresponda a esa base.
   - si activaste auth externa, `/login` y `/signup` deben mandar a `vase.ar`.
5. Uploads:
   - sube una imagen, reinicia el servicio y confirma que el archivo siga existiendo.

### 10. Activar storefront por hostname despues

Cuando ya tengas tenant, dominio y datos consistentes:

1. agrega el dominio o subdominio al tenant en la tabla/logica de `tenant_domains`
2. agrega el wildcard `*.vase.ar` al servicio
3. verifica que al entrar por `cliente.vase.ar` el backend resuelva el tenant por `hostname`

El backend ya tiene base para resolver storefront por hostname, pero eso depende de datos correctos en DB y de que el dominio llegue al mismo servicio.

## Que haria yo como camino V1

Orden recomendado:

1. Desplegar `vase-business` como servicio unico en EasyPanel con `editor.vase.ar`.
2. Validarlo tecnicamente con Postgres temporal si hace falta.
3. No conectar todavia a `vase-db`.
4. Portar modelo y queries criticas a MySQL.
5. Definir el bridge de auth con `vase-app`.
6. Recien ahi activar `VITE_EXTERNAL_AUTH` en serio y sumar `*.vase.ar`.

Ese camino evita dos errores que ya aparecieron:

- creer que este repo ya era el repo principal de Vase
- creer que porque existe `vase-db` MySQL este backend ya puede usarlo
