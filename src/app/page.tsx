
import { ContentCarousel } from "@/components/content-carousel";
import { initializeFirebase } from "@/firebase/server";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import type { Content } from "@/lib/types";

async function getHomePageContent() {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return { trending: [], newReleases: [], popularDramas: [] };
  }
  
  const contentCol = collection(firestore, 'content');

  // Trending: Highest rated
  const trendingQuery = query(contentCol, orderBy('imdbRating', 'desc'), limit(10));
  const trendingSnapshot = await getDocs(trendingQuery);
  const trending = trendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));

  // New Releases: Most recently created
  const newReleasesQuery = query(contentCol, orderBy('createdAt', 'desc'), limit(10));
  const newReleasesSnapshot = await getDocs(newReleasesQuery);
  const newReleases = newReleasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));

  // Popular Dramas: type === 'drama', highest rated
  const popularDramasQuery = query(contentCol, orderBy('imdbRating', 'desc'), limit(10));
  const popularDramasSnapshot = await getDocs(popularDramasQuery);
  // We filter client-side because Firestore doesn't support inequality filters on one field and ordering on another
  const popularDramas = popularDramasSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Content))
    .filter(item => item.type === 'drama');

  return { trending, newReleases, popularDramas };
}


export default async function Home() {
  const { trending, newReleases, popularDramas } = await getHomePageContent();

  return (
    <div className="flex flex-col">
      {/* Hero Section can remain static or be updated to feature a specific item */}
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
        {trending.length > 0 && <ContentCarousel title="Trending Now" items={trending} />}
        {newReleases.length > 0 && <ContentCarousel title="New Releases" items={newReleases} />}
        {popularDramas.length > 0 && <ContentCarousel title="Popular Dramas" items={popularDramas} />}
        {trending.length === 0 && newReleases.length === 0 && popularDramas.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p>No content has been added yet.</p>
            <p className="mt-2">Use the admin panel to add movies, series, and dramas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
