
import type { Timestamp } from "firebase/firestore";

export interface Content {
  id: string;
  title: string;
  description: string;
  type: "movie" | "webseries" | "drama";
  bannerImageUrl: string;
  posterImageUrl?: string;
  imdbRating?: number;
  categories?: string[];
  isFeatured?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tmdbId?: number;
  embedUrl?: string;
}
