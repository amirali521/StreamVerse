
import type { Timestamp } from "firebase/firestore";

export interface PlayerSettings {
  primaryColor?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  hotkeys?: boolean;
  volume?: number;
}

export interface Episode {
  episodeNumber: number;
  title?: string;
  embedUrl: string;
  playerSettings?: PlayerSettings;
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
  categories?: string[];
  isFeatured?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tmdbId?: number;
  downloadUrl?: string; // Universal download link
  embedUrl?: string; // For movies only
  playerSettings?: PlayerSettings; // For movie embedUrl
  seasons?: Season[]; // For series/dramas
}

    