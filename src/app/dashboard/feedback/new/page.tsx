import { Metadata } from "next";
import ReviewForm from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Add New Review | Idearoom Dashboard",
  description: "Add a new student review",
};

export default function NewReviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/feedback">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ახალი შეფასების დამატება</h1>
          <p className="text-muted-foreground">დაამატეთ სტუდენტის შეფასება</p>
        </div>
      </div>

      <ReviewForm />
    </div>
  );
}
