# User Profile + Admin Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist signup data on the user profile, surface admin approval UX for pending wholesale users, and make the storefront profile responsive with server-side photo storage.

**Architecture:** Extend the global `users` table with profile columns (no new table). Add 3 endpoints (photo upload, profile update, /api/me extension). Frontend reuses the existing forms in SignupPage/ProfilePage/CheckoutPage and adds 4 small additions to UsersEditor (banner, badge, approve button, customer details panel).

**Tech Stack:** Node.js + Express + pg (server), React 18 + Vite + Tailwind (web), PostgreSQL 17, Multer for file upload.

**No automated test suite exists in this repo.** Each task includes a manual verification block with the exact `curl` / browser steps to run and the expected outcome.

**Spec:** [docs/superpowers/specs/2026-05-06-user-profile-and-admin-approval-design.md](../specs/2026-05-06-user-profile-and-admin-approval-design.md)

---

## File Structure

**Backend (new):**
- `server/src/services/userProfile.js` — schema bootstrap, normalization helpers
- `server/src/routes/me.js` — endpoints `GET /api/me/full`, `PUT /api/me/profile`, `POST /api/me/photo`. The existing `GET /api/me` stays in auth.js for back-compat; we extend it.

**Backend (modify):**
- `server/src/app.js` — wire `meRouter`, ensure `uploads/profiles/` is served via the existing `/uploads` static middleware (already covers it)
- `server/src/routes/auth.js` — extend `handleSignup` (line 384) and `getMeHandler` (line 611) to read/return profile fields
- `server/src/services/bootstrapSchema.js` — call `ensureUserProfileSchema()`

**Frontend (modify):**
- `web/src/context/AuthContext.jsx` — change `signup()` signature to object; add `updateProfile()` and `uploadProfilePhoto()` helpers; add `refreshUser()`
- `web/src/pages/store/SignupPage.jsx` — pass full `formData` to `signup()`
- `web/src/pages/store/ProfilePage.jsx` — replace localStorage photo with server upload; replace local edits with `PUT /api/me/profile`; add responsive layout
- `web/src/pages/store/OrderDetailPage.jsx` — responsive layout (table → cards on mobile)
- `web/src/pages/store/CheckoutPage.jsx` — autofill form initialState from `user`
- `web/src/components/admin/evolution/UsersEditor.jsx` — pending banner, badge, approve button, customer details panel

---

## Task 1: DB schema — add profile columns to `users`

**Files:**
- Create: `server/src/services/userProfile.js`
- Modify: `server/src/services/bootstrapSchema.js`

- [ ] **Step 1: Create the schema bootstrap helper**

Create `server/src/services/userProfile.js`:

```js
import { pool } from '../db.js';

let schemaPromise = null;

export async function ensureUserProfileSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    await pool.query("alter table users add column if not exists phone text");
    await pool.query("alter table users add column if not exists address text");
    await pool.query("alter table users add column if not exists address_extra text");
    await pool.query("alter table users add column if not exists country_code text");
    await pool.query("alter table users add column if not exists country_label text");
    await pool.query("alter table users add column if not exists province text");
    await pool.query("alter table users add column if not exists city text");
    await pool.query("alter table users add column if not exists postal_code text");
    await pool.query("alter table users add column if not exists photo_url text");
    await pool.query("alter table users add column if not exists billing_info jsonb not null default '{}'::jsonb");
  })();
  return schemaPromise;
}

const trim = (v) => (v == null ? null : String(v).trim() || null);
const trimMax = (v, max) => {
  const t = trim(v);
  return t == null ? null : t.slice(0, max);
};

export function normalizeProfileFields(input = {}) {
  return {
    phone: trimMax(input.phone, 60),
    address: trimMax(input.address, 240),
    address_extra: trimMax(input.address_extra ?? input.addressExtra, 120),
    country_code: trimMax(input.country_code ?? input.countryCode, 8),
    country_label: trimMax(input.country_label ?? input.countryLabel, 80),
    province: trimMax(input.province, 120),
    city: trimMax(input.city, 120),
    postal_code: trimMax(input.postal_code ?? input.postalCode, 20),
  };
}

export function normalizeBillingInfo(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value;
}

export function profileColumnsToSelect() {
  return [
    'phone',
    'address',
    'address_extra',
    'country_code',
    'country_label',
    'province',
    'city',
    'postal_code',
    'photo_url',
    'billing_info',
  ].join(', ');
}
```

- [ ] **Step 2: Wire it in bootstrapSchema**

Read `server/src/services/bootstrapSchema.js` first to find where other `ensureXxxSchema` are imported and called. Add:

```js
import { ensureUserProfileSchema } from './userProfile.js';
```

And inside the function that runs all bootstrap migrations, add:

```js
await ensureUserProfileSchema();
```

If the file imports many schema modules, follow the existing alphabetical/grouping convention.

- [ ] **Step 3: Manual verification**

Restart the server (locally or in EasyPanel after rebuild). In `psql vase`:

```sql
\d users
```

