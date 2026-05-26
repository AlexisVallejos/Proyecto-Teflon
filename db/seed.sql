BEGIN;

WITH seed AS (
  SELECT
    '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id,
    'PIQUIM'::text AS tenant_name,
    'localhost'::text AS domain,
    'admin@piquim.local'::text AS admin_email,
    '$2a$10$hE0tkmdmSK4yBrODZ6VsNeC.twjKZHiH6jcG4z79ysV17hwKo636a'::text AS password_hash
)
INSERT INTO tenants (id, name, status)
SELECT tenant_id, tenant_name, 'active'
FROM seed
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

WITH seed AS (
  SELECT
    '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id,
    'localhost'::text AS domain
)
INSERT INTO tenant_domains (tenant_id, domain, is_primary)
SELECT tenant_id, domain, true
FROM seed
ON CONFLICT (domain) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  is_primary = EXCLUDED.is_primary;

WITH seed AS (
  SELECT
    '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO tenant_settings (tenant_id, branding, theme, commerce)
SELECT
  tenant_id,
  '{
    "name": "PIQUIM",
    "logo_url": "",
    "design_preset": "piquim",
    "navbar": {
      "links": [
        { "label": "Inicio", "href": "/" },
        { "label": "Catalogo", "href": "/catalog" },
        { "label": "Nosotros", "href": "/about" }
      ]
    },
    "catalog_cards": [
      { "id": "heladeria", "title": "Heladeria", "prefix": "01 - Frio que enamora", "description": "Materia prima para la elaboracion de helados artesanales, bases estables y terminaciones con sabor propio.", "tags": ["Pulpas", "Variegattos", "Bases", "Neutros"], "image": "/piquim/catalog-heladeria.jpg", "category": "Heladeria" },
      { "id": "panaderia", "title": "Panaderia/Confiteria", "prefix": "02 - Hornear y decorar", "description": "Premezclas, mejoradores, cremas y bases para panaderia, reposteria y confiteria profesional.", "tags": ["Premezclas", "Mejoradores", "Cremas", "DDL"], "image": "/piquim/catalog-panaderia.jpg", "category": "Panaderia" }
    ],
    "footer": {
      "description": "Materia prima premium para heladerias, panaderias y confiterias. Mar del Plata, desde 1992.",
      "quickLinks": [
        { "label": "Catalogo", "href": "/catalog" },
        { "label": "Nosotros", "href": "/about" }
      ],
      "shopLinks": [
        { "label": "Heladeria", "href": "/catalog?category=Heladeria" },
        { "label": "Panaderia/Confiteria", "href": "/catalog?category=panaderia" },
        { "label": "Promociones", "href": "/catalog" }
      ],
      "helpLinks": [
        { "label": "Envios y entregas", "href": "/about" },
        { "label": "Pagos y facturacion", "href": "/checkout" },
        { "label": "Cambios y devoluciones", "href": "/about" },
        { "label": "Preguntas frecuentes", "href": "/about" }
      ],
      "legalLinks": [
        { "label": "Terminos", "href": "/terms" },
        { "label": "Privacidad", "href": "/privacy" },
        { "label": "Cookies", "href": "/privacy" },
        { "label": "Defensa al consumidor", "href": "/about" }
      ],
      "newsletter": {
        "enabled": true,
        "title": "Novedades para profesionales",
        "description": "Recibi lanzamientos, promociones y catalogos tecnicos en tu correo.",
        "placeholder": "tu@email.com",
        "buttonLabel": "Suscribirme"
      },
      "legalText": "(c) 2026 Piquim Profesional S.A. - Mar del Plata, Argentina - CUIT 30-XXXXXXXX-X",
      "contact": {
        "address": "Mar del Plata, Argentina",
        "phone": "",
        "email": "ventas@piquim.local"
      },
      "socials": {
        "instagram": "",
        "facebook": "",
        "youtube": "",
        "tiktok": "",
        "whatsapp": ""
      }
    }
  }'::jsonb,
  '{
    "mode": "light",
    "primary": "#ff4d00",
    "accent": "#ff7a2f",
    "background": "#fffaf6",
    "text": "#1a1614",
    "secondary": "#6f625d",
    "font_family": "Gilroy, Manrope, sans-serif",
    "catalog": {
      "panel_bg": "#fff3eb",
      "surface_bg": "#fffaf6",
      "card_bg": "#ffffff",
      "border": "#dab6a6",
      "muted_text": "#7b665d"
    }
  }'::jsonb,
  '{
    "mode": "both",
    "currency": "ARS",
    "locale": "es-AR",
    "show_prices": true,
    "show_stock": true,
    "reviews_enabled": true,
    "tax_rate": 0.21,
    "whatsapp_number": "",
    "address": "Mar del Plata, Argentina",
    "email": "ventas@piquim.local",
    "order_notification_email": "",
    "payment_methods": ["transfer", "cash_on_pickup"],
    "default_delivery": "distance:auto",
    "shipping_zones": [
      {
        "id": "mdp-free",
        "name": "Entrega sin cargo",
        "description": "Hasta 5 km de la sucursal principal",
        "price": 0,
        "type": "distance",
        "branch_id": "branch-mdq",
        "min_distance_km": 0,
        "max_distance_km": 5,
        "enabled": true
      },
      {
        "id": "mdp-mid",
        "name": "Zona media",
        "description": "De 5 a 10 km desde la sucursal principal",
        "price": 3500,
        "type": "distance",
        "branch_id": "branch-mdq",
        "min_distance_km": 5,
        "max_distance_km": 10,
        "enabled": true
      },
      {
        "id": "mdp-extended",
        "name": "Zona extendida",
        "description": "De 10 a 20 km desde la sucursal principal",
        "price": 6500,
        "type": "distance",
        "branch_id": "branch-mdq",
        "min_distance_km": 10,
        "max_distance_km": 20,
        "enabled": true
      },
      {
        "id": "arg-general",
        "name": "Envio nacional",
        "description": "Cobertura nacional fuera del radio local",
        "price": 1500,
        "type": "flat",
        "enabled": true
      }
    ],
    "branches": [
      {
        "id": "branch-mdq",
        "name": "Sucursal principal",
        "address": "Av. Independencia 1234",
        "hours": "Lun a Sab 9:00-18:00",
        "phone": "",
        "pickup_fee": 0,
        "latitude": -38.00548,
        "longitude": -57.54261,
        "enabled": true
      }
    ],
    "bank_transfer": {
      "cbu": "",
      "alias": "",
      "bank": "",
      "holder": ""
    }
  }'::jsonb
