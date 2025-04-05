-- Create admin_logs table for tracking administrative operations
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  action_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID,
  details JSONB,
  ip_address TEXT,
  status TEXT
);

-- Ensure we have our execute_direct_query function
CREATE OR REPLACE FUNCTION execute_direct_query(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  success BOOLEAN;
BEGIN
  -- Log the query attempt
  INSERT INTO admin_logs (action, details, status)
  VALUES ('execute_direct_query', jsonb_build_object('query', query), 'attempted');

  success := TRUE;
  
  BEGIN
    EXECUTE query INTO result;
    EXCEPTION WHEN OTHERS THEN
      success := FALSE;
      result := jsonb_build_object('error', SQLERRM, 'hint', SQLSTATE);
      
      -- Log the error
      INSERT INTO admin_logs (action, details, status)
      VALUES ('execute_direct_query', 
        jsonb_build_object(
          'query', query,
          'error', SQLERRM,
          'sqlstate', SQLSTATE
        ), 
        'error'
      );
  END;
  
  -- Log success if no errors
  IF success THEN
    INSERT INTO admin_logs (action, details, status)
    VALUES ('execute_direct_query', 
      jsonb_build_object(
        'query', query,
        'result_size', jsonb_array_length(result)
      ), 
      'success'
    );
  END IF;
  
  RETURN result;
END;
$$; 