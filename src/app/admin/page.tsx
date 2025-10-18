
"use client";

import { useAdminStatus } from "@/firebase/auth/use-admin-status";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Film, ListVideo, PlusCircle } from "lucide-react";
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
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Add New Content</CardTitle>
            <PlusCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Add a new movie, web series, or drama to the catalog.</CardDescription>
            <Button asChild className="mt-4">
              <Link href="/admin/add-content">
                Add Content
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Manage Content</CardTitle>
            <ListVideo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Edit existing content, add seasons, and manage episodes.</CardDescription>
            <Button asChild className="mt-4">
              <Link href="/admin/content">
                Manage Content
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
