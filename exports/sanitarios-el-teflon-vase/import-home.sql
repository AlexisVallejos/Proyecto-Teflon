-- Sanitarios El Teflon - import opcional para Vase / Proyecto Teflon
-- Uso:
-- psql "$DATABASE_URL" -v tenant_id="'UUID_DEL_TENANT'" -f exports/sanitarios-el-teflon-vase/import-home.sql

BEGIN;

WITH target AS (
  SELECT :tenant_id::uuid AS tenant_id
),
settings_payload AS (
  SELECT
    tenant_id,
    '{
      "name": "Sanitarios El Teflon",
      "logo_url": "",
      "design_preset": "sanitarios_industrial",
      "navbar": {
        "links": [
          { "label": "Inicio", "href": "/" },
          { "label": "Catalogo", "href": "/catalog" },
          { "label": "Nosotros", "href": "/about" }
        ],
        "show_search": true,
        "show_wishlist": true,
        "show_cart": true,
        "show_account": true,
        "register_label": "Registrarse",
        "register_href": "/register"
      },
      "footer": {
        "description": "Griferia, sanitarios, accesorios y materiales con asesoramiento para cada obra o renovacion.",
        "quickLinks": [
          { "label": "Catalogo", "href": "/catalog" },
          { "label": "Nosotros", "href": "/about" }
        ],
        "shopLinks": [
          { "label": "Griferia", "href": "/catalog?category=griferia" },
          { "label": "Sanitarios", "href": "/catalog?category=sanitarios" },
          { "label": "Accesorios", "href": "/catalog?category=accesorios" },
          { "label": "Repuestos", "href": "/catalog?category=repuestos" }
        ],
        "helpLinks": [
          { "label": "Carrito", "href": "/cart" },
          { "label": "Terminos", "href": "/terms" }
        ],
        "legalLinks": [
          { "label": "Terminos y condiciones", "href": "/terms" }
        ],
        "newsletter": { "enabled": false, "title": "Novedades", "description": "", "placeholder": "tu@email.com", "buttonLabel": "Enviar" },
        "legalText": "(c) 2026 Sanitarios El Teflon. Todos los derechos reservados.",
        "contact": { "address": "Mar del Plata, Argentina", "phone": "", "email": "" },
        "socials": { "instagram": "", "facebook": "", "youtube": "", "tiktok": "", "whatsapp": "" }
      },
      "admin_panel": { "title": "Panel de administracion", "logo_url": "" },
      "catalog_cards": []
    }'::jsonb AS branding,
    '{
      "mode": "light",
      "primary": "#f97316",
      "accent": "#111827",
      "background": "#f8f7f4",
      "text": "#111827",
      "secondary": "#64748b",
      "font_family": "Inter, Manrope, sans-serif",
      "catalog": {
        "panel_bg": "#f1f5f9",
        "surface_bg": "#ffffff",
        "card_bg": "#ffffff",
        "border": "#dbe2ea",
        "muted_text": "#64748b"
      },
      "admin_panel": {
        "mode": "light",
        "accent": "#111111",
        "shell_bg": "#e7edf4",
        "sidebar_bg": "#f8fafc",
        "panel_bg": "#ffffff",
        "canvas_bg": "#eef3f8",
        "text": "#0f172a",
        "muted_text": "#475569"
      }
    }'::jsonb AS theme,
    '{
      "mode": "hybrid",
      "currency": "ARS",
      "locale": "es-AR",
      "show_prices": true,
      "show_stock": true,
      "reviews_enabled": true,
      "tax_rate": 0.21,
      "address": "Mar del Plata, Argentina",
      "email": "",
      "payment_methods": ["transfer", "cash_on_pickup"],
      "brands": ["FV", "Ferrum", "Roca", "Piazza", "Hydros", "Peirano", "Aqualaf", "Docol"]
    }'::jsonb AS commerce
  FROM target
)
INSERT INTO tenant_settings (tenant_id, branding, theme, commerce)
SELECT tenant_id, branding, theme, commerce
FROM settings_payload
ON CONFLICT (tenant_id) DO UPDATE
SET
  branding = EXCLUDED.branding,
  theme = EXCLUDED.theme,
  commerce = EXCLUDED.commerce,
  updated_at = now();

