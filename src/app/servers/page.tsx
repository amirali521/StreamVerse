
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { generateServerSuggestions, getVidSrcUrl, searchExternalContent } from "./actions";
import { VideoPlayer } from "@/components/video-player";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
}

function ContentCard({ item, onSelect }: { item: SearchResult, onSelect: (item: SearchResult) => void }) {
  return (
    <button onClick={() => onSelect(item)} className="w-full text-left group">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
            <Image
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg"}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <h3 className="p-2 font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </CardContent>
      </Card>
    </button>
  );
}

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'movie' | 'tv'>("movie");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [selectedContent, setSelectedContent] = useState<{ title: string; videoUrl: string } | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const suggestionsFetched = useRef(false);

  useEffect(() => {
    // Prevent double-fetching in React 18 Strict Mode (development)
    if (suggestionsFetched.current) return;
    suggestionsFetched.current = true;

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const aiSuggestions = await generateServerSuggestions();
        const detailedSuggestions = await Promise.all(
          aiSuggestions.suggestions.map(async (suggestion) => {
            const results = await searchExternalContent(suggestion.title, suggestion.type, false);
            return results.length > 0 ? results[0] : null;
          })
        );
        setSuggestions(detailedSuggestions.filter(Boolean) as SearchResult[]);
      } catch (error) {
        console.error("Failed to get AI suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    
    fetchSuggestions();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) {
        setHasSearched(false);
        setSearchResults([]);
        return;
    };

    setIsSearching(true);
    setHasSearched(true);
    setSelectedContent(null);
    try {
      const results = await searchExternalContent(searchQuery, searchType, true);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]); // Set to empty array on error
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType]);

  const handleSelectContent = async (item: SearchResult) => {
    setIsLoadingVideo(true);
    setSelectedContent(null);
    try {
      // For TV series, we need to ask for season and episode, for now, default to S1E1
      const source = item.media_type === 'tv'
        ? await getVidSrcUrl(String(item.id), 'tv', '1', '1')
        : await getVidSrcUrl(String(item.id), 'movie');
        
      if (source?.url) {
        setSelectedContent({ title: item.title, videoUrl: source.url });
      } else {
        console.error("Could not retrieve video source.");
      }
    } catch (error) {
      console.error("Failed to get video URL:", error);
    } finally {
      setIsLoadingVideo(false);
    }
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const contentToDisplay = hasSearched ? searchResults : suggestions;
  const isLoading = hasSearched ? isSearching : isLoadingSuggestions;

  return (
    <div className="container py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Explore External Servers</CardTitle>
          <CardDescription>Discover and stream from third-party sources. AI will suggest content, or you can search for anything you want.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {selectedContent ? (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{selectedContent.title}</h2>
                        <VideoPlayer source={{ name: "VidSrc", url: selectedContent.videoUrl }} poster="" />
                        <Button onClick={() => setSelectedContent(null)} className="mt-4">Back to Search</Button>
                    </div>
                    <div>
                        <h3 className="text-2xl font-headline font-semibold mb-4">You Might Also Like</h3>
                         {isLoadingSuggestions ? (
                            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                         ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                {suggestions.map((item) => (
                                    <ContentCard key={item.id} item={item} onSelect={handleSelectContent} />
                                ))}
                            </div>
                         )}
                    </div>
                </div>
            ) : isLoadingVideo ? (
                 <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Fetching video stream, please wait...</p>
                </div>
            ) : (
              <>
                <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-semibold text-center">Search for Content</h4>
                  <div className="flex w-full items-center space-x-2">
                    <Select
                      value={searchType}
                      onValueChange={(value) => setSearchType(value as any)}
                    >
                      <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="movie">Movie</SelectItem>
                          <SelectItem value="tv">Series/Drama</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      placeholder={`Search for a ${searchType}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }}}
                    />
                    <Button type="button" onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-2xl font-headline font-semibold mb-4">
                        {hasSearched ? 'Search Results' : 'AI Suggestions'}
                    </h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (contentToDisplay && contentToDisplay.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {contentToDisplay.map((item) => (
                            <ContentCard key={item.id} item={item} onSelect={handleSelectContent} />
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center pt-10">
                            {hasSearched ? "No results found for your search." : "Could not load suggestions."}
                        </p>
                    )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
