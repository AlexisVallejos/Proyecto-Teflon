# Grupo C — Sistema de tokens de color funcional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que la "Paleta base interactiva" se aplique como fallback a todos los sliders Hero* y bloques `FeaturedProducts*`, conservando overrides por bloque y exponiendo UX clara de "hereda / reset" en el admin.

**Architecture:** Extraer un helper puro `getStorefrontThemeColorTokens` y un hook `useStorefrontThemeColors`. Extender `normalizeHeroStyles` y `normalizeFeaturedStyles` para aceptar un objeto `themeColors` y aplicar la cadena `blockOverride → theme[mappedKey] → hardcoded`. Cada variante define un mapping declarativo `slot → tokenName`. Los componentes bloque consumen el hook y pasan el resultado al normalizador. El admin gana un componente `ThemeAwareColorInput` que muestra "Hereda de Paleta base" cuando el valor está vacío y un botón Reset cuando hay override.

**Tech Stack:** React 18, Vite, Tailwind, JSONB en `tenant_settings.theme`. No hay framework de tests en `web/`; las verificaciones son smoke manual con `npm run dev`.

**Spec source:** [docs/superpowers/specs/2026-05-06-grupo-c-color-tokens-design.md](../specs/2026-05-06-grupo-c-color-tokens-design.md)

---

## File map

**Crear:**
- `web/src/components/admin/evolution/ThemeAwareColorInput.jsx`

**Modificar:**
- `web/src/utils/storefrontTheme.js` — agregar `getStorefrontThemeColorTokens`
- `web/src/context/ThemeContext.jsx` — agregar hook `useStorefrontThemeColors`
- `web/src/data/heroSliderTemplates.js` — agregar `HERO_THEME_TOKEN_MAP` + extender `normalizeHeroStyles`
- `web/src/data/featuredProductsTemplates.js` — agregar `FEATURED_THEME_TOKEN_MAP` + extender `normalizeFeaturedStyles`
- `web/src/components/blocks/HeroSlider.jsx` (variante `classic`)
- `web/src/components/blocks/HeroModernistSlider.jsx`
- `web/src/components/blocks/HeroModernistCenteredSlider.jsx`
- `web/src/components/blocks/HeroBoutiqueSlider.jsx`
- `web/src/components/blocks/HeroCorporateSlider.jsx`
- `web/src/components/blocks/FashionHeroSlider.jsx`
- `web/src/components/blocks/HomeDecorHeroSlider.jsx`
- `web/src/components/blocks/SanitariosIndustrialHeroSlider.jsx`
- `web/src/components/blocks/FeaturedProducts.jsx` (orquestador)
- `web/src/components/blocks/FeaturedProductsModern.jsx`
- `web/src/components/blocks/FeaturedProductsHighEnergy.jsx`
- `web/src/components/blocks/FeaturedProductsLuxury.jsx`
- `web/src/components/blocks/FeaturedProductsMasonry.jsx`
- `web/src/components/blocks/FeaturedProductsSnap.jsx`
- `web/src/components/blocks/FeaturedProductsMinimal.jsx`
- `web/src/components/admin/evolution/BlockPropertiesEditor.jsx` — usar `ThemeAwareColorInput` para los color fields de hero/featured

**Fuera de alcance:** `HeroGamingSlider.jsx` y `HeroSaleBurstSlider.jsx` no están en `HERO_VARIANT_OPTIONS`, así que no son seleccionables desde el admin. No se tocan.

---

## Convención de mapping

Token names disponibles (provistos por `getStorefrontThemeColorTokens`):

```js
{ primary, accent, background, text, secondary,
  panel_bg, card_bg, surface_bg, border, muted_text }
```

Mapping per variant: objeto plano `{ slotKey: tokenName }`. Si un slot no está en el mapping, no tiene fallback de tema (se queda en hardcoded).

---

## Task 1: Helper `getStorefrontThemeColorTokens`

**Files:**
- Modify: `web/src/utils/storefrontTheme.js`

- [ ] **Step 1: Agregar la función al final del archivo**

Abrir `web/src/utils/storefrontTheme.js` y agregar al final, después de la línea 50:

