-- Enable RLS on the storage.objects and storage.buckets table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create character-profile-pics bucket
INSERT INTO
  storage.buckets (id, name, file_size_limit, allowed_mime_types, public)
VALUES
  (
    'character-profile-pics',
    'character-profile-pics',
    104857600, -- 100 MB in bytes
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'image/svg'
    ],
    false
  )
ON CONFLICT (id) DO
UPDATE
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/svg'
  ];

-- Create videos-to-download bucket
INSERT INTO
  storage.buckets (id, name, file_size_limit, allowed_mime_types)
VALUES
  (
    'videos-to-download',
    'videos-to-download',
    104857600, -- 100 MB in bytes
    ARRAY['text/csv']
  )
ON CONFLICT (id) DO
UPDATE
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['text/csv'];

-- Policy for videos-to-download bucket
CREATE POLICY "BACKEND WORKER SELECT for videos-to-download table" ON storage.buckets FOR
SELECT TO authenticated
  USING (
    name = 'videos-to-download'
    AND auth.jwt () ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY "BACKEND WORKER SELECT for videos-to-download objects" ON storage.objects FOR
SELECT TO authenticated
  USING (
    bucket_id = 'videos-to-download'
    AND auth.jwt () ->> 'app_role' = 'backend_worker'
  );

-- Grant storage permissions to authenticated role
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Add character-profile-pics policies for backend_worker
CREATE POLICY "BACKEND WORKER SELECT for character-profile-pics table" ON storage.buckets FOR
SELECT TO authenticated
  USING (
    name = 'character-profile-pics'
    AND auth.jwt () ->> 'app_role' = 'backend_worker'
  );

CREATE POLICY "BACKEND WORKER SELECT for character-profile-pics objects" ON storage.objects FOR
SELECT TO authenticated
  USING (
    name = 'character-profile-pics'
    AND auth.jwt () ->> 'app_role' = 'backend_worker'
  );

-- Add authenticated user SELECT policies for character-profile-pics bucket
CREATE POLICY "Authenticated users can view character-profile-pics bucket"
ON storage.buckets FOR SELECT TO authenticated
USING (
    name = 'character-profile-pics'
);

CREATE POLICY "Authenticated users can view character-profile-pics objects"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'character-profile-pics'
);