WITH new_tenant AS (
  INSERT INTO tenants (name, status)
  VALUES ('Sanitarios El Teflon', 'active')
  RETURNING id
), new_domain AS (
  INSERT INTO tenant_domains (tenant_id, domain, is_primary)
  SELECT id, 'elteflon.local', true FROM new_tenant
  RETURNING tenant_id
), new_settings AS (
  INSERT INTO tenant_settings (tenant_id, branding, theme, commerce)
  SELECT
    id,
    '{"name":"Sanitarios El Teflon","logo_url":""}'::jsonb,
    '{"primary":"#f97316","font_family":"Inter"}'::jsonb,
    '{"mode":"hybrid","currency":"ARS","whatsapp_number":""}'::jsonb
  FROM new_tenant
  RETURNING tenant_id
), new_price_lists AS (
  INSERT INTO price_lists (tenant_id, name, type, rules_json)
  SELECT id, 'Retail', 'retail', '{}'::jsonb FROM new_tenant
  UNION ALL
  SELECT id, 'Mayorista', 'wholesale', '{}'::jsonb FROM new_tenant
  UNION ALL
  SELECT id, 'Especial', 'special', '{}'::jsonb FROM new_tenant
  RETURNING id, tenant_id
), new_admin_user AS (
  INSERT INTO users (email, password_hash, role, status)
  VALUES (
    'admin@teflon.local',
    '$2a$10$hE0tkmdmSK4yBrODZ6VsNeC.twjKZHiH6jcG4z79ysV17hwKo636a',
    'tenant_admin',
    'active'
  )
  RETURNING id
), new_admin_membership AS (
  INSERT INTO user_tenants (user_id, tenant_id, role, status)
  SELECT new_admin_user.id, new_tenant.id, 'tenant_admin', 'active'
  FROM new_admin_user, new_tenant
  RETURNING user_id
), new_page AS (
  INSERT INTO pages (tenant_id, slug)
  SELECT id, 'home' FROM new_tenant
  RETURNING id
), new_category AS (
  INSERT INTO categories (tenant_id, name, slug)
  SELECT id, 'Grifería', 'griferia' FROM new_tenant
  RETURNING id
)
INSERT INTO product_cache (tenant_id, erp_id, sku, name, description, price, price_wholesale, currency, stock, brand, status)
SELECT 
  t.id, 
  'ERP-001', 
  'GRIF-01', 
  'Juego de Baño', 
  'Excelente juego de baño completo.', 
  15000.00, 
  12000.00, 
  'ARS', 
  50, 
  'FV', 
  'active'
FROM new_tenant t;

INSERT INTO page_sections (page_id, state, type, enabled, sort_order, props)
SELECT new_page.id, 'published', 'HeroSlider', true, 1, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page
UNION ALL
SELECT new_page.id, 'published', 'FeaturedProducts', true, 2, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page
UNION ALL
SELECT new_page.id, 'published', 'Services', true, 3, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page
UNION ALL
SELECT new_page.id, 'draft', 'HeroSlider', true, 1, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page
UNION ALL
SELECT new_page.id, 'draft', 'FeaturedProducts', true, 2, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page
UNION ALL
SELECT new_page.id, 'draft', 'Services', true, 3, '{}'::jsonb FROM (SELECT id FROM pages WHERE slug = 'home' LIMIT 1) as new_page;