```js

export const getStorefrontThemeColorTokens = (theme = {}, mode = 'light') => {
    const preset = getStorefrontThemePreset(mode, theme || {});
    const catalog = preset.catalog || {};
    return {
        primary: preset.primary || '',
        accent: preset.accent || preset.primary || '',
        background: preset.background || '',
        text: preset.text || '',
        secondary: preset.secondary || '',
        panel_bg: catalog.panel_bg || '',
        card_bg: catalog.card_bg || '',
        surface_bg: catalog.surface_bg || '',
        border: catalog.border || '',
        muted_text: catalog.muted_text || '',
    };
};
```

- [ ] **Step 2: Smoke test en consola**

Abrir Chrome devtools en cualquier pantalla del proyecto y pegar:

```js
import('./src/utils/storefrontTheme.js').then(m => console.log(m.getStorefrontThemeColorTokens({ primary: '#ff0000' }, 'light')))
```

(Si hay HMR activo, alcanza con que el archivo no rompa al guardar.)

Expected: objeto con `primary: '#ff0000'`, `background: '#f8fafc'` (default light), etc.

- [ ] **Step 3: Commit**

```bash
git add web/src/utils/storefrontTheme.js
git commit -m "feat(theme): add getStorefrontThemeColorTokens helper"
```

---

## Task 2: Hook `useStorefrontThemeColors`

**Files:**
- Modify: `web/src/context/ThemeContext.jsx`

- [ ] **Step 1: Importar el helper**

En `web/src/context/ThemeContext.jsx`, línea 3, reemplazar:

```js
import { getStorefrontThemePreset } from '../utils/storefrontTheme';
```

por:

```js
import { getStorefrontThemePreset, getStorefrontThemeColorTokens } from '../utils/storefrontTheme';
```

- [ ] **Step 2: Exportar el hook al final del archivo**

Al final de `web/src/context/ThemeContext.jsx` (después de `export const useTheme = useContext(ThemeContext);`), agregar:

```js

export const useStorefrontThemeColors = () => {
    const ctx = useContext(ThemeContext);
    return useMemo(
        () => getStorefrontThemeColorTokens(ctx?.theme || {}, ctx?.mode || 'light'),
        [ctx?.theme, ctx?.mode]
    );
};
```

- [ ] **Step 3: Verificar no romper imports existentes**

```bash
cd web && npm run dev
```

Expected: el dev server arranca sin errores de import. Cargar `/` en el browser y confirmar que el header sigue pintando colores.

- [ ] **Step 4: Commit**

```bash
git add web/src/context/ThemeContext.jsx
git commit -m "feat(theme): expose useStorefrontThemeColors hook"
```

---

## Task 3: Extender `normalizeHeroStyles` con mapping de tema

**Files:**
- Modify: `web/src/data/heroSliderTemplates.js:385-395`

- [ ] **Step 1: Agregar el mapping antes de `normalizeHeroStyles`**

En `web/src/data/heroSliderTemplates.js`, antes de la línea 385 (`export const normalizeHeroStyles = ...`), agregar:

```js

// Slot de color → token de tema. Slots ausentes no heredan del tema (solo hardcoded).
export const HERO_THEME_TOKEN_MAP = {
    classic: {
        titleColor: 'text',
        textColor: 'secondary',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
    },
    modernist: {
        titleColor: 'text',
        textColor: 'secondary',
        labelColor: 'text',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
    },
    modernist_centered: {
        titleColor: 'text',
        textColor: 'secondary',
        labelColor: 'text',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
    },
    modern_boutique: {
        titleColor: 'text',
        textColor: 'secondary',
        labelBgColor: 'primary',
        labelTextColor: 'background',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
        accentBgColor: 'accent',
        accentTextColor: 'background',
    },
    fashion: {
        backgroundColor: 'background',
        titleColor: 'text',
        textColor: 'secondary',
        labelColor: 'text',
        accentColor: 'accent',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
    },
    home_decor: {
        backgroundColor: 'background',
        titleColor: 'text',
        textColor: 'secondary',
        labelColor: 'text',
        accentColor: 'accent',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
    },
    sanitarios_industrial: {
        titleColor: 'text',
        labelColor: 'secondary',
        cardTitleColor: 'text',
        cardSubtitleColor: 'secondary',
        textColor: 'secondary',
        primaryButtonBgColor: 'primary',
        primaryButtonTextColor: 'background',
        secondaryButtonTextColor: 'text',
        secondaryButtonBorderColor: 'text',
        specColor: 'accent',
        dotActiveColor: 'primary',
    },
    corporate: {
        titleColor: 'text',
        textColor: 'secondary',
        labelColor: 'accent',
    },
};
```

