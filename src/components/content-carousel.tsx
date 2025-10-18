
import Image from "next/image";
import Link from "next/link";
import { type Content } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

interface ContentCarouselProps {
  title: string;
  items: Content[];
}

function ContentCard({ item }: { item: Content }) {
  return (
    <Link href={`/watch/${item.id}`} className="block group">
      <Card className="w-[200px] md:w-[240px] border-0 bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
            {item.bannerImageUrl ? (
              <Image
                src={item.bannerImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 200px, 240px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground text-xs text-center">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h3 className="mt-2 font-semibold text-base truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ContentCarousel({ title, items }: ContentCarouselProps) {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-headline font-semibold mb-6">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
        <div className="flex-shrink-0 w-1"></div> {/* Gutter */}
      </div>
    </section>
  );
}
