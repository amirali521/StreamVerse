
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
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

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <div className="w-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id}>
              <div className="w-full aspect-video md:aspect-[16/7] relative">
                <Image
                  src={item.bannerImageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
                  <div className="max-w-xl text-white">
                    <h2 className="text-3xl md:text-5xl font-bold font-headline leading-tight">
                      {item.title}
                    </h2>
                    <p className="mt-2 md:mt-4 text-sm md:text-base line-clamp-3">
                      {item.description}
                    </p>
                    <Button asChild className="mt-4 md:mt-6 bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                      <Link href={`/watch/${item.id}`}>
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Watch Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      </Carousel>
    </div>
  );
}
