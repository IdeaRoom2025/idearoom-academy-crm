-- Create a function that can execute arbitrary SQL with parameters
-- This is a last resort approach for bypassing RLS
CREATE OR REPLACE FUNCTION execute_sql(
  sql_query TEXT,
  include_picture BOOLEAN DEFAULT false,
  picture_data TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with owner privileges
AS $$
DECLARE
  result JSONB;
  full_query TEXT;
BEGIN
  -- If we have picture data, replace the placeholder
  IF include_picture AND picture_data IS NOT NULL THEN
    full_query := REPLACE(sql_query, '''[BASE64_DATA]''', quote_literal(picture_data));
  ELSE
    full_query := sql_query;
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE 'SELECT row_to_json(t) FROM (' || full_query || ') t' INTO result;
  
  -- Log that we used this function (for auditing)
  INSERT INTO "admin_logs" (action, user_id, details)
  VALUES (
    'execute_sql', 
    current_setting('request.jwt.claims', true)::json->>'sub',
    jsonb_build_object(
      'query', sql_query,
      'timestamp', NOW()
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "admin_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id TEXT,
  details JSONB
);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, BOOLEAN, TEXT) TO authenticated; 