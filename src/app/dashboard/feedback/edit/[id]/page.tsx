import { Metadata } from "next";
import ReviewEditForm from "@/components/review-edit-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../../../../supabase/server";
import { Review } from "@/types/review";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Review | Idearoom Dashboard",
  description: "Edit an existing student review",
};

interface EditReviewPageParams {
  params: {
    id: string;
  };
}

export default async function EditReviewPage({ params }: EditReviewPageParams) {
  const { review } = await getReview(parseInt(params.id));

  // If review not found, show not found page
  if (!review) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/feedback">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">შეფასების რედაქტირება</h1>
          <p className="text-muted-foreground">განაახლეთ არსებული შეფასება</p>
        </div>
      </div>

      <ReviewEditForm reviewId={parseInt(params.id)} initialData={review} />
    </div>
  );
}

async function getReview(id: number): Promise<{ review: Review | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("review")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching review:", error);
      return { review: null };
    }

    return { review: data as Review };
  } catch (err) {
    console.error("Error in getReview:", err);
    return { review: null };
  }
}
