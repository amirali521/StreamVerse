
"use client";
import { useFirestore, useUser } from "@/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Content {
  id: string;
  title: string;
  type: "movie" | "webseries" | "drama";
}

export default function ManageContentPage() {
  const firestore = useFirestore();
  const [contentList, setContentList] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!firestore) return;
      setLoading(true);
      const contentCollection = collection(firestore, "content");
      const contentSnapshot = await getDocs(contentCollection);
      const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
      setContentList(contents);
      setLoading(false);
    };
    fetchContent();
  }, [firestore]);
  
  const handleDelete = async (id: string, title: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, "content", id));
        setContentList(contentList.filter(c => c.id !== id));
        toast({
            title: "Content Deleted",
            description: `${title} has been successfully deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting Content",
            description: error.message || "Could not delete content.",
        });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading content...</div>;
  }

  return (
    <div className="container py-10">
    <Card>
      <CardHeader>
        <CardTitle>Manage Content</CardTitle>
        <CardDescription>View, edit, or delete existing content in the catalog.</CardDescription>
      </CardHeader>
      <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentList.length === 0 ? (
            <TableRow>
                <TableCell colSpan={3} className="text-center h-24">No content found.</TableCell>
            </TableRow>
          ) : (
            contentList.map(content => (
                <TableRow key={content.id}>
                <TableCell className="font-medium">{content.title}</TableCell>
                <TableCell className="capitalize">{content.type}</TableCell>
                <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/content/${content.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the content
                                "{content.title}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(content.id, content.title)}>
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
                </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
    </div>
  );
}