Expected: the columns `phone`, `address`, `address_extra`, `country_code`, `country_label`, `province`, `city`, `postal_code`, `photo_url`, `billing_info` appear. `billing_info` has type `jsonb` with default `'{}'`.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/userProfile.js server/src/services/bootstrapSchema.js
git commit -m "feat(server): add profile columns to users table + bootstrap helper"
```

---

## Task 2: Extend `GET /api/me` to return profile fields

**Files:**
- Modify: `server/src/routes/auth.js:611-647`

- [ ] **Step 1: Update getMeHandler SELECT**

In `server/src/routes/auth.js`, replace the `SELECT` query inside `getMeHandler` (currently `'select id, email, role, status from users where id = $1'`) with:

```js
import { ensureUserProfileSchema, profileColumnsToSelect } from '../services/userProfile.js';
```

Add the import at the top with the other imports. Then change the handler:

```js
export async function getMeHandler(req, res, next) {
  try {
    await ensureUserProfileSchema();
    const userRes = await pool.query(
      `select id, email, role, status, display_name, ${profileColumnsToSelect()} from users where id = $1`,
      [req.user.id]
    );
    if (!userRes.rowCount) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const user = userRes.rows[0];
    let tenantId = req.tenant?.id || req.user.tenantId || null;
    let role = user.role;
    let status = user.status || 'active';

    if (user.role !== 'master_admin') {
      const membership = await getMembership(user.id, tenantId);
      if (membership) {
        tenantId = membership.tenant_id;
        role = membership.role;
        status = membership.status || status;
      }
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role,
        status,
        tenant_id: tenantId,
        display_name: user.display_name,
        name: user.display_name,
        phone: user.phone,
        address: user.address,
        address_extra: user.address_extra,
        country_code: user.country_code,
        country_label: user.country_label,
        province: user.province,
        city: user.city,
        postal_code: user.postal_code,
        photo_url: user.photo_url,
        billing_info: user.billing_info || {},
      },
    });
  } catch (err) {
    return next(err);
  }
}
```

- [ ] **Step 2: Manual verification**

Restart server. From a terminal where you have a valid JWT (get one by logging in via the storefront and copying `localStorage.teflon_token`):

```bash
curl -H "Authorization: Bearer <TOKEN>" https://editor.vase.ar/api/me | jq
```

Expected: response includes `phone`, `address`, `photo_url`, `billing_info: {}`, etc. — values may be `null` for an existing user, that's fine.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/auth.js
git commit -m "feat(server): extend GET /api/me to return profile fields"
```

---

## Task 3: Extend `POST /auth/signup` to persist profile data

**Files:**
- Modify: `server/src/routes/auth.js` (in `handleSignup`, around line 384)

- [ ] **Step 1: Update the signup INSERT**

Find `handleSignup` in `server/src/routes/auth.js`. After my previous fix it already uses `resolveTenantIdFromRequest`. Now extend the field extraction and INSERT.

At the top of the function (after the existing email/password/tenant_id checks), add:

```js
import { ensureUserProfileSchema, normalizeProfileFields } from '../services/userProfile.js';
```

(Add to the existing import block at the top of the file.)

Inside `handleSignup`, after the `normalizedEmail` check, ADD:

```js
await ensureUserProfileSchema();
const profile = normalizeProfileFields(req.body);
const displayName = String(name || '').trim() || null;
```

Then find the `INSERT INTO users` statement (the one for new accounts that includes `email_verified_at, requires_email_verification`) and change it from:

```js
const userRes = await pool.query(
  [
    'insert into users (email, password_hash, role, status, email_verified_at, requires_email_verification)',
    'values ($1, $2, $3, $4, $5, $6)',
    'returning id, email, role, status, email_verified_at, requires_email_verification',
  ].join(' '),
  [normalizedEmail, passwordHash, assignedRole, 'active', null, true]
);
```

to:

```js
const userRes = await pool.query(
  [
    'insert into users (',
    '  email, password_hash, role, status, email_verified_at, requires_email_verification,',
    '  display_name, phone, address, address_extra, country_code, country_label,',
    '  province, city, postal_code',
    ') values (',
    '  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15',
    ') returning id, email, role, status, email_verified_at, requires_email_verification',
  ].join(' '),
  [
    normalizedEmail, passwordHash, assignedRole, 'active', null, true,
    displayName,
    profile.phone, profile.address, profile.address_extra,
    profile.country_code, profile.country_label,
    profile.province, profile.city, profile.postal_code,
  ]
);
```

- [ ] **Step 2: Manual verification**

```bash
curl -X POST https://editor.vase.ar/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 6d8bc886-8777-4c5b-b996-397837793aba" \
  -d '{
    "email": "test-profile-'$(date +%s)'@example.com",
    "password": "Test1234!",
    "name": "Juan Perez",
    "phone": "+5492235550000",
    "address": "Av. Libertador 1234",
    "country_code": "AR",
    "country_label": "Argentina",
    "province": "Buenos Aires",
    "city": "Mar del Plata",
    "postal_code": "7600"
  }'
```

Expected: 201 response with `requires_approval: true`. Then in `psql vase`:

