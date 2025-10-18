
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import { ContentCarousel } from "@/components/content-carousel";
import type { Content } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export default function Home() {
  const firestore = useFirestore();
  const [trending, setTrending] = useState<ClientContent[]>([]);
  const [newReleases, setNewReleases] = useState<ClientContent[]>([]);
  const [popularDramas, setPopularDramas] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHomePageContent() {
      if (!firestore) {
        return; // Wait for firestore to be initialized
      }

      setLoading(true);
      try {
        const contentCol = collection(firestore, 'content');
        const contentSnapshot = await getDocs(contentCol);

        if (contentSnapshot.empty) {
          setLoading(false);
          return;
        }

        // Fetch all content and process it on the client
        const allContent: ClientContent[] = contentSnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to JS Dates, with a fallback for old data
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(0),
          } as ClientContent;
        });

        // 1. Get New Releases: Sort all content by `createdAt` date
        const sortedNewReleases = [...allContent].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setNewReleases(sortedNewReleases);

        // 2. Get Trending: Sort all content by IMDb rating
        const sortedTrending = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
        setTrending(sortedTrending.slice(0, 10));
        
        // 3. Get Popular Dramas: Filter for dramas, then sort by rating
        const dramas = allContent.filter(item => item.type === 'drama');
        const sortedDramas = dramas.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
        setPopularDramas(sortedDramas.slice(0, 10));

      } catch (error) {
        console.error("Error fetching homepage content:", error);
      } finally {
        setLoading(false);
      }
    }

    getHomePageContent();
  }, [firestore]);


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading content...</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] md:h-[50vh] text-white">
        <Carousel
          opts={{ loop: true }}
          className="w-full h-full"
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            }),
          ]}
        >
          <CarouselContent className="h-full">
            {newReleases.slice(0, 4).map((item) => (
              <CarouselItem key={item.id} className="h-full">
                <Link href={`/watch/${item.id}`} className="block h-full">
                  <div className="relative h-full">
                    <Image
                      src={item.bannerImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-12 lg:p-24">
                      <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-headline font-bold text-white drop-shadow-xl">
                          {item.title}
                        </h1>
                        <p className="mt-2 md:mt-4 text-sm md:text-lg text-white/90 drop-shadow-lg line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
          <CarouselNext className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        </Carousel>
      </section>

      {/* Content Sections */}
      <div className="py-12 px-4 md:px-6 lg:px-8 space-y-16">
        {trending.length === 0 && newReleases.length === 0 && popularDramas.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No content has been added yet.</p>
            <p className="mt-2">Use the admin panel to add movies, series, and dramas.</p>
          </div>
        ) : (
          <>
            {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
            {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
            {popularDramas.length > 0 && <ContentCarousel title="Popular Dramas" items={popularDramas} />}
          </>
        )}
      </div>
    </div>
  );
}
