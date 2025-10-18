"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
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

export default function Home() {
  const firestore = useFirestore();
  const [trending, setTrending] = useState<Content[]>([]);
  const [newReleases, setNewReleases] = useState<Content[]>([]);
  const [popularDramas, setPopularDramas] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHomePageContent() {
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contentCol = collection(firestore, 'content');

        const fetchAndMap = async (q: any) => {
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            return [];
          }
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
        };

        const trendingQuery = query(contentCol, orderBy('imdbRating', 'desc'), limit(10));
        const newReleasesQuery = query(contentCol, orderBy('updatedAt', 'desc'), limit(10));
        const dramasQuery = query(contentCol, where('type', '==', 'drama'));

        const [trendingRes, newReleasesRes, allDramasRes] = await Promise.all([
            fetchAndMap(trendingQuery),
            fetchAndMap(newReleasesQuery),
            fetchAndMap(dramasQuery)
        ]);
        
        const sortedDramas = allDramasRes
            .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
            .slice(0, 10);

        setTrending(trendingRes);
        setNewReleases(newReleasesRes);
        setPopularDramas(sortedDramas);

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
        {newReleases.length > 0 ? (
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
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <p className="text-muted-foreground">No recent content to display.</p>
          </div>
        )}
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
