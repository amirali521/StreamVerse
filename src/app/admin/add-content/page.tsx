
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
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

// Data structures from backend.json
interface Episode {
  episodeNumber: number;
  title: string;
  videoUrl: string;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
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

  // State for managing seasons and episodes
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isAddEpisodeOpen, setAddEpisodeOpen] = useState(false);
  const [isEditEpisodeOpen, setEditEpisodeOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeUrl, setNewEpisodeUrl] = useState("");
  
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

  const hasMultiSeasonStructure = seasons.length > 0 && seasons.some(s => s.seasonNumber > 1);

  const handleAddSeason = () => {
    // If we're creating the first explicit season, check if there are any "default" episodes
    // and move them into this new season.
    let defaultEpisodes: Episode[] = [];
    if (seasons.length === 1 && seasons[0].seasonNumber === 1 && !hasMultiSeasonStructure) {
        defaultEpisodes = seasons[0].episodes;
    }
    
    const newSeasonNumber = seasons.length + 1;
    const newSeason: Season = { seasonNumber: newSeasonNumber, episodes: [] };
    
    let newSeasons;
    // If we only had a "default" season, replace it with a numbered season 1
    if (seasons.length === 1 && seasons[0].seasonNumber === 1 && !hasMultiSeasonStructure) {
        seasons[0].episodes = defaultEpisodes; // Add default episodes to season 1
        newSeasons = [...seasons, newSeason];
    } else if (seasons.length === 0) { // If starting completely fresh
        const seasonOne: Season = { seasonNumber: 1, episodes: [] };
        newSeasons = [seasonOne, newSeason];
    }
    else {
        newSeasons = [...seasons, newSeason];
    }
    
    // Ensure season numbers are contiguous if we manipulated them
    const finalSeasons = newSeasons.map((s, i) => ({...s, seasonNumber: i + 1}));

    setSeasons(finalSeasons);
    toast({ title: "Season Added", description: `Season ${newSeasonNumber} has been staged.` });
  };

  const handleAddEpisode = () => {
    if (!newEpisodeTitle || !newEpisodeUrl) return;

    let updatedSeasons = [...seasons];

    // If we are in multi-season mode (accordions are visible)
    if (hasMultiSeasonStructure) {
        if (selectedSeason === null) return;
        updatedSeasons = seasons.map(s => {
            if (s.seasonNumber === selectedSeason) {
                const newEpisodeNumber = (s.episodes?.length || 0) + 1;
                const newEpisode: Episode = {
                    episodeNumber: newEpisodeNumber,
                    title: newEpisodeTitle,
                    videoUrl: newEpisodeUrl
                };
                return { ...s, episodes: [...s.episodes, newEpisode] };
            }
            return s;
        });
    } else {
        // No explicit seasons, add to the default virtual season (Season 1)
        const defaultSeason = updatedSeasons.find(s => s.seasonNumber === 1) || { seasonNumber: 1, episodes: [] };
        const newEpisodeNumber = (defaultSeason.episodes?.length || 0) + 1;
        const newEpisode: Episode = {
            episodeNumber: newEpisodeNumber,
            title: newEpisodeTitle,
            videoUrl: newEpisodeUrl
        };
        const updatedDefaultSeason = { ...defaultSeason, episodes: [...defaultSeason.episodes, newEpisode] };
        // Replace or add the default season
        if (updatedSeasons.some(s => s.seasonNumber === 1)) {
            updatedSeasons = updatedSeasons.map(s => s.seasonNumber === 1 ? updatedDefaultSeason : s);
        } else {
            updatedSeasons.push(updatedDefaultSeason);
        }
    }

    setSeasons(updatedSeasons);
    toast({ title: "Episode Staged", description: `${newEpisodeTitle} has been staged.` });
    setAddEpisodeOpen(false);
    setNewEpisodeTitle("");
    setNewEpisodeUrl("");
  };

  const handleEditEpisode = () => {
    if (selectedSeason === null || !selectedEpisode || !newEpisodeTitle || !newEpisodeUrl) return;

    const updatedSeasons = seasons.map(s => {
        if (s.seasonNumber === selectedSeason) {
            const updatedEpisodes = s.episodes.map(e =>
                e.episodeNumber === selectedEpisode.episodeNumber
                ? { ...e, title: newEpisodeTitle, videoUrl: newEpisodeUrl }
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
        imdbRating: values.imdbRating || 0,
        categories: categories,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (values.type === 'movie') {
        if (!values.googleDriveVideoUrl) {
            form.setError("googleDriveVideoUrl", { type: 'manual', message: 'Video URL is required for movies.' });
            return;
        }
        contentData.googleDriveVideoUrl = values.googleDriveVideoUrl;
    } else {
        // Save seasons only if there are any episodes within them
        const seasonsWithEpisodes = seasons.filter(s => s.episodes.length > 0);
        if (seasonsWithEpisodes.length > 0) {
          contentData.seasons = seasonsWithEpisodes;
        }
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
                            <Button variant="ghost" size="icon" type="button" onClick={() => { setSelectedSeason(season.seasonNumber); setSelectedEpisode(episode); setNewEpisodeTitle(episode.title); setNewEpisodeUrl(episode.videoUrl); setEditEpisodeOpen(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit Episode {episode.episodeNumber}</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Label htmlFor="edit-episode-title">Title</Label>
                                <Input id="edit-episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} />
                                <Label htmlFor="edit-episode-url">Video URL</Label>
                                <Input id="edit-episode-url" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} />
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
    <div className="container py-10">
       <Card className="max-w-4xl mx-auto">
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
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">General Details</h3>
                        <div className="space-y-6 pt-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Enter content title" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter a short description" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
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
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a content type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="movie">Movie</SelectItem>
                                    <SelectItem value="webseries">Web Series</SelectItem>
                                    <SelectItem value="drama">Drama</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="categories" render={({ field }) => (
                                <FormItem><FormLabel>Categories / Tags</FormLabel><FormControl><Input placeholder="e.g. Bollywood, Action, Romance" {...field} /></FormControl><FormDescription>Enter comma-separated tags.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Banner Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            {contentType === 'movie' && (
                                <FormField control={form.control} name="googleDriveVideoUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Video URL</FormLabel>
                                    <FormControl><Input placeholder="Paste a direct video/embed link" {...field} /></FormControl>
                                    <FormDescription>Main link for streaming (e.g., Google Drive, YouTube embed).</FormDescription><FormMessage /></FormItem>
                                )} />
                            )}
                            <FormField control={form.control} name="imdbRating" render={({ field }) => (
                                <FormItem><FormLabel>IMDb Rating</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="10" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                    
                    {/* Season and Episode Management Section */}
                    {contentType !== 'movie' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-semibold">{hasMultiSeasonStructure ? 'Seasons & Episodes' : 'Episodes'}</h3>
                                <div className="flex gap-2">
                                    <Dialog open={isAddEpisodeOpen} onOpenChange={(isOpen) => !isOpen && setAddEpisodeOpen(false)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" type="button" onClick={() => {
                                                const seasonNumber = hasMultiSeasonStructure ? selectedSeason : 1;
                                                setSelectedSeason(seasonNumber);
                                                const season = seasons.find(s => s.seasonNumber === seasonNumber);
                                                const nextEpisodeNumber = (season?.episodes.length || 0) + 1;
                                                const formattedEpisodeNumber = String(nextEpisodeNumber).padStart(2, '0');
                                                setNewEpisodeTitle(`Episode ${formattedEpisodeNumber}`);
                                                setNewEpisodeUrl("");
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
                                                <Label htmlFor="episode-url">Video URL</Label>
                                                <Input id="episode-url" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" type="button" onClick={() => setAddEpisodeOpen(false)}>Cancel</Button>
                                                <Button type="button" onClick={handleAddEpisode}>Save Episode</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button type="button" onClick={handleAddSeason}><PlusCircle className="mr-2 h-4 w-4" /> Add Season</Button>
                                </div>
                            </div>
                            
                            {hasMultiSeasonStructure ? (
                                <Accordion type="single" collapsible className="w-full" onValueChange={(value) => setSelectedSeason(Number(value.split('-')[1]))}>
                                    {seasons.sort((a,b) => a.seasonNumber - b.seasonNumber).map(season => (
                                    <AccordionItem value={`item-${season.seasonNumber}`} key={season.seasonNumber}>
                                        <AccordionTrigger className="text-xl">Season {season.seasonNumber}</AccordionTrigger>
                                        <AccordionContent>
                                            {renderEpisodesForSeason(season)}
                                        </AccordionContent>
                                    </AccordionItem>
                                    ))}
                                    {(!seasons || seasons.length === 0) && <p className="text-muted-foreground text-center py-8">No seasons found. Add one to get started.</p>}
                                </Accordion>
                            ) : (
                                <div className="pt-4">
                                    {seasons[0] && seasons[0].episodes.length > 0 ? renderEpisodesForSeason(seasons[0]) : <p className="text-muted-foreground text-center py-8">No episodes yet. Add one to get started.</p>}
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

    