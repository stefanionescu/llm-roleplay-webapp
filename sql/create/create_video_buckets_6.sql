-- Function to create a bucket and its associated policies
CREATE OR REPLACE FUNCTION create_content_bucket(bucket_name text)
RETURNS void AS $$
BEGIN
    -- Create bucket
    INSERT INTO storage.buckets (
        id,
        name,
        file_size_limit,
        allowed_mime_types,
        public
    )
    VALUES (
        bucket_name || '-content',
        bucket_name || '-content',
        524288000, -- 500 MB in bytes
        ARRAY[
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/jpg',
            'image/svg'
        ],
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        file_size_limit = 524288000,
        allowed_mime_types = ARRAY[
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/jpg',
            'image/svg'
        ];

    -- Create bucket policies
    EXECUTE format($policy$
        -- Backend worker policies
        CREATE POLICY "BACKEND WORKER permissions for %1$s-content table" 
        ON storage.buckets FOR SELECT TO authenticated
        USING (
            name = '%1$s-content'
            AND auth.jwt() ->> 'app_role' = 'backend_worker'
        );

        CREATE POLICY "BACKEND WORKER SELECT for %1$s-content objects" 
        ON storage.objects FOR SELECT TO authenticated
        USING (
            bucket_id = '%1$s-content'
            AND auth.jwt() ->> 'app_role' = 'backend_worker'
        );

        CREATE POLICY "BACKEND WORKER INSERT for %1$s-content objects" 
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = '%1$s-content'
            AND auth.jwt() ->> 'app_role' = 'backend_worker'
        );

        CREATE POLICY "BACKEND WORKER UPDATE for %1$s-content objects" 
        ON storage.objects FOR UPDATE TO authenticated
        USING (
            bucket_id = '%1$s-content'
            AND auth.jwt() ->> 'app_role' = 'backend_worker'
        );

        CREATE POLICY "BACKEND WORKER DELETE for %1$s-content objects" 
        ON storage.objects FOR DELETE TO authenticated
        USING (
            bucket_id = '%1$s-content'
            AND auth.jwt() ->> 'app_role' = 'backend_worker'
            AND (
                (metadata ->> 'failed_to_analyze')::boolean IS TRUE
                OR (metadata ->> 'scheduled_for_deletion')::boolean IS TRUE
            )
        );

        -- Authenticated user SELECT policies
        CREATE POLICY "Authenticated users can view %1$s-content bucket"
        ON storage.buckets FOR SELECT TO authenticated
        USING (
            name = '%1$s-content'
        );

        CREATE POLICY "Authenticated users can view %1$s-content objects"
        ON storage.objects FOR SELECT TO authenticated
        USING (
            bucket_id = '%1$s-content'
        );
    $policy$, bucket_name);
END;
$$ LANGUAGE plpgsql;

-- Create all buckets using the function
DO $$
DECLARE
    bucket_names text[] := ARRAY[
        'university',
        'books',
        'luxury',
        'wellness',
        'football',
        'food',
        'fitness',
        'fashion',
        'dating',
        'london'
    ];
    bucket_name text;
BEGIN
    FOREACH bucket_name IN ARRAY bucket_names
    LOOP
        PERFORM create_content_bucket(bucket_name);
    END LOOP;
END;
$$;