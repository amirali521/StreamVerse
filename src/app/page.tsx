"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { ContentCarousel } from "@/components/content-carousel";
import type { Content } from "@/lib/types";

export default function Home() {
  const firestore = useFirestore();
  const [trending, setTrending] = useState<Content[]>([]);
  const [newReleases, setNewReleases] = useState<Content[]>([]);
  const [popularDramas, setPopularDramas] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchContent = async () => {
      setLoading(true);
      try {
        const contentCol = collection(firestore, 'content');

        // Helper to fetch and map documents
        const fetchAndMap = async (q: any) => {
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            return [];
          }
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
        };

        // Trending: Highest rated
        const trendingQuery = query(contentCol, orderBy('imdbRating', 'desc'), limit(10));
        setTrending(await fetchAndMap(trendingQuery));

        // New Releases: Most recently created
        const newReleasesQuery = query(contentCol, orderBy('createdAt', 'desc'), limit(10));
        setNewReleases(await fetchAndMap(newReleasesQuery));
        
        // Popular Dramas: Fetch all dramas, then sort and slice on the client
        const dramasQuery = query(contentCol, where('type', '==', 'drama'));
        const allDramas = await fetchAndMap(dramasQuery);
        const sortedDramas = allDramas
            .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
            .slice(0, 10);
        setPopularDramas(sortedDramas);

      } catch (error) {
        console.error("Error fetching homepage content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [firestore]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] text-white bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-12 lg:p-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-white drop-shadow-xl">
              StreamVerse
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow-lg">
              Your universe of movies, web series, and dramas. Explore trending content, new releases, and popular shows.
            </p>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="py-12 px-4 md:px-6 lg:px-8 space-y-16">
        {loading ? (
           <div className="text-center text-muted-foreground">Loading content...</div>
        ) : (
          <>
            {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
            {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
            {popularDramas.length > 0 && <ContentCarousel title="Popular Dramas" items={popularDramas} />}
            {trending.length === 0 && newReleases.length === 0 && popularDramas.length === 0 && (
              <div className="text-center text-muted-foreground">
                <p>No content has been added yet.</p>
                <p className="mt-2">Use the admin panel to add movies, series, and dramas.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
