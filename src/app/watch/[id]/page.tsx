import { notFound } from "next/navigation";
import Image from "next/image";
import { allContent } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { PlayCircle, PlusCircle, ThumbsUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ContentCarousel } from "@/components/content-carousel";
import { popularDramas } from "@/lib/data";

export default function WatchPage({ params }: { params: { id: string } }) {
  const item = allContent.find(c => c.id === params.id);

  if (!item) {
    notFound();
  }

  const image = PlaceHolderImages.find(p => p.id === item.imageId);

  return (
    <div className="flex flex-col">
      {/* Video Player Section */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="absolute inset-0">
          {image && (
            <Image
              src={image.imageUrl.replace('/400/600', '/1280/720')}
              alt={item.title}
              fill
              className="object-cover opacity-30"
              data-ai-hint={image.imageHint}
            />
          )}
        </div>
        <div className="z-10 text-center">
          <PlayCircle className="h-24 w-24 text-white/70 hover:text-white transition-colors cursor-pointer" />
          <p className="mt-4 text-white/80 text-lg">Playback not available</p>
        </div>
      </div>

      {/* Content Details */}
      <div className="container mx-auto py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">{item.title}</h1>
            <div className="flex items-center gap-4 mt-4 text-muted-foreground">
              <span>2024</span>
              <span>&#8226;</span>
              <span>2h 15m</span>
              <span>&#8226;</span>
              <span className="border px-2 py-0.5 rounded-sm text-sm">HD</span>
            </div>
            <p className="mt-6 text-lg text-foreground/80 leading-relaxed">
              {item.description} Dive into a world of intrigue and passion. A timeless tale of love, loss, and the pursuit of destiny against a backdrop of stunning landscapes and unforgettable characters.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlayCircle className="mr-2 h-6 w-6" /> Play
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <PlusCircle className="h-6 w-6" />
                <span className="sr-only">Add to My List</span>
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <ThumbsUp className="h-6 w-6" />
                <span className="sr-only">Like</span>
              </Button>
            </div>
          </div>
          <div className="text-sm text-foreground/70">
            <p><span className="font-semibold text-foreground/90">Cast:</span> Jane Doe, John Smith, Sam Wilson</p>
            <p className="mt-2"><span className="font-semibold text-foreground/90">Genres:</span> Drama, Romance, Historical</p>
            <p className="mt-2"><span className="font-semibold text-foreground/90">This movie is:</span> Emotional, Captivating</p>
          </div>
        </div>

        <Separator className="my-12 md:my-16" />

        {/* More Like This */}
        <ContentCarousel title="More Like This" items={popularDramas.filter(d => d.id !== item.id)} />
      </div>
    </div>
  );
}
