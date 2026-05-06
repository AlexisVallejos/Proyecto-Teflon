# Grupo A — Cleanup (T&C, Navbar, Servicios) — Design

**Fecha:** 2026-05-06
**Alcance:** 3 cleanups de cierre. No hay arquitectura nueva ni migraciones de DB.

---

## 1. Términos y Condiciones (cierre del trabajo en vuelo)

La página `web/src/pages/store/TermsPage.jsx` ya existe (texto profesional en español, deslinda a Vase.ar como proveedor de software/hosting, hace responsable a la empresa por compras/pagos/entregas). Falta cablear ruta y admin field.

### 1.1 Ruta `/terms`

**Archivo:** `web/src/App.jsx`

- Agregar `import TermsPage from './pages/store/TermsPage';` junto al resto de imports de `pages/store/`.
- Agregar línea `else if (route === '/terms') Component = TermsPage;` después de la línea de `/order-details` (alrededor de la línea 88).

El footer ya linkea a `/terms` (`Footer.jsx:123`), así que no hay cambios ahí.

### 1.2 Campo "Razón social" en admin

**Archivo:** `web/src/components/admin/evolution/CheckoutEditor.jsx`

Agregar un bloque nuevo **"Información legal"** entre el bloque "Notificaciones y estados" y los siguientes. Un solo input:

```jsx
<div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Información legal</p>
    <p className="text-xs text-zinc-500">Se usa en la página de Términos y Condiciones para identificar a la empresa responsable.</p>
    <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Razón social / Nombre legal</label>
        <input
            type="text"
            value={settings?.commerce?.legal_company_name || ''}
            placeholder="Sanitarios El Teflon S.R.L."
            onChange={(e) => updateCommerceField('legal_company_name', e.target.value)}
            className={fieldClass}
        />
    </div>
</div>
```

**Persistencia:** se guarda en `settings.commerce.legal_company_name` dentro del JSONB de `tenant_settings`. No requiere migración. El frontend de `TermsPage.jsx` ya lo lee con fallback a `branding.name` o `tenant.name`.

---

## 2. Navbar — limpieza

### 2.1 Sacar "Contáctanos" y convertir WhatsApp en CTA visual

**Archivo:** `web/src/components/layout/Header.jsx`

**Cambio en `staticLinks` (líneas 313-317):**

Antes:
```js
const staticLinks = [
    { label: "Sobre nosotros", href: "/about", external: false },
    { label: "Contactanos", href: "/#contacto", external: false },
    ...(whatsappHref ? [{ label: "WhatsApp", href: whatsappHref, external: true }] : []),
];
```

Después:
```js
const staticLinks = [
    { label: "Sobre nosotros", href: "/about", external: false },
];
```

WhatsApp se separa y deja de ser un `MenuAnchor`. Se renderiza aparte, después del último `MenuAnchor` del navbar desktop (después del `extraLinks.map(...)`), como un botón CTA estilizado:

```jsx
{whatsappHref ? (
    <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 h-9 text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-sm hover:opacity-90 transition-opacity"
    >
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-2.335 0-4.241 1.906-4.241 4.241 0 .741.194 1.436.53 2.031l-.564 2.057 2.106-.552c.571.31 1.221.495 1.914.495 2.335 0 4.241-1.906 4.241-4.241 0-2.335-1.906-4.241-4.241-4.241zm3.11 5.617c-.126.126-.541.313-.746.331-.205.018-.466.014-.766-.082-.3-.096-.65-.213-1.071-.397-.421-.184-.791-.453-1.109-.771-.318-.318-.587-.688-.771-1.109-.184-.421-.301-.771-.397-1.071-.096-.3-.1-.561-.082-.766.018-.205.205-.62.331-.746.126-.126.21-.157.283-.157.073 0 .147.009.215.013.068.004.142.008.201.12.059.112.184.449.201.487.017.038.026.084.004.131-.022.047-.047.073-.094.131l-.141.164c-.047.054-.097.113-.041.21.056.097.248.409.533.662.285.253.525.333.622.378.097.045.153.037.21-.028.057-.065.244-.285.309-.383.065-.098.131-.082.22-.047.089.035.565.267.663.316.098.049.164.073.188.113.024.04.024.234-.102.36zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.658 1.438 5.161l-1.438 5.243 5.362-1.407C8.749 21.65 10.309 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.558 0-3.007-.432-4.241-1.178l-3.041.798.814-2.964C4.782 15.656 4 14.075 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
        Contáctanos
    </a>
) : null}
```

