
"use client";

import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

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

export default function EditContentPage({ params }: { params: { contentId: string } }) {
  const { contentId } = params;
  const firestore = useFirestore();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  // State for modals
  const [isAddSeasonOpen, setAddSeasonOpen] = useState(false);
  const [isAddEpisodeOpen, setAddEpisodeOpen] = useState(false);
  const [isEditEpisodeOpen, setEditEpisodeOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeUrl, setNewEpisodeUrl] = useState("");


  useEffect(() => {
    if (!firestore || !contentId) return;
    const fetchContent = async () => {
      setLoading(true);
      const docRef = doc(firestore, "content", contentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent({ id: docSnap.id, ...docSnap.data() } as Content);
      } else {
        notFound();
      }
      setLoading(false);
    };
    fetchContent();
  }, [firestore, contentId]);

  const handleAddSeason = async () => {
    if (!firestore || !content) return;
    const currentSeasons = content.seasons || [];
    const newSeasonNumber = currentSeasons.length + 1;
    const newSeason = { seasonNumber: newSeasonNumber, episodes: [] };

    try {
      const docRef = doc(firestore, "content", content.id);
      await updateDoc(docRef, {
        seasons: arrayUnion(newSeason),
      });
      setContent({
        ...content,
        seasons: [...currentSeasons, newSeason],
      });
      toast({ title: "Season Added", description: `Season ${newSeasonNumber} has been added.` });
      setAddSeasonOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleAddEpisode = async () => {
    if (!firestore || !content || selectedSeason === null || !newEpisodeTitle || !newEpisodeUrl) return;
    
    const season = content.seasons?.find(s => s.seasonNumber === selectedSeason);
    if (!season) return;

    const newEpisodeNumber = (season.episodes?.length || 0) + 1;
    const newEpisode: Episode = {
        episodeNumber: newEpisodeNumber,
        title: newEpisodeTitle,
        videoUrl: newEpisodeUrl
    };

    const updatedSeasons = content.seasons?.map(s => {
        if (s.seasonNumber === selectedSeason) {
            return { ...s, episodes: [...s.episodes, newEpisode] };
        }
        return s;
    });

    try {
        const docRef = doc(firestore, "content", content.id);
        await updateDoc(docRef, { seasons: updatedSeasons });
        setContent({ ...content, seasons: updatedSeasons });
        toast({ title: "Episode Added", description: `${newEpisode.title} has been added to Season ${selectedSeason}.` });
        setAddEpisodeOpen(false);
        setNewEpisodeTitle("");
        setNewEpisodeUrl("");
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };
  
  const handleEditEpisode = async () => {
     if (!firestore || !content || selectedSeason === null || !selectedEpisode || !newEpisodeTitle || !newEpisodeUrl) return;

    const updatedSeasons = content.seasons?.map(s => {
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
        const docRef = doc(firestore, "content", content.id);
        await updateDoc(docRef, { seasons: updatedSeasons });
        setContent({ ...content, seasons: updatedSeasons });
        toast({ title: "Episode Updated", description: `Episode ${selectedEpisode.episodeNumber} has been updated.` });
        setEditEpisodeOpen(false);
        setNewEpisodeTitle("");
        setNewEpisodeUrl("");
        setSelectedEpisode(null);
    } catch(e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDeleteEpisode = async (seasonNumber: number, episode: Episode) => {
    if (!firestore || !content) return;

    const season = content.seasons?.find(s => s.seasonNumber === seasonNumber);
    if (!season) return;

    const updatedSeasons = content.seasons?.map(s => {
        if (s.seasonNumber === seasonNumber) {
             // Filter out the episode and then re-assign episode numbers
            const filteredEpisodes = s.episodes.filter(e => e.episodeNumber !== episode.episodeNumber);
            const renumberedEpisodes = filteredEpisodes.map((ep, index) => ({ ...ep, episodeNumber: index + 1 }));
            return { ...s, episodes: renumberedEpisodes };
        }
        return s;
    });

    try {
        const docRef = doc(firestore, "content", content.id);
        await updateDoc(docRef, { seasons: updatedSeasons });
        setContent({ ...content, seasons: updatedSeasons });
        toast({ title: "Episode Deleted", description: `Episode ${episode.episodeNumber} from Season ${seasonNumber} has been deleted.` });
    } catch(e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (!content) {
    return notFound();
  }
  
  if (content.type === 'movie') {
      return (
        <div className="container py-10">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Manage Content: {content.title}</CardTitle>
                    <CardDescription>Movies do not have seasons or episodes. Edit the main content details if needed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/admin/content')}>Back to Content List</Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline">{content.title}</CardTitle>
              <CardDescription className="mt-2">
                Manage seasons and episodes for this {content.type}.
              </CardDescription>
            </div>
            <Image src={content.bannerImageUrl} alt={content.title} width={150} height={225} className="rounded-md object-cover aspect-[2/3]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Dialog open={isAddSeasonOpen} onOpenChange={setAddSeasonOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add {content.seasons && content.seasons.length > 0 ? 'Another' : ''} Season
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Season</DialogTitle>
                  <DialogDescription>
                    This will add Season { (content.seasons?.length || 0) + 1 } to {content.title}.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddSeasonOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSeason}>Add Season</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
             {content.seasons && content.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber).map(season => (
                <AccordionItem value={`item-${season.seasonNumber}`} key={season.seasonNumber}>
                    <AccordionTrigger className="text-xl">
                        Season {season.seasonNumber}
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-end mb-4">
                            <Dialog open={isAddEpisodeOpen && selectedSeason === season.seasonNumber} onOpenChange={(isOpen) => {
                                if (!isOpen) { setAddEpisodeOpen(false); setSelectedSeason(null); }
                            }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => { setSelectedSeason(season.seasonNumber); setAddEpisodeOpen(true); }}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Episode
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Episode to Season {season.seasonNumber}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="episode-title" className="text-right">Title</Label>
                                            <Input id="episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} className="col-span-3" placeholder={`Episode ${(season.episodes?.length || 0) + 1}`} />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="episode-url" className="text-right">Video URL</Label>
                                            <Input id="episode-url" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} className="col-span-3" placeholder="https://drive.google.com/..." />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setAddEpisodeOpen(false); setSelectedSeason(null); }}>Cancel</Button>
                                        <Button onClick={handleAddEpisode}>Save Episode</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-2">
                            {season.episodes && season.episodes.sort((a,b) => a.episodeNumber - b.episodeNumber).map(episode => (
                                <div key={episode.episodeNumber} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                    <p>Episode {episode.episodeNumber}: {episode.title}</p>
                                    <div className="flex items-center gap-2">
                                        <Dialog open={isEditEpisodeOpen && selectedEpisode?.episodeNumber === episode.episodeNumber} onOpenChange={(isOpen) => { if (!isOpen) setEditEpisodeOpen(false)}}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setSelectedSeason(season.seasonNumber);
                                                    setSelectedEpisode(episode);
                                                    setNewEpisodeTitle(episode.title);
                                                    setNewEpisodeUrl(episode.videoUrl);
                                                    setEditEpisodeOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                     <DialogTitle>Edit Episode {episode.episodeNumber}</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="edit-episode-title" className="text-right">Title</Label>
                                                        <Input id="edit-episode-title" value={newEpisodeTitle} onChange={(e) => setNewEpisodeTitle(e.target.value)} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="edit-episode-url" className="text-right">Video URL</Label>
                                                        <Input id="edit-episode-url" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} className="col-span-3" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                     <Button variant="outline" onClick={() => setEditEpisodeOpen(false)}>Cancel</Button>
                                                     <Button onClick={handleEditEpisode}>Save Changes</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEpisode(season.seasonNumber, episode)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                             {(!season.episodes || season.episodes.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No episodes yet. Add one to get started.</p>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
             ))}
             {(!content.seasons || content.seasons.length === 0) && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No seasons found for this content.</p>
                    <p className="text-muted-foreground">Add a season to begin adding episodes.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
