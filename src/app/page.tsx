
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import { ContentCarousel } from "@/components/content-carousel";
import type { Content } from "@/lib/types";
import { HeroBanner } from "@/components/hero-banner";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export default function Home() {
  const firestore = useFirestore();
  const [heroContent, setHeroContent] = useState<ClientContent[]>([]);
  const [trending, setTrending] = useState<ClientContent[]>([]);
  const [newReleases, setNewReleases] = useState<ClientContent[]>([]);
  const [popularDramas, setPopularDramas] = useState<ClientContent[]>([]);
  const [bollywood, setBollywood] = useState<ClientContent[]>([]);
  const [hollywood, setHollywood] = useState<ClientContent[]>([]);
  const [tollywood, setTollywood] = useState<ClientContent[]>([]);
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

        // Set Hero Content (latest 5 movies)
        const newMovies = sortedNewReleases.filter(item => item.type === 'movie');
        setHeroContent(newMovies.slice(0, 5));

        // 2. Get Trending: Sort all content by IMDb rating
        const sortedTrending = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
        setTrending(sortedTrending.slice(0, 10));
        
        // 3. Get Popular Dramas: Filter for dramas, then sort by rating
        const dramas = allContent.filter(item => item.type === 'drama');
        const sortedDramas = dramas.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
        setPopularDramas(sortedDramas.slice(0, 10));

        // 4. Get content by specific categories
        setBollywood(allContent.filter(item => item.categories?.includes('Bollywood')));
        setHollywood(allContent.filter(item => item.categories?.includes('Hollywood')));
        setTollywood(allContent.filter(item => item.categories?.includes('Tollywood')));


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
      {heroContent.length > 0 && <HeroBanner items={heroContent} />}

      {/* Content Sections */}
      <div className="py-12 px-4 md:px-6 lg:px-8 space-y-16">
        {trending.length === 0 && newReleases.length === 0 && popularDramas.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No content has been added yet.</p>
            <p className="mt-2">Use the admin panel to add movies, series, and dramas.</p>
          </div>
        ) : (
          <>
            {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
            {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
            {bollywood.length > 0 && <ContentCarousel title="Bollywood" items={bollywood} />}
            {hollywood.length > 0 && <ContentCarousel title="Hollywood" items={hollywood} />}
            {tollywood.length > 0 && <ContentCarousel title="Tollywood" items={tollywood} />}
            {popularDramas.length > 0 && <ContentCarousel title="Popular Dramas" items={popularDramas} />}
          </>
        )}
      </div>
    </div>
  );
}
