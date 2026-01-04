
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content as ContentType, Season, Episode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState, useMemo } from "react";
import { VideoPlayer, type VideoSource } from "@/components/video-player";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";


// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<ContentType, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const EPISODES_PER_PAGE = 50;

function EpisodeSelector({ 
  content,
  selectedSeasonNum,
  setSelectedSeasonNum,
  selectedEpisodeNum,
  setSelectedEpisodeNum,
}: {
  content: ClientContent;
  selectedSeasonNum: number,
  setSelectedSeasonNum: (season: number) => void,
  selectedEpisodeNum: number,
  setSelectedEpisodeNum: (episode: number) => void,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);


    const seasonsToShow = useMemo(() => {
        return content.seasons?.map(s => ({
            seasonNumber: s.seasonNumber,
            episodes: s.episodes.map(e => ({ episodeNumber: e.episodeNumber }))
        })).sort((a,b) => a.seasonNumber - b.seasonNumber) || [];
    }, [content.seasons]);
    
    const selectedSeasonData = seasonsToShow.find(s => s.seasonNumber === selectedSeasonNum);
    const sortedEpisodes = useMemo(() => {
        return selectedSeasonData?.episodes?.sort((a, b) => a.episodeNumber - b.episodeNumber) || [];
    }, [selectedSeasonData]);

    // Pagination logic
    const totalPages = Math.ceil(sortedEpisodes.length / EPISODES_PER_PAGE);
    const paginatedEpisodes = sortedEpisodes.slice((currentPage - 1) * EPISODES_PER_PAGE, currentPage * EPISODES_PER_PAGE);

    const handleSeasonChange = (seasonNumber: number) => {
        setSelectedSeasonNum(seasonNumber);
        setCurrentPage(1); // Reset to first page of episodes on season change
        const newSeason = seasonsToShow.find(s => s.seasonNumber === seasonNumber);
        if (newSeason?.episodes && newSeason.episodes.length > 0) {
            const firstEpisode = newSeason.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
            setSelectedEpisodeNum(firstEpisode.episodeNumber);
        } else {
            setSelectedEpisodeNum(1); // Default to 1
        }
    };
  
    if (isLoading) {
        return (
             <Card className="bg-background/80 border-0 md:border md:bg-card mt-6">
                <CardHeader><CardTitle className="text-xl">Seasons & Episodes</CardTitle></CardHeader>
                <CardContent><p>Loading seasons...</p></CardContent>
            </Card>
        )
    }

    if (seasonsToShow.length === 0) {
        return null; // Don't show the component if there's no season data
    }

  return (
    <Card className="bg-background/80 border-0 md:border md:bg-card mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
         <CardTitle className="text-xl">Seasons & Episodes</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Season</h3>
            <div className="flex flex-wrap gap-2">
              {seasonsToShow.map(season => (
                <Button 
                  key={season.seasonNumber} 
                  size="sm"
                  variant={selectedSeasonNum === season.seasonNumber ? 'secondary' : 'outline'}
                  onClick={() => handleSeasonChange(season.seasonNumber)}
                  className="transition-colors duration-200"
                >
                  S{String(season.seasonNumber).padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Episode</h3>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">{`Page ${currentPage} of ${totalPages}`}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
              {paginatedEpisodes.map(episode => (
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
             {sortedEpisodes.length === 0 && <p className="text-sm text-muted-foreground mt-2">No episodes found for this season.</p>}
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
  
  const videoSource: VideoSource | null = useMemo(() => {
    if (!item) return null;

    let url: string | undefined;

    if (item.type === 'movie') {
      url = item.embedUrl;
    } else {
      const season = item.seasons?.find(s => s.seasonNumber === selectedSeasonNum);
      const episode = season?.episodes.find(e => e.episodeNumber === selectedEpisodeNum);
      url = episode?.embedUrl;
    }

    if (!url) return null;

    return {
        name: 'Video Player',
        url: url,
    };
  }, [item, selectedSeasonNum, selectedEpisodeNum]);

  const downloadUrl: string | null = useMemo(() => {
    if (!item) return null;
    
    let url: string | undefined;

    if (item.type === 'movie') {
      url = item.downloadUrl;
    } else {
      // For series, the main downloadUrl is for the package. Episode downloads are separate.
      const season = item.seasons?.find(s => s.seasonNumber === selectedSeasonNum);
      const episode = season?.episodes.find(e => e.episodeNumber === selectedEpisodeNum);
      url = (episode as any)?.downloadUrl || item.downloadUrl;
    }
    
    return url || null;
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

      // Pre-select first season/episode if it's a series with manual data
      if (fetchedItem.type !== 'movie' && fetchedItem.seasons && fetchedItem.seasons.length > 0) {
        const firstSeason = fetchedItem.seasons.sort((a,b) => a.seasonNumber - b.seasonNumber)[0];
        setSelectedSeasonNum(firstSeason.seasonNumber);
        if (firstSeason.episodes && firstSeason.episodes.length > 0) {
           const firstEpisode = firstSeason.episodes.sort((a,b) => a.episodeNumber - b.episodeNumber)[0];
           setSelectedEpisodeNum(firstEpisode.episodeNumber);
        }
      }

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
          {videoSource ? (
            <VideoPlayer source={videoSource} poster={poster} />
          ) : (
            <div className="aspect-video bg-black flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-muted-foreground">No video source configured for this content.</p>
            </div>
          )}
          
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{item.title}</h1>
              {downloadUrl && (
                  <Button asChild>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
              )}
            </div>

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
          </div>

          {item.type !== 'movie' && (
            <EpisodeSelector 
              content={item}
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

    