- [ ] **Step 2: Reemplazar `normalizeHeroStyles` (líneas 385-395)**

Reemplazar el bloque entero por:

```js
export const normalizeHeroStyles = (variant, styles, themeColors = null) => {
    const normalizedVariant = normalizeHeroVariant(variant);
    const defaults = getDefaultHeroStyles(variant);
    const source = styles && typeof styles === 'object' ? styles : {};
    const themeMap = HERO_THEME_TOKEN_MAP[normalizedVariant] || {};
    const next = { ...defaults };

    Object.keys(defaults).forEach((key) => {
        const override = source[key];
        if (typeof override === 'string' && override.trim().length > 0) {
            next[key] = override;
            return;
        }
        const tokenName = themeMap[key];
        if (tokenName && themeColors && typeof themeColors[tokenName] === 'string' && themeColors[tokenName].length > 0) {
            next[key] = themeColors[tokenName];
        }
    });

    return next;
};
```

- [ ] **Step 3: Smoke test manual**

```bash
cd web && npm run dev
```

Cargar el home. El comportamiento visual NO cambia todavía (los componentes aún no pasan `themeColors`). Solo verificar que no se rompió nada — cargá `/` y `/admin/evolution`.

- [ ] **Step 4: Commit**

```bash
git add web/src/data/heroSliderTemplates.js
git commit -m "feat(hero): support theme color fallback in normalizeHeroStyles"
```

---

## Task 4: Extender `normalizeFeaturedStyles` con mapping de tema

**Files:**
- Modify: `web/src/data/featuredProductsTemplates.js:107-117`

- [ ] **Step 1: Agregar el mapping antes de `normalizeFeaturedStyles`**

En `web/src/data/featuredProductsTemplates.js`, antes de la línea 107, agregar:

```js

// Slot de color → token de tema. Slots ausentes no heredan del tema.
export const FEATURED_THEME_TOKEN_MAP = {
    classic: {
        titleColor: 'text',
        accentColor: 'primary',
        ctaBg: 'primary',
        ctaTextColor: 'background',
        cardBg: 'card_bg',
        borderColor: 'border',
    },
    modern: {
        titleColor: 'text',
        accentColor: 'primary',
        ctaBg: 'primary',
        ctaTextColor: 'background',
        cardBg: 'card_bg',
        borderColor: 'border',
        sectionBg: 'background',
    },
    high_energy: {
        titleColor: 'text',
        accentColor: 'accent',
        ctaBg: 'primary',
        ctaTextColor: 'background',
    },
    luxury: {
        titleColor: 'text',
        accentColor: 'accent',
        buttonBackgroundColor: 'primary',
        buttonTextColor: 'background',
        borderColor: 'border',
    },
    masonry: {
        titleColor: 'text',
        accentColor: 'primary',
    },
    snap: {
        titleColor: 'text',
        accentColor: 'primary',
    },
    minimal: {
        titleColor: 'text',
        accentColor: 'primary',
    },
};
```

- [ ] **Step 2: Reemplazar `normalizeFeaturedStyles` (líneas 107-117)**

Reemplazar por:

```js
export const normalizeFeaturedStyles = (variant, styles, themeColors = null) => {
    const normalizedVariant = normalizeFeaturedVariant(variant);
    const defaults = getDefaultFeaturedStyles(variant);
    const source = styles && typeof styles === 'object' ? styles : {};
    const themeMap = FEATURED_THEME_TOKEN_MAP[normalizedVariant] || {};
    const next = { ...defaults };

    Object.keys(defaults).forEach((key) => {
        const override = source[key];
        if (typeof override === 'string' && override.trim().length > 0) {
            next[key] = override;
            return;
        }
        const tokenName = themeMap[key];
        if (tokenName && themeColors && typeof themeColors[tokenName] === 'string' && themeColors[tokenName].length > 0) {
            next[key] = themeColors[tokenName];
        }
    });

    return next;
};
```

- [ ] **Step 3: Smoke test**

`cd web && npm run dev` — confirmar que home y admin cargan sin errores.

- [ ] **Step 4: Commit**

```bash
git add web/src/data/featuredProductsTemplates.js
git commit -m "feat(featured): support theme color fallback in normalizeFeaturedStyles"
```

---

