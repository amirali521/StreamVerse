
"use client";

import { notFound, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content as ContentType, Season, Episode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState, useRef } from "react";
import { VideoPlayer } from "@/components/video-player";
import { createEmbedUrl, createDownloadUrl } from "@/lib/utils";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<ContentType, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function ImdbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="24"
      viewBox="0 0 48 24"
      fill="none"
      role="img"
      {...props}
    >
      <title>IMDb</title>
      <path
        d="M4.6992 0.511719H0.585938V23.5117H4.6992V0.511719Z"
        fill="#F5C518"
      ></path>
      <path
        d="M15.4055 0.511719H8.40552V23.5117H15.4055C20.9055 23.5117 23.6555 19.455 23.6555 12.0117C23.6555 4.5684 20.9055 0.511719 15.4055 0.511719ZM17.1198 18.235C16.3331 19.1484 15.1531 19.655 13.9198 19.655H12.5198V4.3684H13.9198C15.1531 4.3684 16.3331 4.87506 17.1198 5.7884C17.9065 6.70173 18.2598 8.03506 18.2598 9.89506V14.1284C18.2598 15.9884 17.9065 17.3217 17.1198 18.235Z"
        fill="#F5C518"
      ></path>
      <path
        d="M33.4688 0.511719H27.5156V23.5117H33.4688V19.655H38.5312V23.5117H44.4844V0.511719H38.5312V4.3684H33.4688V0.511719Z"
        fill="#F5C518"
      ></path>
    </svg>
  );
}


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
    <Card className="bg-background/80">
      <CardHeader>
        <CardTitle className="text-xl">Resources</CardTitle>
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
                  className="transition-colors duration-200 hover:bg-accent/80"
                >
                  S{String(season.seasonNumber).padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Episode</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mb-2">
              {selectedSeason?.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber).map(episode => (
                <Button 
                  key={episode.episodeNumber}
                  variant={selectedEpisode?.episodeNumber === episode.episodeNumber ? 'secondary' : 'ghost'}
                  size="sm"
                  className="aspect-square p-0 w-10 h-10 flex-shrink-0 transition-colors duration-200 hover:bg-accent/80"
                  onClick={() => setSelectedEpisode(episode)}
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
  const playerRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<ClientContent | null>(null);
  const [related, setRelated] = useState<ClientContent[]>([]);
  const [trending, setTrending] = useState<ClientContent[]>([]);
  const [newReleases, setNewReleases] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

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
  

  if (loading) {
      return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>
  }

  if (!item) {
    notFound();
  }
  
  const rawVideoUrl = item.type === 'movie' ? item.googleDriveVideoUrl : selectedEpisode?.videoUrl;
  const embedUrl = rawVideoUrl ? createEmbedUrl(rawVideoUrl) : "";
  const downloadUrl = rawVideoUrl ? createDownloadUrl(rawVideoUrl) : "";

  const getDownloadFilename = () => {
    if (!item) return "";
    const title = item.title.replace(/[^a-z0-9\s-]/gi, '').trim();
    if (item.type === 'movie') {
        return `${title}.mp4`;
    }
    if (selectedSeason && selectedEpisode) {
        const seasonNum = String(selectedSeason.seasonNumber).padStart(2, '0');
        const episodeNum = String(selectedEpisode.episodeNumber).padStart(2, '0');
        const episodeTitle = selectedEpisode.title.replace(/[^a-z0-9\s-]/gi, '').trim();
        return `${title} - S${seasonNum}E${episodeNum} - ${episodeTitle}.mp4`;
    }
    return `${title}.mp4`;
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player and Details */}
          <div className="lg:col-span-2 space-y-6">
            <div ref={playerRef} className="bg-background/80 rounded-lg overflow-hidden">
                {embedUrl ? (
                    <VideoPlayer src={embedUrl} poster={item.bannerImageUrl} />
                ) : (
                    <div className="aspect-video bg-black flex items-center justify-center">
                        <p className="text-muted-foreground">{item.type !== 'movie' ? 'Select an episode to play.' : 'No video available.'}</p>
                    </div>
                )}
            </div>
            
            <div>
                <h1 className="text-3xl md:text-4xl font-headline font-bold">{item.title}</h1>
                 {item.type !== 'movie' && selectedEpisode && (
                   <p className="text-lg text-primary mt-1">{`S${String(selectedSeason?.seasonNumber).padStart(2, '0')}E${String(selectedEpisode?.episodeNumber).padStart(2, '0')}: ${selectedEpisode?.title}`}</p>
                 )}


                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-4">
                  {item.imdbRating && (
                      <div className="flex items-center gap-2">
                          <ImdbIcon className="h-6" />
                          <span className="font-bold text-yellow-300">{item.imdbRating}/10</span>
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

                {rawVideoUrl && (
                  <div className="flex items-center gap-4 mt-6">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                        <a href={downloadUrl} download={getDownloadFilename()} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2" />
                            Download
                        </a>
                    </Button>
                  </div>
                )}
            </div>
          </div>

          {/* Right Column: Episode Selector */}
          {item.type !== 'movie' && (
            <div className="lg:col-span-1">
              <EpisodeSelector 
                item={item}
                selectedSeason={selectedSeason}
                setSelectedSeason={setSelectedSeason}
                selectedEpisode={selectedEpisode}
                setSelectedEpisode={setSelectedEpisode}
              />
            </div>
          )}
        </div>

        <div className="space-y-16 py-12 mt-8">
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
