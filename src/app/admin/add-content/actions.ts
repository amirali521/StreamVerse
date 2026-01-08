
"use server";

import { searchTMDB, getTMDBDetails, getTMDBImages } from "@/lib/tmdb";
import { generateSocialPost } from "@/ai/flows/generate-social-post";
import type { SocialPostInput } from "@/ai/flows/generate-social-post";

export async function searchContent(query: string, type: 'movie' | 'webseries' | 'drama', isDubbedSearch: boolean) {
  const tmdbType = type === 'movie' ? 'movie' : 'tv';
  
  if (isDubbedSearch) {
    // Perform multiple searches to maximize chances of finding a dubbed version
    const dubbedQuery1 = `${query} (Hindi Dubbed)`;
    const dubbedQuery2 = `${query} (Hindi)`;
    
    const [results1, results2] = await Promise.all([
      searchTMDB(dubbedQuery1, tmdbType),
      searchTMDB(dubbedQuery2, tmdbType),
    ]);
    
    // Combine and deduplicate results
    const allResults = [...results1, ...results2];
    const uniqueResults = allResults.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
    );

    // If no dubbed results, search for the original as a fallback
    if (uniqueResults.length === 0) {
        return await searchTMDB(query, tmdbType);
    }
    
    return uniqueResults;
  }

  return await searchTMDB(query, tmdbType);
}

export async function getContentDetails(id: number, type: 'movie' | 'tv') {
  return await getTMDBDetails(id, type);
}

export async function getSocialImages(id: number, type: 'movie' | 'tv') {
    return await getTMDBImages(id, type);
}

export async function generatePostDetails(input: SocialPostInput) {
    return await generateSocialPost(input);
}
