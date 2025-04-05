-- Create a function that uses a raw SQL query to insert reviews
CREATE OR REPLACE FUNCTION insert_review_raw(data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with owner privileges, bypassing RLS
AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  -- Insert using raw SQL to completely bypass any restrictions
  EXECUTE format('
    INSERT INTO "review" (
      "fullName", 
      "text", 
      "course", 
      "courseLink", 
      "student_picture"
    ) VALUES (
      %L, %L, %L, %L, %L
    ) RETURNING id',
    (data->>'fullName'),
    (data->>'text'),
    (data->>'course'),
    COALESCE(data->>'courseLink', ''),
    (data->>'student_picture')
  ) INTO new_id;
  
  -- Get the newly created record
  SELECT jsonb_build_object(
    'id', r.id,
    'fullName', r."fullName",
    'text', r."text",
    'course', r."course",
    'courseLink', r."courseLink",
    'created_at', r.created_at
  ) INTO result
  FROM "review" r
  WHERE r.id = new_id;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in insert_review_raw: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_review_raw(JSONB) TO authenticated;

-- Temporarily disable RLS on review table if needed for testing
-- ALTER TABLE "review" DISABLE ROW LEVEL SECURITY; 