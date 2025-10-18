import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { ContentCarousel } from "@/components/content-carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { trending, newReleases, popularDramas } from "@/lib/data";

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-12 lg:p-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-white drop-shadow-xl">
              Galaxy Wanderers
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow-lg">
              In a universe of forgotten stars and cosmic mysteries, a renegade crew aboard the starship 'Serendipity' uncovers a secret that could either save humanity or shatter it into stardust.
            </p>
            <div className="mt-8 flex gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/watch/1">
                  <PlayCircle className="mr-2 h-6 w-6" />
                  Watch Now
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/50 hover:bg-white/20">
                <Link href="/watch/1">
                  More Info
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="py-12 px-4 md:px-6 lg:px-8 space-y-16">
        <ContentCarousel title="Trending Now" items={trending} />
        <ContentCarousel title="New Releases" items={newReleases} />
        <ContentCarousel title="Popular Dramas" items={popularDramas} />
      </div>
    </div>
  );
}
