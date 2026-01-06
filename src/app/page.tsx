
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import { ContentCarousel } from "@/components/content-carousel";
import type { Content } from "@/lib/types";
import { HeroBanner } from "@/components/hero-banner";
import { getUpcomingMovies } from "@/lib/tmdb";
import { UpcomingHeroBanner } from "@/components/upcoming-hero-banner";
import { generateHeroSummary } from "@/ai/flows/generate-hero-summary";
import { startCase } from "lodash";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  posterImageUrl?: string;
};

interface CarouselData {
    title: string;
    items: ClientContent[];
}

const MIN_ITEMS_FOR_CAROUSEL = 4;

export default function Home() {
  const firestore = useFirestore();
  const [heroContent, setHeroContent] = useState<ClientContent[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
  const [carousels, setCarousels] = useState<CarouselData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHomePageContent() {
      if (!firestore) {
        return; // Wait for firestore to be initialized
      }

      setLoading(true);
      try {
        // Fetch upcoming movies from TMDB and generate AI summaries
        const upcoming = await getUpcomingMovies();
        const upcomingWithSummaries = await Promise.all(
          upcoming.map(async (movie) => {
            const summary = await generateHeroSummary({
              title: movie.title,
              description: movie.overview,
            });
            return { ...movie, aiSummary: summary.cinematicDescription };
          })
        );
        setUpcomingMovies(upcomingWithSummaries);


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
        
        let generatedCarousels: CarouselData[] = [];

        // 1. Get Hero Content: Filter for items with `isFeatured` set to true
        const featuredContent = allContent.filter(item => item.isFeatured).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setHeroContent(featuredContent.slice(0, 5));
        
        // 2. Get New Releases: Sort all content by `createdAt` date
        const sortedNewReleases = [...allContent].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        if(sortedNewReleases.length >= MIN_ITEMS_FOR_CAROUSEL) {
            generatedCarousels.push({ title: "New Releases", items: sortedNewReleases.slice(0, 10) });
        }

        // 3. Get Trending: Sort all content by IMDb rating
        const sortedTrending = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
        if(sortedTrending.length >= MIN_ITEMS_FOR_CAROUSEL) {
            generatedCarousels.push({ title: "Trending Now", items: sortedTrending.slice(0, 10) });
        }
        
        // 4. Group content by type (movie, webseries, drama) and categories
        const groupedContent: Record<string, ClientContent[]> = {};
        allContent.forEach(item => {
            // Group by type
            if (item.type) {
                const typeKey = startCase(item.type.toLowerCase());
                if (!groupedContent[typeKey]) groupedContent[typeKey] = [];
                groupedContent[typeKey].push(item);
            }
            // Group by categories
            item.categories?.forEach(cat => {
                const categoryKey = startCase(cat.toLowerCase());
                if (!groupedContent[categoryKey]) groupedContent[categoryKey] = [];
                groupedContent[categoryKey].push(item);
            });
        });
        
        // 5. Create carousels from groups that have enough items
        const dynamicCarousels: CarouselData[] = [];
        for (const title in groupedContent) {
             if (groupedContent[title].length >= MIN_ITEMS_FOR_CAROUSEL) {
                // Avoid duplicating carousels we've already manually created
                if (!generatedCarousels.some(c => c.title.toLowerCase() === title.toLowerCase())) {
                    dynamicCarousels.push({ title, items: groupedContent[title].slice(0, 10) });
                }
            }
        }

        // Combine manually created carousels with dynamically generated ones
        setCarousels([...generatedCarousels, ...dynamicCarousels]);

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
      {upcomingMovies.length > 0 && <UpcomingHeroBanner items={upcomingMovies} />}

      {/* Content Sections */}
      <div className="py-4 space-y-4">
        {carousels.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground px-4">
            <p>No content has been added yet.</p>
            <p className="mt-2">Use the admin panel to add movies, series, and dramas.</p>
          </div>
        ) : (
          carousels.map(carousel => (
            <ContentCarousel key={carousel.title} title={carousel.title} items={carousel.items} />
          ))
        )}
      </div>
    </div>
  );
}
