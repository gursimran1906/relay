# Supabase Storage Setup for Issue Attachments (Private/Authenticated Access)

This guide will help you set up Supabase storage for handling issue image attachments with authenticated-only access.

## 1. Create Storage Bucket

Go to your Supabase dashboard → Storage → Create bucket

- **Bucket name**: `issue-attachments`
- **Public bucket**: ❌ (Disable this - keep it private)
- **File size limit**: 10MB (or as needed)
- **Allowed MIME types**: `image/*`

## 2. Set Storage Policies (Authenticated Users Only)

In the Supabase dashboard → Storage → `issue-attachments` → Policies

### Allow Authenticated Uploads

```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'issue-attachments');
```

### Allow Authenticated Downloads

```sql
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'issue-attachments');
```

### Optional: Allow Authenticated Updates

```sql
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'issue-attachments')
WITH CHECK (bucket_id = 'issue-attachments');
```

### Optional: Allow Authenticated Deletes

```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'issue-attachments');
```

## 3. Bucket Configuration

Make sure your bucket is configured with:

- **Public**: ❌ Disabled (Private bucket)
- **File size limit**: 10485760 bytes (10MB)
- **Allowed MIME types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/gif`
  - `image/webp`

## 4. Alternative: SQL Script

You can also run this SQL in the Supabase SQL editor:

```sql
-- Create the bucket (if not exists) - PRIVATE bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-attachments', 'issue-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for authenticated users only
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'issue-attachments');

CREATE POLICY IF NOT EXISTS "Allow authenticated downloads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'issue-attachments');

CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'issue-attachments')
WITH CHECK (bucket_id = 'issue-attachments');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'issue-attachments');
```

## 5. Environment Variables

Make sure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 6. How Private Access Works

With a private bucket:

1. **Upload**: Users can upload images through the authenticated API
2. **Access**: Images are accessed via signed URLs that expire after a set time
3. **Security**: Only authenticated users can access images
4. **No Direct Links**: Images can't be accessed directly via public URLs

## 7. Testing

After setup, test the upload functionality:

1. Make sure you're logged in to the application
2. Go to your report page (`/report/[uid]`)
3. Try uploading an image
4. Check that the image appears in your Supabase storage bucket
5. Verify the image displays correctly in the issues list (via signed URLs)

## 8. Folder Structure

Images will be stored in the following structure:

```
issue-attachments/ (PRIVATE)
└── issue-images/
    ├── assetId-timestamp.jpg
    ├── assetId-timestamp.png
    └── ...
```

## 9. Important Security Notes

- Images are only accessible to authenticated users
- Direct URLs won't work - images are served via signed URLs
- Signed URLs expire for additional security
- Perfect for sensitive issue reporting where privacy is important
