
"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, limit, query, where } from "firebase/firestore";
import type { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlayCircle, ThumbsUp, PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContentCarousel } from "@/components/content-carousel";
import { useEffect, useState } from "react";

export default function WatchPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const [item, setItem] = useState<Content | null>(null);
  const [related, setRelated] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getContentItem(id: string) {
      if (!firestore) return;
      
      setLoading(true);
      const contentRef = doc(firestore, 'content', id);
      const contentSnap = await getDoc(contentRef);

      if (!contentSnap.exists()) {
        setItem(null);
        setLoading(false);
        return;
      }
      
      const fetchedItem = { id: contentSnap.id, ...contentSnap.data() } as Content;
      setItem(fetchedItem);

      // Fetch related content
      const relatedQuery = query(
          collection(firestore, 'content'), 
          where('type', '==', fetchedItem.type),
          where('__name__', '!=', fetchedItem.id),
          limit(10)
      );
      const relatedSnapshot = await getDocs(relatedQuery);
      const relatedItems = relatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
      setRelated(relatedItems);
      setLoading(false);
    }
    
    getContentItem(params.id);
  }, [params.id, firestore]);
  

  if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!item) {
    notFound();
  }
  
  const sortedSeasons = item.seasons?.sort((a, b) => a.seasonNumber - b.seasonNumber) || [];

  return (
    <div className="flex flex-col">
      {/* Hero/Player Section */}
      <div className="relative w-full h-[40vh] md:h-[60vh] bg-black flex items-center justify-center">
        <div className="absolute inset-0">
            <Image
              src={item.bannerImageUrl}
              alt={item.title}
              fill
              className="object-cover opacity-30"
              priority
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center">
            {item.type === 'movie' && (
                <>
                    <PlayCircle className="h-24 w-24 text-white/70 hover:text-white transition-colors cursor-pointer" />
                    <p className="mt-4 text-white/80 text-lg">Play Movie</p>
                </>
            )}
        </div>
      </div>

      {/* Content Details */}
      <div className="container mx-auto py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">{item.title}</h1>
            <div className="flex items-center gap-4 mt-4 text-muted-foreground">
              {item.imdbRating && (
                <>
                  <span>IMDb: {item.imdbRating}/10</span>
                  <span>&#8226;</span>
                </>
              )}
              <span className="capitalize">{item.type}</span>
            </div>
            <p className="mt-6 text-lg text-foreground/80 leading-relaxed">
              {item.description}
            </p>
            <div className="mt-8 flex items-center gap-4">
               {item.type === 'movie' && (
                 <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlayCircle className="mr-2 h-6 w-6" /> Play
                 </Button>
               )}
              <Button variant="outline" size="icon" className="h-12 w-12">
                <PlusCircle className="h-6 w-6" />
                <span className="sr-only">Add to My List</span>
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <ThumbsUp className="h-6 w-6" />
                <span className="sr-only">Like</span>
              </Button>
            </div>
          </div>
        </div>

        {item.type !== 'movie' && sortedSeasons.length > 0 && (
            <>
                <Separator className="my-12 md:my-16" />
                <div className="max-w-4xl">
                    <h2 className="text-3xl font-headline font-semibold mb-6">Seasons & Episodes</h2>
                     <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                        {sortedSeasons.map((season) => (
                            <AccordionItem value={`item-${season.seasonNumber}`} key={season.seasonNumber}>
                                <AccordionTrigger className="text-xl">Season {season.seasonNumber}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-4">
                                    {season.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber).map((episode) => (
                                        <div key={episode.episodeNumber} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                                            <div className="text-2xl font-bold text-primary">{String(episode.episodeNumber).padStart(2, '0')}</div>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold">{episode.title}</h4>
                                                <p className="text-sm text-muted-foreground truncate">{episode.videoUrl}</p>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <PlayCircle className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!season.episodes || season.episodes.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No episodes in this season yet.</p>}

                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </>
        )}

        {related.length > 0 && (
            <>
                <Separator className="my-12 md:my-16" />
                <ContentCarousel title="More Like This" items={related} />
            </>
        )}
        
      </div>
    </div>
  );
}
