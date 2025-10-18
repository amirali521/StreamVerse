
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function AdminPage() {
  const { user, claims, loaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loaded && !claims?.admin) {
      router.push("/");
    }
  }, [user, claims, loaded, router]);

  if (!loaded || !claims?.admin) {
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
