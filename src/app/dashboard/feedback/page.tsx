import { Suspense } from "react";
import { Metadata } from "next";
import ReviewTable from "@/components/review-table";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Feedback | Idearoom Dashboard",
  description: "View and manage student feedback and reviews",
};

export const dynamic = "force-dynamic";
export const revalidate = 0; // Don't cache this page

export default async function FeedbackPage() {
  // Try multiple methods to fetch reviews
  const { fetchedReviews, error } = await fetchData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">შეფასებები</h1>
          <p className="text-muted-foreground">
            ნახეთ და მართეთ სტუდენტების შეფასებები
          </p>
        </div>
        <Button asChild>
          <Link
            href="/dashboard/feedback/new"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>შეფასების დამატება</span>
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ReviewTable initialReviews={fetchedReviews || []} />
      </Suspense>
    </div>
  );
}

async function fetchData() {
  try {
    // Data fetching from Supabase
    const supabaseClient = await createClient();

    console.log("Fetching reviews from Supabase...");

    // Use the standard query only - this ensures consistency
    const { data: fetchedReviews, error } = await supabaseClient
      .from("review")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return { fetchedReviews: [], error };
    }

    console.log(`Database query returned ${fetchedReviews.length} reviews`);
    return { fetchedReviews, error: null };
  } catch (err) {
    console.error("Error in fetchData:", err);
    return { fetchedReviews: [], error: err };
  }
}