WITH target AS (
  SELECT :tenant_id::uuid AS tenant_id
),
category_seed AS (
  SELECT tenant_id, 'Griferia'::text AS name, 'griferia'::text AS slug FROM target
  UNION ALL SELECT tenant_id, 'Sanitarios', 'sanitarios' FROM target
  UNION ALL SELECT tenant_id, 'Accesorios', 'accesorios' FROM target
  UNION ALL SELECT tenant_id, 'Repuestos', 'repuestos' FROM target
)
INSERT INTO categories (tenant_id, name, slug, data)
SELECT tenant_id, name, slug, '{}'::jsonb
FROM category_seed
ON CONFLICT (tenant_id, slug) DO UPDATE
SET name = EXCLUDED.name;

WITH target AS (
  SELECT :tenant_id::uuid AS tenant_id
),
home_page AS (
  INSERT INTO pages (tenant_id, slug)
  SELECT tenant_id, 'home' FROM target
  ON CONFLICT (tenant_id, slug) DO UPDATE SET updated_at = now()
  RETURNING id
),
selected_page AS (
  SELECT id FROM home_page
  UNION ALL
  SELECT p.id
  FROM pages p
  JOIN target t ON t.tenant_id = p.tenant_id
  WHERE p.slug = 'home'
  LIMIT 1
),
section_seed AS (
  SELECT 1 AS sort_order, 'HeroSlider'::text AS type, '{
    "variant": "sanitarios_industrial",
    "slides": [
      {
        "label": "Sanitarios y griferia",
        "title": "TODO PARA TU OBRA",
        "description": "Griferia, sanitarios, accesorios y materiales seleccionados con asesoramiento para cada proyecto.",
        "featured": "Atencion comercial",
        "cardEyebrow": "Linea destacada",
        "cardTitle": "Catalogo sanitario",
        "specLabel": "Stock, pedidos y consultas",
        "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop",
        "primaryButtonLabel": "VER CATALOGO",
        "primaryButtonLink": "/catalog",
        "secondaryButtonLabel": "NOSOTROS",
        "secondaryButtonLink": "/about"
      },
      {
        "label": "Banos, cocina y obra",
        "title": "PRODUCTOS LISTOS PARA INSTALAR",
        "description": "Una tienda preparada para comparar marcas, consultar disponibilidad y coordinar compras con claridad.",
        "featured": "Entrega coordinada",
        "cardEyebrow": "Gestion online",
        "cardTitle": "Pedidos y consultas",
        "specLabel": "Catalogo actualizado",
        "image": "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=2070&auto=format&fit=crop",
        "primaryButtonLabel": "EXPLORAR LINEAS",
        "primaryButtonLink": "/catalog",
        "secondaryButtonLabel": "CONTACTO",
        "secondaryButtonLink": "/about"
      }
    ],
    "styles": {
      "backgroundColor": "#f97316",
      "leftPanelColor": "#121212",
      "titleColor": "#ffffff",
      "textColor": "#f4f4f5",
      "labelColor": "#f97316",
      "primaryButtonBgColor": "#ffffff",
      "primaryButtonTextColor": "#f97316",
      "secondaryButtonBgColor": "#18181b",
      "secondaryButtonTextColor": "#ffffff",
      "secondaryButtonBorderColor": "#3f3f46"
    }
  }'::jsonb AS props
  UNION ALL
  SELECT 2, 'BrandMarquee', '{
    "variant": "grid_static",
    "eyebrow": "Nuestras marcas",
    "title": "Marcas para obra, bano y cocina",
    "subtitle": "Trabajamos lineas de griferia, sanitarios y accesorios para resolver compras con respaldo.",
    "speed": "static",
    "primaryButton": { "label": "", "link": "" },
    "items": [
      { "id": "brand-fv", "name": "FV" },
      { "id": "brand-ferrum", "name": "Ferrum" },
      { "id": "brand-roca", "name": "Roca" },
      { "id": "brand-piazza", "name": "Piazza" },
      { "id": "brand-hydros", "name": "Hydros" },
      { "id": "brand-peirano", "name": "Peirano" },
      { "id": "brand-aqualaf", "name": "Aqualaf" },
      { "id": "brand-docol", "name": "Docol" }
    ],
    "styles": {
      "backgroundColor": "#f8fafc",
      "panelBackgroundColor": "#ffffff",
      "titleColor": "#111827",
      "subtitleColor": "#64748b",
      "badgeBackgroundColor": "#f97316",
      "badgeTextColor": "#ffffff",
      "cardBackgroundColor": "#ffffff",
      "cardBorderColor": "#dbe2ea"
    }
  }'::jsonb
  UNION ALL
  SELECT 3, 'FeaturedProducts', '{
    "variant": "modern",
    "title": "Productos destacados",
    "subtitle": "Una seleccion de productos principales para consultar, comparar y sumar al pedido.",
    "ctaLabel": "Ver catalogo completo",
    "ctaLink": "/catalog",
    "styles": {
      "backgroundColor": "#ffffff",
      "cardBackgroundColor": "#ffffff",
      "titleColor": "#111827",
      "subtitleColor": "#64748b",
      "accentColor": "#f97316",
      "priceColor": "#f97316",
      "buttonBackgroundColor": "#111827",
      "buttonTextColor": "#ffffff"
    }
  }'::jsonb
  UNION ALL
  SELECT 4, 'Services', '{
    "title": "Servicios para comprar mejor",
    "subtitle": "Asesoramiento, coordinacion y respaldo para resolver productos de obra, bano y cocina.",
    "items": [
      { "icon": "support_agent", "title": "Asesoramiento tecnico", "text": "Ayudamos a elegir griferia, sanitarios y accesorios segun medidas, uso y presupuesto." },
      { "icon": "local_shipping", "title": "Entrega coordinada", "text": "Organizamos retiro o envio segun cobertura para que cada compra llegue a tiempo." },
      { "icon": "shield", "title": "Compra con respaldo", "text": "Cada pedido conserva seguimiento comercial para resolver consultas, cambios y reposiciones." }
    ],
    "styles": {
      "backgroundColor": "#111827",
      "titleColor": "#ffffff",
      "subtitleColor": "#cbd5e1",
      "cardBackgroundColor": "#1f2937",
      "cardTitleColor": "#ffffff",
      "cardTextColor": "#cbd5e1",
      "iconColor": "#f97316",
      "iconBackgroundColor": "rgba(249, 115, 22, 0.16)"
    }
  }'::jsonb
)
DELETE FROM page_sections
WHERE page_id = (SELECT id FROM selected_page)
  AND state IN ('draft', 'published');

