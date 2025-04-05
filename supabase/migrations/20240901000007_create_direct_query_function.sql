-- Create a function to execute direct queries bypassing RLS
CREATE OR REPLACE FUNCTION execute_direct_query(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with database owner privileges
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query directly bypassing any RLS
  EXECUTE 'SELECT to_jsonb(q) FROM (' || query || ') q' INTO result;
  
  -- Log that the function was used
  INSERT INTO "admin_logs" (action, user_id, details)
  VALUES (
    'direct_query', 
    (SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid),
    jsonb_build_object(
      'query', query,
      'timestamp', NOW()
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_direct_query(TEXT) TO authenticated; 