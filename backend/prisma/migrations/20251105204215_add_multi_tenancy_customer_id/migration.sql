-- 🔐 MULTI-TENANCY: Add customerId to users table
-- This migration enables customer-level data isolation

-- Step 1: Add customerId column (NULLABLE initially for existing users)
ALTER TABLE "users" ADD COLUMN "customerId" TEXT;

-- Step 2: Create a default customer if none exists (for existing users)
-- Check if there are any users without a customer
DO $$
DECLARE
    default_customer_id TEXT;
    user_count INT;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM "users";

    IF user_count > 0 THEN
        -- Check if a customer exists
        SELECT "id" INTO default_customer_id FROM "customers" LIMIT 1;

        IF default_customer_id IS NULL THEN
            -- Create a default customer for migration
            INSERT INTO "customers" (
                "id",
                "companyName",
                "primaryContact",
                "address",
                "city",
                "postalCode",
                "country",
                "createdAt",
                "updatedAt"
            ) VALUES (
                gen_random_uuid()::text,
                'Standard Kunde (Migration)',
                '{"name": "Migration Admin", "email": "admin@migration.local", "phone": "+49000000000", "position": "Admin"}'::jsonb,
                'Migration Straße 1',
                'Migration Stadt',
                '00000',
                'Deutschland',
                NOW(),
                NOW()
            )
            RETURNING "id" INTO default_customer_id;

            RAISE NOTICE 'Created default customer with ID: %', default_customer_id;
        END IF;

        -- Assign all existing users to this customer
        UPDATE "users" SET "customerId" = default_customer_id WHERE "customerId" IS NULL;

        RAISE NOTICE 'Assigned % users to customer %', user_count, default_customer_id;
    END IF;
END $$;

-- Step 3: Make customerId NOT NULL (after assigning existing users)
ALTER TABLE "users" ALTER COLUMN "customerId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Add index for performance
CREATE INDEX "users_customer_idx" ON "users"("customerId");

-- Step 6: Update sites.customerId to match (if sites exist without customer)
UPDATE "sites"
SET "customerId" = (SELECT "customerId" FROM "users" LIMIT 1)
WHERE "customerId" IS NULL;