FROM seed
ON CONFLICT (tenant_id) DO UPDATE
SET
  branding = EXCLUDED.branding,
  theme = EXCLUDED.theme,
  commerce = EXCLUDED.commerce,
  updated_at = now();

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO price_lists (tenant_id, name, type, rules_json)
SELECT tenant_id, 'Retail', 'retail', '{}'::jsonb FROM seed
ON CONFLICT (tenant_id, name) DO UPDATE
SET
  type = EXCLUDED.type,
  rules_json = EXCLUDED.rules_json;

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO price_lists (tenant_id, name, type, rules_json)
SELECT tenant_id, 'Mayorista', 'wholesale', '{}'::jsonb FROM seed
ON CONFLICT (tenant_id, name) DO UPDATE
SET
  type = EXCLUDED.type,
  rules_json = EXCLUDED.rules_json;

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO price_lists (tenant_id, name, type, rules_json)
SELECT tenant_id, 'Especial', 'special', '{}'::jsonb FROM seed
ON CONFLICT (tenant_id, name) DO UPDATE
SET
  type = EXCLUDED.type,
  rules_json = EXCLUDED.rules_json;

WITH seed AS (
  SELECT
    'admin@piquim.local'::text AS admin_email,
    '$2a$10$hE0tkmdmSK4yBrODZ6VsNeC.twjKZHiH6jcG4z79ysV17hwKo636a'::text AS password_hash
)
INSERT INTO users (email, password_hash, role, status)
SELECT admin_email, password_hash, 'tenant_admin', 'active'
FROM seed
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

