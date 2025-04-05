import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check how many reviews exist before test
    const { data: existingReviews, error: countError } = await supabase
      .from("review")
      .select("id", { count: "exact" });

    const reviewCount = existingReviews?.length || 0;
    console.log(`Found ${reviewCount} existing reviews before test`);

    // Create a timestamp for unique testing
    const timestamp = new Date().toISOString();

    // Attempt a simple insert with timestamp in name
    const testData = {
      fullName: `Test Name (${timestamp})`,
      text: "This is a test review - please ignore",
      course: "Test Course",
      courseLink: "",
      student_picture: null,
    };

    const { data, error } = await supabase
      .from("review")
      .insert([testData])
      .select();

    if (error) {
      console.error("Direct insert error:", error);
      return NextResponse.json({
        success: false,
        message: "Error inserting test data",
        error: error.message,
      });
    }

    // IMPORTANT: Keep the test data (don't delete it) for persistence verification
    // Previously we were deleting test data, which could cause confusion

    return NextResponse.json({
      success: true,
      message: "Test data added and kept in database for testing purposes",
      data: data,
      existingReviewCount: reviewCount,
    });
  } catch (error) {
    console.error("Test direct insert error:", error);
    return NextResponse.json({
      success: false,
      message: "Error in test endpoint",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: Request) {
  try {
    // Initialize supabase client
    const supabase = await createClient();

    // Get request body
    const reviewData = await request.json();

    // Log the received data for debugging
    console.log("Received review data:", reviewData);

    // Several attempts to insert data to ensure it works
    let insertResult = null;
    let insertError = null;

    // Method 1: Direct insert using the standard API
    try {
      const { data, error } = await supabase
        .from("review")
        .insert([reviewData])
        .select();

      if (!error) {
        insertResult = data;
        console.log("Method 1 (direct insert) succeeded:", data);
      } else {
        console.error("Method 1 (direct insert) failed:", error);
        insertError = error;
      }
    } catch (err) {
      console.error("Error in Method 1:", err);
    }

    // Method 2: Try using RPC if first method failed
    if (!insertResult) {
      try {
        const { data, error } = await supabase.rpc("insert_review", {
          p_review: reviewData,
        });

        if (!error) {
          insertResult = data;
          console.log("Method 2 (RPC) succeeded:", data);
        } else {
          console.error("Method 2 (RPC) failed:", error);
          if (!insertError) insertError = error;
        }
      } catch (err) {
        console.error("Error in Method 2:", err);
      }
    }

    // Method 3: Last resort, raw SQL
    if (!insertResult) {
      try {
        // Create a simplified version of the data with just the essential fields
        const safeData = {
          fullName: reviewData.fullName || "Unknown",
          text: reviewData.text || "",
          course: reviewData.course || "",
          courseLink: reviewData.courseLink || "",
          // Only include image if it's not too large
          student_picture:
            reviewData.student_picture &&
            reviewData.student_picture.length < 5000000
              ? reviewData.student_picture
              : null,
        };

        const { data, error } = await supabase.rpc("execute_direct_query", {
          query: `
            INSERT INTO review (full_name, text, course, course_link, student_picture)
            VALUES (
              '${safeData.fullName.replace(/'/g, "''")}',
              '${safeData.text.replace(/'/g, "''")}',
              '${safeData.course.replace(/'/g, "''")}',
              '${safeData.courseLink.replace(/'/g, "''")}',
              ${safeData.student_picture ? `'${safeData.student_picture.replace(/'/g, "''")}'` : "NULL"}
            )
            RETURNING *;
          `,
        });

        if (!error) {
          insertResult = data;
          console.log("Method 3 (raw SQL) succeeded:", data);
        } else {
          console.error("Method 3 (raw SQL) failed:", error);
          if (!insertError) insertError = error;
        }
      } catch (err) {
        console.error("Error in Method 3:", err);
      }
    }

    // Check for any inserted data and return response
    if (insertResult) {
      // Check if the review exists immediately after insert to verify persistence
      try {
        let reviewExists = false;
        if (insertResult[0]?.id) {
          const { data: checkData } = await supabase
            .from("review")
            .select("id")
            .eq("id", insertResult[0].id)
            .single();

          reviewExists = !!checkData;
          console.log(
            "Verification check for inserted review:",
            reviewExists ? "✅ Review exists" : "❌ Review not found"
          );
        }
      } catch (err) {
        console.error("Error verifying review insertion:", err);
      }

      return NextResponse.json({
        success: true,
        message: "Review successfully inserted",
        data: insertResult,
      });
    } else {
      // No insert method worked
      return NextResponse.json(
        {
          success: false,
          error: "Could not insert review using any method",
          details: insertError,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Direct insert API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