```sql
SELECT email, display_name, phone, address, city FROM users ORDER BY created_at DESC LIMIT 1;
```

Expected: row has Juan Perez, +549..., Av. Libertador..., Mar del Plata.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/auth.js
git commit -m "feat(server): persist signup profile fields (phone, address, location)"
```

---

## Task 4: Add `PUT /api/me/profile` endpoint

**Files:**
- Create: `server/src/routes/me.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create the me router**

Create `server/src/routes/me.js`:

```js
import express from 'express';
import { pool } from '../db.js';
import {
  ensureUserProfileSchema,
  normalizeBillingInfo,
  normalizeProfileFields,
  profileColumnsToSelect,
} from '../services/userProfile.js';

export const meRouter = express.Router();

meRouter.put('/profile', async (req, res, next) => {
  try {
    await ensureUserProfileSchema();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = normalizeProfileFields(req.body || {});
    const displayName = req.body?.name != null
      ? (String(req.body.name).trim().slice(0, 120) || null)
      : undefined;
    const billingInfo = req.body?.billing_info !== undefined
      ? normalizeBillingInfo(req.body.billing_info)
      : undefined;

    const setParts = [];
    const values = [userId];
    let idx = 2;
    const setField = (column, value) => {
      setParts.push(`${column} = coalesce($${idx}, ${column})`);
      values.push(value);
      idx += 1;
    };
    const setFieldOverride = (column, value) => {
      setParts.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    if (displayName !== undefined) setFieldOverride('display_name', displayName);
    setField('phone', profile.phone);
    setField('address', profile.address);
    setField('address_extra', profile.address_extra);
    setField('country_code', profile.country_code);
    setField('country_label', profile.country_label);
    setField('province', profile.province);
    setField('city', profile.city);
    setField('postal_code', profile.postal_code);
    if (billingInfo !== undefined) {
      if (billingInfo === null && req.body?.billing_info !== null) {
        return res.status(400).json({ error: 'invalid_billing_info' });
      }
      setFieldOverride('billing_info', billingInfo || {});
    }

    if (!setParts.length) {
      return res.status(400).json({ error: 'no_fields' });
    }

    const updateRes = await pool.query(
      `update users set ${setParts.join(', ')}
       where id = $1
       returning id, email, role, status, display_name, ${profileColumnsToSelect()}`,
      values
    );

    if (!updateRes.rowCount) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    return res.json({ user: updateRes.rows[0] });
  } catch (err) {
    return next(err);
  }
});
```

- [ ] **Step 2: Wire the router in app.js**

In `server/src/app.js`, add import:

```js
import { meRouter } from './routes/me.js';
```

Then mount it after the existing `/api/me` line:

```js
app.get('/api/me', authenticate, getMeHandler);
app.use('/api/me', authenticate, meRouter);
```

- [ ] **Step 3: Manual verification**

```bash
curl -X PUT https://editor.vase.ar/api/me/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+5492235559999", "city": "Necochea" }'
```