## Task 5: HeroModernistSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/HeroModernistSlider.jsx:1-38`

- [ ] **Step 1: Importar hook + normalizador**

Agregar después de la línea 2 de `HeroModernistSlider.jsx`:

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

- [ ] **Step 2: Reemplazar la desestructuración hardcoded de styles**

Reemplazar las líneas 28-38 (el bloque `const { titleColor = ..., ... } = styles;`) por:

```js
    const themeColors = useStorefrontThemeColors();
    const {
        titleColor,
        textColor,
        labelColor,
        primaryButtonBgColor,
        primaryButtonTextColor,
        secondaryButtonBgColor,
        secondaryButtonTextColor,
        secondaryButtonBorderColor,
        overlayColor,
    } = normalizeHeroStyles('modernist', styles, themeColors);
```

- [ ] **Step 3: Smoke test visual**

1. `cd web && npm run dev`
2. En admin → editor → setear un slider tipo Modernist en el home.
3. En admin → Apariencia → Paleta base interactiva, cambiar "Acento" a `#ff0000`. Guardar.
4. Recargar el storefront → el botón primario del Modernist se ve rojo.
5. En admin → editar el slider → setear `primaryButtonBgColor` en `#00ff00`. Guardar.
6. Recargar → el botón se ve verde (override gana).
7. En admin → vaciar `primaryButtonBgColor`. Guardar.
8. Recargar → vuelve a rojo (heredado).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HeroModernistSlider.jsx
git commit -m "feat(hero): HeroModernistSlider reads theme colors via normalizer"
```

---

## Task 6: HeroModernistCenteredSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/HeroModernistCenteredSlider.jsx`

- [ ] **Step 1: Leer el archivo y localizar la desestructuración de styles**

```bash
grep -n "= styles" web/src/components/blocks/HeroModernistCenteredSlider.jsx
```

- [ ] **Step 2: Aplicar el patrón**

Agregar imports al inicio:

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

Reemplazar `const { ... } = styles;` por:

```js
const themeColors = useStorefrontThemeColors();
const { titleColor, textColor, labelColor, primaryButtonBgColor, primaryButtonTextColor, secondaryButtonBgColor, secondaryButtonTextColor, secondaryButtonBorderColor, overlayColor } = normalizeHeroStyles('modernist_centered', styles, themeColors);
```

(Si el slider tiene slots adicionales, conservalos: solo agregá los que ya existían en su desestructuración.)

- [ ] **Step 3: Smoke test**

Repetir el smoke test del Task 5 step 3 con un slider `modernist_centered`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HeroModernistCenteredSlider.jsx
git commit -m "feat(hero): HeroModernistCenteredSlider reads theme colors via normalizer"
```

---

## Task 7: HeroBoutiqueSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/HeroBoutiqueSlider.jsx`

- [ ] **Step 1: Localizar desestructuración**

```bash
grep -n "= styles" web/src/components/blocks/HeroBoutiqueSlider.jsx
```

- [ ] **Step 2: Aplicar el patrón**

Imports al inicio:

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

Reemplazar la desestructuración por:

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('modern_boutique', rawStyles, themeColors);
const { titleColor, textColor, labelBgColor, labelTextColor, primaryButtonBgColor, primaryButtonTextColor, secondaryButtonBgColor, secondaryButtonTextColor, secondaryButtonBorderColor, accentBgColor, accentTextColor, overlayColor } = styles;
```

(Renombrar el prop `styles` recibido como `rawStyles` en la firma del componente para no chocar.)

- [ ] **Step 3: Smoke test** con slider `modern_boutique`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HeroBoutiqueSlider.jsx
git commit -m "feat(hero): HeroBoutiqueSlider reads theme colors via normalizer"
```

---

## Task 8: FashionHeroSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/FashionHeroSlider.jsx`

- [ ] **Step 1: Localizar la firma del componente y la desestructuración**

```bash
grep -n "function FashionHeroSlider\|= styles\|export default" web/src/components/blocks/FashionHeroSlider.jsx
```

- [ ] **Step 2: Aplicar el patrón estándar**

Imports:

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

Renombrar prop `styles` recibido como `rawStyles` y agregar dentro del componente:

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('fashion', rawStyles, themeColors);
```

Conservar el resto del código tal cual (sigue leyendo `styles.X` como antes; ahora `styles` ya viene normalizado con el fallback aplicado).

- [ ] **Step 3: Smoke test** con slider `fashion`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/FashionHeroSlider.jsx
git commit -m "feat(hero): FashionHeroSlider reads theme colors via normalizer"
```

