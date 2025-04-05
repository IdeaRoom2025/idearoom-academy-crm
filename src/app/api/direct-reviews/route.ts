import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define the Review interface
interface Review {
  id: number;
  [key: string]: any;
}

export async function GET() {
  try {
    const supabase = await createClient();
    let reviews = [];
    let method = "unknown";

    // Try standard query first - simplest approach
    const { data: standardQueryData, error: standardQueryError } =
      await supabase
        .from("review")
        .select("*")
        .order("created_at", { ascending: false });

    if (
      !standardQueryError &&
      standardQueryData &&
      standardQueryData.length > 0
    ) {
      reviews = standardQueryData;
      method = "standard query";
      console.log(
        `API: Retrieved ${reviews.length} reviews via standard query`
      );
    } else {
      // Fall back to direct query if standard query fails
      try {
        const { data: directData, error: directError } = await supabase.rpc(
          "execute_direct_query",
          {
            query: `SELECT * FROM review ORDER BY created_at DESC`,
          }
        );

        if (!directError && directData) {
          reviews = directData;
          method = "direct query";
          console.log(
            `API: Retrieved ${reviews.length} reviews via direct query`
          );
        } else {
          console.error("API: Direct query error:", directError);
        }
      } catch (directError) {
        console.error("API: Error executing direct query:", directError);
      }
    }

    // Check for duplicate IDs and warn if found
    const ids = new Set<number>();
    const duplicates: number[] = [];

    reviews.forEach((review: Review) => {
      if (ids.has(review.id)) {
        duplicates.push(review.id);
      } else {
        ids.add(review.id);
      }
    });

    if (duplicates.length > 0) {
      console.warn(
        `API: Found ${duplicates.length} duplicate review IDs: ${duplicates.join(", ")}`
      );
    }

    return NextResponse.json({
      success: true,
      reviews,
      method,
      count: reviews.length,
    });
  } catch (error) {
    console.error("API: Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
