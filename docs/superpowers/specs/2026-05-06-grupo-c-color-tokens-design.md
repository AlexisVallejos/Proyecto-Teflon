# Grupo C — Sistema de tokens de color funcional — Design

**Fecha:** 2026-05-06
**Alcance:** Hacer que la "Paleta base interactiva" del admin se aplique como fallback a todos los sliders y bloques de productos destacados, manteniendo overrides por bloque.

---

## Goal

Hoy la Paleta base interactiva persiste valores en `settings.theme` y los expone como CSS variables (`--color-primary`, etc.). El header y algunos componentes los respetan. Los sliders Hero* y los bloques `FeaturedProducts*` los **ignoran completamente** porque leen solo de `block.props.styles` (hex estático por bloque).

El objetivo es que cada slot de color de cada template siga una cadena de prioridad consistente:

```
block.props.styles.X     (override explícito del bloque)
      ↓ si vacío
theme.X                  (settings.theme.* — Paleta base)
      ↓ si vacío
default hardcoded        (identidad visual mínima del template)
```

## Architecture

### 1. Helper de tokens

**Archivo nuevo (o ampliación de existente):** `web/src/utils/storefrontTheme.js`

Función `getStorefrontThemeColorTokens(theme, mode)` que devuelve un objeto plano con los 10 tokens resueltos:

```js
{
  primary, accent, background, text, secondary,
  panel_bg, card_bg, surface_bg, border, muted_text
}
```

Funde `theme` + defaults light/dark según `mode`. La lógica ya existe parcialmente en el código que hoy genera CSS vars; se extrae como función pura para poder llamarla desde JS.

### 2. Hook de consumo

**Archivo:** `web/src/context/ThemeContext.jsx`

Nuevo hook exportado `useStorefrontThemeColors()`:

```js
export function useStorefrontThemeColors() {
  const { settings } = useTenant();
  const { mode } = useTheme();
  return useMemo(
    () => getStorefrontThemeColorTokens(settings?.theme, mode),
    [settings?.theme, mode]
  );
}
```

Cualquier bloque lo invoca para obtener los hex resueltos del tema.

### 3. Normalizadores extendidos

**Archivos:**
- `web/src/data/heroSliderTemplates.js` — `normalizeHeroStyles(variant, blockStyles, themeColors)`
- `web/src/data/featuredProductsTemplates.js` — `normalizeFeaturedStyles(variant, blockStyles, themeColors)`

Cambio: ambos aceptan un tercer parámetro `themeColors`. Por cada key de color del template, el normalizador aplica la cadena de prioridad. Cada variante define su mapping de slot → token.

Ejemplo para Hero Modernist:

```js
function normalizeModernist(blockStyles = {}, theme = {}) {
  return {
    titleColor:   blockStyles.titleColor   || theme.text       || '#0f172a',
    accentColor:  blockStyles.accentColor  || theme.primary    || '#ea580c',
    ctaBg:        blockStyles.ctaBg        || theme.primary    || '#ea580c',
    ctaText:      blockStyles.ctaText      || theme.background || '#ffffff',
    overlayColor: blockStyles.overlayColor || '#000000',
    textColor:    blockStyles.textColor    || theme.text       || '#1f2937',
  };
}
```

Cada variante tiene su propio mapping declarativo. La parte laboriosa es decidir slot por slot a qué token mapea.

### 4. Aplicación en cada bloque

En cada componente `Hero*Slider.jsx` y `FeaturedProducts*.jsx`:

```js
import { useStorefrontThemeColors } from '../../context/ThemeContext';

// dentro del componente:
const themeColors = useStorefrontThemeColors();
const colors = normalizeHeroStyles(variant, block.props.styles, themeColors);
// usar colors.X como antes
```

Donde la versión actual hardcodea hex inline (e.g. `<div style={{ color: '#0099e5' }}>`), se reemplaza por `colors.X` resuelto.

### 5. Templates 100% hardcoded

**Templates afectados:** `HeroGamingSlider`, `HeroSaleBurstSlider`, `HeroCorporateSlider`, posiblemente `FashionHeroSlider` y `HomeDecorHeroSlider`.

Estos no exponen `block.props.styles` para colores; tienen toda su paleta hardcoded como parte de su identidad visual.

**Decisión conservadora:** identificar 2-3 slots clave por template (CTA primario + color de acento) y enchufarlos a `theme.primary` y `theme.accent` con fallback al hardcoded actual. Los gradientes ambientales (e.g. fucsia/cian de Gaming) quedan intactos.

Para cada template hardcoded, definir explícitamente:
- Qué slots se vuelven themeables (mínimo 1: el CTA primario).
- Qué slots se quedan como están.

### 6. UX del admin — "Hereda de Paleta base"

**Archivo(s):** los editores que renderizan color pickers para sliders y featured. Hay que ubicarlos durante implementación (probablemente `BlockPropertiesEditor.jsx` o editores por tipo bajo `web/src/components/admin/evolution/`).

Cambios por color picker:

- **Cuando el valor está vacío (`''` o `null`):**
  - El swatch del picker muestra el color resuelto del tema (gris claro con un check o similar para indicar "heredado").
  - Label/placeholder: `Hereda de Paleta base`.
  - El input no tiene valor — sigue vacío en el estado.

