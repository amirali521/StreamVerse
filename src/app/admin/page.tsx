
"use client";

import { useAdminStatus } from "@/firebase/auth/use-admin-status";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

export default function AdminPage() {
  const { user, loaded: userLoaded } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const router = useRouter();

  const loaded = userLoaded && !adminLoading;

  useEffect(() => {
    if (loaded && !isAdmin) {
      router.push("/");
    }
     if (userLoaded && !user) {
      router.push("/admin/login");
    }
  }, [user, userLoaded, isAdmin, loaded, router]);

  if (!loaded || !isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/add-content">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Add, edit, or delete movies, web series, and dramas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View and manage user accounts.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View content performance and user engagement.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
