"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { Review } from "@/types/review";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const reviewFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს" })
    .max(100, { message: "სახელი უნდა შეიცავდეს მაქსიმუმ 100 სიმბოლოს" }),
  text: z
    .string()
    .min(5, { message: "ტექსტი უნდა შეიცავდეს მინიმუმ 5 სიმბოლოს" })
    .max(1000, { message: "ტექსტი უნდა შეიცავდეს მაქსიმუმ 1000 სიმბოლოს" }),
  course: z
    .string()
    .min(2, { message: "კურსის დასახელება უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს" })
    .max(100, {
      message: "კურსის დასახელება უნდა შეიცავდეს მაქსიმუმ 100 სიმბოლოს",
    }),
  courseLink: z.string().optional(), // Just make it optional with no validation
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewEditFormProps {
  reviewId: number;
  initialData?: Review;
}

type Course = {
  id: string;
  title: string;
};

export default function ReviewEditForm({
  reviewId,
  initialData,
}: ReviewEditFormProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.student_picture || null
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [review, setReview] = useState<Review | null>(initialData || null);
  const router = useRouter();

  const [courseValid, setCourseValid] = useState(true);
  const [validatedCourseLink, setValidatedCourseLink] = useState(
    initialData?.courseLink || ""
  );
  const [courseValidating, setCourseValidating] = useState(false);
  const [courseSuggestions, setCourseSuggestions] = useState<Course[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: initialData
      ? {
          fullName: initialData.fullName,
          text: initialData.text,
          course: initialData.course,
          courseLink: initialData.courseLink || "",
        }
      : {
          fullName: "",
          text: "",
          course: "",
          courseLink: "",
        },
  });

  // Fetch review data if not provided as props
  useEffect(() => {
    if (!initialData) {
      const fetchReview = async () => {
        try {
          const { data, error } = await supabase
            .from("review")
            .select("*")
            .eq("id", reviewId)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setReview(data);
            setImageUrl(data.student_picture || null);
            form.reset({
              fullName: data.fullName,
              text: data.text,
              course: data.course,
              courseLink: data.courseLink || "",
            });
          }
        } catch (error) {
          console.error("Error fetching review:", error);
          toast({
            title: "შეცდომა",
            description: "შეფასების მონაცემების ჩატვირთვა ვერ მოხერხდა",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchReview();
    }
  }, [reviewId, initialData, form]);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image.");
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const uniqueId =
        Date.now().toString() + Math.random().toString(36).substring(2, 11);
      const fileName = `${uniqueId}.${fileExt}`;

      console.log("Attempting to upload:", fileName);

      // DIRECT IMAGE UPLOAD APPROACH - this bypasses Supabase storage
      // and uploads directly to a base64 data URL
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) {
              throw new Error("Failed to read file");
            }

            console.log("Image converted to data URL, length:", dataUrl.length);

            setImageUrl(dataUrl);
            toast({
              title: "წარმატება",
              description: "სურათი წარმატებით აიტვირთა",
            });

            setUploading(false);
            resolve();
          } catch (err) {
            setUploading(false);
            reject(err);
          }
        };

        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          setUploading(false);
          reject(new Error("Error reading file"));
        };

        reader.readAsDataURL(file);
      });
    } catch (error: any) {
      console.error("Full error details:", error);
      toast({
        title: "შეცდომა",
        description: error.message || "სურათის ატვირთვისას მოხდა შეცდომა",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const validateCourse = async (courseTitle: string) => {
    if (!courseTitle || courseTitle.length < 2) {
      setCourseValid(false);
      setCourseSuggestions([]);
      return;
    }

    setCourseValidating(true);
    try {
      const response = await fetch(
        `/api/courses/check?title=${encodeURIComponent(courseTitle)}`
      );
      const data = await response.json();

      setCourseValid(data.exists);
      if (data.exists) {
        setValidatedCourseLink(data.courseLink);
        form.setValue("courseLink", data.courseLink);
      } else {
        setValidatedCourseLink("");
      }

      if (data.suggestions) {
        setCourseSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setCourseSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error validating course:", error);
      setCourseValid(false);
    } finally {
      setCourseValidating(false);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "course" && value.course) {
        validateCourse(value.course as string);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const selectCourseSuggestion = (course: Course) => {
    form.setValue("course", course.title);
    form.setValue("courseLink", `/courses/${course.id}`);
    setValidatedCourseLink(`/courses/${course.id}`);
    setCourseValid(true);
    setShowSuggestions(false);
  };

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      // Check if review exists
      if (!review) {
        toast({
          title: "შეცდომა",
          description: "შეფასება ვერ მოიძებნა",
          variant: "destructive",
        });
        return;
      }

      // Check if course is valid first
      if (!courseValid) {
        toast({
          title: "შეცდომა",
          description:
            "გთხოვთ აირჩიოთ არსებული კურსი ან დაელოდოთ კურსის დადასტურებას",
          variant: "destructive",
        });
        return;
      }

      // Show loading state
      toast({
        title: "მიმდინარეობს დამუშავება",
        description: "გთხოვთ მოიცადოთ...",
      });

      console.log("Starting edit form submission with values:", {
        ...values,
        reviewId: review.id,
        imageUrl: imageUrl
          ? `[Base64 image: ${imageUrl.substring(0, 30)}...]`
          : null,
        validatedCourseLink,
      });

      // Create the data object with the validated course link
      const reviewData = {
        fullName: values.fullName,
        text: values.text,
        course: values.course,
        courseLink: validatedCourseLink, // Use the validated link instead of raw input
        student_picture: imageUrl,
      };

      // Double check image size before submitting
      if (imageUrl && imageUrl.length > 5000000) {
        console.warn("Image too large:", imageUrl.length, "bytes");
        toast({
          title: "შეცდომა",
          description: "სურათი ძალიან დიდია (მაქსიმუმ 5MB)",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "Submitting review data for ID:",
        review.id,
        "image size:",
        imageUrl ? `${Math.round(imageUrl.length / 1024)}KB` : "No image"
      );

      // Try multiple update methods for reliability
      try {
        // Direct update via API
        const response = await fetch(`/api/reviews/${review.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        });

        console.log("API response status:", response.status);
        const result = await response.json();
        console.log("API response:", result);

        if (!result.success) {
          throw new Error(result.error || "შენახვა ვერ მოხერხდა");
        }

        // Verify the data was actually updated
        if (result.data) {
          console.log("Review successfully updated:", result.data);
        } else {
          console.warn(
            "Review may not have been properly updated - no data returned"
          );
        }

        toast({
          title: "წარმატება",
          description: "შეფასება წარმატებით განახლდა",
        });

        // Add a small delay before navigation to ensure state is updated
        setTimeout(() => {
          router.push("/dashboard/feedback");
          router.refresh();
        }, 500);
      } catch (apiError) {
        console.error("API call error:", apiError);

        // Fall back to direct Supabase update if API fails
        console.log("Trying direct Supabase update as fallback...");

        try {
          const { data, error } = await supabase
            .from("review")
            .update(reviewData)
            .eq("id", review.id)
            .select();

          if (error) {
            throw error;
          }

          console.log("Fallback update succeeded:", data);

          toast({
            title: "წარმატება",
            description: "შეფასება წარმატებით განახლდა (fallback method)",
          });

          // Add a small delay before navigation
          setTimeout(() => {
            router.push("/dashboard/feedback");
            router.refresh();
          }, 500);
        } catch (fallbackError) {
          console.error("Fallback update failed:", fallbackError);
          throw fallbackError; // Re-throw to be handled by outer catch
        }
      }
    } catch (error) {
      console.error("Submit error:", error);

      // Get more detailed error information if available
      let errorMessage = "შენახვის შეცდომა";

      if (error instanceof Error) {
        errorMessage += ": " + error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage += ": " + JSON.stringify(error);
      } else {
        errorMessage += ": " + String(error);
      }

      toast({
        title: "შეცდომა",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 bg-card p-6 rounded-lg border shadow-sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt="Student avatar" />
              ) : (
                <AvatarFallback className="text-4xl">
                  <UserCircle className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="relative overflow-hidden"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ატვირთვა...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    ატვირთე სურათი
                  </>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={uploadImage}
                  disabled={uploading}
                />
              </Button>
              <p className="text-xs text-muted-foreground">
                მაქსიმუმ 10MB ზომის სურათი
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სრული სახელი</FormLabel>
                <FormControl>
                  <Input placeholder="შეიყვანეთ სრული სახელი" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem>
                <FormLabel>კურსის დასახელება</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="შეიყვანეთ კურსის დასახელება"
                      {...field}
                      className={courseValid ? "border-green-500 pr-10" : ""}
                      onBlur={() => {
                        if (field.value) validateCourse(field.value);
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onFocus={() => {
                        if (courseSuggestions.length > 0)
                          setShowSuggestions(true);
                      }}
                    />
                  </FormControl>
                  {courseValidating && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {courseValid && !courseValidating && (
                    <div className="absolute right-3 top-2.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  {showSuggestions && courseSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-popover rounded-md border shadow-md">
                      <ul className="py-1 text-sm">
                        {courseSuggestions.map((course) => (
                          <li
                            key={course.id}
                            className="px-3 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => selectCourseSuggestion(course)}
                          >
                            {course.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {!courseValid && field.value && !courseValidating && (
                  <p className="text-sm text-destructive mt-1">
                    შეიყვანეთ არსებული კურსის დასახელება
                  </p>
                )}
                {courseValid && !courseValidating && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ლინკი: {validatedCourseLink}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>შეფასების ტექსტი</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="შეიყვანეთ შეფასების ტექსტი"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/feedback")}
          >
            გაუქმება
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                შენახვა...
              </>
            ) : (
              "შეფასების განახლება"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
