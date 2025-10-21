
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, { type EmblaCarouselType } from "embla-carousel-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Content } from "@/lib/types";
import { Button } from "./ui/button";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );
  const [activeIndex, setActiveIndex] = React.useState(0);

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

  const activeItem = items[activeIndex];

  return (
    <div className="w-full relative aspect-video md:aspect-[16/7] overflow-hidden">
      {/* The Carousel now wraps everything */}
      <Carousel
        setApi={emblaApi}
        className="w-full h-full"
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id}>
              <Image
                src={item.bannerImageUrl}
                alt={item.title}
                fill
                className="object-cover"
                priority={items.indexOf(item) === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

        {/* Static Content Overlay */}
        {activeItem && (
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
            <div
              key={activeIndex} // This key is what triggers the fade animation on change
              className={cn("max-w-xl text-white animate-in fade-in duration-500")}
            >
              <h2 className="text-3xl md:text-5xl font-bold font-headline leading-tight">
                {activeItem.title}
              </h2>
              <p className="mt-2 md:mt-4 text-sm md:text-base line-clamp-3">
                {activeItem.description}
              </p>
              <Button asChild className="mt-4 md:mt-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                <Link href={`/watch/${activeItem.id}`}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Now
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Carousel Controls - Now inside the Carousel component */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block">
            <CarouselPrevious className="bg-background/50 hover:bg-background/80 border-0" />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
            <CarouselNext className="bg-background/50 hover:bg-background/80 border-0" />
        </div>

      </Carousel>
    </div>
  );
}