Se etiqueta como "Contáctanos" porque ese es su rol funcional. Si no hay número de WhatsApp configurado, simplemente no se renderiza (no hay link roto).

### 2.2 Sacar "Ofertas" del nav default

**Archivo:** `web/src/components/layout/StoreLayout.jsx`

Línea 17, eliminar el item:
```js
{ label: 'Ofertas', href: '/#ofertas' },
```

`defaultNavLinks` queda en: Inicio · Catalogo · Sobre nosotros.

Si el tenant tiene `branding.navbar.links` configurado en sus settings, ese override sigue ganando — no lo tocamos.

### 2.3 Limpiar referencias residuales en Header.jsx

En `Header.jsx:321`, la lista de etiquetas filtradas para `extraLinks` ya incluye `"contactanos"` y `"contacto"` así que cualquier link configurado con esos nombres queda fuera del navbar desktop. No requiere cambio.

En `mobilePrimaryLinks` (línea 327-341), como ahora `staticLinks` solo contiene "Sobre nosotros", el menú mobile también pierde "Contactanos" automáticamente. WhatsApp ya tiene su propio botón circular en el footer del menú mobile (líneas 725-734), así que no necesitamos duplicarlo.

---

## 3. Sacar el bloque "Servicios" del home

**Decisión confirmada por el usuario:** opción (a) — eliminar del render del home actual, mantener el tipo de bloque disponible en el admin para futuro uso.

### 3.1 Investigación previa (parte del primer paso de implementación)

Antes de tocar código, encontrar dónde se renderiza el bloque `Services`:
- Buscar referencias a `'Services'` o `services` como tipo de bloque en `web/src/components/PageBuilder.jsx` y `web/src/pages/store/HomePage.jsx`.
- Confirmar el id/tipo exacto del bloque en las secciones por defecto del tenant actual.

### 3.2 Cambio

Filtrar el bloque del render. Hay dos formas según dónde esté:

**Si está en `defaultSections.js`** como una sección por defecto del home:
- Eliminar el objeto correspondiente del array de secciones default.

**Si está como sección activa en el tenant (en DB)**:
- No tocar la DB. En su lugar, filtrarla en el render (`PageBuilder.jsx` o donde se itere `sections`):
  ```js
  const visibleSections = sections.filter((s) => s?.type !== 'Services');
  ```
- Esto hace que el tipo siga existiendo en el editor pero no se pinte en el frontend público.

La elección depende de lo que se encuentre en el paso 3.1.

---

## Testing

Manual smoke test:

1. **Términos:**
   - Visitar `/terms` → ve la página completa con el nombre de la razón social cargado desde admin.
   - Footer → click en "Términos" → llega a `/terms`.
   - Desde `/terms`, los botones "Volver al inicio", "Ir al catálogo", "Sobre nosotros" funcionan.
   - Editar `legal_company_name` en admin, guardar, recargar `/terms` → ve el nuevo nombre.

2. **Navbar desktop:**
   - No aparece "Contáctanos" como link de texto.
   - No aparece "Ofertas".
   - Aparece botón verde redondeado de WhatsApp con texto "Contáctanos" alineado a la derecha del nav.
   - Click → abre `wa.me/<numero>` en pestaña nueva.
   - Si el admin tiene `whatsapp_number` vacío → no aparece el botón (y nada más se rompe).

3. **Navbar mobile:**
   - El menú abierto no muestra "Contáctanos" en accesos directos.
   - El botón redondo de WhatsApp en el footer del menú sigue funcionando.

4. **Home:**
   - El bloque "Servicios" / "Nuestros Servicios" no aparece.
   - El resto del home (hero, productos destacados, etc.) se renderiza sin huecos visibles.

---

## Fuera de alcance (de Grupo A)

- Branding editable con upload de logo (Grupo B)
- Sistema de tokens de color funcional (Grupo C)
- Tarjetas con SVG/PNG en "Te acompañamos" (Grupo D)
- Cambios de DB schema
- Internacionalización del texto de Términos
