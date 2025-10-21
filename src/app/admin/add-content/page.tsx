
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

const contentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["movie", "webseries", "drama"]),
  bannerImageUrl: z.string().url("Please enter a valid URL."),
  googleDriveVideoUrl: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
});

export default function AddContentPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [contentType, setContentType] = useState<"movie" | "webseries" | "drama">("movie");

  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "movie",
      bannerImageUrl: "",
      googleDriveVideoUrl: "",
      imdbRating: 0,
      categories: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contentSchema>) {
    if (!firestore) return;
    
    // Convert category string to array of tags
    const categories = values.categories ? values.categories.split(',').map(s => s.trim()).filter(Boolean) : [];

    let contentData: any = {
        title: values.title,
        description: values.description,
        type: values.type,
        bannerImageUrl: values.bannerImageUrl,
        imdbRating: values.imdbRating || 0,
        categories: categories,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (values.type === 'movie') {
        if (!values.googleDriveVideoUrl) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Google Drive Video URL is required for movies.",
            });
            return;
        }
        contentData.googleDriveVideoUrl = values.googleDriveVideoUrl;
    } else {
        contentData.seasons = [];
    }


    try {
      const docRef = await addDoc(collection(firestore, "content"), contentData);
      toast({
        title: "Content Added",
        description: `${values.title} has been successfully added.`,
      });
      router.push(`/admin/content`);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not add content.",
      });
    }
  }

  return (
    <div className="container py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Content</CardTitle>
          <CardDescription>
            Fill out the form to add a new movie, web series, or drama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter content title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a short description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        setContentType(value as "movie" | "webseries" | "drama");
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="webseries">Web Series</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories / Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bollywood, Action, Romance" {...field} />
                    </FormControl>
                     <FormDescription>
                      Enter comma-separated tags. These will be used for filtering.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bannerImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {contentType === 'movie' && (
                 <FormField
                    control={form.control}
                    name="googleDriveVideoUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Google Drive Video URL</FormLabel>
                        <FormControl>
                        <Input placeholder="https://drive.google.com/..." {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be converted for streaming and download.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}

              <FormField
                control={form.control}
                name="imdbRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMDb Rating</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Content</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
