import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { Pool } from "pg";

// Create direct PostgreSQL connection for absolute emergencies
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

export async function POST(request: Request) {
  try {
    // Parse request body
    const reviewData = await request.json();
    console.log("Received emergency data:", {
      ...reviewData,
      student_picture: reviewData.student_picture
        ? "image data exists"
        : "no image",
    });

    // Validate required fields
    if (!reviewData.fullName || !reviewData.text || !reviewData.course) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Try direct PostgreSQL connection if available
    if (pool) {
      try {
        console.log("Using direct PostgreSQL connection");

        const query = `
          INSERT INTO review ("fullName", "text", "course", "courseLink", "student_picture")
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, "fullName", "text", "course", "courseLink"
        `;

        const params = [
          reviewData.fullName,
          reviewData.text,
          reviewData.course,
          reviewData.courseLink || "",
          reviewData.student_picture,
        ];

        const result = await pool.query(query, params);

        return NextResponse.json({
          success: true,
          method: "direct_pg",
          message: "Review created via direct PostgreSQL connection",
          data: result.rows[0],
        });
      } catch (pgError: any) {
        console.error("Direct PostgreSQL error:", pgError);
        // Fall through to Supabase methods
      }
    }

    // Use Supabase client for a simple insert (bypassing complex steps)
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from("review")
        .insert([
          {
            fullName: reviewData.fullName,
            text: reviewData.text,
            course: reviewData.course,
            courseLink: reviewData.courseLink || "",
            student_picture: null, // Skip image in emergency mode
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        method: "supabase_simple",
        message: "Review created via simplified insert (no image)",
        data: data,
      });
    } catch (finalError: any) {
      return NextResponse.json(
        {
          success: false,
          error: finalError.message || "All emergency methods failed",
          details: finalError,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Fatal error in emergency insert:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Fatal error in emergency handler",
      },
      { status: 500 }
    );
  }
}
