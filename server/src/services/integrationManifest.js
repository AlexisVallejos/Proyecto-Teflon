import crypto from 'crypto';

const PRICE_TIER_FIELDS = Array.from({ length: 10 }, (_, index) => ({
  key: `price_${index + 1}`,
  type: 'number',
  required: false,
  description: `Precio libre ${index + 1}. El ecommerce lo guarda como tarifa sincronizada sin asumir el nombre comercial.`,
}));

const PRODUCT_FIELDS = [
  {
    key: 'external_id',
    type: 'string',
    required: true,
    description: 'Identificador unico y estable del producto en el sistema de gestion.',
  },
  {
    key: 'sku',
    type: 'string',
    required: false,
    description: 'Codigo comercial o SKU del producto.',
  },
  {
    key: 'name',
    type: 'string',
    required: false,
    description: 'Nombre oficial del producto.',
  },
  {
    key: 'description',
    type: 'string',
    required: false,
    description: 'Descripcion ampliada o texto informativo del articulo.',
  },
  {
    key: 'short_description',
    type: 'string',
    required: false,
    description: 'Descripcion corta para catalogo, cards y destacados.',
  },
  {
    key: 'brand',
    type: 'string',
    required: false,
    description: 'Marca del producto si existe en el sistema de gestion.',
  },
  ...PRICE_TIER_FIELDS,
  {
    key: 'stock',
    type: 'number',
    required: false,
    description: 'Cantidad disponible en stock.',
  },
  {
    key: 'is_active',
    type: 'boolean',
    required: false,
    description: 'Indica si el producto sigue activo en el sistema de gestion.',
  },
  {
    key: 'images',
    type: 'string[]',
    required: false,
    description: 'Lista de URLs publicas de imagenes.',
  },
  {
    key: 'category_id',
    type: 'uuid',
    required: false,
    description: 'UUID real de una categoria principal ya creada en el ecommerce.',
  },
  {
    key: 'category_ids',
    type: 'uuid[]',
    required: false,
    description: 'Lista de UUIDs de categorias del ecommerce para asociar el producto.',
  },
  {
    key: 'category_path',
    type: 'string|string[]',
    required: false,
    description: 'Jerarquia recomendada para el sync. Ejemplo: Categoria > Gran Familia > Familia.',
  },
  {
    key: 'updated_at',
    type: 'datetime',
    required: false,
    description: 'Fecha de ultima modificacion para sync incremental.',
  },
];

const SAMPLE_PAYLOAD = {
  source_system: 'sistema-gestion-teflon',
  items: [
    {
      external_id: 'PROD-1001',
      sku: 'PROD-1001',
      name: 'Producto ejemplo',
      short_description: 'Texto corto para cards y listados.',
      description: 'Descripcion ampliada del producto',
      brand: 'Marca Test',
      price_1: 24990,
      price_2: 21990,
      price_3: 20990,
      stock: 15,
      is_active: true,
      images: [
        'https://dominio-del-sistema.com/imagenes/prod-1001.jpg',
      ],
      category_path: 'Sanitarios > Griferia > Monocomando',
      updated_at: '2026-03-14T15:00:00.000Z',
    },
  ],
};

const LEGACY_SAMPLE_PAYLOAD = {
  source_system: 'gestion-escritorio',
    producto: {
      codigo_propio: '666',
      detalle_ampliado: 'ABLANDADOR AGUA AF1500 FLUVIAL',
      detalle_abreviado: 'ABLANDADOR AGUA AF1500 FLUVIAL',
      texto_asociado: 'Descripcion ampliada del articulo enviada por el sistema de gestion.',
      jerarquia_categoria: 'Tratamiento de agua > Ablandadores',
      precio_1: 1465583,
      precio_2: 1399000,
      precio_3: 1325000,
      disponibilidad: 12,
    activo: true,
    imagenes: [
      'https://dominio-del-sistema.com/imagenes/666_1.jpg',
      'https://dominio-del-sistema.com/imagenes/666_2.jpg',
    ],
  },
};

export const buildProductSyncCompatibilitySecret = ({ tenantId, tokenValue }) => {
  const normalizedTenant = String(tenantId || '').trim();
  const normalizedToken = String(tokenValue || '').trim();
  if (!normalizedTenant || !normalizedToken) return null;

  const salt = String(
    process.env.INTEGRATIONS_COMPAT_SECRET_SALT ||
    process.env.APP_SECRET ||
    'teflon-integrations-compat'
  );

  return crypto
    .createHmac('sha256', salt)
    .update(`${normalizedTenant}:${normalizedToken}`)
    .digest('hex');
};

export const resolveServerBaseUrl = (req) => {
  const envBase =
    process.env.INTEGRATIONS_PUBLIC_BASE_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    '';
  if (envBase) {
    return String(envBase).replace(/\/+$/, '');
  }

  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:4000';
  return `${protocol}://${host}`.replace(/\/+$/, '');
};

export const buildProductSyncSchema = (baseUrl) => ({
  integration: 'product_sync',
  version: 1,
  base_url: baseUrl,
  endpoints: {
    ping_url: `${baseUrl}/api/v1/integrations/ping`,
    sync_products_url: `${baseUrl}/api/v1/integrations/products/sync`,
    schema_product_url: `${baseUrl}/api/v1/integrations/schema/product`,
  },
  auth: {
    accepted_headers: ['x-api-key', 'Authorization: Bearer TOKEN', 'x-tenant-id'],
    required_scope: 'products:sync',
  },
  notes: [
    'Stock viaja dentro del item de producto. No hace falta un endpoint separado para stock.',
    'El campo external_id es obligatorio para crear o actualizar sin ambiguedad.',
    'La API acepta hasta 10 tarifas libres mediante price_1 hasta price_10.',
    'El contrato publicado recomienda enviar solo price_1 hasta price_10; los aliases legacy siguen aceptandose solo por compatibilidad interna.',
    'Usa category_path para enviar el arbol Categoria > Gran Familia > Familia. category_id queda reservado para un UUID real de categoria del ecommerce.',
    'Si envias category_path, evita duplicarlo con campos legacy como family, grand_family, familia o gran_familia.',
  ],
  fields: PRODUCT_FIELDS,
  sample_payload: SAMPLE_PAYLOAD,
});

export const buildTenantIntegrationManifest = ({ baseUrl, tenantId, tokenRecord = null }) => {
  const schema = buildProductSyncSchema(baseUrl);
  const consumerKey = tokenRecord?.token_hash || null;
  const consumerSecret = buildProductSyncCompatibilitySecret({
    tenantId,
    tokenValue: consumerKey,
  });

  return {
    tenant_id: tenantId,
    auth: {
      scope: 'products:sync',
      header_name: 'x-api-key',
      bearer_supported: true,
      token_name: tokenRecord?.name || null,
      token: tokenRecord?.token_hash || null,
    },
    endpoints: schema.endpoints,
    schema,
    compatibility: {
      mode: 'consumer_key_secret',
      domain: baseUrl,
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      endpoints: {
        ping_url: `${baseUrl}/api/v1/integrations/gestion/ping`,
        product_url: `${baseUrl}/api/v1/integrations/gestion/producto`,
        products_url: `${baseUrl}/api/v1/integrations/gestion/productos`,
      },
      notes: [
        'Pensado para sistemas de gestion que solo permiten configurar Dominio, Consumer Key y Consumer Secret.',
        'Acepta un producto por request o un lote de productos.',
        'Tambien acepta x-www-form-urlencoded ademas de JSON.',
      ],
      sample_payload: LEGACY_SAMPLE_PAYLOAD,
    },
  };
};
