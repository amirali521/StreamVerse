
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { startCase } from "lodash";
import { Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function ContentGridCard({ item }: { item: ClientContent }) {
  return (
    <Link href={`/watch/${item.id}`} className="block group">
      <Card className="w-full border-0 bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
            {item.bannerImageUrl ? (
              <Image
                src={item.bannerImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground text-xs text-center">No Image</span>
              </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h3 className="mt-2 font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
}

function FilterSheet({ allContent, onFilterChange }: { allContent: ClientContent[], onFilterChange: (filteredContent: ClientContent[]) => void }) {
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'webseries' | 'drama'>('all');
    
    // Dynamically generate the list of all available genres from the content
    const allGenres = useMemo(() => {
        const genres = new Set<string>();
        allContent.forEach(item => {
            item.categories?.forEach(cat => genres.add(startCase(cat.toLowerCase())));
        });
        return Array.from(genres).sort();
    }, [allContent]);


    const handleApplyFilters = () => {
        let filtered = allContent;

        if (selectedGenres.length > 0) {
            filtered = filtered.filter(item => 
                selectedGenres.every(genre => 
                    item.categories?.some(cat => cat.toLowerCase() === genre.toLowerCase())
                )
            );
        }

        if (selectedType !== 'all') {
            filtered = filtered.filter(item => item.type === selectedType);
        }

        onFilterChange(filtered);
    };
    
    const handleClearFilters = () => {
        setSelectedGenres([]);
        setSelectedType('all');
        onFilterChange(allContent);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Filter Content</SheetTitle>
                    <SheetDescription>
                        Refine your results based on genres and content type.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow pr-6">
                    <div className="py-4 space-y-6">
                        {/* Content Type Filter */}
                        <div>
                            <h4 className="font-semibold mb-3">Content Type</h4>
                            <RadioGroup defaultValue="all" value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="r-all" />
                                    <Label htmlFor="r-all">All</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="movie" id="r-movie" />
                                    <Label htmlFor="r-movie">Movies</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="webseries" id="r-webseries" />
                                    <Label htmlFor="r-webseries">Web Series</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="drama" id="r-drama" />
                                    <Label htmlFor="r-drama">Dramas</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {/* Genre Filter */}
                        {allGenres.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3">Genres</h4>
                                <div className="space-y-2">
                                    {allGenres.map(genre => (
                                        <div key={genre} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`check-${genre}`}
                                                checked={selectedGenres.includes(genre.toLowerCase())}
                                                onCheckedChange={(checked) => {
                                                    const lowerCaseGenre = genre.toLowerCase();
                                                    setSelectedGenres(prev => 
                                                        checked ? [...prev, lowerCaseGenre] : prev.filter(g => g !== lowerCaseGenre)
                                                    );
                                                }}
                                            />
                                            <Label htmlFor={`check-${genre}`} className="font-normal">{genre}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <SheetFooter>
                    <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
                    <SheetClose asChild>
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}


export default function CategoryPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;
  
  const [initialContent, setInitialContent] = useState<ClientContent[]>([]);
  const [allAvailableContent, setAllAvailableContent] = useState<ClientContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!firestore || !slug) return;

    const fetchContent = async () => {
      setLoading(true);
      const contentCol = collection(firestore, 'content');
      const contentSnapshot = await getDocs(contentCol);
      
      const allContent: ClientContent[] = contentSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0),
          } as ClientContent;
        });

      setAllAvailableContent(allContent); // Store all content for dynamic filter generation
      let contentForCategory: ClientContent[] = [];
      const categoryTitle = startCase(slug.replace(/-/g, ' '));
      setTitle(categoryTitle);

      switch (slug) {
        case 'trending-now':
          contentForCategory = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
          break;
        case 'new-releases':
          contentForCategory = [...allContent].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
          break;
        case 'movies':
            contentForCategory = allContent.filter(item => item.type === 'movie');
            break;
        case 'web-series':
            contentForCategory = allContent.filter(item => item.type === 'webseries');
            break;
        case 'dramas':
            contentForCategory = allContent.filter(item => item.type === 'drama');
            break;
        default:
          const formattedSlug = slug.replace(/-/g, ' ').toLowerCase();
          contentForCategory = allContent.filter(item => 
            item.categories?.some(cat => cat.toLowerCase() === formattedSlug)
          );
          break;
      }
      
      setInitialContent(contentForCategory);
      setFilteredContent(contentForCategory);
      setLoading(false);
    };

    fetchContent();

  }, [firestore, slug]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading content...</div>;
  }
  
  if (!loading && initialContent.length === 0) {
      return (
        <div className="container py-10 text-center">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-muted-foreground">No content found for this category.</p>
        </div>
      )
  }

  return (
    <div className="container py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold">{title}</h1>
        <FilterSheet allContent={initialContent} onFilterChange={setFilteredContent} />
      </div>
      
      {filteredContent.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredContent.map(item => (
            <ContentGridCard key={item.id} item={item} />
            ))}
        </div>
      ) : (
         <div className="text-center py-16">
            <p className="text-muted-foreground">No content matches your selected filters.</p>
         </div>
      )}
    </div>
  );
}
