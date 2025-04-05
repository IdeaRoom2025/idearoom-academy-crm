"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Trash, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "../../supabase/client";

export default function UserFormTable({ usersFormData }) {
  const [openDetailId, setOpenDetailId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      const { error } = await supabase.from("users_form").delete().eq("id", id);

      if (error) {
        console.error("Error deleting submission:", error);
        alert("Failed to delete the submission. Please try again.");
      } else {
        alert("Submission deleted successfully!");
        // Reload the page to refresh the data
        window.location.reload();
      }
    }
  };

  const handleViewDetails = (user) => {
    setUserDetails(user);
    setOpenDetailId(user.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Manual formatting to ensure consistency between server and client
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Course</TableHead>
              <TableHead className="hidden md:table-cell">Birth Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersFormData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              usersFormData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.phoneNumber || "N/A"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.choosedCourse || "N/A"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.birth_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = `mailto:${user.email}`)
                          }
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog
        open={openDetailId !== null}
        onOpenChange={(open) => !open && setOpenDetailId(null)}
      >
        {userDetails && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Form Details</DialogTitle>
              <DialogDescription>
                Complete information for {userDetails.firstName}{" "}
                {userDetails.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Email:</span>
                <span className="col-span-2">{userDetails.email}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">First Name:</span>
                <span className="col-span-2">{userDetails.firstName}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Last Name:</span>
                <span className="col-span-2">{userDetails.lastName}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Phone:</span>
                <span className="col-span-2">
                  {userDetails.phoneNumber || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Social ID:</span>
                <span className="col-span-2">
                  {userDetails.socialId || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Birth Date:</span>
                <span className="col-span-2">
                  {formatDate(userDetails.birth_date)}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Course:</span>
                <span className="col-span-2">
                  {userDetails.choosedCourse || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Media Source:</span>
                <span className="col-span-2">
                  {userDetails.choosedMedia || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium">Submission Date:</span>
                <span className="col-span-2">
                  {formatDate(userDetails.created_at)}
                </span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
