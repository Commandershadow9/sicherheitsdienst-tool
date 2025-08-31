-- Entferne alte Unique-Constraint über (name, address, city, postalCode)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'sites_name_address_city_postalCode_key'
  ) THEN
    DROP INDEX "sites_name_address_city_postalCode_key";
  END IF;
END $$;

-- Erzeuge neue Unique-Constraint über (name, address)
CREATE UNIQUE INDEX IF NOT EXISTS "sites_name_address_key" ON "sites" ("name", "address");

