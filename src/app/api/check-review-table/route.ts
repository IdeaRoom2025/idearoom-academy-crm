import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check review table structure
    const { data: columns, error: columnsError } = await supabase.rpc(
      "get_table_columns",
      { table_name: "review" }
    );

    if (columnsError) {
      console.error("Error fetching columns:", columnsError);

      // Fallback: use raw SQL
      const { data: rawColumns, error: rawError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, character_maximum_length")
        .eq("table_name", "review");

      if (rawError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch schema information",
            details: columnsError,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        schema: "Using raw query",
        columns: rawColumns,
      });
    }

    // Try inserting a sample review
    const testReview = {
      fullName: "API Test User",
      text: "This is a test review from the API",
      course: "API Testing Course",
      student_picture: "https://example.com/test.jpg", // Simple URL, not base64
    };

    const { data: insertData, error: insertError } = await supabase
      .from("review")
      .insert([testReview])
      .select();

    // Delete the test data if it was created
    if (insertData && insertData.length > 0) {
      const { error: deleteError } = await supabase
        .from("review")
        .delete()
        .eq("id", insertData[0].id);

      if (deleteError) {
        console.error("Error deleting test review:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      columns,
      testInsert: {
        success: !insertError,
        error: insertError,
        data: insertData,
      },
    });
  } catch (error) {
    console.error("Error checking review table:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check review table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
