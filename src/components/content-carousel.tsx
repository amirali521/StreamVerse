
import Image from "next/image";
import Link from "next/link";
import { type Content } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightCircle } from "lucide-react";
import {kebabCase} from "lodash";
import { AdWidget } from "./ad-widget";

interface ContentCarouselProps {
  title: string;
  items: Content[];
}

function ContentCard({ item }: { item: Content }) {
  return (
    <Link href={`/watch/${item.id}`} className="block group flex-shrink-0">
      <Card className="w-[150px] md:w-[180px] border-0 bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
            {item.bannerImageUrl ? (
              <Image
                src={item.bannerImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 150px, 180px"
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

function SeeMoreCard({ category }: { category: string }) {
  const categorySlug = kebabCase(category);
  return (
     <Link href={`/category/${categorySlug}`} className="block group h-full flex-shrink-0">
      <Card className="w-[150px] md:w-[180px] h-full border-0 bg-transparent shadow-none">
        <CardContent className="p-0 h-full">
          <div className="aspect-[2/3] flex flex-col items-center justify-center bg-card rounded-lg transition-colors duration-300 ease-in-out group-hover:bg-secondary">
              <ArrowRightCircle className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors"/>
              <span className="mt-4 font-semibold text-base group-hover:text-primary transition-colors">See More</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


export function ContentCarousel({ title, items }: ContentCarouselProps) {
  const itemsWithAd = [...items];
  // Insert an ad after the 3rd item if there are enough items
  if (items.length > 3) {
    itemsWithAd.splice(3, 0, 'ad' as any);
  }

  return (
    <section>
      <div className="px-4 md:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-headline font-semibold mb-6">{title}</h2>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4 pl-4 md:pl-6 lg:pl-8">
        {itemsWithAd.map((item, index) => {
          if (item === 'ad') {
            return <AdWidget key={`ad-${index}`} />;
          }
          return <ContentCard key={item.id} item={item} />;
        })}
        {items.length > 0 && <SeeMoreCard category={title} />}
        <div className="flex-shrink-0 w-1"></div> {/* Gutter */}
      </div>
    </section>
  );
}
