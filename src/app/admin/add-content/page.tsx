
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
import { listYouTubeFormats, getYouTubeDownloadUrl } from "@/ai/flows/youtube-flow";
import { type YouTubeFormat } from "@/ai/flows/youtube-types";
import { Copy, Loader2, Youtube } from "lucide-react";
import { createEmbedUrl } from "@/lib/utils";
import { Label } from "@/components/ui/label";


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

  const handleCopy = (textToCopy: string, toastMessage: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied!",
      description: toastMessage,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
       <div className="space-y-1">
        <h3 className="text-lg font-semibold">Video Link Extractor (Non-YouTube)</h3>
        <p className="text-sm text-muted-foreground">
            Paste a webpage URL from sites like Dailymotion to automatically get the direct video link. For YouTube, use the dedicated section below.
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
           <Button variant="outline" size="icon" onClick={() => handleCopy(extractedUrl, "The extracted video URL has been copied.")} type="button">
                <Copy className="h-4 w-4" />
           </Button>
        </div>
      )}
    </div>
  );
}

function YouTubeVideoManager() {
    const [ytUrl, setYtUrl] = useState('');
    const [formats, setFormats] = useState<YouTubeFormat[]>([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [isLoading, setIsLoading] = useState<'analyze' | 'getLink' | false>(false);

    const handleAnalyze = async () => {
        if (!ytUrl) return;
        setIsLoading('analyze');
        setFormats([]);
        setEmbedUrl('');
        setDownloadUrl('');
        try {
            const result = await listYouTubeFormats({ sourceUrl: ytUrl });
            if (result.error) throw new Error(result.error);
            if (!result.formats || result.formats.length === 0) throw new Error("No formats found.");
            setFormats(result.formats);
            
            // Set default format to 720p if available, otherwise the best
            const defaultFormat = result.formats.find(f => f.format_note?.includes('720p')) || result.formats[result.formats.length - 1];
            setSelectedFormat(defaultFormat.format_id);

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetLinks = async () => {
        if (!ytUrl || !selectedFormat) return;
        setIsLoading('getLink');
        try {
            // Embed URL is generated client-side
            const playerEmbedUrl = createEmbedUrl(ytUrl);
            setEmbedUrl(playerEmbedUrl);

            // Download URL is fetched from the backend
            const result = await getYouTubeDownloadUrl({ sourceUrl: ytUrl, formatId: selectedFormat });
            if (result.error) throw new Error(result.error);
            setDownloadUrl(result.videoUrl!);

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to Get Link', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (textToCopy: string, toastMessage: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        toast({
        title: "Copied!",
        description: toastMessage,
        });
    };

    return (
        <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Youtube className="text-red-500" /> YouTube Content Manager</h3>
                <p className="text-sm text-muted-foreground">
                    Get playable embed links and downloadable video links for YouTube content.
                </p>
            </div>
            {/* Step 1: Input URL and Analyze */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Enter YouTube video URL"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    disabled={!!isLoading}
                />
                <Button onClick={handleAnalyze} disabled={isLoading === 'analyze'} type="button">
                    {isLoading === 'analyze' ? <Loader2 className="animate-spin" /> : "Analyze URL"}
                </Button>
            </div>

            {/* Step 2: Select Format and Get Links */}
            {formats.length > 0 && (
                <div className="flex items-center gap-2">
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a download format" />
                        </SelectTrigger>
                        <SelectContent>
                            {formats.map((f) => (
                                <SelectItem key={f.format_id} value={f.format_id}>
                                    {f.format_note} ({f.ext}) - {f.filesize_approx_str}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGetLinks} disabled={isLoading === 'getLink'} type="button">
                        {isLoading === 'getLink' ? <Loader2 className="animate-spin" /> : "Get Links"}
                    </Button>
                </div>
            )}
            
            {/* Step 3: Display and Copy Links */}
            {embedUrl && (
                 <div className="space-y-2">
                    <Label>Embed Link (for Player)</Label>
                    <div className="flex items-center gap-2">
                        <Input value={embedUrl} readOnly disabled className="bg-muted text-muted-foreground" />
                        <Button variant="outline" size="icon" onClick={() => handleCopy(embedUrl, "Embed URL copied to clipboard.")} type="button"><Copy className="h-4 w-4" /></Button>
                    </div>
                 </div>
            )}
            {downloadUrl && (
                 <div className="space-y-2">
                    <Label>Download Link</Label>
                    <div className="flex items-center gap-2">
                        <Input value={downloadUrl} readOnly disabled className="bg-muted text-muted-foreground" />
                        <Button variant="outline" size="icon" onClick={() => handleCopy(downloadUrl, "Download URL copied to clipboard.")} type="button"><Copy className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </div>
    );
}


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
            Fill out the form to add a new movie, web series, or drama. Use the tools below to generate video links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <YouTubeVideoManager />
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
                        <Input placeholder="e.g. Bollywood, Action, Romance, Hollywood Hindi Dubbed" {...field} />
                        </FormControl>
                        <FormDescription>
                        Enter comma-separated tags. These will automatically create filter options for users.
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
                            <Input placeholder="Use a tool above or paste a direct video/embed link" {...field} />
                            </FormControl>
                            <FormDescription>
                            This is the main link for streaming (e.g., YouTube embed or Google Drive preview).
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
