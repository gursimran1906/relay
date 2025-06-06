-- Add UID column to items table for secure QR code generation
-- This allows QR codes to use UUIDs instead of sequential IDs for security

-- Add uid column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'items' 
        AND column_name = 'uid'
    ) THEN
        ALTER TABLE items ADD COLUMN uid UUID DEFAULT extensions.uuid_generate_v4() NOT NULL;
    END IF;
END $$;

-- Create unique index on uid
CREATE UNIQUE INDEX IF NOT EXISTS items_uid_key ON items(uid);

-- Ensure all existing items have UIDs
UPDATE items SET uid = extensions.uuid_generate_v4() WHERE uid IS NULL; 