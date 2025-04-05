import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check current user info
    const { data: userInfo, error: userError } = await supabase.auth.getUser();

    // Check RLS policies on review table
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "review")
      .maybeSingle();

    if (policiesError) {
      // Try alternative method to check permissions
      const { data: testInsert, error: insertError } = await supabase
        .from("review")
        .insert([
          {
            fullName: "Test User",
            text: "Test review for RLS checking",
            course: "Test Course",
            student_picture: null,
          },
        ])
        .select();

      return NextResponse.json({
        success: false,
        user: userInfo,
        policies: {
          error: policiesError,
          message: "Could not fetch RLS policies directly",
        },
        testInsert: {
          success: !insertError,
          error: insertError,
        },
      });
    }

    // Try to check review table schema
    const { data: tableInfo, error: tableError } = await supabase.rpc(
      "get_table_info",
      { table_name: "review" }
    );

    return NextResponse.json({
      success: true,
      user: userInfo,
      policies,
      tableInfo: tableInfo || { error: tableError },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
