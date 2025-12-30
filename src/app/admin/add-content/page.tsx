
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
import { Search, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { searchContent, getContentDetails } from "./actions";

const contentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["movie", "webseries", "drama"]),
  bannerImageUrl: z.string().min(1, "Please enter a URL for the card image."),
  posterImageUrl: z.string().optional().or(z.literal('')),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tmdbId: z.coerce.number().min(1, "A TMDB ID is required to source the video."),
});

export default function AddContentPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchType, setTmdbSearchType] = useState<"movie" | "webseries" | "drama">("movie");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "movie",
      bannerImageUrl: "",
      posterImageUrl: "",
      imdbRating: 0,
      categories: "",
      isFeatured: false,
      tmdbId: 0,
    },
  });

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery) return;
    setIsSearching(true);
    const results = await searchContent(tmdbSearchQuery, tmdbSearchType);
    setTmdbSearchResults(results);
    setIsSearching(false);
  };
  
  const handleSelectTmdbResult = async (result: any) => {
    const tmdbType = result.media_type === 'movie' ? 'movie' : 'tv';
    const details = await getContentDetails(result.id, tmdbType);

    if (details) {
        form.setValue("tmdbId", result.id);
        form.setValue("title", details.title);
        form.setValue("description", details.description);
        form.setValue("imdbRating", Number(details.imdbRating));
        form.setValue("categories", details.categories.join(", "));
        form.setValue("bannerImageUrl", details.bannerImageUrl);
        form.setValue("posterImageUrl", details.posterImageUrl);
        
        const selectedType = tmdbType === 'movie' ? 'movie' : tmdbSearchType as "webseries" | "drama";
        form.setValue("type", selectedType);

        setTmdbSearchResults([]);
        setTmdbSearchQuery(details.title);
    }
  };

  async function onSubmit(values: z.infer<typeof contentSchema>) {
    if (!firestore) return;
    
    const categories = values.categories ? values.categories.split(',').map(s => s.trim()).filter(Boolean) : [];

    let contentData: any = {
        tmdbId: values.tmdbId,
        title: values.title,
        description: values.description,
        type: values.type,
        bannerImageUrl: values.bannerImageUrl,
        posterImageUrl: values.posterImageUrl || values.bannerImageUrl,
        imdbRating: values.imdbRating || 0,
        categories: categories,
        isFeatured: values.isFeatured || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, "content"), contentData);
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
    <div className="container py-4">
       <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New Content</CardTitle>
          <CardDescription>
            Fill out the form to add a new movie, web series, or drama. Use TMDB search to auto-fill details, which will automatically source the video from VidLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="text-lg font-semibold">Content Details</h3>
                        </div>

                        <div className="space-y-6 pt-4">
                            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                <h4 className="font-semibold text-center">Auto-fill with TMDB</h4>
                                <div className="flex w-full items-center space-x-2">
                                    <Select
                                    value={tmdbSearchType}
                                    onValueChange={(value) => setTmdbSearchType(value as any)}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="movie">Movie</SelectItem>
                                        <SelectItem value="webseries">Web Series</SelectItem>
                                        <SelectItem value="drama">Drama</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="text"
                                    placeholder={`Search for a ${tmdbSearchType}...`}
                                    value={tmdbSearchQuery}
                                    onChange={(e) => setTmdbSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTmdbSearch(); }}}
                                />
                                <Button type="button" onClick={handleTmdbSearch} disabled={isSearching}>
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                            {tmdbSearchResults.length > 0 && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {tmdbSearchResults.map((result) => (
                                        <button key={result.id} type="button" onClick={() => handleSelectTmdbResult(result)} className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-4">
                                            <Image src={result.poster_path ? `https://image.tmdb.org/t/p/w92${result.poster_path}` : "/placeholder.svg"} alt="poster" width={40} height={60} className="rounded-sm" />
                                            <div>
                                                <p className="font-semibold">{result.title}</p>
                                                {result.release_date && <p className="text-xs text-muted-foreground">{new Date(result.release_date).getFullYear()}</p>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            </div>
                             <FormField control={form.control} name="tmdbId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>TMDB ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Auto-filled from TMDB Search" {...field} readOnly />
                                    </FormControl>
                                    <FormDescription>This ID is used to source the video from VidLink.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Content Type</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value as "movie" | "webseries" | "drama")} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a content type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="movie">Movie</SelectItem>
                                    <SelectItem value="webseries">Web Series</SelectItem>
                                    <SelectItem value="drama">Drama</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter content title" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter a short description" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="categories" render={({ field }) => (
                                <FormItem><FormLabel>Categories / Tags</FormLabel><FormControl><Input placeholder="e.g. Bollywood, Action, Romance" {...field} /></FormControl><FormDescription>Enter comma-separated tags.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Banner Image URL (for cards)</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormDescription>Used for carousels and grids.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="posterImageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Poster Image URL (for player/hero)</FormLabel><FormControl><Input placeholder="https://example.com/poster.jpg" {...field} /></FormControl><FormDescription>Optional. Used for the hero banner and video player. If blank, the banner image will be used.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imdbRating" render={({ field }) => (
                                <FormItem><FormLabel>IMDb Rating</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="10" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="isFeatured" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Feature on Homepage</FormLabel>
                                    <FormDescription>
                                        Enable to show this content in the hero banner on the homepage.
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
                        </div>
                    </div>
                    <Button type="submit">Add Content</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
