
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from "@/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Content } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { startCase } from "lodash";

// A version of the Content type for client-side processing with JS Dates
type ClientContent = Omit<Content, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function ContentGridCard({ item }: { item: ClientContent }) {
  return (
    <Link href={`/watch/${item.id}`} className="block group">
      <Card className="w-full border-0 bg-transparent shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
            {item.bannerImageUrl ? (
              <Image
                src={item.bannerImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground text-xs text-center">No Image</span>
              </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h3 className="mt-2 font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
}


export default function CategoryPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;
  
  const [content, setContent] = useState<ClientContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!firestore || !slug) return;

    const fetchContent = async () => {
      setLoading(true);
      const contentCol = collection(firestore, 'content');
      const contentSnapshot = await getDocs(contentCol);
      
      const allContent: ClientContent[] = contentSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0),
          } as ClientContent;
        });

      let filteredContent: ClientContent[] = [];
      const categoryTitle = startCase(slug.replace(/-/g, ' '));
      setTitle(categoryTitle);

      switch (slug) {
        case 'trending-now':
          filteredContent = [...allContent].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
          break;
        case 'popular-dramas':
          filteredContent = allContent
            .filter(item => item.type === 'drama')
            .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
          break;
        default:
          // Handles general categories like Bollywood, Hollywood, etc.
          // This logic matches the slug (e.g., 'bollywood') to a category ('Bollywood') in a case-insensitive manner.
          const formattedSlug = slug.replace(/-/g, ' ').toLowerCase();
          filteredContent = allContent.filter(item => 
            item.categories?.some(cat => cat.toLowerCase() === formattedSlug)
          );
          break;
      }
      
      setContent(filteredContent);
      setLoading(false);
    };

    fetchContent();

  }, [firestore, slug]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading content...</div>;
  }
  
  if (!loading && content.length === 0) {
      return (
        <div className="container py-10 text-center">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-muted-foreground">No content found for this category.</p>
        </div>
      )
  }

  return (
    <div className="container py-10 px-4">
      <h1 className="text-4xl font-headline font-bold mb-8">{title}</h1>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {content.map(item => (
          <ContentGridCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
