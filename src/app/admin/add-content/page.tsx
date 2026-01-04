
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Search, Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { searchContent, getContentDetails } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createDownloadUrl, createEmbedUrl } from "@/lib/utils";

const episodeSchema = z.object({
  episodeNumber: z.coerce.number().min(1, "Episode number is required."),
  title: z.string().optional(),
  googleDriveUrl: z.string().min(1, "Google Drive URL is required."),
});

const seasonSchema = z.object({
  seasonNumber: z.coerce.number().min(1, "Season number is required."),
  episodes: z.array(episodeSchema),
});


const contentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["movie", "webseries", "drama"]),
  bannerImageUrl: z.string().url("Please enter a valid URL for the card image."),
  posterImageUrl: z.string().url("Please enter a valid URL for the poster image.").optional().or(z.literal('')),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tmdbId: z.coerce.number().optional(),
  googleDriveUrl: z.string().optional(), // For Movie player/download OR Series package download
  seasons: z.array(seasonSchema).optional(),
});


function SeasonsEpisodesField({ control, getValues }: { control: any, getValues: any }) {
    const { fields: seasonFields, append: appendSeason, remove: removeSeason } = useFieldArray({
        control,
        name: "seasons"
    });

    return (
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold">Season & Episode Management</h4>
            <p className="text-sm text-muted-foreground">
                For series and dramas, add seasons and episodes below. Use a Google Drive link for each episode.
            </p>

            <Accordion type="multiple" className="w-full">
                {seasonFields.map((season, seasonIndex) => (
                    <AccordionItem value={`season-${seasonIndex}`} key={season.id}>
                        <AccordionTrigger className="font-semibold">
                            Season {getValues(`seasons.${seasonIndex}.seasonNumber`) || seasonIndex + 1}
                        </AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-4 p-2 border-l-2">
                                <FormField
                                    control={control}
                                    name={`seasons.${seasonIndex}.seasonNumber`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Season Number</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <EpisodeArrayField seasonIndex={seasonIndex} control={control} />

                                <Button type="button" variant="destructive" size="sm" onClick={() => removeSeason(seasonIndex)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Season
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendSeason({ seasonNumber: seasonFields.length + 1, episodes: [] })}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Season
            </Button>
        </div>
    );
}

function EpisodeArrayField({ seasonIndex, control }: { seasonIndex: number, control: any }) {
    const { fields: episodeFields, append: appendEpisode, remove: removeEpisode } = useFieldArray({
        control,
        name: `seasons.${seasonIndex}.episodes`
    });

    return (
        <div className="space-y-4">
            <h5 className="font-medium text-sm">Episodes</h5>
            {episodeFields.map((episode, episodeIndex) => (
                <div key={episode.id} className="p-3 bg-background/50 rounded-md border space-y-2">
                     <FormField
                        control={control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.episodeNumber`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Episode Number</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.googleDriveUrl`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google Drive URL (Episode)</FormLabel>
                                <FormControl><Input placeholder="Paste Google Drive link for this episode" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeEpisode(episodeIndex)}>
                        Remove Episode
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendEpisode({ episodeNumber: episodeFields.length + 1, googleDriveUrl: "" })}
            >
                Add Episode
            </Button>
        </div>
    );
}


export default function AddContentPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchType, setTmdbSearchType] = useState<"movie" | "webseries" | "drama">("movie");
  const [tmdbSearchIsDubbed, setTmdbSearchIsDubbed] = useState(false);
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
      googleDriveUrl: "",
      seasons: [],
    },
  });

  const contentType = form.watch("type");

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery) return;
    setIsSearching(true);
    const results = await searchContent(tmdbSearchQuery, tmdbSearchType, tmdbSearchIsDubbed);
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
        
        let currentCategories = form.getValues("categories") || "";
        let newCategories = details.categories || [];

        if (tmdbSearchIsDubbed && !newCategories.some((c: string) => c.toLowerCase() === 'hindi dubbed')) {
          newCategories.push("Hindi Dubbed");
        }
        
        const combinedCategories = [...currentCategories.split(',').map(c => c.trim()), ...newCategories]
            .filter((value, index, self) => self.findIndex(v => v.toLowerCase() === value.toLowerCase()) === index && value)
            .join(', ');
        
        form.setValue("categories", combinedCategories);
        
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
    
    if (values.type === 'movie') {
        // For movies, the main googleDriveUrl is for both player and download
        contentData.embedUrl = values.googleDriveUrl ? createEmbedUrl(values.googleDriveUrl) : "";
        contentData.downloadUrl = values.googleDriveUrl ? createDownloadUrl(values.googleDriveUrl) : "";
    } else {
        // For series, the main googleDriveUrl is for the package download only
        contentData.downloadUrl = values.googleDriveUrl ? createDownloadUrl(values.googleDriveUrl) : "";
        
        // Process seasons and episodes
        contentData.seasons = (values.seasons || []).map(season => ({
            seasonNumber: season.seasonNumber,
            episodes: season.episodes.map(episode => ({
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                // Each episode gets its own embed and download URL from its googleDriveUrl
                embedUrl: createEmbedUrl(episode.googleDriveUrl),
                downloadUrl: createDownloadUrl(episode.googleDriveUrl),
            }))
        }));
    }


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
            Fill out the form to add a new movie, web series, or drama. Use TMDB search to auto-fill details.
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
                            <div className="flex items-center space-x-2">
                                <Checkbox id="dubbed-search" checked={tmdbSearchIsDubbed} onCheckedChange={(checked) => setTmdbSearchIsDubbed(!!checked)} />
                                <Label htmlFor="dubbed-search" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Search for Hindi Dubbed version
                                </Label>
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
                                        <Input placeholder="Auto-filled from TMDB Search" {...field} />
                                    </FormControl>
                                    <FormDescription>The ID from The Movie Database used to fetch images and details.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField
                                control={form.control}
                                name="googleDriveUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {contentType === 'movie' ? 'Google Drive URL (Movie)' : 'Google Drive URL (Series Package)'}
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Paste Google Drive share link here" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {contentType === 'movie' 
                                                ? 'Used for both the movie player and download link.'
                                                : 'Used for the full series/season package download link. Episode links are managed below.'
                                            }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
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
                                <FormItem><FormLabel>Categories / Tags</FormLabel><FormControl><Input placeholder="e.g. Bollywood, Action, Hindi Dubbed" {...field} /></FormControl><FormDescription>Enter comma-separated tags.</FormDescription><FormMessage /></FormItem>
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
                    
                    {(contentType === 'webseries' || contentType === 'drama') && (
                        <SeasonsEpisodesField control={form.control} getValues={form.getValues} />
                    )}

                    <Button type="submit">Add Content</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    