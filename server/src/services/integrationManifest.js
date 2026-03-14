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
    key: 'brand',
    type: 'string',
    required: false,
    description: 'Marca del producto si existe en el sistema de gestion.',
  },
  {
    key: 'price_retail',
    type: 'number',
    required: false,
    description: 'Precio de venta principal para web o lista minorista.',
  },
  {
    key: 'price_wholesale',
    type: 'number',
    required: false,
    description: 'Precio mayorista si la gestion lo maneja por separado.',
  },
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
    key: 'category',
    type: 'string',
    required: false,
    description: 'Familia o categoria principal. Se recomienda enviarla para futuros mapeos.',
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
      description: 'Descripcion ampliada del producto',
      brand: 'Marca Test',
      price_retail: 24990,
      price_wholesale: 21990,
      stock: 15,
      is_active: true,
      images: [
        'https://dominio-del-sistema.com/imagenes/prod-1001.jpg',
      ],
      category: 'Bombas',
      updated_at: '2026-03-14T15:00:00.000Z',
    },
  ],
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
    'Si la gestion maneja hasta 10 tarifas, se recomienda enviar al menos price_retail y price_wholesale.',
  ],
  fields: PRODUCT_FIELDS,
  sample_payload: SAMPLE_PAYLOAD,
});

export const buildTenantIntegrationManifest = ({ baseUrl, tenantId, tokenRecord = null }) => {
  const schema = buildProductSyncSchema(baseUrl);

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
  };
};