Expected: response `{ user: { ..., phone: "+5492235559999", city: "Necochea", address: <previous value> } }`. The `address` should be unchanged because `coalesce` preserves it.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/me.js server/src/app.js
git commit -m "feat(server): add PUT /api/me/profile endpoint with partial update"
```

---

## Task 5: Add `POST /api/me/photo` endpoint

**Files:**
- Modify: `server/src/routes/me.js`

- [ ] **Step 1: Add Multer setup and the endpoint**

Append to `server/src/routes/me.js`:

```js
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const PROFILE_UPLOAD_DIR = 'uploads/profiles/';
fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROFILE_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = /^\.(jpg|jpeg|png|webp)$/i.test(ext) ? ext : '.jpg';
    cb(null, `${req.user.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const okExt = allowed.test(path.extname(file.originalname || '').toLowerCase());
    const okMime = allowed.test(file.mimetype || '');
    if (okExt && okMime) {
      cb(null, true);
    } else {
      cb(new Error('invalid_photo_type'));
    }
  },
});

meRouter.post('/photo', photoUpload.single('photo'), async (req, res, next) => {
  try {
    await ensureUserProfileSchema();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'photo_required' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const previousRes = await pool.query(
      'select photo_url from users where id = $1',
      [userId]
    );
    const previousPhoto = previousRes.rows[0]?.photo_url || null;

    await pool.query('update users set photo_url = $2 where id = $1', [userId, photoUrl]);

    if (previousPhoto && previousPhoto.startsWith('/uploads/profiles/')) {
      const prevPath = path.join(process.cwd(), previousPhoto.replace(/^\//, ''));
      fs.unlink(prevPath, () => {}); // best-effort cleanup
    }

    return res.json({ photo_url: photoUrl });
  } catch (err) {
    return next(err);
  }
});

meRouter.use((err, req, res, next) => {
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message === 'invalid_photo_type')) {
    return res.status(400).json({
      error: 'invalid_photo',
      details: 'La foto debe ser JPG/PNG/WebP de hasta 5 MB',
    });
  }
  return next(err);
});
```

- [ ] **Step 2: Verify `/uploads` is served statically**

Check `server/src/app.js` — there should already be:
```js
app.use('/uploads', express.static('uploads'));
```

If not, add it before the `/api/*` routes.

- [ ] **Step 3: Manual verification**

```bash
curl -X POST https://editor.vase.ar/api/me/photo \
  -H "Authorization: Bearer <TOKEN>" \
  -F "photo=@/path/to/test.jpg"
```

Expected: `{ "photo_url": "/uploads/profiles/<userId>-<ts>-xxxx.jpg" }`. Then visit `https://editor.vase.ar/uploads/profiles/<that-filename>` in browser → see the image.

Test invalid file:
```bash
curl -X POST https://editor.vase.ar/api/me/photo \
  -H "Authorization: Bearer <TOKEN>" \
  -F "photo=@/path/to/test.pdf"
```
Expected: 400 with `{ "error": "invalid_photo", "details": "..." }`.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/me.js
git commit -m "feat(server): add POST /api/me/photo upload (Multer, 5MB max, jpg/png/webp)"
```

---

## Task 6: Frontend signup — pass full form data

**Files:**
- Modify: `web/src/context/AuthContext.jsx:179`
- Modify: `web/src/pages/store/SignupPage.jsx` (the `submit()` function around line 700+)

- [ ] **Step 1: Refactor signup() to accept an object**

In `web/src/context/AuthContext.jsx`, replace the existing `signup` function:

```js
const signup = async (input = {}) => {
    if (isExternalAuthEnabled()) {
        throw new Error('external_auth_enabled');
    }

    const tenantHeaders = getTenantHeaders();
    const envTenant = String(import.meta.env.VITE_TENANT_ID || '').trim();
    const headerTenant = String(tenantHeaders['X-Tenant-Id'] || '').trim();
    const tenantId = headerTenant || envTenant || '';

    const payload = {
        email: input.email,
        password: input.password,
        role: input.role,
        name: input.name,
        phone: input.phone,
        address: input.address,
        address_extra: input.address_extra,
        country_code: input.country_code,
        country_label: input.country_label,
        province: input.province,
        city: input.city,
        postal_code: input.postal_code,
        ...(tenantId ? { tenant_id: tenantId } : {}),
    };

    const response = await fetch(`${getApiBase()}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        const signupError = new Error(error.error || 'Signup failed');
        signupError.payload = error;
        throw signupError;
    }

    const data = await response.json();
    const requiresApproval = data?.requires_approval || data?.user?.status === 'pending';
    if (!requiresApproval && data?.token && data?.user) {
        setUser(data.user);
        localStorage.setItem('teflon_token', data.token);
        localStorage.setItem('teflon_user', JSON.stringify(data.user));
    } else if (data?.user) {
        // intentionally not setting session for pending users
    }
    return data;
};
```

- [ ] **Step 2: Update SignupPage.submit() to pass formData**

Open `web/src/pages/store/SignupPage.jsx` and find the `submit` function (used in Step3 by `onSubmit={submit}`). Find where it currently calls `signup(...)` and replace with:

```js
await signup({
    email: formData.email,
    password: formData.password,
    role: formData.role || 'retail',
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    address_extra: formData.address_extra || formData.addressExtra || '',
    country_code: formData.country_code || formData.countryCode || '',
    country_label: formData.country_label || formData.country || '',
    province: formData.province,
    city: formData.city,
    postal_code: formData.postal_code || formData.postalCode || '',
});
```

> If the field names in `formData` differ (look at the `update('xxx', value)` calls in Step1/Step2), use whichever names actually exist. Read the file first to confirm.

- [ ] **Step 3: Manual verification**

Local frontend dev: `cd web && npm run dev`. Open http://localhost:5173/signup, complete the 3 steps with all fields filled, submit. Expected: redirect to verification page (or success message). Check DB:

```sql
SELECT email, display_name, phone, address, city, country_label FROM users ORDER BY created_at DESC LIMIT 1;
```
All fields should be populated.

- [ ] **Step 4: Commit**

```bash
git add web/src/context/AuthContext.jsx web/src/pages/store/SignupPage.jsx
git commit -m "feat(web): signup sends full profile data instead of email/password only"
```

---

## Task 7: Frontend — add `updateProfile()` and `uploadProfilePhoto()` helpers + `refreshUser()`

**Files:**
- Modify: `web/src/context/AuthContext.jsx`

- [ ] **Step 1: Add the helpers**

In `web/src/context/AuthContext.jsx`, after the `signup` function, add:

```js
const refreshUser = async () => {
    const token = localStorage.getItem('teflon_token');
    if (!token) return null;
    try {
        const response = await fetch(`${getApiBase()}/api/me`, {
            headers: {
                ...getTenantHeaders(),
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.user) {
            setUser(data.user);
            localStorage.setItem('teflon_user', JSON.stringify(data.user));
        }
        return data?.user || null;
    } catch (err) {
        console.error('refreshUser failed', err);
        return null;
    }
};

const updateProfile = async (profileFields) => {
    const token = localStorage.getItem('teflon_token');
    if (!token) throw new Error('not_authenticated');

    const response = await fetch(`${getApiBase()}/api/me/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileFields || {}),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `profile_update_${response.status}`);
    }

    const data = await response.json();
    if (data?.user) {
        setUser(data.user);
        localStorage.setItem('teflon_user', JSON.stringify(data.user));
    }
    return data?.user || null;
};

