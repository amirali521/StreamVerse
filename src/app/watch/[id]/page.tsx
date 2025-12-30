
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content as ContentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState, useMemo } from "react";
import { VideoPlayer } from "@/components/video-player";
import { createEmbedUrl } from "@/lib/utils";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<ContentType, 'createdAt' | 'updatedAt' | 'seasons' | 'episodes'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  posterImageUrl?: string;
  tmdbId?: number;
  embedUrl?: string;
};

// Dummy types for season/episode selection, not from DB
interface Episode {
  episodeNumber: number;
}
interface Season {
  seasonNumber: number;
  episodes: Episode[];
}


function EpisodeSelector({ 
  selectedSeasonNum,
  setSelectedSeasonNum,
  selectedEpisodeNum,
  setSelectedEpisodeNum,
  tmdbId
}: {
  selectedSeasonNum: number,
  setSelectedSeasonNum: (season: number) => void,
  selectedEpisodeNum: number,
  setSelectedEpisodeNum: (episode: number) => void,
  tmdbId: number
}) {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSeasons() {
            if (!tmdbId) return;
            setIsLoading(true);
            try {
                const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
                const data = await response.json();

                const seasonsData: Season[] = await Promise.all(data.seasons.filter((s:any) => s.season_number > 0).map(async (season: any) => {
                    const seasonDetailResponse = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
                    const seasonDetailData = await seasonDetailResponse.json();
                    return {
                        seasonNumber: season.season_number,
                        episodes: seasonDetailData.episodes.map((ep: any) => ({ episodeNumber: ep.episode_number }))
                    };
                }));
                
                setSeasons(seasonsData);
            } catch (error) {
                console.error("Failed to fetch season data from TMDB", error);
            }
            setIsLoading(false);
        }

        fetchSeasons();
    }, [tmdbId]);
    
    const selectedSeason = seasons.find(s => s.seasonNumber === selectedSeasonNum);
  
    if (isLoading) {
        return (
             <Card className="bg-background/80 border-0 md:border md:bg-card mt-6">
                <CardHeader>
                    <CardTitle className="text-xl">Seasons & Episodes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading seasons...</p>
                </CardContent>
            </Card>
        )
    }

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
              {seasons.map(season => (
                <Button 
                  key={season.seasonNumber} 
                  size="sm"
                  variant={selectedSeasonNum === season.seasonNumber ? 'secondary' : 'outline'}
                  onClick={() => {
                    setSelectedSeasonNum(season.seasonNumber);
                    if (season.episodes && season.episodes.length > 0) {
                      const sortedEpisodes = [...season.episodes].sort((a,b) => a.episodeNumber - b.episodeNumber);
                      setSelectedEpisodeNum(sortedEpisodes[0].episodeNumber);
                    } else {
                      setSelectedEpisodeNum(1); // Default to 1 if no episodes found
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
                  variant={selectedEpisodeNum === episode.episodeNumber ? 'accent' : 'ghost'}
                  className="aspect-square p-0 h-12 w-12 text-sm font-bold transition-colors duration-200 hover:bg-accent/80"
                  onClick={() => setSelectedEpisodeNum(episode.episodeNumber)}
                  size="sm"
                >
                  {String(episode.episodeNumber).padStart(2, '0')}
                </Button>
              ))}
            </div>
             {(!selectedSeason?.episodes || selectedSeason.episodes.length === 0) && <p className="text-sm text-muted-foreground mt-2">No episodes found for this season.</p>}
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
  
  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [selectedEpisodeNum, setSelectedEpisodeNum] = useState(1);
  
  const embedUrl = useMemo(() => {
    // Priority 1: Use manual embed URL if it exists.
    if (item?.embedUrl) {
      return createEmbedUrl(item.embedUrl);
    }
    
    // Priority 2: Fallback to VidLink using TMDB ID.
    if (item?.tmdbId) {
      if (item.type === 'movie') {
        return `https://vidlink.pro/movie/${item.tmdbId}`;
      }
      return `https://vidlink.pro/tv/${item.tmdbId}/${selectedSeasonNum}/${selectedEpisodeNum}`;
    }

    return undefined; // No video source found
  }, [item, selectedSeasonNum, selectedEpisodeNum]);
  

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

      const allContentCol = collection(firestore, 'content');
      const allContentSnapshot = await getDocs(allContentCol);

      const allContent: ClientContent[] = allContentSnapshot.docs
        .filter(doc => doc.id !== fetchedItem.id)
        .map(doc => {
            const contentData = doc.data();
            return {
                id: doc.id,
                ...contentData,
                createdAt: contentData.createdAt ? (contentData.createdAt as Timestamp).toDate() : new Date(0),
                updatedAt: contentData.updatedAt ? (contentData.updatedAt as Timestamp).toDate() : new Date(0),
            } as ClientContent
        });

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

      const sortedNewReleases = [...allContent].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      setNewReleases(sortedNewReleases.slice(0, 10));

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

  const poster = item.posterImageUrl || item.bannerImageUrl;

  return (
    <div className="bg-black text-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="w-full space-y-6">
          {embedUrl ? (
            <VideoPlayer src={embedUrl} poster={poster} />
          ) : (
            <div className="aspect-video bg-black flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-muted-foreground">No video source found for this content.</p>
            </div>
          )}
          
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{item.title}</h1>

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
            
            { embedUrl && item.embedUrl && // Show download button only for manual embeds
              <Button onClick={() => window.open(item.embedUrl, '_blank')} size="default" className="bg-primary hover:bg-primary/90 flex-1 px-4">
                <Download className="mr-2" />
                Go to Source
              </Button>
            }
          </div>

          {item.type !== 'movie' && item.tmdbId && !item.embedUrl && (
            <EpisodeSelector 
              tmdbId={item.tmdbId}
              selectedSeasonNum={selectedSeasonNum}
              setSelectedSeasonNum={setSelectedSeasonNum}
              selectedEpisodeNum={selectedEpisodeNum}
              setSelectedEpisodeNum={setSelectedEpisodeNum}
            />
          )}

        </div>
      </div>
      
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

    
