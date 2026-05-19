# Sistema privado de uploads para Vase

Servicio independiente para `uploads.vase.ar`.

No usa FTP, SFTP ni usuarios Linux. Todo acceso depende del JWT emitido por la app principal de `vase.ar`.

## Arquitectura

```txt
vase.ar
-> login/auth backend
-> JWT compartido
-> uploads-service
-> Docker volume persistente
-> /data/uploads/{username}
-> uploads.vase.ar
```

Estructura de storage:

```txt
/data/uploads/
├── teflon/
├── juan/
└── maria/
```

## Endpoints

### Health

```http
GET /health
```

### Upload privado

```http
POST /upload
Authorization: Bearer JWT
Content-Type: multipart/form-data
```

Campo de archivo:

```txt
file
```

Guarda en:

```txt
/data/uploads/{username}/{filename}
```

### Listar mis archivos

```http
GET /files
Authorization: Bearer JWT
```

### Descargar/ver archivo privado

```http
GET /files/:user/:filename
Authorization: Bearer JWT
```

Regla:

```txt
JWT username == :user
```

Si `juan` intenta abrir `/files/maria/factura.pdf`, responde `403 forbidden_folder`.

### Crear URL publica opcional

```http
POST /files/:filename/public-url
Authorization: Bearer JWT
Content-Type: application/json
```

Body:

```json
{
  "ttl_seconds": 604800
}
```

Devuelve:

```json
{
  "ok": true,
  "public_url": "https://uploads.vase.ar/public/TOKEN",
  "expires_in_seconds": 604800
}
```

### Abrir URL publica

```http
GET /public/:token
```

## Variables

Ver:

```txt
uploads-service/.env.example
```

En produccion, `UPLOADS_JWT_SECRET` debe ser el mismo secreto que `vase.ar` use para firmar tokens Bearer de uploads.

```env
NODE_ENV=production
PORT=3010
UPLOADS_JWT_SECRET=EL_SECRETO_COMPARTIDO_PARA_UPLOADS
UPLOADS_ROOT=/data/uploads
PUBLIC_BASE_URL=https://uploads.vase.ar
PUBLIC_URL_SECRET=OTRO_SECRETO_LARGO
MAX_FILE_SIZE_MB=50
CORS_ORIGIN=https://vase.ar,https://editor.vase.ar
```

## Docker Compose

Archivo:

```txt
docker-compose.uploads.yml
```

Levantar:

```bash
docker compose -f docker-compose.uploads.yml up -d --build
```

Volumen persistente:

```txt
vase_uploads_data -> /data/uploads
```

## EasyPanel

Crear un App Service nuevo:

```txt
Nombre: uploads-service
Dominio: uploads.vase.ar
Puerto interno: 3010
Build context: uploads-service
Dockerfile: uploads-service/Dockerfile
Volume mount: /data/uploads
```

Variables:

```env
NODE_ENV=production
PORT=3010
UPLOADS_JWT_SECRET=EL_SECRETO_COMPARTIDO_PARA_UPLOADS
UPLOADS_ROOT=/data/uploads
PUBLIC_BASE_URL=https://uploads.vase.ar
PUBLIC_URL_SECRET=SECRETO_LARGO_DISTINTO
MAX_FILE_SIZE_MB=50
CORS_ORIGIN=https://vase.ar,https://editor.vase.ar
```

DNS:

```txt
uploads.vase.ar -> IP del servidor EasyPanel
```

## Nginx

Archivo:

```txt
nginx/uploads.vase.ar.conf
```

Si EasyPanel/Traefik maneja proxy y TLS, no hace falta usar nginx manual. La config queda como referencia para VPS propio.

## Ejemplo JWT

El token debe incluir al menos:

```json
{
  "sub": "user-id-123",
  "username": "teflon",
  "email": "teflon@vase.ar",
  "role": "user"
}
```

El servicio usa `username`. Si no viene, intenta derivarlo desde `email` o `sub`.

Ejemplo Node:

```js
import jwt from "jsonwebtoken";

const token = jwt.sign(
  {
    sub: "user-id-123",
    username: "teflon",
    email: "teflon@vase.ar",
    role: "user"
  },
  process.env.JWT_SECRET,
  { expiresIn: "8h" }
);
```

## cURL

Subir:

```bash
curl -X POST "https://uploads.vase.ar/upload" \
  -H "Authorization: Bearer JWT" \
  -F "file=@./producto.jpg"
```

Listar:

```bash
curl -X GET "https://uploads.vase.ar/files" \
  -H "Authorization: Bearer JWT"
```

Abrir privado:

```bash
curl -X GET "https://uploads.vase.ar/files/teflon/ARCHIVO.jpg" \
  -H "Authorization: Bearer JWT" \
  --output archivo.jpg
```

Crear URL publica:

```bash
curl -X POST "https://uploads.vase.ar/files/ARCHIVO.jpg/public-url" \
  -H "Authorization: Bearer JWT" \
  -H "Content-Type: application/json" \
  -d '{"ttl_seconds":604800}'
```

## Frontend fetch

```js
async function uploadFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://uploads.vase.ar/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "upload_failed");
  }

  return payload;
}
```

## Seguridad aplicada

- JWT obligatorio para endpoints privados.
- Un usuario solo puede acceder a `/files/{su-username}/...`.
- Sanitizacion de username y filename.
- Bloqueo de path traversal.
- `helmet`.
- CORS restringido.
- Rate limit.
- Limite de tamano por `MAX_FILE_SIZE_MB`.
- Tipos permitidos: imagenes, videos y PDF.
- Volumen persistente Docker.

## Tipos permitidos

```txt
image/jpeg
image/png
image/webp
image/gif
image/avif
video/mp4
video/webm
video/quicktime
application/pdf
```

## Futuro MinIO/S3

El codigo de filesystem esta concentrado en:

```txt
uploads-service/src/storage.js
```

Para migrar a MinIO/S3, reemplazar esa capa por un adapter que implemente:

```txt
ensureUserDir
listUserFiles
getFileMetadata
resolveUserFilePath / read stream equivalente
```

Mantener iguales los endpoints y la autenticacion.