const uploadProfilePhoto = async (file) => {
    const token = localStorage.getItem('teflon_token');
    if (!token) throw new Error('not_authenticated');
    if (!file) throw new Error('photo_required');

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${getApiBase()}/api/me/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.details || err?.error || `photo_upload_${response.status}`);
    }

    const data = await response.json();
    if (data?.photo_url) {
        const nextUser = { ...(user || {}), photo_url: data.photo_url };
        setUser(nextUser);
        localStorage.setItem('teflon_user', JSON.stringify(nextUser));
    }
    return data?.photo_url || null;
};
```

- [ ] **Step 2: Export them in the AuthContext value**

Find the `<AuthContext.Provider value={{ ... }}>` line (around line 267). Add `refreshUser, updateProfile, uploadProfilePhoto` to the value object:

```jsx
<AuthContext.Provider value={{
    user, login, signup, verifyEmailCode, resendVerificationCode, logout,
    isWholesale, isWholesalePending, isAdmin, loading,
    refreshUser, updateProfile, uploadProfilePhoto,
}}>
```

- [ ] **Step 3: Manual verification**

In browser console after login:
```js
const { refreshUser, updateProfile, uploadProfilePhoto } = window.__authContext || {};
// Or from React DevTools, find AuthProvider and call value.updateProfile({ city: 'Test' })
```

Easier: continue to Task 8 which exercises this end-to-end via the UI.

- [ ] **Step 4: Commit**

```bash
git add web/src/context/AuthContext.jsx
git commit -m "feat(web): add updateProfile / uploadProfilePhoto / refreshUser to AuthContext"
```

---

## Task 8: ProfilePage — replace localStorage photo with server upload

**Files:**
- Modify: `web/src/pages/store/ProfilePage.jsx` (lines 373, 619, 635, 652, 730)

- [ ] **Step 1: Read the affected sections**

Read `web/src/pages/store/ProfilePage.jsx` lines 360-400, 615-660, and 720-740 to understand the current photo flow. The pattern is:
- File input → FileReader → base64 → `localStorage.setItem('teflon_profile_photo_${userId}', base64)`
- Render: `<img src={profilePhoto} />` where `profilePhoto = localStorage.getItem(...)`

- [ ] **Step 2: Replace with server upload**

At the top of the file, add to imports:

```js
import { useAuth } from '../../context/AuthContext';
```

(May already be imported — check first.)

Inside the component, replace the photo state initialization. Find:

```js
const [profilePhoto, setProfilePhoto] = useState(() => {
    const key = `teflon_profile_photo_${user.id || user.email}`;
    return localStorage.getItem(key) || '';
});
```

Replace with:

```js
const { user, uploadProfilePhoto } = useAuth();
const [profilePhoto, setProfilePhoto] = useState(() => {
    if (user?.photo_url) {
        return `${getApiBase()}${user.photo_url}`;
    }
    // Fallback to localStorage for unmigrated users (transition period)
    const key = `teflon_profile_photo_${user?.id || user?.email}`;
    return localStorage.getItem(key) || '';
});

useEffect(() => {
    if (user?.photo_url) {
        setProfilePhoto(`${getApiBase()}${user.photo_url}`);
    }
}, [user?.photo_url]);
```

Find the file change handler (currently writes to localStorage). Replace with:

```js
const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const localUrl = URL.createObjectURL(file);
        setProfilePhoto(localUrl); // optimistic preview
        const photoUrl = await uploadProfilePhoto(file);
        if (photoUrl) {
            setProfilePhoto(`${getApiBase()}${photoUrl}`);
            // Cleanup old localStorage if it was used
            const key = `teflon_profile_photo_${user.id || user.email}`;
            localStorage.removeItem(key);
        }
    } catch (err) {
        console.error('Photo upload failed', err);
        alert(typeof err?.message === 'string' ? err.message : 'No se pudo subir la foto');
        // Revert preview
        if (user?.photo_url) {
            setProfilePhoto(`${getApiBase()}${user.photo_url}`);
        } else {
            setProfilePhoto('');
        }
    }
};
```

Wire the file input's `onChange={handlePhotoChange}`.

- [ ] **Step 3: Manual verification**

In `vases.vase.ar/profile`, click the camera icon, choose a JPG. Expected: photo appears immediately. Reload page → photo still there. Open another browser, log in same user → photo there too. Check DB:
```sql
SELECT photo_url FROM users WHERE email = '<your-email>';
```

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/store/ProfilePage.jsx
git commit -m "feat(web): server-side profile photo upload replacing localStorage"
```

---

## Task 9: ProfilePage — edit profile via API

**Files:**
- Modify: `web/src/pages/store/ProfilePage.jsx`

- [ ] **Step 1: Find existing edit forms**

Read the file and locate the form sections that allow editing personal info, address, billing. They likely have local state and a save button that today either does nothing or saves to localStorage.

