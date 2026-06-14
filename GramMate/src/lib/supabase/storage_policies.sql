-- Supabase Storage policies guidance and example for avatars bucket
-- Run in Supabase SQL editor

-- Storage policies use the "storage.objects" table in the storage schema
-- Example policy: allow users to insert objects under their own folder (prefix: "{user_id}/...")

-- Allow authenticated users to upload objects under their own user folder
CREATE POLICY "Allow upload to own folder" ON storage.objects
FOR INSERT USING (
  auth.role() = 'authenticated' AND
  (bucket_id = 'avatars' OR bucket_id = 'videos') AND
  lower(split_part(name, '/', 1)) = lower(auth.uid())
) WITH CHECK (
  lower(split_part(name, '/', 1)) = lower(auth.uid())
);

-- Allow authenticated users to select (read) public files in avatars/videos buckets
CREATE POLICY "Allow public read for files" ON storage.objects
FOR SELECT USING (
  (bucket_id = 'avatars' OR bucket_id = 'videos') AND
  (metadata->>'public' = 'true' OR true) -- adjust to restrict to public objects only
);

-- Allow delete only for object owner or service_role
CREATE POLICY "Allow delete own" ON storage.objects
FOR DELETE USING (
  lower(split_part(name, '/', 1)) = lower(auth.uid()) OR auth.role() = 'service_role'
);

-- Note: Supabase dashboard > Storage > Policies provides UI to manage these policies; the SQL approach is shown for automation.
