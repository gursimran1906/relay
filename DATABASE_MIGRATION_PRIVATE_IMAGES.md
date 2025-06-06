# Database Migration: Private Image Storage

This migration updates the database to support private image storage with Supabase.

## Changes Required

1. **Rename Column**: Change `image_url` to `image_path` in the `issues` table
2. **Update Data**: Convert any existing URLs to paths (if applicable)

## SQL Migration Script

Run this SQL in your Supabase SQL editor:

```sql
-- Step 1: Add new image_path column
ALTER TABLE issues
ADD COLUMN image_path TEXT;

-- Step 2: Copy data from image_url to image_path (if you have existing data)
-- Note: This is only needed if you have existing images stored as URLs
UPDATE issues
SET image_path = image_url
WHERE image_url IS NOT NULL;

-- Step 3: Drop the old image_url column
ALTER TABLE issues
DROP COLUMN image_url;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN issues.image_path IS 'Path to image in Supabase storage (private bucket)';
```

## Alternative: If you want to keep both columns temporarily

```sql
-- Add the new column while keeping the old one
ALTER TABLE issues
ADD COLUMN image_path TEXT;

-- Add comment
COMMENT ON COLUMN issues.image_path IS 'Path to image in Supabase storage (private bucket)';
COMMENT ON COLUMN issues.image_url IS 'Deprecated: Use image_path instead';
```

## Verification

After running the migration, verify the changes:

```sql
-- Check the table structure
\d issues;

-- Or use this query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'issues'
AND column_name IN ('image_path', 'image_url');
```

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Add back the image_url column
ALTER TABLE issues
ADD COLUMN image_url TEXT;

-- Copy data back (if needed)
UPDATE issues
SET image_url = image_path
WHERE image_path IS NOT NULL;

-- Drop image_path column
ALTER TABLE issues
DROP COLUMN image_path;
```

## Notes

- **Backup First**: Always backup your database before running migrations
- **Test Environment**: Run this in a test environment first
- **Existing Images**: If you have existing images stored as public URLs, you'll need to migrate them to the private storage
- **Application Code**: Make sure all application code is updated to use `image_path` before running the migration
