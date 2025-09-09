-- Create Enum for DevicePlatform
DO $$ BEGIN
  CREATE TYPE "DevicePlatform" AS ENUM ('IOS','ANDROID','WEB');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create table device_tokens
CREATE TABLE IF NOT EXISTS "device_tokens" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastUsedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK
ALTER TABLE "device_tokens"
  ADD CONSTRAINT IF NOT EXISTS "device_tokens_user_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS "device_tokens_user_idx" ON "device_tokens" ("userId");

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_device_tokens ON "device_tokens";
CREATE TRIGGER set_updated_at_on_device_tokens
BEFORE UPDATE ON "device_tokens"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

