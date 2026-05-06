# User Profile Persistence + Admin Approval UX — Design Spec

**Date**: 2026-05-06
**Status**: Approved by user, awaiting implementation plan
**Scope**: Three connected features for the storefront and admin panel

---

## Goals

1. **Admin can approve pending wholesale users** from the editor's Users panel with clear UX (today only the API exists; the UI is hidden behind a generic dropdown).
2. **Signup data persists** on the user profile so checkout can autofill name, phone, address, country, province, city.
3. **Profile page is responsive** on mobile (no horizontal scroll, photo + orders visible, order detail readable). The profile photo persists on the server (today it lives in `localStorage` per device).

## Non-Goals

- Per-tenant profile data (the same user across two tenants gets the same profile data).
- Profile photo cropping/editing UI beyond a simple upload + preview.
- Wholesale-tier auto-pricing rules; we only flip `status pending → active` and assign role.
- Migrating historical localStorage photos to the server — the new flow uses the server, the old key is read once as fallback for ~2 months and then removed.

## Approval semantics — Option B (confirmed)

A "pending" user can browse the storefront and add to cart but their wholesale tier is not active until approved. Approval = `user_tenants.status: pending → active` (and optionally tier assignment). Retail users do not require approval.

---

## Section 1 — Data Model

Extend the existing `users` table (single source of truth; users are global across tenants in this codebase, so profile data is global too).

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_extra text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_label text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_info jsonb NOT NULL DEFAULT '{}'::jsonb;
```

Migrations run on boot via a new `ensureUserProfileSchema()` helper (same pattern as `ensureEmailVerificationSchema`, `ensureVaseBridgeSchema`).

All fields are nullable. Existing users keep working; new fields default to NULL/`{}`.

### Future-proofing note

If later we need per-tenant profile data (e.g., distinct CUIT per company), introduce `user_tenants_profile (user_id, tenant_id, fields…)`. Not in scope now.

---

## Section 2 — Endpoints

### `POST /api/me/photo` (new)

Auth required. Multer: max 5 MB, types `jpg/jpeg/png/webp`. Stores file at `uploads/profiles/<userId>-<timestamp>.<ext>`. Updates `users.photo_url`. Returns `{ photo_url }`.

Same Multer pattern as `tenant.js:25-48` (product image upload). New folder `uploads/profiles/`.

### `PUT /api/me/profile` (new)

Auth required. Body accepts any subset of: `name, phone, address, address_extra, country_code, country_label, province, city, postal_code, billing_info`. Persists with `coalesce` so partial updates don't wipe other fields. Returns `{ user }` with the updated row.

Tenant-scoping: uses `req.user.id` from the JWT. No `X-Tenant-Id` needed (profile is user-global).

### `GET /api/me` (extended)

Already exists. Extend the SELECT to include the new columns and return them inside `user`.

### `POST /auth/signup` (extended)

Already exists. Body now also reads: `phone, address, address_extra, country_code, country_label, province, city, postal_code`. Each is normalized (trim, length cap), all optional. INSERT writes them in the same statement that creates the user.

### `PATCH /tenant/users/:id` (no change, already exists)

Used by admin approval. The `useUsersManager.approveWholesaleUser` already calls this with `{ role: 'wholesale', status: 'active' }`.

---

## Section 3 — Frontend changes

### Signup flow (`web/src/pages/store/SignupPage.jsx` + `web/src/context/AuthContext.jsx`)

`signup()` signature changes from positional args to a single object:

```js
// Before:
signup(email, password, role, name)

// After:
signup({ email, password, role, name, phone, address, address_extra,
         country_code, country_label, province, city, postal_code })
