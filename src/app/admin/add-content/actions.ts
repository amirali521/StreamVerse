
"use server";

import { searchTMDB, getTMDBDetails } from "@/lib/tmdb";

export async function searchContent(query: string, type: 'movie' | 'webseries' | 'drama') {
  const tmdbType = type === 'movie' ? 'movie' : 'tv';
  return await searchTMDB(query, tmdbType);
}

export async function getContentDetails(id: number, type: 'movie' | 'tv') {
  return await getTMDBDetails(id, type);
}
