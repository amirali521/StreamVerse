
import type { Timestamp } from "firebase/firestore";

export interface Episode {
  episodeNumber: number;
  title: string;
  embedUrl: string;
  downloadUrl: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: "movie" | "webseries" | "drama";
  bannerImageUrl: string;
  posterImageUrl?: string;
  imdbRating?: number;
  embedUrl?: string;
  downloadUrl?: string;
  seasons?: Season[];
  categories?: string[];
  isFeatured?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
