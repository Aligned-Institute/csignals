-- 1. Create the source_registry table
CREATE TABLE IF NOT EXISTS source_registry (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  source_name   text NOT NULL,
  domain        text NOT NULL,
  connector     text NOT NULL,
  freshness_ttl interval NOT NULL,
  confidence    float NOT NULL,
  active        boolean DEFAULT true,
  config        jsonb
);

-- 2. Create the aligned_states table
CREATE TABLE IF NOT EXISTS aligned_states (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            text NOT NULL,
  version              integer NOT NULL,
  query_context        text,
  agents               jsonb NOT NULL,
  conflicts            jsonb,
  aggregate_confidence float NOT NULL,
  freshness_flags      jsonb,
  aligned_at           timestamptz DEFAULT now(),
  state_hash           text NOT NULL
);

-- 3. Enable Row-Level Security
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE aligned_states ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for source_registry
DROP POLICY IF EXISTS "Users can read source_registry by tenant_id" ON source_registry;
CREATE POLICY "Users can read source_registry by tenant_id"
  ON source_registry FOR SELECT
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id') 
    OR tenant_id = 'default-tenant'
  );

DROP POLICY IF EXISTS "Users can insert source_registry by tenant_id" ON source_registry;
CREATE POLICY "Users can insert source_registry by tenant_id"
  ON source_registry FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

DROP POLICY IF EXISTS "Users can update source_registry by tenant_id" ON source_registry;
CREATE POLICY "Users can update source_registry by tenant_id"
  ON source_registry FOR UPDATE
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- 5. Create RLS Policies for aligned_states
DROP POLICY IF EXISTS "Users can read aligned_states by tenant_id" ON aligned_states;
CREATE POLICY "Users can read aligned_states by tenant_id"
  ON aligned_states FOR SELECT
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

DROP POLICY IF EXISTS "Users can insert aligned_states by tenant_id" ON aligned_states;
CREATE POLICY "Users can insert aligned_states by tenant_id"
  ON aligned_states FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- 6. Seed the source registry for default and test tenants
INSERT INTO source_registry (tenant_id, source_name, domain, connector, freshness_ttl, confidence)
VALUES
  ('default-tenant', 'yfinance_commodity', 'commodity', 'CommodityAgent', '2 minutes', 0.95),
  ('default-tenant', 'fred_macro', 'macro', 'MacroAgent', '1 day', 0.90),
  ('default-tenant', 'rss_news', 'news', 'NewsAgent', '15 minutes', 0.80),
  ('default-tenant', 'feedstock_chain', 'domain', 'FeedstockAgent', '5 minutes', 0.85)
ON CONFLICT DO NOTHING;

INSERT INTO source_registry (tenant_id, source_name, domain, connector, freshness_ttl, confidence)
VALUES
  ('tenant-test-123', 'yfinance_commodity', 'commodity', 'CommodityAgent', '2 minutes', 0.95),
  ('tenant-test-123', 'fred_macro', 'macro', 'MacroAgent', '1 day', 0.90),
  ('tenant-test-123', 'rss_news', 'news', 'NewsAgent', '15 minutes', 0.80),
  ('tenant-test-123', 'feedstock_chain', 'domain', 'FeedstockAgent', '5 minutes', 0.85)
ON CONFLICT DO NOTHING;

-- 7. Add aligned_states to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Check if table is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'aligned_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE aligned_states;
  END IF;
END $$;
