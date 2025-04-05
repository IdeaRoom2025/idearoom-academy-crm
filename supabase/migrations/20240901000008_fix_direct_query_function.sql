-- Fix the execute_direct_query function to handle non-array results properly
CREATE OR REPLACE FUNCTION execute_direct_query(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  success BOOLEAN;
BEGIN
  -- Log the query attempt without requiring admin_logs table
  BEGIN
    INSERT INTO admin_logs (action, details, status)
    VALUES ('execute_direct_query', jsonb_build_object('query', query), 'attempted');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if admin_logs table doesn't exist
    NULL;
  END;

  success := TRUE;
  
  BEGIN
    -- Execute the query and handle both array and scalar results
    EXECUTE 'SELECT to_jsonb(q) FROM (' || query || ') q' INTO result;
    
    -- If result is null, return empty array
    IF result IS NULL THEN
      result := '[]'::jsonb;
    END IF;
    
    EXCEPTION WHEN OTHERS THEN
      success := FALSE;
      result := jsonb_build_object('error', SQLERRM, 'hint', SQLSTATE);
      
      -- Log the error if possible
      BEGIN
        INSERT INTO admin_logs (action, details, status)
        VALUES ('execute_direct_query', 
          jsonb_build_object(
            'query', query,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
          ), 
          'error'
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
  END;
  
  -- Log success if no errors
  IF success THEN
    BEGIN
      -- Safe check for array result before getting length
      INSERT INTO admin_logs (action, details, status)
      VALUES ('execute_direct_query', 
        jsonb_build_object(
          'query', query,
          'result_type', jsonb_typeof(result),
          'result_size', CASE 
            WHEN jsonb_typeof(result) = 'array' THEN jsonb_array_length(result)
            ELSE 1
          END
        ), 
        'success'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_direct_query(TEXT) TO authenticated; 