WITH selected_page AS (
  SELECT p.id
  FROM pages p
  WHERE p.tenant_id = :tenant_id::uuid
    AND p.slug = 'home'
  LIMIT 1
),
section_seed AS (
  SELECT 1 AS sort_order, 'HeroSlider'::text AS type, '{
    "variant": "sanitarios_industrial",
    "slides": [
      {
        "label": "Sanitarios y griferia",
        "title": "TODO PARA TU OBRA",
        "description": "Griferia, sanitarios, accesorios y materiales seleccionados con asesoramiento para cada proyecto.",
        "featured": "Atencion comercial",
        "cardEyebrow": "Linea destacada",
        "cardTitle": "Catalogo sanitario",
        "specLabel": "Stock, pedidos y consultas",
        "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop",
        "primaryButtonLabel": "VER CATALOGO",
        "primaryButtonLink": "/catalog",
        "secondaryButtonLabel": "NOSOTROS",
        "secondaryButtonLink": "/about"
      }
    ],
    "styles": {
      "backgroundColor": "#f97316",
      "leftPanelColor": "#121212",
      "titleColor": "#ffffff",
      "textColor": "#f4f4f5",
      "labelColor": "#f97316",
      "primaryButtonBgColor": "#ffffff",
      "primaryButtonTextColor": "#f97316",
      "secondaryButtonBgColor": "#18181b",
      "secondaryButtonTextColor": "#ffffff",
      "secondaryButtonBorderColor": "#3f3f46"
    }
  }'::jsonb AS props
  UNION ALL
  SELECT 2, 'BrandMarquee', '{
    "variant": "grid_static",
    "eyebrow": "Nuestras marcas",
    "title": "Marcas para obra, bano y cocina",
    "subtitle": "Trabajamos lineas de griferia, sanitarios y accesorios para resolver compras con respaldo.",
    "speed": "static",
    "primaryButton": { "label": "", "link": "" },
    "items": [
      { "id": "brand-fv", "name": "FV" },
      { "id": "brand-ferrum", "name": "Ferrum" },
      { "id": "brand-roca", "name": "Roca" },
      { "id": "brand-piazza", "name": "Piazza" },
      { "id": "brand-hydros", "name": "Hydros" },
      { "id": "brand-peirano", "name": "Peirano" },
      { "id": "brand-aqualaf", "name": "Aqualaf" },
      { "id": "brand-docol", "name": "Docol" }
    ],
    "styles": {
      "backgroundColor": "#f8fafc",
      "panelBackgroundColor": "#ffffff",
      "titleColor": "#111827",
      "subtitleColor": "#64748b",
      "badgeBackgroundColor": "#f97316",
      "badgeTextColor": "#ffffff",
      "cardBackgroundColor": "#ffffff",
      "cardBorderColor": "#dbe2ea"
    }
  }'::jsonb
  UNION ALL
  SELECT 3, 'FeaturedProducts', '{
    "variant": "modern",
    "title": "Productos destacados",
    "subtitle": "Una seleccion de productos principales para consultar, comparar y sumar al pedido.",
    "ctaLabel": "Ver catalogo completo",
    "ctaLink": "/catalog",
    "styles": {
      "backgroundColor": "#ffffff",
      "cardBackgroundColor": "#ffffff",
      "titleColor": "#111827",
      "subtitleColor": "#64748b",
      "accentColor": "#f97316",
      "priceColor": "#f97316",
      "buttonBackgroundColor": "#111827",
      "buttonTextColor": "#ffffff"
    }
  }'::jsonb
  UNION ALL
  SELECT 4, 'Services', '{
    "title": "Servicios para comprar mejor",
    "subtitle": "Asesoramiento, coordinacion y respaldo para resolver productos de obra, bano y cocina.",
    "items": [
      { "icon": "support_agent", "title": "Asesoramiento tecnico", "text": "Ayudamos a elegir griferia, sanitarios y accesorios segun medidas, uso y presupuesto." },
      { "icon": "local_shipping", "title": "Entrega coordinada", "text": "Organizamos retiro o envio segun cobertura para que cada compra llegue a tiempo." },
      { "icon": "shield", "title": "Compra con respaldo", "text": "Cada pedido conserva seguimiento comercial para resolver consultas, cambios y reposiciones." }
    ],
    "styles": {
      "backgroundColor": "#111827",
      "titleColor": "#ffffff",
      "subtitleColor": "#cbd5e1",
      "cardBackgroundColor": "#1f2937",
      "cardTitleColor": "#ffffff",
      "cardTextColor": "#cbd5e1",
      "iconColor": "#f97316",
      "iconBackgroundColor": "rgba(249, 115, 22, 0.16)"
    }
  }'::jsonb
),
states AS (
  SELECT 'draft'::text AS state
  UNION ALL SELECT 'published'
)
INSERT INTO page_sections (page_id, state, type, enabled, sort_order, props)
SELECT selected_page.id, states.state, section_seed.type, true, section_seed.sort_order, section_seed.props
FROM selected_page
CROSS JOIN states
CROSS JOIN section_seed;

COMMIT;

