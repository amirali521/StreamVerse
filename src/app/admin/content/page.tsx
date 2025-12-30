
"use client";

import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, MoreVertical } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";


interface Content {
  id: string;
  title: string;
  description: string;
  type: "movie" | "webseries" | "drama";
  bannerImageUrl: string;
  posterImageUrl?: string;
  imdbRating?: number;
  categories?: string[];
  isFeatured?: boolean;
  tmdbId?: number;
}

const editContentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  bannerImageUrl: z.string().url("Please enter a valid URL for the card image."),
  posterImageUrl: z.string().url("Please enter a valid URL for the poster image.").optional().or(z.literal('')),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

function EditContentForm({ contentItem, onUpdate, closeDialog }: { contentItem: Content, onUpdate: (updatedContent: Content) => void, closeDialog: () => void }) {
    const firestore = useFirestore();
    const form = useForm<z.infer<typeof editContentSchema>>({
        resolver: zodResolver(editContentSchema),
        defaultValues: {
            title: contentItem.title,
            description: contentItem.description,
            bannerImageUrl: contentItem.bannerImageUrl,
            posterImageUrl: contentItem.posterImageUrl || "",
            imdbRating: contentItem.imdbRating || 0,
            categories: contentItem.categories?.join(", ") || "",
            isFeatured: contentItem.isFeatured || false,
        },
    });

    async function onSubmit(values: z.infer<typeof editContentSchema>) {
        if (!firestore) return;

        const categories = values.categories ? values.categories.split(',').map(s => s.trim()).filter(Boolean) : [];

        const updatedData: Partial<Content> & { updatedAt: any } = {
            title: values.title,
            description: values.description,
            bannerImageUrl: values.bannerImageUrl,
            posterImageUrl: values.posterImageUrl || values.bannerImageUrl,
            categories,
            imdbRating: values.imdbRating || 0,
            isFeatured: values.isFeatured || false,
            updatedAt: serverTimestamp()
        };

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, updatedData);
            onUpdate({ ...contentItem, ...updatedData, posterImageUrl: updatedData.posterImageUrl, isFeatured: updatedData.isFeatured });
            toast({ title: "Content Updated", description: `${values.title} has been updated.` });
            closeDialog();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="categories" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories / Tags</FormLabel>
                    <FormControl><Input placeholder="e.g. Bollywood, Action" {...field} /></FormControl>
                    <FormDescription>Comma-separated values. These create filters for users.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Banner Image URL (for cards)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="posterImageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Poster Image URL (for player/hero)</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Optional. Used for hero/player. If blank, banner image is used.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imdbRating" render={({ field }) => (
                    <FormItem><FormLabel>IMDb Rating</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                        <FormLabel>Feature on Homepage</FormLabel>
                        <FormDescription>
                            Show this in the hero banner on the homepage.
                        </FormDescription>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                    </FormItem>
                )} />
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function EditContentModal({ contentItem, onOpenChange, onUpdate, isOpen }: { contentItem: Content, isOpen: boolean, onOpenChange: (open: boolean) => void, onUpdate: (updatedContent: Content) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit: {contentItem.title}</DialogTitle>
                    <DialogDescription>Update the details for this content. Video content is sourced automatically from VidLink via its TMDB ID.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className="py-4 pr-6">
                      <EditContentForm
                        contentItem={contentItem}
                        onUpdate={onUpdate}
                        closeDialog={() => onOpenChange(false)}
                      />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function ContentGridCard({
    content,
    onEdit,
    onDelete,
}: {
    content: Content;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card className="overflow-hidden group">
            <CardContent className="p-0 relative">
                <div className="aspect-[2/3] w-full relative">
                    <Image
                        src={content.bannerImageUrl}
                        alt={content.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                   <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="font-semibold truncate">{content.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{content.type}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ManageContentPage() {
  const firestore = useFirestore();
  const [contentList, setContentList] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");


  const fetchContent = async () => {
    if (!firestore) return;
    setLoading(true);
    const contentCollection = collection(firestore, "content");
    const contentSnapshot = await getDocs(contentCollection);
    const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
    setContentList(contents);
    setLoading(false);
  };

  useEffect(() => {
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

  const handleUpdate = (updatedContent: Content) => {
    setContentList(contentList.map(c => c.id === updatedContent.id ? updatedContent : c));
  };
  
  const filteredContent = useMemo(() => {
    let filtered = contentList;

    if (activeTab !== "all") {
        if (["movie", "webseries", "drama"].includes(activeTab)) {
            filtered = filtered.filter(item => item.type === activeTab);
        } else {
            filtered = filtered.filter(item => 
                item.categories?.some(cat => cat.toLowerCase() === activeTab.toLowerCase())
            );
        }
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [contentList, activeTab, searchTerm]);


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading content...</div>;
  }

  return (
    <div className="container py-4">
    <Card>
      <CardHeader>
        <CardTitle>Manage Content</CardTitle>
        <CardDescription>View, edit, or delete existing content in the catalog.</CardDescription>
      </CardHeader>
      <CardContent>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by title..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-full sm:w-auto overflow-x-auto">
              <TabsList className="w-max sm:w-auto sm:inline-flex">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="movie">Movies</TabsTrigger>
                  <TabsTrigger value="webseries">Web Series</TabsTrigger>
                  <TabsTrigger value="drama">Dramas</TabsTrigger>
                  <TabsTrigger value="bollywood">Bollywood</TabsTrigger>
                  <TabsTrigger value="hollywood">Hollywood</TabsTrigger>
              </TabsList>
            </div>
        </div>

        <div className="relative h-[60vh] overflow-y-auto rounded-md border">
            <div className="overflow-x-auto p-4">
                {filteredContent.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No content found for this filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredContent.map(content => (
                            <AlertDialog key={content.id}>
                                <ContentGridCard
                                    content={content}
                                    onEdit={() => setEditingContent(content)}
                                    onDelete={() => {}}
                                />
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete "{content.title}".
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
                        ))}
                    </div>
                )}
            </div>
        </div>
       </Tabs>
      </CardContent>
    </Card>

    {editingContent && (
        <EditContentModal
            isOpen={!!editingContent}
            onOpenChange={(open) => !open && setEditingContent(null)}
            contentItem={editingContent}
            onUpdate={handleUpdate}
        />
    )}
    </div>
  );
}