- [ ] **Step 2: Wire each save button to `updateProfile`**

For each form, the save handler should call:

```js
const { updateProfile } = useAuth();

const handleSavePersonalInfo = async () => {
    try {
        await updateProfile({
            name: formState.name,
            phone: formState.phone,
        });
        // toast or inline success
        setEditingPersonal(false);
    } catch (err) {
        console.error(err);
        alert('No se pudieron guardar los datos');
    }
};

const handleSaveAddress = async () => {
    try {
        await updateProfile({
            address: formState.address,
            address_extra: formState.address_extra,
            country_code: formState.country_code,
            country_label: formState.country_label,
            province: formState.province,
            city: formState.city,
            postal_code: formState.postal_code,
        });
        setEditingAddress(false);
    } catch (err) {
        console.error(err);
        alert('No se pudo guardar la dirección');
    }
};

const handleSaveBilling = async () => {
    try {
        await updateProfile({
            billing_info: billingFormState, // object validated by normalizeBillingInfo on server
        });
        setEditingBilling(false);
    } catch (err) {
        console.error(err);
        alert('No se pudo guardar la facturación');
    }
};
```

> The exact field names and existing handler names depend on what's in the file. Read first, then edit. If the file uses a single big form, consolidate into one save handler that sends all fields at once.

- [ ] **Step 3: Initialize form state from `user`**

Wherever the form fields are initialized with `useState`, derive defaults from `user`:

```js
const { user } = useAuth();
const [formState, setFormState] = useState(() => ({
    name: user?.name || user?.display_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    address_extra: user?.address_extra || '',
    country_code: user?.country_code || '',
    country_label: user?.country_label || '',
    province: user?.province || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
}));
const [billingFormState, setBillingFormState] = useState(() => user?.billing_info || EMPTY_BILLING_INFO);
```

- [ ] **Step 4: Manual verification**

In `vases.vase.ar/profile`, edit the address (e.g., change city). Save. Reload. Expected: city persists. Re-login from incognito: city is still there.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/store/ProfilePage.jsx
git commit -m "feat(web): persist profile edits via PUT /api/me/profile"
```

---

## Task 10: ProfilePage — responsive layout

**Files:**
- Modify: `web/src/pages/store/ProfilePage.jsx`

- [ ] **Step 1: Header (foto + nombre + email) responsive**

Find the header section. Apply mobile-first classes. Pattern:

```jsx
<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
    <div className="relative h-24 w-24 sm:h-28 sm:w-28">
        {/* photo */}
    </div>
    <div className="text-center sm:text-left">
        <h1 className="text-xl font-bold sm:text-2xl">{user?.name || user?.email}</h1>
        <p className="text-sm text-zinc-500">{user?.email}</p>
    </div>
</div>
```

- [ ] **Step 2: Sidebar de secciones → tabs en mobile**

Find the section navigation (sidebar with "Mis pedidos", "Direcciones", etc.). Render dual:

```jsx
{/* Desktop sidebar */}
<aside className="hidden md:block md:w-60 shrink-0 space-y-1">
    {sections.map(s => (
        <button key={s.key} onClick={() => setActive(s.key)} className={...}>{s.label}</button>
    ))}
</aside>

{/* Mobile tabs */}
<div className="md:hidden -mx-4 mb-4 overflow-x-auto px-4">
    <div className="flex gap-2 whitespace-nowrap">
        {sections.map(s => (
            <button key={s.key} onClick={() => setActive(s.key)} className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold',
                active === s.key
                    ? 'border-primary bg-primary text-white'
                    : 'border-zinc-200 bg-white text-zinc-700'
            )}>{s.label}</button>
        ))}
    </div>
</div>
```

- [ ] **Step 3: Pedidos table → cards en mobile**

Find the orders table. Wrap with the dual pattern:

```jsx
{/* Desktop table */}
<div className="hidden md:block overflow-x-auto">
    <table>{/* existing table */}</table>
</div>

{/* Mobile cards */}
<div className="space-y-3 md:hidden">
    {orders.map(order => (
        <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900">#{order.number || order.id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_STYLES[ORDER_STATUS_LABELS[order.status]] || 'bg-zinc-100 text-zinc-600')}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-400">Total</span>
                <span className="text-base font-bold text-zinc-900">{formatCurrency(order.total, order.currency)}</span>
            </div>
            <button onClick={() => navigate(`/orders/${order.id}`)} className="mt-3 w-full rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Ver detalle
            </button>
        </div>
    ))}
