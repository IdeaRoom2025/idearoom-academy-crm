-- Create the review-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable public access to review-images (READ only)
INSERT INTO storage.policies (name, bucket_id, permission, definition)
VALUES (
  'Public Read Access for review-images', 
  'review-images', 
  'SELECT', 
  '(bucket_id = ''review-images''::text)'
)
ON CONFLICT (name, bucket_id, permission) DO NOTHING;

-- Allow authenticated users to upload and delete from review-images
INSERT INTO storage.policies (name, bucket_id, permission, definition)
VALUES (
  'Auth Upload Access for review-images', 
  'review-images', 
  'INSERT', 
  '(bucket_id = ''review-images''::text AND auth.role() = ''authenticated''::text)'
)
ON CONFLICT (name, bucket_id, permission) DO NOTHING;

INSERT INTO storage.policies (name, bucket_id, permission, definition)
VALUES (
  'Auth Delete Access for review-images', 
  'review-images', 
  'DELETE', 
  '(bucket_id = ''review-images''::text AND auth.role() = ''authenticated''::text)'
)
ON CONFLICT (name, bucket_id, permission) DO NOTHING; 