---

## Task 9: HomeDecorHeroSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/HomeDecorHeroSlider.jsx`

Aplicar el mismo patrón que en Task 8:

- [ ] **Step 1: Imports**

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

- [ ] **Step 2: Renombrar prop `styles` → `rawStyles` y normalizar**

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('home_decor', rawStyles, themeColors);
```

- [ ] **Step 3: Smoke test** con slider `home_decor`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HomeDecorHeroSlider.jsx
git commit -m "feat(hero): HomeDecorHeroSlider reads theme colors via normalizer"
```

---

## Task 10: SanitariosIndustrialHeroSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/SanitariosIndustrialHeroSlider.jsx`

- [ ] **Step 1: Imports**

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

- [ ] **Step 2: Renombrar prop `styles` → `rawStyles` y normalizar**

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('sanitarios_industrial', rawStyles, themeColors);
```

- [ ] **Step 3: Smoke test** con slider `sanitarios_industrial`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/SanitariosIndustrialHeroSlider.jsx
git commit -m "feat(hero): SanitariosIndustrialHeroSlider reads theme colors via normalizer"
```

---

## Task 11: HeroCorporateSlider consume el tema

**Files:**
- Modify: `web/src/components/blocks/HeroCorporateSlider.jsx`

- [ ] **Step 1: Imports**

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

- [ ] **Step 2: Renombrar prop `styles` → `rawStyles` y normalizar**

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('corporate', rawStyles, themeColors);
```

- [ ] **Step 3: Smoke test** con slider `corporate`. El acento (label) y los textos principales deben pintarse con el tema; los grises corporativos quedan hardcoded (no están en el mapping).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HeroCorporateSlider.jsx
git commit -m "feat(hero): HeroCorporateSlider reads theme colors via normalizer"
```

---

## Task 12: HeroSlider (variante classic) consume el tema

**Files:**
- Modify: `web/src/components/blocks/HeroSlider.jsx`

- [ ] **Step 1: Imports**

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeHeroStyles } from "../../data/heroSliderTemplates";
```

- [ ] **Step 2: Inyectar normalización**

Localizar dónde se usan los styles del bloque. Renombrar prop `styles` recibido como `rawStyles` y agregar dentro del componente:

```js
const themeColors = useStorefrontThemeColors();
const styles = normalizeHeroStyles('classic', rawStyles, themeColors);
```

- [ ] **Step 3: Smoke test** con slider `classic`.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/HeroSlider.jsx
git commit -m "feat(hero): HeroSlider classic reads theme colors via normalizer"
```

---

## Task 13: FeaturedProducts orquestador pasa themeColors

**Files:**
- Modify: `web/src/components/blocks/FeaturedProducts.jsx`

- [ ] **Step 1: Imports**

Agregar al tope:

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
```

(`normalizeFeaturedStyles` ya está importado.)

- [ ] **Step 2: Pasar themeColors a los normalizadores**

Localizar las llamadas a `normalizeFeaturedStyles(variant, styles)` dentro del componente. Antes de cualquier llamada, obtener:

```js
const themeColors = useStorefrontThemeColors();
```

Reemplazar cada llamada por:

```js
normalizeFeaturedStyles(variant, styles, themeColors)
```

Si `FeaturedProducts.jsx` no llama directamente al normalizador y solo delega a las variantes, en lugar del cambio anterior **pasar `themeColors` como prop a cada subcomponente** (ver Task 14).

- [ ] **Step 3: Smoke test**

Cargar home con un bloque `FeaturedProducts` activo. Verificar que sigue renderizando.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/FeaturedProducts.jsx
git commit -m "feat(featured): FeaturedProducts router supplies themeColors"
```

---

## Task 14: Variantes Featured consumen el tema

**Files:**
- Modify: `web/src/components/blocks/FeaturedProductsModern.jsx`
- Modify: `web/src/components/blocks/FeaturedProductsHighEnergy.jsx`
- Modify: `web/src/components/blocks/FeaturedProductsLuxury.jsx`
- Modify: `web/src/components/blocks/FeaturedProductsMasonry.jsx`
- Modify: `web/src/components/blocks/FeaturedProductsSnap.jsx`
- Modify: `web/src/components/blocks/FeaturedProductsMinimal.jsx`

