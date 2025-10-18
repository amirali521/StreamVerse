
import type { Timestamp } from "firebase/firestore";

export interface Episode {
  episodeNumber: number;
  title: string;
  videoUrl: string;
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
  imdbRating?: number;
  googleDriveVideoUrl?: string;
  seasons?: Season[];
  categories?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
