"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  BookOpen,
  Users,
  Layers,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserFormTable from "../../components/UserFormTable";
import { createClient } from "../../../supabase/server";

// Define an interface based on your 'users_form' table schema
interface UserForm {
  id: number;
  created_at: string;
  // add additional fields
}

// Helper function for consistent date formatting
const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const year = date.getFullYear();

    // Format as DD.MM.YYYY (Georgian style)
    return `${day}.${month}.${year}`;
  } catch (e) {
    return dateString;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogCount, setBlogCount] = useState(0);
  const [usersFormData, setUsersFormData] = useState<UserForm[]>([]);
  const [usersFormCount, setUsersFormCount] = useState(0);
  const [offeredCoursesCount, setOfferedCoursesCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);

  // Authentication check
  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem("isAuthenticated");

      if (!isAuthenticated) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("localStorage is not available:", err);
      router.replace("/");
    }
  }, [router]);

  // Data fetching from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = await createClient();

        // Get blog count
        const { count: fetchedBlogCount } = await supabase
          .from("blogs")
          .select("*", { count: "exact", head: true });
        setBlogCount(fetchedBlogCount || 0);

        // Get offered courses count
        const { count: fetchedOfferedCoursesCount } = await supabase
          .from("offered_course")
          .select("*", { count: "exact", head: true });
        setOfferedCoursesCount(fetchedOfferedCoursesCount || 0);

        // Get courses count
        const { count: fetchedCoursesCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true });
        setCoursesCount(fetchedCoursesCount || 0);

        // Get users_form data and count
        const { data: fetchedUsersFormData, error } = await supabase
          .from("users_form")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Error fetching users_form data:", error);
        } else {
          setUsersFormData(fetchedUsersFormData || []);
        }

        const { count: fetchedUsersFormCount } = await supabase
          .from("users_form")
          .select("*", { count: "exact", head: true });
        setUsersFormCount(fetchedUsersFormCount || 0);
      } catch (err) {
        console.error("Error fetching data from Supabase:", err);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [loading]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      router.push("/");
    } catch (err) {
      console.error("localStorage is not available:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        იტვირთება...
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full min-h-[calc(100vh-73px)] bg-muted/30">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold">მთავარი პანელი</h1>
              <Button asChild>
                <Link
                  href="/dashboard/blogs/new"
                  className="flex items-center gap-2"
                >
                  <span>ახალი ბლოგის დამატება</span>
                  <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 text-sm p-3 px-4 rounded-lg text-blue-600 dark:text-blue-400 flex gap-2 items-center border border-blue-100 dark:border-blue-900">
              <InfoIcon size="14" />
              <span>
                მოგესალმებით სამართავ პანელზე! აქ შეგიძლიათ მართოთ კურსები,
                შეთავაზებები და ბლოგები.
              </span>
            </div>
          </header>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ბლოგები
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{blogCount}</div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  მომხმარებლები
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{usersFormCount}</div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  შეთავაზებები
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {offeredCoursesCount}
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  კურსები
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{coursesCount}</div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Form Data Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">
              მომხმარებლების მოთხოვნები
            </h2>
            {usersFormData.length > 0 ? (
              <UserFormTable usersFormData={usersFormData} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                მომხმარებლების მოთხოვნები არ მოიძებნა
              </div>
            )}
          </section>

          {/* Quick Links */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>შეთავაზებების მართვა</CardTitle>
                <CardDescription>
                  დაამატეთ, შეცვალეთ ან წაშალეთ შეთავაზებები
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/offers">შეთავაზებების მართვა</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>კურსების მართვა</CardTitle>
                <CardDescription>
                  დაამატეთ, შეცვალეთ ან წაშალეთ კურსები
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/dashboard/courses">კურსების მართვა</Link>
                </Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