Aplicar el mismo patrón a los 6 archivos:

- [ ] **Step 1: Imports en cada archivo**

```js
import { useStorefrontThemeColors } from "../../context/ThemeContext";
import { normalizeFeaturedStyles } from "../../data/featuredProductsTemplates";
```

- [ ] **Step 2: Reemplazar llamadas a `normalizeFeaturedStyles`**

Donde el archivo hoy hace:

```js
const colors = normalizeFeaturedStyles('modern', styles);
```

Cambiar a:

```js
const themeColors = useStorefrontThemeColors();
const colors = normalizeFeaturedStyles('modern', styles, themeColors);
```

(Reemplazar `'modern'` por la variante correcta de cada archivo: `high_energy`, `luxury`, `masonry`, `snap`, `minimal`.)

- [ ] **Step 3: Smoke test**

Para cada variante: setear esa variante en un bloque del home, cambiar primario en Paleta base, verificar que el acento de los productos cambia.

- [ ] **Step 4: Commit por archivo o como batch**

```bash
git add web/src/components/blocks/FeaturedProducts*.jsx
git commit -m "feat(featured): all featured variants read theme colors via normalizer"
```

---

## Task 15: Componente `ThemeAwareColorInput`

**Files:**
- Create: `web/src/components/admin/evolution/ThemeAwareColorInput.jsx`

- [ ] **Step 1: Crear el archivo**

```jsx
import React from 'react';

const isValidHex = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

const RotateIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);

export default function ThemeAwareColorInput({ label, value, themeFallback, onChange }) {
    const hasOverride = isValidHex(value);
    const effective = hasOverride ? value : (isValidHex(themeFallback) ? themeFallback : '#000000');

    const handlePick = (event) => {
        onChange(event.target.value);
    };

    const handleReset = () => {
        onChange('');
    };

    return (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-zinc-300">{label}</span>
                {!hasOverride ? (
                    <span className="text-[9px] uppercase tracking-widest text-emerald-300/80">Hereda de Paleta base</span>
                ) : null}
            </span>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={effective}
                    onChange={handlePick}
                    className="h-8 w-9 cursor-pointer rounded-lg border-none bg-transparent"
                    aria-label={label}
                />
                <span className="min-w-[70px] text-right font-mono text-[10px] uppercase text-zinc-500">
                    {effective}
                </span>
                {hasOverride ? (
                    <button
                        type="button"
                        onClick={handleReset}
                        title="Volver al color de Paleta base"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                    >
                        <RotateIcon className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>
        </label>
    );
}
```

- [ ] **Step 2: Smoke check sintáctico**