- **Cuando el valor tiene un hex:**
  - El swatch muestra ese hex.
  - Aparece un botón pequeño `↺ Reset` al lado.
  - Click en Reset → setea el valor a `''` (vuelve al estado heredado).

Helper compartido: un componente `<ThemeAwareColorInput value onChange themeFallback label />` que encapsula esta UX. Se usa en todos los editores de bloques que tengan colores.

## Data flow

```
Admin Paleta base
   ↓ updateTheme()
settings.theme.* (state)
   ↓ Save → POST /api/settings
DB: tenant_settings.theme (JSONB)
   ↓ TenantContext fetch
settings.theme (loaded)
   ↓ ThemeProvider
   ├→ document.documentElement CSS vars  (header, etc., como hoy)
   └→ useStorefrontThemeColors() hook    (sliders, featured — NUEVO)
                                              ↓
                                       normalizeHeroStyles / normalizeFeaturedStyles
                                              ↓
                                       3-level fallback
                                              ↓
                                       colors.X aplicado al render
```

Live update: el evento `tenant-settings-updated` ya dispara refresh del TenantContext; los componentes que usen el hook se re-renderizan automáticamente con los nuevos colores.

## Files to touch

- `web/src/utils/storefrontTheme.js` — nuevo helper `getStorefrontThemeColorTokens`
- `web/src/context/ThemeContext.jsx` — nuevo hook `useStorefrontThemeColors`
- `web/src/data/heroSliderTemplates.js` — extender `normalizeHeroStyles` + mappings por variante
- `web/src/data/featuredProductsTemplates.js` — extender `normalizeFeaturedStyles` + mappings por variante
- Componentes Hero (todos los que existan):
  - `HeroSlider.jsx`
  - `HeroModernistSlider.jsx`
  - `HeroModernistCenteredSlider.jsx`
  - `HeroBoutiqueSlider.jsx`
  - `HeroGamingSlider.jsx` (modo conservador)
  - `HeroCorporateSlider.jsx` (modo conservador)
  - `HeroSaleBurstSlider.jsx` (modo conservador)
  - `HomeDecorHeroSlider.jsx`, `FashionHeroSlider.jsx`, `SanitariosIndustrialHeroSlider.jsx` (auditar — ajustar como corresponda)
- Componentes Featured:
  - `FeaturedProducts.jsx` (orchestrator)
  - `FeaturedProductsModern.jsx`
  - `FeaturedProductsHighEnergy.jsx`
  - `FeaturedProductsLuxury.jsx`
  - `FeaturedProductsMasonry.jsx`
  - `FeaturedProductsSnap.jsx`
  - `FeaturedProductsMinimal.jsx`
- Componente nuevo: `web/src/components/admin/evolution/ThemeAwareColorInput.jsx`
- Editores admin que renderizan color pickers para slider/featured (a localizar en implementación).

## Testing

Smoke test manual:

1. **Tema global:** En admin → Apariencia → Paleta base, cambiar "Acento" a `#ff0000`. Guardar.
   - Home: header, todos los sliders sin override, todos los featured sin override → muestran rojo en sus slots de primario/acento.
2. **Override por bloque:** En admin → editar un slider específico, setear "CTA Bg" a `#00ff00`. Guardar.
   - Solo ese slider tiene CTA verde; los demás siguen rojos.
3. **Reset:** Click en "↺ Reset" del CTA Bg de ese slider. Guardar.
   - Vuelve a rojo (heredado).
4. **Indicador de herencia:** Editor del slider muestra "Hereda de Paleta base" para slots vacíos.
5. **Templates hardcoded:** Cambiar primario en Paleta base → Hero Gaming muestra el primario nuevo en su CTA, pero conserva sus gradientes fucsia/cian.
6. **Live reactividad:** Hacer cambio en Paleta base con el preview abierto → los bloques visibles cambian sin reload completo.

## Out of scope

- Nuevos slots de color en `settings.theme` (los 10 actuales bastan).
- Migración de datos para tenants existentes (overrides existentes se respetan; no se borran).
- Refactorización profunda de los gradientes/animaciones de los templates con identidad visual fuerte.
- Pickers de fuente o tipografía.
- Modo automático claro/oscuro por hora (queda fuera).
- `theme.catalog.*` se preserva como está; no expandimos.

## Risks

- **Templates con identidad visual rota.** Mitigación: para Gaming/SaleBurst/Corporate, listar explícitamente los 2-3 slots themeables; el resto del mapping queda en hardcoded.
- **Componente `ThemeAwareColorInput` no consistente entre editores.** Mitigación: uno solo, reutilizable. Si algún editor existente usa un picker custom no trivial, se sustituye.
- **Performance del hook.** Mitigación: `useMemo` sobre `settings.theme` + `mode`. Cambia poco; recomputo barato.
- **Tenants con overrides "vacíos pero no null"** (e.g. `'#'` o `'transparent'`). Mitigación: el normalizador trata como vacío cualquier valor falsy o que no parsee como hex válido.
