
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractVideo } from "@/ai/flows/extract-video-flow";
import { Copy, Loader2 } from "lucide-react";

const contentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["movie", "webseries", "drama"]),
  bannerImageUrl: z.string().url("Please enter a valid URL."),
  googleDriveVideoUrl: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
});

function VideoExtractor() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [extractedUrl, setExtractedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    if (!sourceUrl) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a source URL to extract from.",
      });
      return;
    }
    setIsLoading(true);
    setExtractedUrl("");
    try {
      const result = await extractVideo({ sourceUrl });
      if (result.videoUrl) {
        setExtractedUrl(result.videoUrl);
        toast({
          title: "Extraction Successful",
          description: "Video link has been extracted.",
        });
      } else {
        throw new Error(result.error || "No video URL found.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: error.message || "Could not extract video link from the URL.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedUrl) return;
    navigator.clipboard.writeText(extractedUrl);
    toast({
      title: "Copied!",
      description: "The extracted video URL has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
       <div className="space-y-1">
        <h3 className="text-lg font-semibold">Video Link Extractor</h3>
        <p className="text-sm text-muted-foreground">
            Paste a webpage URL (e.g., from YouTube, Dailymotion) to automatically get the direct video link.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Enter webpage URL to extract video from" 
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <Button onClick={handleExtract} disabled={isLoading} type="button">
          {isLoading ? <Loader2 className="animate-spin" /> : "Extract"}
        </Button>
      </div>
      {extractedUrl && (
        <div className="flex items-center gap-2">
           <Input 
            value={extractedUrl}
            readOnly
            disabled
            className="bg-muted text-muted-foreground"
          />
           <Button variant="outline" size="icon" onClick={handleCopy} type="button">
                <Copy className="h-4 w-4" />
           </Button>
        </div>
      )}
    </div>
  );
}


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
                description: "Video URL is required for movies.",
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
            Fill out the form to add a new movie, web series, or drama. You can use the extractor to get video links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <VideoExtractor />

            <Separator />
            
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
                            <FormLabel>Video URL</FormLabel>
                            <FormControl>
                            <Input placeholder="Use the extractor above or paste a direct link" {...field} />
                            </FormControl>
                            <FormDescription>
                            This will be used for streaming and download.
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