WITH seed AS (
  SELECT
    '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id,
    'admin@piquim.local'::text AS admin_email
),
admin_user AS (
  SELECT id
  FROM users
  WHERE email = (SELECT admin_email FROM seed)
)
INSERT INTO user_tenants (user_id, tenant_id, role, status)
SELECT admin_user.id, seed.tenant_id, 'tenant_admin', 'active'
FROM admin_user, seed
ON CONFLICT (user_id, tenant_id) DO UPDATE
SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO api_tokens (tenant_id, name, token_hash, scope)
SELECT tenant_id, 'ERP Sync Local', 'erp-sync-local-001', 'products:sync'
FROM seed
WHERE NOT EXISTS (
  SELECT 1
  FROM api_tokens
  WHERE tenant_id = (SELECT tenant_id FROM seed)
    AND token_hash = 'erp-sync-local-001'
);

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
DELETE FROM categories
WHERE tenant_id = (SELECT tenant_id FROM seed);

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO categories (tenant_id, name, slug, data)
SELECT tenant_id, 'Heladeria', 'heladeria', '{}'::jsonb FROM seed
UNION ALL
SELECT tenant_id, 'Panaderia/Confiteria', 'panaderia', '{}'::jsonb
FROM seed
ON CONFLICT (tenant_id, slug) DO NOTHING;

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO pages (tenant_id, slug)
SELECT tenant_id, 'home'
FROM seed
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
  updated_at = now();

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO pages (tenant_id, slug)
SELECT tenant_id, 'about'
FROM seed
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
  updated_at = now();

WITH home_page AS (
  SELECT id
  FROM pages
  WHERE tenant_id = '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid
    AND slug = 'home'
)
DELETE FROM page_sections
WHERE page_id = (SELECT id FROM home_page);

WITH home_page AS (
  SELECT id
  FROM pages
  WHERE tenant_id = '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid
    AND slug = 'home'
)
INSERT INTO page_sections (page_id, state, type, enabled, sort_order, props)
SELECT id, 'published', 'PiquimHero', true, 1, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'published', 'PiquimAnnounceBar', true, 2, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'published', 'PiquimTresMundos', true, 3, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'published', 'PiquimCatalog3Panel', true, 4, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'published', 'PiquimFeaturedProducts', true, 5, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'published', 'PiquimCTABanner', true, 6, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimHero', true, 1, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimAnnounceBar', true, 2, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimTresMundos', true, 3, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimCatalog3Panel', true, 4, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimFeaturedProducts', true, 5, '{}'::jsonb FROM home_page
UNION ALL
SELECT id, 'draft', 'PiquimCTABanner', true, 6, '{}'::jsonb FROM home_page;

WITH seed AS (
  SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid AS tenant_id
)
INSERT INTO product_cache (
  tenant_id,
  erp_id,
  sku,
  name,
  description,
  price,
  price_wholesale,
  currency,
  stock,
  brand,
  status,
  data
)
SELECT
  tenant_id,
  'ERP-001',
  'PROD-001',
  'Base neutra para helado artesanal',
  'Materia prima profesional para heladerias que necesitan textura estable, buen rendimiento y sabor limpio.',
  15000.00,
  12000.00,
  'ARS',
  50,
  'PIQUIM',
  'active',
  '{
    "short_description": "Base profesional para elaboracion de helados artesanales.",
    "image": "/piquim/product-bucket.png"
  }'::jsonb
FROM seed
ON CONFLICT (tenant_id, erp_id) DO UPDATE
SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_wholesale = EXCLUDED.price_wholesale,
  currency = EXCLUDED.currency,
  stock = EXCLUDED.stock,
  brand = EXCLUDED.brand,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

WITH product_ref AS (
  SELECT id, tenant_id
  FROM product_cache
  WHERE tenant_id = '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid
    AND erp_id = 'ERP-001'
),
category_ref AS (
  SELECT id
  FROM categories
  WHERE tenant_id = '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid
    AND slug = 'heladeria'
)
INSERT INTO product_categories (product_id, category_id)
SELECT product_ref.id, category_ref.id
FROM product_ref, category_ref
ON CONFLICT (product_id, category_id) DO NOTHING;

WITH product_ref AS (
  SELECT id
  FROM product_cache
  WHERE tenant_id = '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid
    AND erp_id = 'ERP-001'
)
INSERT INTO product_overrides (tenant_id, product_id, hidden, featured, sort_order)
SELECT '636736e2-e135-44cd-ac5c-5d4ccb839a73'::uuid, id, false, true, 0
FROM product_ref
ON CONFLICT (tenant_id, product_id) DO UPDATE
SET
  hidden = EXCLUDED.hidden,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order;

COMMIT;
