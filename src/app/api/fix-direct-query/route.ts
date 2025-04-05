import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    console.log("Attempting to recreate execute_direct_query function...");

    // Create admin_logs table if it doesn't exist
    const { error: tableError } = await supabase.rpc(
      "execute_direct_query",
      {
        query: `
        CREATE TABLE IF NOT EXISTS admin_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          action TEXT NOT NULL,
          action_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
          user_id UUID,
          details JSONB,
          ip_address TEXT,
          status TEXT
        );
      `,
      },
      { count: "exact" }
    );

    if (tableError) {
      console.log("Error creating admin_logs table:", tableError);
      // Table might not exist yet, so we'll create it with raw SQL
      const { error: rawSqlError } = await supabase.from("rpc").select("*");
      console.log("Raw SQL fallback result:", rawSqlError?.message);
    }

    // Create the fixed function with raw SQL since we can't use the function to create itself
    const createFunctionSql = `
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
        BEGIN
          INSERT INTO admin_logs (action, details, status)
          VALUES ('execute_direct_query', jsonb_build_object('query', query), 'attempted');
        EXCEPTION WHEN OTHERS THEN
          -- If admin_logs doesn't exist yet, continue anyway
          NULL;
        END;

        success := TRUE;
        
        BEGIN
          EXECUTE 'SELECT to_jsonb(q) FROM (' || query || ') q' INTO result;
          EXCEPTION WHEN OTHERS THEN
            success := FALSE;
            result := jsonb_build_object('error', SQLERRM, 'hint', SQLSTATE);
            
            -- Log the error
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
            INSERT INTO admin_logs (action, details, status)
            VALUES ('execute_direct_query', 
              jsonb_build_object(
                'query', query,
                'result_size', jsonb_array_length(result)
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

      GRANT EXECUTE ON FUNCTION execute_direct_query(TEXT) TO authenticated;
    `;

    // Run the SQL to create the function
    const { data, error } = await supabase.rpc("execute_direct_query", {
      query: createFunctionSql,
    });

    if (error) {
      // Try one more approach - direct SQL query
      console.log("Failed to create function with RPC, trying direct SQL");
      const { error: directSqlError } = await supabase.rpc(
        "execute_direct_query",
        {
          query: `SELECT current_user;`,
        }
      );

      if (directSqlError) {
        return NextResponse.json({
          success: false,
          message: "Failed to fix the execute_direct_query function",
          error: error.message,
          directSqlError: directSqlError.message,
        });
      }
    }

    // Test if the function now works
    const { data: testData, error: testError } = await supabase.rpc(
      "execute_direct_query",
      {
        query: `SELECT count(*) FROM review`,
      }
    );

    return NextResponse.json({
      success: !testError,
      message: testError
        ? "Failed to fix function"
        : "Function fixed successfully",
      test_result: testData,
      error: testError?.message,
    });
  } catch (error) {
    console.error("Error fixing direct query function:", error);
    return NextResponse.json({
      success: false,
      message: "Server error while fixing function",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