`cd web && npm run dev` — confirmar que no hay errores de parse.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/evolution/ThemeAwareColorInput.jsx
git commit -m "feat(admin): add ThemeAwareColorInput component"
```

---

## Task 16: Wire `ThemeAwareColorInput` en BlockPropertiesEditor

**Files:**
- Modify: `web/src/components/admin/evolution/BlockPropertiesEditor.jsx`

- [ ] **Step 1: Importar el componente nuevo y los maps + hook**

Cerca de los otros imports al inicio del archivo, agregar:

```js
import ThemeAwareColorInput from './ThemeAwareColorInput';
import { useStorefrontThemeColors } from '../../../context/ThemeContext';
import { HERO_THEME_TOKEN_MAP } from '../../../data/heroSliderTemplates';
import { FEATURED_THEME_TOKEN_MAP } from '../../../data/featuredProductsTemplates';
```

- [ ] **Step 2: Obtener `themeColors` dentro del componente**

En el cuerpo del componente principal de `BlockPropertiesEditor.jsx` (cerca de donde ya se llaman hooks como `normalizeHeroSlides`, `normalizeFeaturedStyles`, etc.), agregar:

```js
const themeColors = useStorefrontThemeColors();
```

- [ ] **Step 3: Reemplazar uso de `ColorField` para hero color fields**

Localizar el render que itera `heroColorFields` (búsqueda: `heroColorFields.map`). Donde renderiza `<ColorField ... />` por cada campo, reemplazar por:

```jsx
{heroColorFields.map((field) => {
    const tokenName = (HERO_THEME_TOKEN_MAP[heroVariant] || {})[field.key];
    const fallback = tokenName ? themeColors[tokenName] : '';
    return (
        <ThemeAwareColorInput
            key={field.key}
            label={field.label}
            value={block.props?.styles?.[field.key] || ''}
            themeFallback={fallback}
            onChange={(next) => mergeProps({ styles: { ...(block.props?.styles || {}), [field.key]: next } })}
        />
    );
})}
```

(Adaptar `mergeProps`/`onChange` al patrón real del archivo: si el callback existente es `onColorChange(key, value)` u otro nombre, usar ese.)

- [ ] **Step 4: Reemplazar uso de `ColorField` para featured color fields**

Mismo patrón con `featuredColorFields` y `FEATURED_THEME_TOKEN_MAP`:

```jsx
{featuredColorFields.map((field) => {
    const tokenName = (FEATURED_THEME_TOKEN_MAP[featuredVariant] || {})[field.key];
    const fallback = tokenName ? themeColors[tokenName] : '';
    return (
        <ThemeAwareColorInput
            key={field.key}
            label={field.label}
            value={block.props?.styles?.[field.key] || ''}
            themeFallback={fallback}
            onChange={(next) => mergeProps({ styles: { ...(block.props?.styles || {}), [field.key]: next } })}
        />
    );
})}
```

- [ ] **Step 5: Smoke test**

1. `cd web && npm run dev`
2. Admin → editor → seleccionar un bloque slider o featured.
3. Para slots vacíos, debe verse "Hereda de Paleta base" debajo del label.
4. El swatch de color muestra el color resuelto del tema (no `#000000` muerto).
5. Click en color → setear a otro valor → aparece botón ↺ Reset al lado.
6. Click Reset → label vuelve a "Hereda de Paleta base", el swatch vuelve al color del tema.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/admin/evolution/BlockPropertiesEditor.jsx
git commit -m "feat(admin): wire ThemeAwareColorInput for hero and featured color fields"
```

---

## Task 17: Smoke test integral

**Files:**
- (ninguno — solo verificación)

- [ ] **Step 1: Smoke test end-to-end**

1. `cd web && npm run dev`. Abrir storefront.
2. Setear primario en Paleta base a `#ff0066` y guardar.
3. Recargar storefront. Verificar:
   - Header pinta primario en `#ff0066` (ya funcionaba).
   - **Slider activo** pinta CTA primario en `#ff0066`.
   - **Bloque FeaturedProducts** pinta acento en `#ff0066`.
4. En admin → editar slider → setear `primaryButtonBgColor` en `#00ff88`. Guardar.
5. Recargar storefront → ese slider tiene CTA verde, los otros (si hay más de uno) siguen `#ff0066`.
6. En admin → editar slider → click ↺ Reset en `primaryButtonBgColor`. Guardar.
7. Recargar storefront → CTA vuelve a `#ff0066`.
8. Cambiar mode a `dark` desde admin (si está expuesto) → verificar que los colores del tema se actualizan apropiadamente y los overrides siguen ganando.

- [ ] **Step 2: Documentar resultados**

Si todos los pasos pasan, marcar el grupo como completo. Si alguno falla, debugear con `systematic-debugging` skill.

- [ ] **Step 3: Push**

```bash
git push
```

---

## Self-review notes (autor del plan)

- **Cobertura de spec:** todos los puntos del spec están cubiertos: helper, hook, normalizadores extendidos, mapping declarativo por variante, aplicación en cada bloque, UX "Hereda" + Reset.
- **Templates hardcoded fuera de scope:** Gaming y SaleBurst no están en HERO_VARIANT_OPTIONS — por eso no están en este plan. Si luego se quieren incluir, se agregan a HERO_VARIANT_OPTIONS, se les define mapping, y se les aplica el patrón del Task 11 (Corporate).
- **Type consistency:** `getStorefrontThemeColorTokens(theme, mode)`, `useStorefrontThemeColors()`, `HERO_THEME_TOKEN_MAP`, `FEATURED_THEME_TOKEN_MAP`, `normalizeHeroStyles(variant, styles, themeColors)`, `normalizeFeaturedStyles(variant, styles, themeColors)` — usados consistentemente en todas las tareas.
- **Compatibilidad:** la firma del normalizador con tercer parámetro opcional (`themeColors = null`) significa que cualquier código que aún llame con 2 argumentos sigue funcionando hasta que se actualice.
