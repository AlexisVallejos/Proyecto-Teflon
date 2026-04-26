CREATE TABLE IF NOT EXISTS consortium_config (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  monthly_fee numeric(12,2) NOT NULL DEFAULT 1,
  max_active_clubs int NOT NULL DEFAULT 200,
  reminder_days int NOT NULL DEFAULT 5,
  quota_due_day int NOT NULL DEFAULT 10,
  bank_transfer jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consortium_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  responsable text NOT NULL,
  email text NOT NULL,
  telefono text,
  cuit text,
  direccion text,
  estado text NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS consortium_clubs_tenant_estado_idx
  ON consortium_clubs(tenant_id, estado);

CREATE INDEX IF NOT EXISTS consortium_clubs_tenant_user_idx
  ON consortium_clubs(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS consortium_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES consortium_clubs(id) ON DELETE CASCADE,
  mes text NOT NULL CHECK (mes ~ '^[0-9]{4}-[0-9]{2}$'),
  monto numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'pagada', 'vencida')),
  fecha_vencimiento date,
  fecha_pago timestamptz,
  comprobante_url text,
  notification_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, club_id, mes)
);

CREATE INDEX IF NOT EXISTS consortium_quotas_tenant_mes_estado_idx
  ON consortium_quotas(tenant_id, mes, estado);

CREATE INDEX IF NOT EXISTS consortium_quotas_club_mes_idx
  ON consortium_quotas(club_id, mes DESC);

CREATE TABLE IF NOT EXISTS consortium_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mes text NOT NULL CHECK (mes ~ '^[0-9]{4}-[0-9]{2}$'),
  ejecutado_por uuid REFERENCES users(id) ON DELETE SET NULL,
  ganadores jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mes)
);

CREATE INDEX IF NOT EXISTS consortium_draws_tenant_mes_idx
  ON consortium_draws(tenant_id, mes DESC);
