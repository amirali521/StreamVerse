
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bot, Loader2, Sparkles, CheckCircle, Plus } from 'lucide-react';
import { findContent, addContentFromTmdb } from './actions';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
}

function AddButton({ result }: { result: SearchResult }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addContentFromTmdb(result.id, result.media_type);
      toast({
        title: 'Content Added!',
        description: `${result.title} has been added to your library.`,
      });
      setIsAdded(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Adding Content',
        description:
          error.message || 'There was a problem adding this content.',
      });
    }
    setIsAdding(false);
  };

  if (isAdded) {
    return (
      <Button disabled variant="secondary" size="sm">
        <CheckCircle className="mr-2 h-4 w-4" /> Added
      </Button>
    );
  }

  return (
    <Button onClick={handleAdd} disabled={isAdding} size="sm">
      {isAdding ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      Add
    </Button>
  );
}

export default function AssistantPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setResults(null);
    setError(null);
    try {
      const searchResults = await findContent(query);
      setResults(searchResults);
    } catch (e: any) {
      setError(
        e.message || 'An unexpected error occurred. Please try again.'
      );
    }
    setIsSearching(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="mt-4">AI Content Assistant</CardTitle>
        <CardDescription>
          Use natural language to find and add content. Try "latest Bollywood
          movies" or "top rated web series 2023".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="e.g. popular action movies from 2024"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            disabled={isSearching}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        <div className="mt-8">
          {isSearching && (
            <div className="text-center text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">AI is searching for content...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-destructive">{error}</div>
          )}
          {results && results.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p>No results found for your query.</p>
            </div>
          )}
          {results && results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search Results</h3>
              <ul className="divide-y divide-border rounded-md border">
                {results.map((result) => (
                  <li
                    key={result.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={
                          result.poster_path
                            ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                            : '/placeholder.svg'
                        }
                        alt="poster"
                        width={45}
                        height={68}
                        className="rounded-sm"
                      />
                      <div>
                        <p className="font-semibold">{result.title}</p>
                        {result.release_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.release_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                    <AddButton result={result} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
