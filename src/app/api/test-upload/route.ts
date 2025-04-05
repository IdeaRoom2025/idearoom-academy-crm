import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // List all storage buckets to check access
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to list buckets",
          details: bucketsError,
        },
        { status: 500 }
      );
    }

    // Check for the review-images bucket
    const reviewBucket = buckets.find(
      (bucket) => bucket.name === "review-images"
    );

    // Get bucket details if it exists
    let bucketDetails = null;
    if (reviewBucket) {
      try {
        // List files in the review-images bucket
        const { data: files, error: filesError } = await supabase.storage
          .from("review-images")
          .list();

        if (filesError) {
          console.error("Error listing files:", filesError);
        }

        bucketDetails = {
          exists: true,
          isPublic: reviewBucket.public || false,
          fileCount: files?.length || 0,
          files: files || [],
        };
      } catch (detailsError) {
        console.error("Error getting bucket details:", detailsError);
        bucketDetails = {
          exists: true,
          error: "Failed to get bucket details",
        };
      }
    }

    return NextResponse.json({
      success: true,
      buckets: buckets,
      reviewBucket: bucketDetails || { exists: false },
    });
  } catch (error) {
    console.error("Storage test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Storage test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