```

`SignupPage.submit()` already collects all these in `formData`; just pass them through. Backwards-compat shim not needed (only the storefront calls this).

Tenant resolution stays as fixed in the previous bugfix (`AuthContext.jsx` reads from header/host; backend falls back to host via `resolveTenantIdFromRequest`).

### Profile page (`web/src/pages/store/ProfilePage.jsx`, 1353 LOC)

**Photo flow rewrite**:
- Remove `localStorage.setItem('teflon_profile_photo_${userId}', base64)`.
- New flow: `<input type="file">` → `POST /api/me/photo` (multipart) → response.photo_url → `setUser({ ...user, photo_url })`.
- Render: `<img src={user.photo_url || fallbackInitial} />`.
- Fallback: if `user.photo_url` is null AND old localStorage key exists, read it once and migrate via `POST /api/me/photo` (transparent migration, then delete the key). Code removed in 2 months.

**Editing profile**:
- Existing edit forms now PUT to `/api/me/profile` instead of just storing locally.
- After save, refresh `useAuth().user`.

**Responsive layout**:
- Header (foto + nombre + email): `flex-col items-center sm:flex-row sm:items-start`.
- Sidebar de secciones (sm screens): convertir a `<select>` arriba o tabs horizontales scrollables (`overflow-x-auto`).
- Tabla de pedidos: en mobile (`< md`) renderizar como cards verticales. En desktop seguir como tabla. Patrón:
  ```jsx
  <div className="hidden md:block"><table>...</table></div>
  <div className="md:hidden space-y-3">{orders.map(o => <OrderCard order={o}/>)}</div>
  ```
- Forms (dirección, datos): `grid grid-cols-1 sm:grid-cols-2 gap-3`.

### Order detail (`web/src/pages/store/OrderDetailPage.jsx`)

- Items: tabla en desktop, cards en mobile (mismo patrón que arriba).
- Resumen lateral (subtotal/envío/total): en desktop a la derecha sticky, en mobile abajo en una card.
- Imágenes de producto: `w-16 h-16` fijo.

### Checkout autofill (`web/src/pages/store/CheckoutPage.jsx`)

Al montar el form, si el usuario está logueado y tiene datos de perfil, prefilleo los campos vacíos. No piso lo que el usuario haya escrito (uso initialState basado en user, sin re-escribir cuando user cambia después).

```js
const [form, setForm] = useState(() => ({
  name: user?.name || user?.display_name || '',
  phone: user?.phone || '',
  address: user?.address || '',
  // ... etc
}));
```

### Admin Users panel (`web/src/components/admin/evolution/UsersEditor.jsx`)

Three additions; logic helpers in `useUsersManager` ya existen.

1. **Banner global de pendientes** arriba de la lista:
   ```
   ⚠️ Tenés 3 mayoristas pendientes de aprobación  [Ver pendientes]
   ```
   Solo visible si `usersList.some(u => u.status === 'pending')`. Click filtra `status = pending`.

2. **Badge "Pendiente"** en cada fila — pill amarillo `bg-amber-500/15 border-amber-500/40` al lado del nombre cuando `user.status === 'pending'`.

3. **Botón "Aprobar"** verde al lado de cada pendiente. Llama directamente a `approveWholesaleUser(item)` (ya existe). Confirmación inline: "¿Aprobar a `email@x.com` como mayorista?".

4. **Panel de detalle** (cuando seleccionás un user) — agregar sección "Datos del cliente" mostrando los campos persistidos: phone, address, country/province/city. Útil para validar la legitimidad del cliente antes de aprobar.

---

## Error Handling

- Signup with invalid field types → backend strips/normalizes silently (don't block account creation for a bad postal code).
- Photo upload > 5 MB or wrong type → 400 with code `invalid_photo`, frontend toast "La foto debe ser JPG/PNG/WebP de hasta 5 MB".
- `PUT /api/me/profile` with malformed `billing_info` → 400 with `invalid_billing_info`.
- Photo write to disk fails → 500, frontend toast generic. (No retries; user re-tries.)
- Approve user when membership row missing → existing `PATCH` returns 404 `user_not_found`, frontend toast "El usuario ya no existe en este sitio".

## Testing

Manual end-to-end (no test suite yet in repo):

1. **Signup**: registrarse en `vases.vase.ar/signup` con todos los campos llenos. Verificar en DB que `users` tiene los campos persistidos.
2. **Checkout autofill**: loguearse, ir a checkout — campos prefilleados con datos del signup.
3. **Profile edit**: cambiar dirección en `/profile` → recargar → cambio persiste.
4. **Profile photo**: subir foto → recargar → foto sigue. Loguearse desde otro navegador → foto sigue.
5. **Admin approve**: registrar un mayorista pending → en `editor.vase.ar/admin/evolution` → tab Usuarios → ver banner + badge + botón Aprobar → click → status → active.
6. **Mobile responsive**: abrir Chrome DevTools → device toolbar → iPhone 12 → recorrer `/profile` y `/orders/<id>`. No scroll horizontal, todo legible.

## Rollout

- Backend deploy primero (migrations corren al boot, son idempotentes via `IF NOT EXISTS`).
- Frontend deploy después (depende de los nuevos endpoints).
- Si rollback urgente: el `users` table queda con columnas extra que el código viejo ignora (no rompe nada).

## Open Questions / Deferred

- **Multi-tenant profile divergence**: si un user pertenece a 2 tenants y uno requiere CUIT distinto, hoy comparten el mismo `billing_info`. Aceptable por ahora; abrir ticket cuando aparezca el caso.
- **Photo CDN**: hoy se sirve desde `/uploads/profiles/...` directo del Node. Si el storage crece mucho, considerar S3 + Cloudfront. No bloquea esta entrega.
- **Email change**: cambiar el email del user requeriría re-verificación. No incluido en `PUT /api/me/profile` (excluyo `email` del payload aceptado).

## Estimated effort

4-6 horas de trabajo focalizado. Backend ~1.5h, frontend signup+checkout ~1h, frontend profile (foto+responsive) ~2h, admin UsersEditor ~1h, testing manual ~30min.
