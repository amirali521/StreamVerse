
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { searchExternalContent } from "../servers/actions";
import Image from "next/image";

interface TMDBResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  media_type: 'movie' | 'tv';
}

const downloadSites = [
    { name: "1337x", query: "site:1337x.to" },
    { name: "RARBG", query: "site:rarbg.to" },
    { name: "FitGirl", query: "site:fitgirl-repacks.site" },
    { name: "Dodi", query: "site:dodi-repacks.site" },
    { name: "TorrentGalaxy", query: "site:torrentgalaxy.to" },
    { name: "UHDMovies", query: "site:uhdmovies.wiki" },
];

function ResultCard({ item, onSelect }: { item: TMDBResult, onSelect: (item: TMDBResult) => void }) {
  const year = item.release_date ? new Date(item.release_date).getFullYear() : null;
  return (
    <button onClick={() => onSelect(item)} className="block group text-left w-full">
      <Card className="w-full overflow-hidden transition-all duration-200 hover:bg-muted/50">
          <CardContent className="p-0 flex items-center gap-4">
              <div className="aspect-[2/3] w-20 relative flex-shrink-0 bg-secondary">
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="py-2 pr-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {item.title}
                </h3>
                {year && <p className="text-xs text-muted-foreground">{year}</p>}
              </div>
          </CardContent>
      </Card>
    </button>
  );
}

export default function DMCA() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<TMDBResult[]>([]);
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsLoading(true);
        setSelectedTitle(null);
        const [movieResults, tvResults] = await Promise.all([
            searchExternalContent({ query, type: 'movie' }),
            searchExternalContent({ query, type: 'tv' }),
        ]);
        setResults([...movieResults, ...tvResults].slice(0, 10)); // Combine and limit results
        setIsLoading(false);
    };
    
    const handleSelect = (item: TMDBResult) => {
        const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
        setSelectedTitle(`${item.title} ${year}`.trim());
        setResults([]);
        setQuery(`${item.title} ${year}`);
    };

    const generateSearchUrl = (siteQuery: string, contentTitle: string) => {
        const searchQuery = `${contentTitle} download ${siteQuery}`;
        return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    };

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">DMCA / Download Helper</CardTitle>
                    <CardDescription>
                        Search for content to generate download search links. We do not host any files on our servers. This tool is for educational purposes only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 mb-6">
                        <Input
                            type="text"
                            placeholder="Search for any movie or series..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={isLoading} size="icon">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="sr-only">Search</span>
                        </Button>
                    </form>

                    {isLoading && (
                        <div className="space-y-2">
                           {Array.from({length: 3}).map((_, i) => (
                               <div key={i} className="h-[76px] w-full bg-muted animate-pulse rounded-lg" />
                           ))}
                        </div>
                    )}
                    
                    {!isLoading && results.length > 0 && (
                        <div className="space-y-2">
                            {results.map(item => (
                                <ResultCard key={item.id} item={item} onSelect={handleSelect} />
                            ))}
                        </div>
                    )}
                    
                    {selectedTitle && (
                        <div className="mt-8">
                             <h3 className="text-lg font-semibold mb-4">Download links for: <span className="text-primary">{selectedTitle}</span></h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {downloadSites.map(site => (
                                    <a
                                        key={site.name}
                                        href={generateSearchUrl(site.query, selectedTitle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="outline" className="w-full justify-between">
                                            <span>{site.name}</span>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground"/>
                                        </Button>
                                    </a>
                                ))}
                             </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
