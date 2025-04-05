-- Create reviews table
CREATE TABLE IF NOT EXISTS review (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  courseLink VARCHAR(255),
  student_picture VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE review ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
CREATE POLICY "Authenticated users can view reviews"
  ON review
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON review
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their reviews"
  ON review
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete their reviews"
  ON review
  FOR DELETE
  TO authenticated
  USING (true);

-- Add to realtime subscription
ALTER PUBLICATION supabase_realtime ADD TABLE review;

-- Create review_images storage bucket if it doesn't exist
-- Note: This is executed separately as part of storage setup
-- INSERT INTO storage.buckets (id, name) 
-- VALUES ('review-images', 'review-images')
-- ON CONFLICT DO NOTHING; 