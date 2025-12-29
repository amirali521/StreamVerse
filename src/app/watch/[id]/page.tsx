
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content as ContentType, Season, Episode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { createEmbedUrl, createDownloadUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getDownloadUrl } from "@/ai/flows/get-download-url";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<ContentType, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  posterImageUrl?: string;
  streamPlatform?: 'doodstream' | 'mixdrop';
};

function EpisodeSelector({ 
  item,
  selectedSeason,
  setSelectedSeason,
  selectedEpisode,
  setSelectedEpisode
}: {
  item: ClientContent,
  selectedSeason: Season | null,
  setSelectedSeason: (season: Season | null) => void,
  selectedEpisode: Episode | null,
  setSelectedEpisode: (episode: Episode | null) => void
}) {
  if (!item.seasons || item.seasons.length === 0) return null;
  
  const sortedSeasons = [...item.seasons].sort((a,b) => a.seasonNumber - b.seasonNumber);

  return (
    <Card className="bg-background/80 border-0 md:border md:bg-card mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Seasons & Episodes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Season</h3>
            <div className="flex flex-wrap gap-2">
              {sortedSeasons.map(season => (
                <Button 
                  key={season.seasonNumber} 
                  size="sm"
                  variant={selectedSeason?.seasonNumber === season.seasonNumber ? 'secondary' : 'outline'}
                  onClick={() => {
                    setSelectedSeason(season);
                    if (season.episodes && season.episodes.length > 0) {
                      const sortedEpisodes = [...season.episodes].sort((a,b) => a.episodeNumber - b.episodeNumber);
                      setSelectedEpisode(sortedEpisodes[0]);
                    } else {
                      setSelectedEpisode(null);
                    }
                  }}
                  className="transition-colors duration-200"
                >
                  S{String(season.seasonNumber).padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Episode</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSeason?.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber).map(episode => (
                <Button 
                  key={episode.episodeNumber}
                  variant={selectedEpisode?.episodeNumber === episode.episodeNumber ? 'accent' : 'ghost'}
                  className="aspect-square p-0 h-12 w-12 text-sm font-bold transition-colors duration-200 hover:bg-accent/80"
                  onClick={() => setSelectedEpisode(episode)}
                  size="sm"
                >
                  {String(episode.episodeNumber).padStart(2, '0')}
                </Button>
              ))}
            </div>
             {(!selectedSeason?.episodes || selectedSeason.episodes.length === 0) && <p className="text-sm text-muted-foreground mt-2">No episodes in this season.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WatchPage() {
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<ClientContent | null>(null);
  const [related, setRelated] = useState<ClientContent[]>([]);
  const [trending, setTrending] = useState<ClientContent[]>([]);
  const [newReleases, setNewReleases] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [adClicked, setAdClicked] = useState(false);

  useEffect(() => {
    async function getContentData(id: string) {
      if (!firestore || !id) return;
      
      setLoading(true);
      const contentRef = doc(firestore, 'content', id);
      const contentSnap = await getDoc(contentRef);

      if (!contentSnap.exists()) {
        setItem(null);
        setLoading(false);
        return;
      }
      
      const data = contentSnap.data();
      const fetchedItem = { 
        id: contentSnap.id, 
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(0),
      } as ClientContent;
      
      setItem(fetchedItem);

      // Default selections for series/drama
      if (fetchedItem.type !== 'movie' && fetchedItem.seasons && fetchedItem.seasons.length > 0) {
        const sortedSeasons = [...fetchedItem.seasons].sort((a,b) => a.seasonNumber - b.seasonNumber);
        const firstSeason = sortedSeasons[0];
        setSelectedSeason(firstSeason);
        if (firstSeason.episodes && firstSeason.episodes.length > 0) {
          const sortedEpisodes = [...firstSeason.episodes].sort((a,b) => a.episodeNumber - b.episodeNumber);
          setSelectedEpisode(sortedEpisodes[0]);
        }
      }

      // Fetch all other content for carousels
      const allContentCol = collection(firestore, 'content');
      const allContentSnapshot = await getDocs(allContentCol);

      const allContent: ClientContent[] = allContentSnapshot.docs
        .filter(doc => doc.id !== fetchedItem.id) // Exclude the current item
        .map(doc => {
            const contentData = doc.data();
            return {
                id: doc.id,
                ...contentData,
                createdAt: contentData.createdAt ? (contentData.createdAt as Timestamp).toDate() : new Date(0),
                updatedAt: contentData.updatedAt ? (contentData.updatedAt as Timestamp).toDate() : new Date(0),
            } as ClientContent
        });

      // Related content (based on categories, then type)
      const getRelatedContent = () => {
          const itemCategories = fetchedItem.categories || [];
          if (itemCategories.length > 0) {
              const perfectMatches = allContent.filter(c => 
                  c.categories && itemCategories.every(cat => c.categories!.includes(cat))
              );
              if (perfectMatches.length > 0) return perfectMatches;
              
              const partialMatches = allContent.filter(c => 
                  c.categories && itemCategories.some(cat => c.categories!.includes(cat))
              );
              if (partialMatches.length > 0) return partialMatches;
          }
          return allContent.filter(c => c.type === fetchedItem.type);
      };

      setRelated(getRelatedContent().slice(0, 10));

      // New Releases
      const sortedNewReleases = [...allContent].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      setNewReleases(sortedNewReleases.slice(0, 10));

      // Trending
      const sortedTrending = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
      setTrending(sortedTrending.slice(0, 10));


      setLoading(false);
    }
    
    if (id) {
      getContentData(id);
    }
  }, [id, firestore]);
  
  // Reset the copy button state when the video source changes
  useEffect(() => {
    setAdClicked(false);
  }, [item, selectedEpisode]);
  

  if (loading) {
      return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>
  }

  if (!item) {
    notFound();
  }
  
  const rawVideoUrl = item.type === 'movie' ? item.streamUrl : selectedEpisode?.streamUrl;
  const platform = item.type === 'movie' ? item.streamPlatform : selectedEpisode?.streamPlatform;
  const embedUrl = rawVideoUrl && platform ? createEmbedUrl(rawVideoUrl, platform) : "";
  const downloadUrl = rawVideoUrl ? createDownloadUrl(rawVideoUrl) : "";
  const poster = item.posterImageUrl || item.bannerImageUrl;
  
  const handleDownload = async () => {
    if (!rawVideoUrl) return;

    setIsDownloading(true);
    try {
      const result = await getDownloadUrl({ url: rawVideoUrl });
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error("Error getting download link:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not retrieve the download link for this video.",
      });
    } finally {
      setIsDownloading(false);
    }
  };


  const handleAdOrCopyLink = () => {
    if (!rawVideoUrl) return;

    if (adClicked) {
      // Second click: Copy the download link
      navigator.clipboard.writeText(rawVideoUrl).then(() => {
        toast({
          title: "Link Copied",
          description: "The stream URL has been copied to your clipboard.",
        });
      }).catch(err => {
        console.error("Failed to copy link: ", err);
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Could not copy the link. Please try again.",
        });
      });
    } else {
      // First click: Open the ad link and update state
      window.open('https://consumeairlinercalligraphy.com/fxb23pzau?key=8dadd4c3cf5b492400bb18194308fb90', '_blank');
      setAdClicked(true);
      toast({
        title: "Ad Opened",
        description: "Click the button again to copy the download link.",
      });
    }
  };

  return (
    <div className="bg-black text-white">
      {/* Main Content: Player, Details, Episodes */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="w-full space-y-6">
          {/* Video Player */}
          {embedUrl ? (
            <VideoPlayer src={embedUrl} poster={poster} />
          ) : (
            <div className="aspect-video bg-black flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-muted-foreground">{item.type !== 'movie' ? 'Select an episode to play.' : 'No video available.'}</p>
            </div>
          )}
          
          {/* Content Details */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{item.title}</h1>
            {item.type !== 'movie' && selectedEpisode && (
              <p className="text-lg text-primary mt-1">{`S${String(selectedSeason?.seasonNumber).padStart(2, '0')}E${String(selectedEpisode?.episodeNumber).padStart(2, '0')}: ${selectedEpisode?.title}`}</p>
            )}

            <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
              {item.imdbRating && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-300">IMDb Rating: {item.imdbRating}/10</span>
                </div>
              )}
              {item.categories && item.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  {item.categories.map(category => (
                    <span key={category} className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">{category}</span>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-base text-foreground/70">
                {item.description}
            </p>

            {rawVideoUrl && (
              <div className="flex items-stretch gap-4">
                <Button onClick={handleDownload} disabled={isDownloading} size="default" className="bg-primary hover:bg-primary/90 flex-1 px-4">
                  {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                  Download
                </Button>
                <Button variant="outline" onClick={handleAdOrCopyLink} className="flex-1 px-4" size="default">
                   {adClicked ? <Check className="mr-2 text-green-500" /> : <Copy className="mr-2" />}
                  Copy Link
                </Button>
              </div>
            )}
          </div>

          {/* Episode Selector */}
          {item.type !== 'movie' && (
            <EpisodeSelector 
              item={item}
              selectedSeason={selectedSeason}
              setSelectedSeason={setSelectedSeason}
              selectedEpisode={selectedEpisode}
              setSelectedEpisode={setSelectedEpisode}
            />
          )}

        </div>
      </div>
      
      {/* Carousels */}
      <div className="space-y-16 py-12">
        {related.length > 0 && (
          <ContentCarousel title="More Like This" items={related} />
        )}
        {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
        {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
      </div>
    </div>
  );
}
