"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  BookOpen,
  Settings,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Sliders,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "./ui/theme-toggle";
import { usePathname } from "next/navigation";

interface DashboardNavbarProps {
  handleLogOut: () => void;
}

export default function DashboardNavbar({
  handleLogOut,
}: DashboardNavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="w-full border-b border-border bg-background py-4 sticky top-0 z-50 backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            prefetch
            className="text-xl font-bold flex items-center gap-2"
          >
            <span className="text-purple-600">Idearoom</span>
          </Link>
          <div className="flex gap-4 ml-8">
            <Link
              href="/dashboard"
              className={`text-sm font-medium ${
                pathname === "/dashboard"
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              მთავარი
            </Link>
            <Link
              href="/dashboard/blogs"
              className={`text-sm font-medium ${
                isActive("/dashboard/blogs")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              ბლოგები
            </Link>
            <Link
              href="/dashboard/courses"
              className={`text-sm font-medium ${
                isActive("/dashboard/courses")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              კურსები
            </Link>
            <Link
              href="/dashboard/lecturer"
              className={`text-sm font-medium ${
                isActive("/dashboard/lecturer")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              ლექტორები
            </Link>
            <Link
              href="/dashboard/offers"
              className={`text-sm font-medium ${
                isActive("/dashboard/offers")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              შეთავაზებები
            </Link>
            <Link
              href="/dashboard/sliders"
              className={`text-sm font-medium ${
                isActive("/dashboard/sliders")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              <Sliders className="h-4 w-4 mr-1" />
              სლაიდერი
            </Link>
            <Link
              href="/dashboard/feedback"
              className={`text-sm font-medium ${
                isActive("/dashboard/feedback")
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              } flex items-center gap-1 transition-colors`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              შეფასებები
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 border border-border"
              >
                <UserCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">
                ჩემი ანგარიში
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>პარამეტრები</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>გასვლა</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
