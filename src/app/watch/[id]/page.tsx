
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, limit, query, where, type Timestamp } from "firebase/firestore";
import type { Content as ContentType, Season } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, PlayCircle } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/video-player";

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
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<{ title: string; videoUrl: string} | null>(null);

  useEffect(() => {
    async function getContentItem(id: string) {
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


      // Fetch related content
      if (fetchedItem.type) {
        const relatedQuery = query(
            collection(firestore, 'content'), 
            where('type', '==', fetchedItem.type),
            where('__name__', '!=', fetchedItem.id),
            limit(10)
        );
        const relatedSnapshot = await getDocs(relatedQuery);
        const relatedItems = relatedSnapshot.docs.map(doc => {
            const relData = doc.data();
            return {
                id: doc.id,
                ...relData,
                createdAt: relData.createdAt ? (relData.createdAt as Timestamp).toDate() : new Date(0),
                updatedAt: relData.updatedAt ? (relData.updatedAt as Timestamp).toDate() : new Date(0),
            } as ClientContent
        });
        setRelated(relatedItems);
      }

      setLoading(false);
    }
    
    getContentItem(id);
  }, [id, firestore]);
  

  if (loading) {
      return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>
  }

  if (!item) {
    notFound();
  }
  
  const videoUrl = item.type === 'movie' ? item.googleDriveVideoUrl : selectedEpisode?.videoUrl;
  const videoTitle = item.type === 'movie' ? item.title : `${item.title} - ${selectedEpisode?.title}`;

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-background/80 rounded-lg overflow-hidden">
            {videoUrl ? (
                <VideoPlayer src={videoUrl} />
            ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                    <p className="text-muted-foreground">Select an episode to play.</p>
                </div>
            )}
        </div>
        
        <div className="py-6">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{videoTitle}</h1>

            {item.imdbRating && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-yellow-400">IMDb:</span>
                    <span>{item.imdbRating}/10</span>
                </div>
            )}
            
            <p className="mt-4 text-base text-foreground/70 max-w-3xl">
                {item.description}
            </p>

            {videoUrl && (
              <Button asChild size="lg" className="mt-6 bg-primary hover:bg-primary/90">
                  <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
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
                        onClick={() => setSelectedSeason(season)}
                      >
                          Season {season.seasonNumber}
                      </Button>
                  ))}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedSeason?.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber).map(episode => (
                      <button
                        key={episode.episodeNumber}
                        onClick={() => setSelectedEpisode(episode)}
                        className={`p-4 rounded-lg text-left transition-colors ${selectedEpisode?.title === episode.title ? 'bg-secondary' : 'bg-muted/20 hover:bg-muted/40'}`}
                      >
                          <div className="flex items-center gap-4">
                              <PlayCircle className="h-6 w-6 text-primary flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold">Ep {episode.episodeNumber}: {episode.title}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{item.title}</p>
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
              {(!selectedSeason?.episodes || selectedSeason.episodes.length === 0) && <p className="text-muted-foreground mt-4">No episodes in this season.</p>}
          </div>
        )}

        {related.length > 0 && (
            <div className="py-12">
              <ContentCarousel title="More Like This" items={related} />
            </div>
        )}
      </div>
    </div>
  );
}
