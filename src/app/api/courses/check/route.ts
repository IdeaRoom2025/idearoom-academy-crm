import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get("title");

    if (!courseTitle) {
      return NextResponse.json(
        {
          exists: false,
          message: "Course title is required",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try exact match first
    let { data: exactMatch, error: exactMatchError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("title", courseTitle)
      .single();

    if (exactMatch) {
      return NextResponse.json({
        exists: true,
        course: exactMatch,
        courseLink: `/courses/${exactMatch.id}`,
      });
    }

    // Try case-insensitive match
    const { data: courses, error } = await supabase
      .from("courses")
      .select("id, title")
      .ilike("title", `%${courseTitle}%`)
      .order("title")
      .limit(5);

    if (error) {
      console.error("Error checking course:", error);
      return NextResponse.json(
        {
          exists: false,
          message: "Error checking course",
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (courses && courses.length > 0) {
      // Return the first matching course
      return NextResponse.json({
        exists: true,
        course: courses[0],
        courseLink: `/courses/${courses[0].id}`,
        suggestions: courses,
      });
    }

    // No match found
    return NextResponse.json({
      exists: false,
      message: "Course not found",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        exists: false,
        message: "Server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
