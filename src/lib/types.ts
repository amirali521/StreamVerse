
import type { Timestamp } from "firebase/firestore";

export interface Episode {
  episodeNumber: number;
  title: string;
  streamUrl: string;
  streamPlatform: 'doodstream' | 'mixdrop';
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
  streamUrl?: string;
  streamPlatform?: 'doodstream' | 'mixdrop';
  seasons?: Season[];
  categories?: string[];
  isFeatured?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
