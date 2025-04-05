"use client";

import { useState, useEffect } from "react";
import { Review } from "@/types/review";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Link as LinkIcon,
  Star,
  MessageSquare,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { formatDate } from "@/utils/date-format";

interface ReviewTableProps {
  initialReviews: Review[];
}

// Add this helper function to check if an image is base64 encoded
const isBase64Image = (src: string | undefined | null): boolean => {
  return !!src && src.startsWith("data:image/");
};

export default function ReviewTable({ initialReviews }: ReviewTableProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Review>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const router = useRouter();

  // Log initial state for debugging
  useEffect(() => {
    if (initialReviews) {
      console.log(
        `ReviewTable: Received ${initialReviews.length} initial reviews`
      );
      // Directly set the reviews from props without merging
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  // Use a more robust realtime subscription approach
  useEffect(() => {
    if (!supabase) return;

    console.log("Setting up realtime subscription for reviews table");

    // Set up realtime subscription
    const channel = supabase
      .channel("reviews-channel") // Give the channel a consistent name
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review",
        },
        (payload) => {
          console.log(
            "Realtime event received:",
            payload.eventType,
            payload.new &&
              typeof payload.new === "object" &&
              "id" in payload.new
              ? payload.new.id
              : payload.old &&
                  typeof payload.old === "object" &&
                  "id" in payload.old
                ? payload.old.id
                : "unknown"
          );

          switch (payload.eventType) {
            case "INSERT":
              if (
                payload.new &&
                typeof payload.new === "object" &&
                "id" in payload.new
              ) {
                setReviews((prev) => {
                  // Check if this review already exists in our state
                  const exists = prev.some(
                    (review) => review.id === payload.new.id
                  );
                  if (exists) {
                    console.log(
                      "Review already exists, skipping insert:",
                      payload.new.id
                    );
                    return prev;
                  }

                  // Add the new review to the beginning of the list
                  console.log(
                    "Adding new review from realtime:",
                    payload.new.id
                  );
                  return [payload.new as Review, ...prev];
                });
              }
              break;

            case "UPDATE":
              if (
                payload.new &&
                typeof payload.new === "object" &&
                "id" in payload.new
              ) {
                setReviews((prev) => {
                  // Find and update the review in our state
                  const reviewExists = prev.some(
                    (review) => review.id === payload.new.id
                  );
                  if (!reviewExists) {
                    console.log(
                      "Updated review doesn't exist in state, adding it:",
                      payload.new.id
                    );
                    return [payload.new as Review, ...prev];
                  }

                  console.log("Updating existing review:", payload.new.id);
                  return prev.map((review) =>
                    review.id === payload.new.id
                      ? { ...review, ...(payload.new as Review) }
                      : review
                  );
                });
              }
              break;

            case "DELETE":
              if (
                payload.old &&
                typeof payload.old === "object" &&
                "id" in payload.old
              ) {
                console.log("Delete event for review:", payload.old.id);
                setReviews((prev) => {
                  const filtered = prev.filter(
                    (review) => review.id !== payload.old.id
                  );
                  console.log(
                    `Removed review ${payload.old.id}, count changed from ${prev.length} to ${filtered.length}`
                  );
                  return filtered;
                });
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    // Debug the current channel state
    setTimeout(() => {
      console.log("Active channels:", supabase.getChannels());
    }, 1000);

    return () => {
      console.log("Removing realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Simple refresh function that directly replaces state without merging
  const fetchLatestReviews = async () => {
    try {
      setIsRefreshing(true);
      console.log("Refreshing reviews from API...");

      const apiUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/direct-reviews`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.reviews)) {
        console.log(
          `Received ${data.reviews.length} reviews from API via ${data.method}`
        );

        // Directly set the reviews from API without merging with existing state
        setReviews(data.reviews);

        toast({
          title: "Reviews refreshed",
          description: `Loaded ${data.reviews.length} reviews`,
          variant: "default",
        });
      } else {
        console.error("Invalid data format from API:", data);
        toast({
          title: "Refresh failed",
          description: "Received invalid data format",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing reviews:", error);
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // More aggressive periodic refresh to ensure we have all reviews
  useEffect(() => {
    // Fetch on initial render
    fetchLatestReviews();

    // Set up interval to periodically refresh
    const interval = setInterval(fetchLatestReviews, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter reviews based on search term
  const filteredReviews = reviews.filter(
    (review) =>
      review.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];

    // Handle undefined or null values
    if (valueA == null) return 1;
    if (valueB == null) return -1;

    // Compare values based on field type
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // For dates and numbers
    return sortDirection === "asc"
      ? valueA > valueB
        ? 1
        : -1
      : valueA < valueB
        ? 1
        : -1;
  });

  const handleSort = (field: keyof Review) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, start with descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ შეფასების წაშლა?")) {
      setIsDeleting(id);
      try {
        const { error } = await supabase.from("review").delete().eq("id", id);

        if (error) throw error;

        toast({
          title: "წარმატება",
          description: "შეფასება წაიშალა",
        });

        // Update local state
        setReviews(reviews.filter((review) => review.id !== id));
      } catch (error) {
        console.error("Error deleting review:", error);
        toast({
          title: "შეცდომა",
          description: "შეფასების წაშლა ვერ მოხერხდა",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              სტუდენტების შეფასებები
            </h2>
            <p className="text-muted-foreground">
              სულ {reviews.length} შეფასება
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void fetchLatestReviews();
              }}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>განახლება</span>
            </Button>
            <Button asChild>
              <Link
                href="/dashboard/feedback/new"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>შეფასების დამატება</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="მოძებნეთ შეფასებები..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/70">
                <TableHead className="w-12">სურათი</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    სახელი და გვარი
                    {sortField === "fullName" && (
                      <span className="text-muted-foreground">
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("course")}
                >
                  <div className="flex items-center gap-1">
                    კურსი
                    {sortField === "course" && (
                      <span className="text-muted-foreground">
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>შეფასება</TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center justify-end gap-1">
                    თარიღი
                    {sortField === "created_at" && (
                      <span className="text-muted-foreground">
                        {sortDirection === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">მოქმედებები</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      <div className="text-lg font-medium">
                        შეფასებები არ მოიძებნა
                      </div>
                      <p className="text-sm text-muted-foreground">
                        დაამატეთ ახალი შეფასება ან შეცვალეთ ძიების პარამეტრები
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedReviews.map((review) => (
                  <TableRow key={review.id} className="group">
                    <TableCell className="font-medium">
                      <Avatar className="h-10 w-10">
                        {review.student_picture ? (
                          <AvatarImage
                            src={review.student_picture}
                            alt={review.fullName}
                          />
                        ) : (
                          <AvatarFallback>
                            <UserCircle className="h-6 w-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {review.fullName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        {review.courseLink ? (
                          <a
                            href={review.courseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 text-blue-500"
                          >
                            {review.course}
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{review.course}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={review.text}>
                        {review.text}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(review.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 opacity-70 hover:opacity-100"
                        >
                          <Link href={`/dashboard/feedback/edit/${review.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-70 hover:opacity-100"
                          onClick={() => handleDelete(review.id)}
                          disabled={isDeleting === review.id}
                        >
                          {isDeleting === review.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