</div>
```

- [ ] **Step 4: Forms grid → 1-col en mobile, 2-col en desktop**

Wherever forms have `grid-cols-2`, change to `grid-cols-1 sm:grid-cols-2`. Same for any `grid-cols-3` etc.

- [ ] **Step 5: Manual verification**

Chrome DevTools → device toolbar → iPhone 12. Recorrer todo el `/profile`. Verificar: no scroll horizontal en ningún punto. Las secciones se eligen con tabs scrollables arriba. Los pedidos se ven como cards. La foto está centrada arriba del nombre.

- [ ] **Step 6: Commit**

```bash
git add web/src/pages/store/ProfilePage.jsx
git commit -m "feat(web): responsive ProfilePage layout for mobile (header, tabs, order cards)"
```

---

## Task 11: OrderDetailPage — responsive layout

**Files:**
- Modify: `web/src/pages/store/OrderDetailPage.jsx`

- [ ] **Step 1: Items table → cards en mobile**

Apply the same dual pattern as Task 10 step 3 to the items table. Each item card:

```jsx
<div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
    <div className="flex gap-3">
        <img
            src={item.image_url || '/img/product-placeholder.png'}
            alt={item.name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
            <p className="text-xs text-zinc-500">SKU {item.sku || '-'}</p>
            <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-zinc-500">{item.qty} × {formatCurrency(item.unit_price)}</span>
                <span className="text-sm font-bold text-zinc-900">{formatCurrency(item.total)}</span>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Resumen lateral → abajo en mobile**

Find the order summary (subtotal/shipping/total). Today probably uses `lg:grid-cols-[1fr_300px]` or similar. Change container so that on mobile the summary stacks below:

```jsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
    <section>{/* items list */}</section>
    <aside className="lg:sticky lg:top-24 lg:self-start">
        {/* summary card */}
    </aside>
</div>
```

- [ ] **Step 3: Manual verification**

Chrome DevTools → iPhone 12 → abrir un pedido cualquiera desde `/profile`. No scroll horizontal. Items legibles. Resumen visible al final.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/store/OrderDetailPage.jsx
git commit -m "feat(web): responsive OrderDetailPage (items cards on mobile, summary stacks)"
```

---

## Task 12: CheckoutPage — autofill from user profile

**Files:**
- Modify: `web/src/pages/store/CheckoutPage.jsx`

- [ ] **Step 1: Initialize form fields from `user`**

Find the checkout form's `useState` initializer. Replace it with:

```js
const { user } = useAuth();
const [form, setForm] = useState(() => ({
    name: user?.name || user?.display_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    address_extra: user?.address_extra || '',
    country: user?.country_label || '',
    country_code: user?.country_code || '',
    province: user?.province || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    // ... preserve any other fields the form has, default to '' or the existing default
}));
```

> Important: do NOT overwrite the form state when `user` changes mid-session. Keep this only as the initial state. If the user edits the form, their edits stay.

- [ ] **Step 2: Manual verification**

Logout. Login again. Add a product to cart. Go to checkout. Expected: name, phone, address, country, province, city all prefilled with what you put in signup or in profile. Edit one field, the edit persists; the other fields don't get reset.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/store/CheckoutPage.jsx
git commit -m "feat(web): autofill checkout form from user profile"
```

---

## Task 13: UsersEditor — pending banner + badge + Approve button

**Files:**
- Modify: `web/src/components/admin/evolution/UsersEditor.jsx`

- [ ] **Step 1: Read the current UsersEditor structure**

Read `web/src/components/admin/evolution/UsersEditor.jsx` (467 lines). Locate:
- Where the user list is rendered (likely a `.map()`)
- Where the search/filter bar is
- The destructured props from `useEvolutionStore` or `useUsersManager`

- [ ] **Step 2: Add the pending banner**

Above the user list (just after the search bar), add:

```jsx
const pendingCount = (filteredUsers || []).filter(u => u.status === 'pending').length;

{pendingCount > 0 && (
    <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-200">⚠</span>
            <div>
                <p className="text-sm font-bold text-white">
                    Tenés {pendingCount} {pendingCount === 1 ? 'mayorista pendiente' : 'mayoristas pendientes'} de aprobación
                </p>
                <p className="text-xs text-amber-200/80">Revisá sus datos y aprobalos o rechazalos.</p>
            </div>
        </div>
        <button
            type="button"
            onClick={() => setSearch('pending')}
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white"
        >
            Ver pendientes
        </button>
    </div>
)}
```

> If `setSearch` triggers `filteredUsers` to filter on the search string but doesn't filter by status, also handle this: change the filter logic in `useUsersManager.filteredUsers` to also match `'pending'` against `item.status`, OR add a separate `statusFilter` state. The simplest is to extend `useUsersManager.filteredUsers` to include `String(item.status).includes(query)` (already does — line 401).

- [ ] **Step 3: Add the "Pendiente" badge in each row**

Where the user is rendered (the row), find the name and add next to it:

```jsx
{item.status === 'pending' && (
    <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
        Pendiente
    </span>
)}
```

- [ ] **Step 4: Add the "Aprobar" button**

In the same row, add (only visible if pending):

```jsx
{item.status === 'pending' && (
    <button
        type="button"
        disabled={userSavingId === item.id}
        onClick={() => {
            if (window.confirm(`¿Aprobar a ${item.email} como mayorista?`)) {
                approveWholesaleUser(item);
            }
        }}
        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-600 disabled:opacity-50"
    >
        {userSavingId === item.id ? 'Aprobando...' : 'Aprobar'}
    </button>
)}
```

> `approveWholesaleUser` and `userSavingId` come from `useUsersManager` — confirm they're already destructured in this component, otherwise add them.

- [ ] **Step 5: Manual verification**

Register a wholesale user in `vases.vase.ar/signup` with role wholesale (if the form supports choosing role; otherwise patch DB to set `user_tenants.status='pending'` and `role='wholesale'` for a test user). Then in `editor.vase.ar/admin/evolution` → Users tab. Expected:
1. Banner amarillo arriba con "Tenés 1 mayorista pendiente"
2. Badge "Pendiente" al lado del email del user
3. Botón verde "Aprobar"
4. Click → confirm → status pasa a `active`, badge y botón desaparecen.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/admin/evolution/UsersEditor.jsx
git commit -m "feat(web): admin UsersEditor pending banner + badge + Approve button"
```

---

## Task 14: UsersEditor — customer details panel

**Files:**
- Modify: `web/src/components/admin/evolution/UsersEditor.jsx`
- Modify: `server/src/routes/tenant.js` (`tenantRouter.get('/users')`) — return profile fields

- [ ] **Step 1: Backend — extend the users list to include profile fields**

In `server/src/routes/tenant.js`, find the `tenantRouter.get('/users', ...)` handler. Locate the SELECT query for the users list. Add the profile columns:

```sql
select u.id, u.email, u.display_name as name,
       u.phone, u.address, u.address_extra,
       u.country_code, u.country_label,
       u.province, u.city, u.postal_code,
       u.created_at,
       ut.role, ut.status, ut.price_adjustment_percent,
       upl.price_list_id, pl.name as price_list_name, pl.type as price_list_type
from user_tenants ut
join users u on u.id = ut.user_id
... (rest of the existing JOINs and WHERE)
```

If the endpoint also serves an individual user (e.g., `tenantRouter.get('/users/:id')`), update both.

- [ ] **Step 2: Frontend — customer details panel**

In `UsersEditor.jsx`, find where `selectedUser` is rendered (the right-side panel that appears when you click a user). Add a new section "Datos del cliente":

```jsx
{selectedUser && (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Datos del cliente</h3>
        <dl className="space-y-2 text-sm">
            <Row label="Nombre" value={selectedUser.name || selectedUser.display_name} />
            <Row label="Email" value={selectedUser.email} />
            <Row label="Teléfono" value={selectedUser.phone} />
            <Row label="Dirección" value={[selectedUser.address, selectedUser.address_extra].filter(Boolean).join(' · ')} />
            <Row label="Ciudad" value={[selectedUser.city, selectedUser.province].filter(Boolean).join(', ')} />
            <Row label="País" value={selectedUser.country_label} />
            <Row label="CP" value={selectedUser.postal_code} />
        </dl>
    </div>
)}
```

Where `Row` is a tiny inline helper:

```jsx
const Row = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <dt className="text-zinc-500">{label}</dt>
        <dd className="font-medium text-white">{value || <span className="text-zinc-600">—</span>}</dd>
    </div>
);
```

- [ ] **Step 3: Manual verification**

In admin → Users → click on a user that has profile data (the one you registered in Task 13 verification). Expected: panel a la derecha muestra teléfono, dirección, ciudad, país, etc.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/tenant.js web/src/components/admin/evolution/UsersEditor.jsx
git commit -m "feat: surface customer profile fields in admin Users panel"
```

