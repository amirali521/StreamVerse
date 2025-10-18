
"use client";

import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
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
import { Edit, Trash2, PlusCircle } from "lucide-react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

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

interface Content {
  id: string;
  title: string;
  description: string;
  type: "movie" | "webseries" | "drama";
  bannerImageUrl: string;
  imdbRating?: number;
  googleDriveVideoUrl?: string;
  seasons?: Season[];
}

// Reusable form for editing content details
const editContentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  bannerImageUrl: z.string().url("Please enter a valid URL."),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  googleDriveVideoUrl: z.string().optional(),
});

function EditContentForm({ contentItem, onUpdate, closeDialog }: { contentItem: Content, onUpdate: (updatedContent: Content) => void, closeDialog: () => void }) {
    const firestore = useFirestore();
    const form = useForm<z.infer<typeof editContentSchema>>({
        resolver: zodResolver(editContentSchema),
        defaultValues: {
            title: contentItem.title,
            description: contentItem.description,
            bannerImageUrl: contentItem.bannerImageUrl,
            imdbRating: contentItem.imdbRating || 0,
            googleDriveVideoUrl: contentItem.googleDriveVideoUrl || "",
        },
    });

    async function onSubmit(values: z.infer<typeof editContentSchema>) {
        if (!firestore) return;

        const updatedData: Partial<Content> = {
            ...values,
            imdbRating: values.imdbRating || 0,
        };

        if (contentItem.type === 'movie') {
            if (!values.googleDriveVideoUrl) {
                form.setError("googleDriveVideoUrl", { type: "manual", message: "Video URL is required for movies." });
                return;
            }
            updatedData.googleDriveVideoUrl = values.googleDriveVideoUrl;
        }

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, updatedData);
            onUpdate({ ...contentItem, ...updatedData });
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
                <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Banner Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imdbRating" render={({ field }) => (
                    <FormItem><FormLabel>IMDb Rating</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {contentItem.type === 'movie' && (
                    <FormField control={form.control} name="googleDriveVideoUrl" render={({ field }) => (
                        <FormItem><FormLabel>Google Drive Video URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

// Edit Modal for Movies
function EditMovieModal({ contentItem, onOpenChange, onUpdate, isOpen }: { contentItem: Content, isOpen: boolean, onOpenChange: (open: boolean) => void, onUpdate: (updatedContent: Content) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Movie: {contentItem.title}</DialogTitle>
                    <DialogDescription>Update the details for this movie.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <EditContentForm
                    contentItem={contentItem}
                    onUpdate={onUpdate}
                    closeDialog={() => onOpenChange(false)}
                  />
                </div>
            </DialogContent>
        </Dialog>
    );
}


// Edit Modal for Web Series / Dramas
function EditSeriesModal({ contentItem, onOpenChange, onUpdate, isOpen }: { contentItem: Content, isOpen: boolean, onOpenChange: (open: boolean) => void, onUpdate: (updatedContent: Content) => void }) {
    const firestore = useFirestore();
    const [seasons, setSeasons] = useState<Season[]>(contentItem.seasons || []);
    const [isAddEpisodeOpen, setAddEpisodeOpen] = useState(false);
    const [isEditEpisodeOpen, setEditEpisodeOpen] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
    const [newEpisodeUrl, setNewEpisodeUrl] = useState("");

    const handleAddSeason = async () => {
        if (!firestore) return;
        const newSeasonNumber = seasons.length + 1;
        const newSeason: Season = { seasonNumber: newSeasonNumber, episodes: [] };
        const updatedSeasons = [...seasons, newSeason];

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, { seasons: updatedSeasons });
            setSeasons(updatedSeasons);
            onUpdate({ ...contentItem, seasons: updatedSeasons });
            toast({ title: "Season Added", description: `Season ${newSeasonNumber} has been added.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleAddEpisode = async () => {
        if (!firestore || selectedSeason === null || !newEpisodeTitle || !newEpisodeUrl) return;

        const updatedSeasons = seasons.map(s => {
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

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, { seasons: updatedSeasons });
            setSeasons(updatedSeasons);
            onUpdate({ ...contentItem, seasons: updatedSeasons });
            toast({ title: "Episode Added", description: `${newEpisodeTitle} has been added to Season ${selectedSeason}.` });
            setAddEpisodeOpen(false);
            setNewEpisodeTitle("");
            setNewEpisodeUrl("");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleEditEpisode = async () => {
        if (!firestore || selectedSeason === null || !selectedEpisode || !newEpisodeTitle || !newEpisodeUrl) return;

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

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, { seasons: updatedSeasons });
            setSeasons(updatedSeasons);
            onUpdate({ ...contentItem, seasons: updatedSeasons });
            toast({ title: "Episode Updated" });
            setEditEpisodeOpen(false);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        }
    };

    const handleDeleteEpisode = async (seasonNumber: number, episode: Episode) => {
        if (!firestore) return;

        const updatedSeasons = seasons.map(s => {
            if (s.seasonNumber === seasonNumber) {
                const filteredEpisodes = s.episodes.filter(e => e.episodeNumber !== episode.episodeNumber);
                const renumberedEpisodes = filteredEpisodes.map((ep, index) => ({ ...ep, episodeNumber: index + 1 }));
                return { ...s, episodes: renumberedEpisodes };
            }
            return s;
        });

        try {
            const docRef = doc(firestore, "content", contentItem.id);
            await updateDoc(docRef, { seasons: updatedSeasons });
            setSeasons(updatedSeasons);
            onUpdate({ ...contentItem, seasons: updatedSeasons });
            toast({ title: "Episode Deleted" });
        } catch(e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage: {contentItem.title}</DialogTitle>
                    <DialogDescription>Add, edit, or remove seasons and episodes for this {contentItem.type}.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-4">
                  <div className="flex justify-end mb-4">
                      <Button onClick={handleAddSeason}><PlusCircle className="mr-2 h-4 w-4" /> Add Season</Button>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                      {seasons.sort((a,b) => a.seasonNumber - b.seasonNumber).map(season => (
                          <AccordionItem value={`item-${season.seasonNumber}`} key={season.seasonNumber}>
                              <AccordionTrigger className="text-xl">Season {season.seasonNumber}</AccordionTrigger>
                              <AccordionContent>
                                  <div className="flex justify-end mb-4">
                                      <Dialog open={isAddEpisodeOpen && selectedSeason === season.seasonNumber} onOpenChange={(isOpen) => !isOpen && setAddEpisodeOpen(false)}>
                                          <DialogTrigger asChild>
                                              <Button variant="outline" onClick={() => {
                                                setSelectedSeason(season.seasonNumber);
                                                const nextEpisodeNumber = (season.episodes?.length || 0) + 1;
                                                const formattedEpisodeNumber = String(nextEpisodeNumber).padStart(2, '0');
                                                setNewEpisodeTitle(`Episode ${formattedEpisodeNumber}`);
                                                setNewEpisodeUrl("");
                                                setAddEpisodeOpen(true);
                                              }}>
                                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Episode
                                              </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                              <DialogHeader><DialogTitle>Add Episode to Season {season.seasonNumber}</DialogTitle></DialogHeader>
                                              <div className="grid gap-4 py-4">
                                                  <Label htmlFor="episode-title">Title</Label>
                                                  <Input id="episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} />
                                                  <Label htmlFor="episode-url">Video URL</Label>
                                                  <Input id="episode-url" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                                              </div>
                                              <DialogFooter>
                                                  <Button variant="outline" onClick={() => setAddEpisodeOpen(false)}>Cancel</Button>
                                                  <Button onClick={handleAddEpisode}>Save Episode</Button>
                                              </DialogFooter>
                                          </DialogContent>
                                      </Dialog>
                                  </div>
                                  <div className="space-y-2">
                                      {season.episodes && season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber).map(episode => (
                                          <div key={episode.episodeNumber} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                              <p>Ep {episode.episodeNumber}: {episode.title}</p>
                                              <div className="flex items-center gap-2">
                                                  <Dialog open={isEditEpisodeOpen && selectedEpisode?.episodeNumber === episode.episodeNumber} onOpenChange={(isOpen) => !isOpen && setEditEpisodeOpen(false)}>
                                                      <DialogTrigger asChild>
                                                          <Button variant="ghost" size="icon" onClick={() => { setSelectedSeason(season.seasonNumber); setSelectedEpisode(episode); setNewEpisodeTitle(episode.title); setNewEpisodeUrl(episode.videoUrl); setEditEpisodeOpen(true); }}>
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
                                                              <Button variant="outline" onClick={() => setEditEpisodeOpen(false)}>Cancel</Button>
                                                              <Button onClick={handleEditEpisode}>Save Changes</Button>
                                                          </DialogFooter>
                                                      </DialogContent>
                                                  </Dialog>
                                                  <AlertDialog>
                                                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                          <AlertDialogHeader><AlertDialogTitle>Delete Episode?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{episode.title}".</AlertDialogDescription></AlertDialogHeader>
                                                          <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleDeleteEpisode(season.seasonNumber, episode)}>Delete</AlertDialogAction>
                                                          </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                  </AlertDialog>
                                              </div>
                                          </div>
                                      ))}
                                      {(!season.episodes || season.episodes.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No episodes yet.</p>}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                      {(!seasons || seasons.length === 0) && <p className="text-muted-foreground text-center py-8">No seasons found. Add one to get started.</p>}
                  </Accordion>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ManageContentPage() {
  const firestore = useFirestore();
  const [contentList, setContentList] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

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


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading content...</div>;
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
                    <Button variant="ghost" size="icon" onClick={() => setEditingContent(content)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
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
                </TableCell>
                </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </CardContent>
    </Card>

    {editingContent && editingContent.type === 'movie' && (
        <EditMovieModal
            isOpen={!!editingContent}
            onOpenChange={(open) => !open && setEditingContent(null)}
            contentItem={editingContent}
            onUpdate={handleUpdate}
        />
    )}

    {editingContent && editingContent.type !== 'movie' && (
        <EditSeriesModal
            isOpen={!!editingContent}
            onOpenChange={(open) => !open && setEditingContent(null)}
            contentItem={editingContent}
            onUpdate={handleUpdate}
        />
    )}

    </div>
  );
}

    