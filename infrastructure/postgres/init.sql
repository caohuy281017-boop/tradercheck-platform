CREATE SCHEMA IF NOT EXISTS tradecheck;

CREATE TABLE IF NOT EXISTS tradecheck.ai_runs (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  input_hash TEXT NOT NULL,
  result JSONB,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_runs_user_created_idx
  ON tradecheck.ai_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tradecheck.audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT,
  request_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  result TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_user_time_idx
  ON tradecheck.audit_events (user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS tradecheck.trade_extensions (
  trade_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  broker TEXT NOT NULL,
  exchange TEXT NOT NULL,
  fee NUMERIC(20, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(20, 2) NOT NULL DEFAULT 0,
  source_fingerprint TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tradecheck.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradecheck.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradecheck.trade_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_runs_owner ON tradecheck.ai_runs
  USING (user_id = current_setting('app.user_id', true));
CREATE POLICY audit_events_owner ON tradecheck.audit_events
  USING (user_id = current_setting('app.user_id', true));
CREATE POLICY trade_extensions_owner ON tradecheck.trade_extensions
  USING (user_id = current_setting('app.user_id', true));
