
"use client";

import { useEffect, useState, useMemo, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Clapperboard, ServerCrash, ChevronLeft, ChevronRight, Download, Image as ImageIcon, Film } from "lucide-react";
import { searchExternalContent, generateServerSuggestions, getEmbedUrls, getExternalContentDetails, getRelatedExternalContent, type EmbedSource, getSocialImages } from "./actions";
import { VideoPlayer } from "@/components/video-player";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TMDBResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  media_type: 'movie' | 'tv';
}

interface SocialImage {
    file_path: string;
    aspect_ratio: number;
    type: 'poster' | 'backdrop' | 'logo';
}

const EPISODES_PER_PAGE = 50;

function ImageDownloadCard({ image, contentTitle }: { image: SocialImage, contentTitle: string }) {
    const imageUrl = `https://image.tmdb.org/t/p/original${image.file_path}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Failed to fetch image.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;

            const extension = blob.type.split('/')[1] || 'jpg';
            const title = contentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const imageType = image.type;
            const shortPath = image.file_path.substring(image.file_path.lastIndexOf('/') + 1).split('.')[0];
            
            a.download = `${title}_${imageType}_${shortPath}.${extension}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast({ title: "Download Started", description: `Downloading ${imageType} image.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Download Failed", description: error.message });
        }
    };

    return (
        <Card className="overflow-hidden group relative">
            <div className="aspect-[2/3] w-full bg-muted">
                <Image
                    src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                    alt={`${contentTitle} ${image.type}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
            </div>
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4"/>
                    Download
                </Button>
            </div>
        </Card>
    );
}

function EpisodeSelector({ 
  details,
  selectedSeasonNum,
  setSelectedSeasonNum,
  selectedEpisodeNum,
  setSelectedEpisodeNum,
}: {
  details: any;
  selectedSeasonNum: number,
  setSelectedSeasonNum: (season: number) => void,
  selectedEpisodeNum: number,
  setSelectedEpisodeNum: (episode: number) => void,
}) {
    const [currentPage, setCurrentPage] = useState(1);

    const seasonsToShow = useMemo(() => {
        return (details?.seasons || [])
            .filter((s: any) => s.season_number > 0) // Filter out "Specials" season
            .map((s: any) => ({
                seasonNumber: s.season_number,
                episodeCount: s.episode_count,
            })).sort((a:any,b:any) => a.seasonNumber - b.seasonNumber) || [];
    }, [details]);
    
    const selectedSeasonData = seasonsToShow.find((s:any) => s.seasonNumber === selectedSeasonNum);

    const episodes = Array.from({ length: selectedSeasonData?.episodeCount || 0 }, (_, i) => ({ episodeNumber: i + 1 }));

    // Pagination logic
    const totalPages = Math.ceil(episodes.length / EPISODES_PER_PAGE);
    const paginatedEpisodes = episodes.slice((currentPage - 1) * EPISODES_PER_PAGE, currentPage * EPISODES_PER_PAGE);

    const handleSeasonChange = (seasonNumber: number) => {
        setSelectedSeasonNum(seasonNumber);
        setCurrentPage(1); 
        setSelectedEpisodeNum(1); // Default to first episode
    };
  
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
              {seasonsToShow.map((season: any) => (
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
             {episodes.length === 0 && <p className="text-sm text-muted-foreground mt-2">No episodes found for this season.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({ item, onSelect }: { item: TMDBResult, onSelect: (item: TMDBResult) => void }) {
  const year = item.release_date ? new Date(item.release_date).getFullYear() : null;
  return (
    <button onClick={() => onSelect(item)} className="block group text-left">
      <Card className="w-full border-0 bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105 bg-secondary">
            {item.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <Clapperboard className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h3 className="mt-2 font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {year && <p className="text-xs text-muted-foreground">{year}</p>}
        </CardContent>
      </Card>
    </button>
  );
}

function RelatedContentCarousel({ contentId, contentType, onSelect }: { contentId: number, contentType: 'movie' | 'tv', onSelect: (item: TMDBResult) => void }) {
    const [relatedContent, setRelatedContent] = useState<TMDBResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRelated() {
            setIsLoading(true);
            const related = await getRelatedExternalContent(contentId, contentType);
            setRelatedContent(related.slice(0, 12)); // Limit to 12
            setIsLoading(false);
        }
        fetchRelated();
    }, [contentId, contentType]);

    if (isLoading) {
        return (
            <div className="mt-12">
                <h2 className="text-3xl font-headline font-semibold mb-4">More Like This</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }
    
    if (relatedContent.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-3xl font-headline font-semibold mb-4">More Like This</h2>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {relatedContent.map(item => (
                    <ResultCard key={item.id} item={item} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
}

function ServersPageComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [suggestions, setSuggestions] = useState<TMDBResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(true);
  const initialSuggestionsFetched = useRef(false);

  const [selectedContent, setSelectedContent] = useState<TMDBResult | null>(null);
  const [selectedContentDetails, setSelectedContentDetails] = useState<any>(null);
  const [embedUrls, setEmbedUrls] = useState<EmbedSource[]>([]);
  const [activeSource, setActiveSource] = useState<EmbedSource | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [selectedEpisodeNum, setSelectedEpisodeNum] = useState(1);
  const [images, setImages] = useState<{posters: SocialImage[], backdrops: SocialImage[], logos: SocialImage[]}>({posters: [], backdrops: [], logos: []});
  
  const videoSource = useMemo(() => {
    if (!selectedContent || embedUrls.length === 0) return null;
    const season = selectedContent.media_type === 'tv' ? selectedSeasonNum : 1;
    const episode = selectedContent.media_type === 'tv' ? selectedEpisodeNum : 1;

    const source = activeSource || embedUrls[0];
    const url = source.url
        .replace('{season}', String(season))
        .replace('{episode}', String(episode));

    return { ...source, url };
}, [selectedContent, embedUrls, activeSource, selectedSeasonNum, selectedEpisodeNum]);

  useEffect(() => {
    async function fetchInitialSuggestions() {
      if (initialSuggestionsFetched.current) return;
      initialSuggestionsFetched.current = true;
      
      setIsFetchingSuggestions(true);
      const suggestedTitles = await generateServerSuggestions();
      const results = await Promise.all(
        suggestedTitles.map(async (item) => {
          const searchRes = await searchExternalContent({ query: item.title, type: item.type as any, isAISuggestion: true });
          return searchRes.length > 0 ? searchRes[0] : null;
        })
      );
      setSuggestions(results.filter((r): r is TMDBResult => r !== null));
      setIsFetchingSuggestions(false);
    }
    fetchInitialSuggestions();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedContent(null);
    setEmbedUrls([]);
    setActiveSource(null);
    setSearchResults([]);

    const results = await searchExternalContent({ query: searchQuery, type: searchType });
    setSearchResults(results);
    setIsSearching(false);
  };
  
  const handleSelectContent = async (item: TMDBResult) => {
      setSelectedContent(item);
      setIsVideoLoading(true);
      setEmbedUrls([]);
      setActiveSource(null);
      setSelectedContentDetails(null);
      setImages({posters: [], backdrops: [], logos: []});
      
      const [urls, details, fetchedImages] = await Promise.all([
          getEmbedUrls(item.id, item.media_type),
          getExternalContentDetails(item.id, item.media_type),
          getSocialImages(item.id, item.media_type)
      ]);
      
      setEmbedUrls(urls);
      setSelectedContentDetails(details);
      
      const posters: SocialImage[] = (fetchedImages.posters || []).map((p: any) => ({...p, type: 'poster'}));
      const backdrops: SocialImage[] = (fetchedImages.backdrops || []).map((b: any) => ({...b, type: 'backdrop'}));
      const logos: SocialImage[] = (fetchedImages.logos || []).map((l: any) => ({...l, type: 'logo'}));
      setImages({ posters: posters.slice(0, 20), backdrops: backdrops.slice(0, 20), logos: logos.slice(0, 10) });


      if (urls.length > 0) {
        setActiveSource(urls[0]);
      }
      
      // Reset season/episode for new content
      setSelectedSeasonNum(1);
      setSelectedEpisodeNum(1);

      setIsVideoLoading(false);

      // Scroll to player
      const playerElement = document.getElementById('player-section');
      if (playerElement) {
          playerElement.scrollIntoView({ behavior: 'smooth' });
      }
  }

  const contentToDisplay = searchResults.length > 0 ? searchResults : suggestions;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold">External Content Explorer</h1>
        <p className="text-muted-foreground">Find and stream from third-party servers.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
        <div className="flex w-full items-center space-x-2">
            <Select value={searchType} onValueChange={(value) => setSearchType(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="tv">Series/Drama</SelectItem>
              </SelectContent>
            </Select>
            <Input
                type="text"
                placeholder="Search for any movie or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="sr-only">Search</span>
            </Button>
        </div>
      </form>

      {selectedContent && (
        <div id="player-section" className="mb-12">
           <h2 className="text-2xl font-bold mb-4">Now Playing: {selectedContent.title}</h2>
           {isVideoLoading ? (
               <div className="aspect-video bg-black flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
               </div>
           ) : videoSource ? (
               <VideoPlayer source={videoSource} poster={`https://image.tmdb.org/t/p/original${selectedContent.poster_path}`} />
           ) : (
                <div className="aspect-video bg-black flex flex-col items-center justify-center border border-dashed border-destructive/50 rounded-lg">
                    <ServerCrash className="h-10 w-10 text-destructive" />
                    <p className="mt-4 text-destructive">Could not find a playable source.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching for a different title.</p>
                </div>
           )}
           
           <Tabs defaultValue="controls" className="mt-4">
              <TabsList>
                <TabsTrigger value="controls"><Film className="mr-2"/>Player Controls</TabsTrigger>
                <TabsTrigger value="images"><ImageIcon className="mr-2"/>Download Images</TabsTrigger>
              </TabsList>
              <TabsContent value="controls">
                {embedUrls.length > 1 && (
                  <div className="mt-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Servers</h3>
                      <Tabs value={activeSource?.name} onValueChange={(value) => setActiveSource(embedUrls.find(s => s.name === value) || null)}>
                          <TabsList>
                              {embedUrls.map(source => (
                                  <TabsTrigger key={source.name} value={source.name}>{source.name}</TabsTrigger>
                              ))}
                          </TabsList>
                      </Tabs>
                  </div>
                )}
                {selectedContent.media_type === 'tv' && selectedContentDetails && (
                  <EpisodeSelector
                    details={selectedContentDetails}
                    selectedSeasonNum={selectedSeasonNum}
                    setSelectedSeasonNum={setSelectedSeasonNum}
                    selectedEpisodeNum={selectedEpisodeNum}
                    setSelectedEpisodeNum={setSelectedEpisodeNum}
                  />
                )}
              </TabsContent>
               <TabsContent value="images">
                  <Tabs defaultValue="posters" className="mt-4">
                      <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="posters" disabled={images.posters.length === 0}>Posters ({images.posters.length})</TabsTrigger>
                          <TabsTrigger value="backdrops" disabled={images.backdrops.length === 0}>Backdrops ({images.backdrops.length})</TabsTrigger>
                          <TabsTrigger value="logos" disabled={images.logos.length === 0}>Logos ({images.logos.length})</TabsTrigger>
                      </TabsList>
                      <ScrollArea className="h-96 w-full rounded-md border mt-2">
                          <div className="p-4">
                              <TabsContent value="posters">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                      {images.posters.map((image) => (
                                          <ImageDownloadCard key={image.file_path} image={image} contentTitle={selectedContent.title} />
                                      ))}
                                  </div>
                              </TabsContent>
                              <TabsContent value="backdrops">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {images.backdrops.map((image) => (
                                          <ImageDownloadCard key={image.file_path} image={{...image, type: 'backdrop'}} contentTitle={selectedContent.title} />
                                      ))}
                                  </div>
                              </TabsContent>
                              <TabsContent value="logos">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                      {images.logos.map((image) => (
                                          <ImageDownloadCard key={image.file_path} image={{...image, type: 'logo'}} contentTitle={selectedContent.title} />
                                      ))}
                                  </div>
                              </TabsContent>
                          </div>
                      </ScrollArea>
                  </Tabs>
              </TabsContent>
           </Tabs>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-headline font-semibold mb-4">
            {searchResults.length > 0 ? "Search Results" : (suggestions.length > 0 ? "Suggestions" : "")}
        </h2>
        
        {(isFetchingSuggestions && suggestions.length === 0) || isSearching ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        ) : contentToDisplay.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {contentToDisplay.map(item => (
                    <ResultCard key={item.id} item={item} onSelect={handleSelectContent} />
                ))}
            </div>
        ) : (
             <div className="text-center py-16">
                <p className="text-muted-foreground">{searchQuery ? 'No results found for your search.' : 'No suggestions available.'}</p>
            </div>
        )}
      </div>

       {selectedContent && (
           <RelatedContentCarousel 
                contentId={selectedContent.id} 
                contentType={selectedContent.media_type}
                onSelect={handleSelectContent}
            />
       )}

    </div>
  );
}

export default function ServersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <ServersPageComponent />
        </Suspense>
    )
}
