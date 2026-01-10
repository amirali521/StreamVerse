
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, { type EmblaCarouselType } from "embla-carousel-react";
import { Button } from "./ui/button";
import { PlayCircle, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Combined type for local and TMDB content
interface HeroItem {
  id: string | number;
  title: string;
  description: string;
  bannerImageUrl: string;
  posterImageUrl?: string;
  // For local content
  isFeatured?: boolean;
  // For upcoming content
  aiSummary?: string;
  trailerUrl?: string;
}

interface HeroBannerProps {
  items: HeroItem[];
}

function TrailerPlayer({ trailerUrl, title }: { trailerUrl: string; title: string }) {
  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={trailerUrl}
        title={`Trailer for ${title}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}


export function HeroBanner({ items }: HeroBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [openTrailer, setOpenTrailer] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: EmblaCarouselType) => {
      setActiveIndex(api.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect(emblaApi);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Close the trailer dialog when the slide changes
  React.useEffect(() => {
    setOpenTrailer(false);
  }, [activeIndex]);

  const activeItem = items[activeIndex];
  const isUpcoming = !!activeItem?.trailerUrl;
  const hasTrailer = !!activeItem?.trailerUrl;

  return (
    <Dialog open={openTrailer} onOpenChange={setOpenTrailer}>
      <div ref={emblaRef} className="w-full relative overflow-hidden bg-black">
        {/* Images Container */}
        <div className="w-full" style={{ aspectRatio: '32/21' }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out",
                index === activeIndex ? "opacity-100 z-10" : "opacity-0"
              )}
            >
              <Image
                src={item.posterImageUrl || item.bannerImageUrl}
                alt={item.title}
                fill
                className="object-cover object-top"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20" />

        {/* Static Content Overlay */}
        {activeItem && (
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 z-30">
            <div className="max-w-xl text-white">
              <div
                key={activeIndex} 
                className="animate-in fade-in duration-1000"
              >
                {isUpcoming && <p className="text-sm font-bold uppercase tracking-widest text-accent">Coming Soon</p>}
                <h2 className="mt-2 text-3xl md:text-5xl font-bold font-headline leading-tight">
                  {activeItem.title}
                </h2>
                <p className="mt-2 md:mt-4 text-sm md:text-base line-clamp-3">
                  {activeItem.aiSummary || activeItem.description}
                </p>
              </div>
              
              {isUpcoming && hasTrailer ? (
                 <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                    <Youtube className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </Button>
                </DialogTrigger>
              ) : (
                <Button asChild className="mt-4 md:mt-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                  <Link href={`/watch/${activeItem.id}`}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Now
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
       {hasTrailer && (
        <DialogContent className="max-w-4xl w-full p-0 border-0">
          <TrailerPlayer trailerUrl={activeItem.trailerUrl!} title={activeItem.title} />
        </DialogContent>
      )}
    </Dialog>
  );
}
