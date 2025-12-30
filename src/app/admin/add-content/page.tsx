
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { PlusCircle, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { searchContent, getContentDetails } from "./actions";

// Data structures from backend.json
interface Episode {
  episodeNumber: number;
  title: string;
  embedUrl: string;
  downloadUrl: string;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

const contentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["movie", "webseries", "drama"]),
  bannerImageUrl: z.string().min(1, "Please enter a URL for the card image."),
  posterImageUrl: z.string().optional().or(z.literal('')),
  embedUrl: z.string().optional(),
  downloadUrl: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  categories: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

export default function AddContentPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [contentType, setContentType] = useState<"movie" | "webseries" | "drama">("movie");
  const [useTmdb, setUseTmdb] = useState(false);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for managing seasons and episodes
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isAddEpisodeOpen, setAddEpisodeOpen] = useState(false);
  const [isEditEpisodeOpen, setEditEpisodeOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeEmbedUrl, setNewEpisodeEmbedUrl] = useState("");
  const [newEpisodeDownloadUrl, setNewEpisodeDownloadUrl] = useState("");
  
  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "movie",
      bannerImageUrl: "",
      posterImageUrl: "",
      embedUrl: "",
      downloadUrl: "",
      imdbRating: 0,
      categories: "",
      isFeatured: false,
    },
  });
  
  const watchedContentType = useWatch({ control: form.control, name: 'type' });

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery) return;
    setIsSearching(true);
    const results = await searchContent(tmdbSearchQuery, watchedContentType);
    setTmdbSearchResults(results);
    setIsSearching(false);
  };
  
  const handleSelectTmdbResult = async (result: any) => {
    const details = await getContentDetails(result.id, result.media_type);
    if (details) {
        form.setValue("title", details.title);
        form.setValue("description", details.description);
        form.setValue("imdbRating", Number(details.imdbRating));
        form.setValue("categories", details.categories.join(", "));
        form.setValue("bannerImageUrl", details.bannerImageUrl);
        form.setValue("posterImageUrl", details.posterImageUrl);
        setTmdbSearchResults([]);
        setTmdbSearchQuery(details.title);
    }
  };


  const hasMultiSeasonStructure = seasons.length > 0 && seasons.some(s => s.seasonNumber > 1);

  const handleAddSeason = () => {
    const newSeasonNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.seasonNumber)) + 1 : 1;
    const newSeason: Season = { seasonNumber: newSeasonNumber, episodes: [] };
    setSeasons([...seasons, newSeason]);
    toast({ title: "Season Added", description: `Season ${newSeasonNumber} has been staged.` });
  };
  

  const handleAddEpisode = () => {
    if (!newEpisodeTitle || !newEpisodeEmbedUrl || !newEpisodeDownloadUrl) return;

    let updatedSeasons = [...seasons];
    const seasonNumberToAdd = (contentType === 'webseries' && hasMultiSeasonStructure && selectedSeason !== null) ? selectedSeason : 1;

    let seasonExists = updatedSeasons.some(s => s.seasonNumber === seasonNumberToAdd);

    if (seasonExists) {
        updatedSeasons = updatedSeasons.map(s => {
            if (s.seasonNumber === seasonNumberToAdd) {
                const newEpisodeNumber = (s.episodes?.length || 0) + 1;
                const newEpisode: Episode = {
                    episodeNumber: newEpisodeNumber,
                    title: newEpisodeTitle,
                    embedUrl: newEpisodeEmbedUrl,
                    downloadUrl: newEpisodeDownloadUrl,
                };
                return { ...s, episodes: [...s.episodes, newEpisode] };
            }
            return s;
        });
    } else {
        const newEpisode: Episode = { episodeNumber: 1, title: newEpisodeTitle, embedUrl: newEpisodeEmbedUrl, downloadUrl: newEpisodeDownloadUrl };
        const newSeason: Season = { seasonNumber: 1, episodes: [newEpisode] };
        updatedSeasons.push(newSeason);
    }

    setSeasons(updatedSeasons);
    toast({ title: "Episode Staged", description: `${newEpisodeTitle} has been staged.` });
    setAddEpisodeOpen(false);
    setNewEpisodeTitle("");
    setNewEpisodeEmbedUrl("");
    setNewEpisodeDownloadUrl("");
  };

  const handleEditEpisode = () => {
    if (selectedSeason === null || !selectedEpisode || !newEpisodeTitle || !newEpisodeEmbedUrl || !newEpisodeDownloadUrl) return;

    const updatedSeasons = seasons.map(s => {
        if (s.seasonNumber === selectedSeason) {
            const updatedEpisodes = s.episodes.map(e =>
                e.episodeNumber === selectedEpisode.episodeNumber
                ? { ...e, title: newEpisodeTitle, embedUrl: newEpisodeEmbedUrl, downloadUrl: newEpisodeDownloadUrl }
                : e
            );
            return { ...s, episodes: updatedEpisodes };
        }
        return s;
    });

    setSeasons(updatedSeasons);
    toast({ title: "Episode Updated" });
    setEditEpisodeOpen(false);
  };
  
  const handleDeleteEpisode = (seasonNumber: number, episode: Episode) => {
    const updatedSeasons = seasons.map(s => {
        if (s.seasonNumber === seasonNumber) {
            const filteredEpisodes = s.episodes.filter(e => e.episodeNumber !== episode.episodeNumber);
            const renumberedEpisodes = filteredEpisodes.map((ep, index) => ({ ...ep, episodeNumber: index + 1 }));
            return { ...s, episodes: renumberedEpisodes };
        }
        return s;
    });
    setSeasons(updatedSeasons);
    toast({ title: "Episode Removed" });
  };


  async function onSubmit(values: z.infer<typeof contentSchema>) {
    if (!firestore) return;
    
    const categories = values.categories ? values.categories.split(',').map(s => s.trim()).filter(Boolean) : [];

    let contentData: any = {
        title: values.title,
        description: values.description,
        type: values.type,
        bannerImageUrl: values.bannerImageUrl,
        posterImageUrl: values.posterImageUrl || values.bannerImageUrl, // Fallback to banner image if poster is empty
        imdbRating: values.imdbRating || 0,
        categories: categories,
        isFeatured: values.isFeatured || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (values.type === 'movie') {
        if (!values.embedUrl) {
            form.setError("embedUrl", { type: 'manual', message: 'Embed URL/Code is required for movies.' });
            return;
        }
        contentData.embedUrl = values.embedUrl;
        contentData.downloadUrl = values.downloadUrl;
    } else {
        const seasonsWithEpisodes = seasons.filter(s => s.episodes.length > 0);
        if (seasonsWithEpisodes.length === 0) {
           toast({
             variant: "destructive",
             title: "No Episodes",
             description: `A ${values.type} must have at least one episode.`,
           });
           return;
        }
        contentData.seasons = seasonsWithEpisodes;
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

  const renderEpisodesForSeason = (season: Season) => (
    <div className="space-y-2">
        {season.episodes && season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber).map(episode => (
            <div key={episode.episodeNumber} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <p>Ep {episode.episodeNumber}: {episode.title}</p>
                <div className="flex items-center gap-2">
                    <Dialog open={isEditEpisodeOpen && selectedEpisode?.episodeNumber === episode.episodeNumber && selectedSeason === season.seasonNumber} onOpenChange={(isOpen) => !isOpen && setEditEpisodeOpen(false)}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" onClick={() => { setSelectedSeason(season.seasonNumber); setSelectedEpisode(episode); setNewEpisodeTitle(episode.title); setNewEpisodeEmbedUrl(episode.embedUrl); setNewEpisodeDownloadUrl(episode.downloadUrl); setEditEpisodeOpen(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit Episode {episode.episodeNumber}</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Label htmlFor="edit-episode-title">Title</Label>
                                <Input id="edit-episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} />
                                <Label htmlFor="edit-episode-embed-url">Embed URL / Code</Label>
                                <Input id="edit-episode-embed-url" value={newEpisodeEmbedUrl} onChange={(e) => setNewEpisodeEmbedUrl(e.target.value)} />
                                <Label htmlFor="edit-episode-download-url">Download URL</Label>
                                <Input id="edit-episode-download-url" value={newEpisodeDownloadUrl} onChange={(e) => setNewEpisodeDownloadUrl(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setEditEpisodeOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={handleEditEpisode}>Save Changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Episode?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{episode.title}". This action is final.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEpisode(season.seasonNumber, episode)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        ))}
        {(!season.episodes || season.episodes.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No episodes in this season yet.</p>}
    </div>
  );

  return (
    <div className="container py-4">
       <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New Content</CardTitle>
          <CardDescription>
            Fill out the form to add a new movie, web series, or drama.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* General Details Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="text-lg font-semibold">General Details</h3>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="tmdb-switch">Auto-fill with TMDB</Label>
                                <Switch id="tmdb-switch" checked={useTmdb} onCheckedChange={setUseTmdb} />
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Content Type</FormLabel>
                                <Select onValueChange={(value) => {
                                    const val = value as "movie" | "webseries" | "drama";
                                    field.onChange(val);
                                    setContentType(val);
                                    if (val !== 'movie' && seasons.length === 0) {
                                      setSeasons([{ seasonNumber: 1, episodes: [] }]);
                                    } else if (val === 'movie') {
                                      setSeasons([]);
                                    }
                                }} defaultValue={field.value} disabled={useTmdb}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a content type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="movie">Movie</SelectItem>
                                    <SelectItem value="webseries">Web Series</SelectItem>
                                    <SelectItem value="drama">Drama</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />

                            {useTmdb && (
                                <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                     <h4 className="font-semibold text-center">Fetch from TMDB</h4>
                                     <div className="flex w-full items-center space-x-2">
                                        <Input
                                            type="text"
                                            placeholder={`Search for a ${watchedContentType}...`}
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
                            )}

                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter content title" {...field} disabled={useTmdb} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter a short description" {...field} disabled={useTmdb} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="categories" render={({ field }) => (
                                <FormItem><FormLabel>Categories / Tags</FormLabel><FormControl><Input placeholder="e.g. Bollywood, Action, Romance" {...field} disabled={useTmdb} /></FormControl><FormDescription>Enter comma-separated tags.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Banner Image URL (for cards)</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} disabled={useTmdb} /></FormControl><FormDescription>Used for carousels and grids.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="posterImageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Poster Image URL (for player/hero)</FormLabel><FormControl><Input placeholder="https://example.com/poster.jpg" {...field} disabled={useTmdb} /></FormControl><FormDescription>Optional. Used for the hero banner and video player. If blank, the banner image will be used.</FormDescription><FormMessage /></FormItem>
                            )} />
                            {contentType === 'movie' && (
                                <div className="space-y-4">
                                <FormField control={form.control} name="embedUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Embed URL / Code</FormLabel>
                                    <FormControl><Input placeholder="Paste embed link or <iframe> code" {...field} /></FormControl>
                                    <FormDescription>The URL for the video player (e.g., from Doodstream, Mixdrop).</FormDescription><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="downloadUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Download URL</FormLabel>
                                    <FormControl><Input placeholder="Paste direct download link" {...field} /></FormControl>
                                    <FormDescription>The direct link to the video file for downloading.</FormDescription><FormMessage /></FormItem>
                                )} />
                                </div>
                            )}
                            <FormField control={form.control} name="imdbRating" render={({ field }) => (
                                <FormItem><FormLabel>IMDb Rating</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="10" {...field} disabled={useTmdb} /></FormControl><FormMessage /></FormItem>
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
                    
                    {/* Season and Episode Management Section */}
                    {contentType !== 'movie' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-semibold">{contentType === 'webseries' && hasMultiSeasonStructure ? 'Seasons & Episodes' : 'Episodes'}</h3>
                                <div className="flex gap-2">
                                    <Dialog open={isAddEpisodeOpen} onOpenChange={(isOpen) => !isOpen && setAddEpisodeOpen(false)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" type="button" onClick={() => {
                                                const seasonNumber = (contentType === 'webseries' && hasMultiSeasonStructure) ? (selectedSeason || 1) : 1;
                                                setSelectedSeason(seasonNumber);
                                                const season = seasons.find(s => s.seasonNumber === seasonNumber);
                                                const nextEpisodeNumber = (season?.episodes.length || 0) + 1;
                                                const formattedEpisodeNumber = String(nextEpisodeNumber).padStart(2, '0');
                                                setNewEpisodeTitle(`Episode ${formattedEpisodeNumber}`);
                                                setNewEpisodeEmbedUrl("");
                                                setNewEpisodeDownloadUrl("");
                                                setAddEpisodeOpen(true);
                                            }}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Episode
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Add Episode {selectedSeason && hasMultiSeasonStructure ? `to Season ${selectedSeason}` : ''}</DialogTitle></DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <Label htmlFor="episode-title">Title</Label>
                                                <Input id="episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} />
                                                <Label htmlFor="episode-embed-url">Embed URL / Code</Label>
                                                <Input id="episode-embed-url" value={newEpisodeEmbedUrl} onChange={(e) => setNewEpisodeEmbedUrl(e.target.value)} placeholder="Paste embed link or <iframe> code" />
                                                <Label htmlFor="episode-download-url">Download URL</Label>
                                                <Input id="episode-download-url" value={newEpisodeDownloadUrl} onChange={(e) => setNewEpisodeDownloadUrl(e.target.value)} placeholder="Paste download link" />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" type="button" onClick={() => setAddEpisodeOpen(false)}>Cancel</Button>
                                                <Button type="button" onClick={handleAddEpisode}>Save Episode</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    {contentType === 'webseries' && (
                                        <Button type="button" onClick={handleAddSeason}><PlusCircle className="mr-2 h-4 w-4" /> Add Season</Button>
                                    )}
                                </div>
                            </div>
                            
                            {contentType === 'webseries' && seasons.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" onValueChange={(value) => setSelectedSeason(Number(value.split('-')[1]))}>
                                    {seasons.sort((a,b) => a.seasonNumber - b.seasonNumber).map(season => (
                                    <AccordionItem value={`item-${season.seasonNumber}`} key={season.seasonNumber}>
                                        <AccordionTrigger className="text-xl">Season {season.seasonNumber}</AccordionTrigger>
                                        <AccordionContent>
                                            {renderEpisodesForSeason(season)}
                                        </AccordionContent>
                                    </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="pt-4">
                                    {(seasons[0] && seasons[0].episodes.length > 0) || contentType === 'drama'
                                      ? renderEpisodesForSeason(seasons[0] || {seasonNumber: 1, episodes: []}) 
                                      : <p className="text-muted-foreground text-center py-8">No episodes yet. Add one to get started.</p>
                                    }
                                </div>
                            )}

                        </div>
                    )}

                    <Button type="submit">Add Content</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    