---

## Task 15: Final integration test + push

- [ ] **Step 1: Build everything locally**

```bash
cd c:/Users/10/Documents/GitHub/Proyecto-Teflon
node --check server/src/routes/auth.js
node --check server/src/routes/me.js
node --check server/src/services/userProfile.js
cd web && node_modules/.bin/vite build --mode development
```

Expected: all syntax OK, build succeeds.

- [ ] **Step 2: Push and deploy**

```bash
git push
```

In EasyPanel → `vase-bussiness` → Rebuild. Wait for build to finish. Verify `/health` responds.

- [ ] **Step 3: End-to-end smoke test in production**

Use the Manual Verification checklist from the spec ([section "Testing"](../specs/2026-05-06-user-profile-and-admin-approval-design.md#testing)). Run all 6 scenarios. Each should pass.

- [ ] **Step 4: Final commit message tag**

If everything works, no extra commit needed. If any small fix was needed during smoke test, commit it:

```bash
git add <files>
git commit -m "fix: address smoke test findings post-deploy"
git push
```

---

## Self-review checklist (already applied)

- ✅ All spec sections covered: data model (Task 1), endpoints (Tasks 2-5), signup (Task 3+6), profile flow (Tasks 7-9), responsive (Tasks 10-11), checkout autofill (Task 12), admin approval UX (Tasks 13-14).
- ✅ No "TBD" / "TODO" / "later" placeholders.
- ✅ Type/method consistency: `uploadProfilePhoto`, `updateProfile`, `refreshUser` defined in Task 7, used in Tasks 8/9.
- ✅ The `normalizeProfileFields` helper signature defined in Task 1 matches usage in Tasks 3 and 4.
- ✅ Each task includes manual verification (no test framework in repo) with concrete commands.
- ✅ All commit messages provided.
- ✅ File paths absolute relative to repo root.
