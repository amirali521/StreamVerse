
"use client";

import { useEffect, useState, useMemo, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Clapperboard, ServerCrash } from "lucide-react";
import { searchExternalContent, generateServerSuggestions, getEmbedUrls, type EmbedSource } from "./actions";
import { VideoPlayer } from "@/components/video-player";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TMDBResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  media_type: 'movie' | 'tv';
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

function ServersPageComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [suggestions, setSuggestions] = useState<TMDBResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(true);
  const initialSuggestionsFetched = useRef(false);

  const [selectedContent, setSelectedContent] = useState<TMDBResult | null>(null);
  const [embedUrls, setEmbedUrls] = useState<EmbedSource[]>([]);
  const [activeSource, setActiveSource] = useState<EmbedSource | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

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
      
      // For TV shows, we need to specify season and episode. For simplicity, we'll default to S1E1.
      // A full implementation would have season/episode selectors.
      const season = item.media_type === 'tv' ? 1 : undefined;
      const episode = item.media_type === 'tv' ? 1 : undefined;
      
      const urls = await getEmbedUrls(item.id, item.media_type, season, episode);
      setEmbedUrls(urls);

      if (urls.length > 0) {
        setActiveSource(urls[0]);
      }
      setIsVideoLoading(false);
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
        <div className="mb-12">
           <h2 className="text-2xl font-bold mb-4">Now Playing: {selectedContent.title}</h2>
           {isVideoLoading ? (
               <div className="aspect-video bg-black flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
               </div>
           ) : activeSource ? (
               <VideoPlayer source={activeSource} poster={`https://image.tmdb.org/t/p/original${selectedContent.poster_path}`} />
           ) : (
                <div className="aspect-video bg-black flex flex-col items-center justify-center border border-dashed border-destructive/50 rounded-lg">
                    <ServerCrash className="h-10 w-10 text-destructive" />
                    <p className="mt-4 text-destructive">Could not find a playable source.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching for a different title.</p>
                </div>
           )}
           {embedUrls.length > 1 && (
             <div className="mt-4">
                <Tabs value={activeSource?.name} onValueChange={(value) => setActiveSource(embedUrls.find(s => s.name === value) || null)}>
                    <TabsList>
                        {embedUrls.map(source => (
                            <TabsTrigger key={source.name} value={source.name}>{source.name}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
             </div>
           )}
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
