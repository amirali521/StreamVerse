
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content as ContentType, Season } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, PlayCircle } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { createEmbedUrl, createDownloadUrl } from "@/lib/utils";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<ContentType, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};


export default function WatchPage() {
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<ClientContent | null>(null);
  const [related, setRelated] = useState<ClientContent[]>([]);
  const [trending, setTrending] = useState<ClientContent[]>([]);
  const [newReleases, setNewReleases] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<{ title: string; videoUrl: string} | null>(null);

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
              // 1. Find items that match ALL categories
              const perfectMatches = allContent.filter(c => 
                  c.categories && itemCategories.every(cat => c.categories!.includes(cat))
              );
              if (perfectMatches.length > 0) return perfectMatches;
              
              // 2. Find items that match ANY category
              const partialMatches = allContent.filter(c => 
                  c.categories && itemCategories.some(cat => c.categories!.includes(cat))
              );
              if (partialMatches.length > 0) return partialMatches;
          }
          // 3. Fallback: Find items of the same type
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
  

  if (loading) {
      return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>
  }

  if (!item) {
    notFound();
  }
  
  const rawVideoUrl = item.type === 'movie' ? item.googleDriveVideoUrl : selectedEpisode?.videoUrl;
  const embedUrl = rawVideoUrl ? createEmbedUrl(rawVideoUrl) : "";
  const downloadUrl = rawVideoUrl ? createDownloadUrl(rawVideoUrl) : "";
  const videoTitle = item.type === 'movie' ? item.title : `${item.title} - ${selectedEpisode?.title}`;

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-background/80 rounded-lg overflow-hidden">
            {embedUrl ? (
                <VideoPlayer src={embedUrl} />
            ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                    <p className="text-muted-foreground">Select an episode to play.</p>
                </div>
            )}
        </div>
        
        <div className="py-6">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{videoTitle}</h1>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2">
              {item.imdbRating && (
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-yellow-400">IMDb:</span>
                      <span>{item.imdbRating}/10</span>
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
            
            <p className="mt-4 text-base text-foreground/70 max-w-3xl">
                {item.description}
            </p>

            {downloadUrl && !downloadUrl.includes('youtube.com') && (
              <Button asChild size="lg" className="mt-6 bg-primary hover:bg-primary/90">
                  <a href={downloadUrl} download>
                      <Download className="mr-2" />
                      Download Video
                  </a>
              </Button>
            )}
        </div>

        {item.type !== 'movie' && item.seasons && item.seasons.length > 0 && (
          <div className="py-6">
              <h2 className="text-2xl font-headline font-semibold mb-4">Seasons & Episodes</h2>
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-2 overflow-x-auto">
                  {item.seasons.sort((a,b) => a.seasonNumber - b.seasonNumber).map(season => (
                      <Button 
                        key={season.seasonNumber}
                        variant={selectedSeason?.seasonNumber === season.seasonNumber ? 'secondary' : 'ghost'}
                        onClick={() => {
                          setSelectedSeason(season);
                          // Select first episode of the season when season changes
                          if (season.episodes && season.episodes.length > 0) {
                             const sortedEpisodes = [...season.episodes].sort((a,b) => a.episodeNumber - b.episodeNumber);
                             setSelectedEpisode(sortedEpisodes[0]);
                          } else {
                            setSelectedEpisode(null);
                          }
                        }}
                      >
                          Season {season.seasonNumber}
                      </Button>
                  ))}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {selectedSeason?.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber).map(episode => (
                      <Button
                        key={episode.episodeNumber}
                        variant={selectedEpisode?.title === episode.title ? 'secondary' : 'ghost'}
                        onClick={() => setSelectedEpisode(episode)}
                        className="h-auto justify-start text-left"
                      >
                          <PlayCircle className="h-6 w-6 text-primary flex-shrink-0 mr-4" />
                          <div>
                              <h4 className="font-semibold">Ep {episode.episodeNumber}: {episode.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{item.title}</p>
                          </div>
                      </Button>
                  ))}
              </div>
              {(!selectedSeason?.episodes || selectedSeason.episodes.length === 0) && <p className="text-muted-foreground mt-4">No episodes in this season.</p>}
          </div>
        )}

        <div className="space-y-16 py-12">
            {related.length > 0 && (
                <ContentCarousel title="More Like This" items={related} />
            )}
            {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
            {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
        </div>
      </div>
    </div>
  );
}
