
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchContent } from '../admin/add-content/actions';

export interface EmbedSource {
    name: string;
    url: string;
}

const servers: { name: string, movieUrl: string, tvUrl: string }[] = [
    {
        name: "VidSrc.to",
        movieUrl: "https://vidsrc.to/embed/movie/{tmdbId}",
        tvUrl: "https://vidsrc.to/embed/tv/{tmdbId}/{season}-{episode}"
    },
    {
        name: "VidSrc.pro",
        movieUrl: "https://vidsrc.pro/embed/movie/{tmdbId}",
        tvUrl: "https://vidsrc.pro/embed/tv/{tmdbId}/{season}-{episode}"
    },
    {
        name: "SuperEmbed",
        movieUrl: "https://multiembed.mov/directstream.php?video_id={tmdbId}&tmdb=1",
        tvUrl: "https://multiembed.mov/directstream.php?video_id={tmdbId}&tmdb=1&s={season}&e={episode}"
    },
    {
        name: "2Embed",
        movieUrl: "https://www.2embed.cc/embed/tmdb/movie?id={tmdbId}",
        tvUrl: "https://www.2embed.cc/embed/tmdb/tv?id={tmdbId}&s={season}&e={episode}"
    },
    {
        name: "Blackvid",
        movieUrl: "https://blackvid.space/embed?tmdb={tmdbId}",
        tvUrl: "https://blackvid.space/embed?tmdb={tmdbId}&s={season}&e={episode}"
    },
    {
        name: "Movie-web",
        movieUrl: "https://movie-web.app/media/tmdb-movie-{tmdbId}",
        tvUrl: "https://movie-web.app/media/tmdb-tv-{tmdbId}-{season}-{episode}"
    },
    {
        name: "Player-api",
        movieUrl: "https://player-api.com/embed/movie/{tmdbId}",
        tvUrl: "https://player-api.com/embed/tv/{tmdbId}/{season}/{episode}"
    }
];

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const ServerSuggestionSchema = z.object({
  title: z.string().describe("The title of the movie or web series."),
  type: z.enum(['movie', 'tv']).describe("The type of content, either 'movie' or 'tv' for a web series."),
});

const ServerSuggestionsOutputSchema = z.object({
  suggestions: z.array(ServerSuggestionSchema),
});

const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateServerSuggestionsFlow',
    outputSchema: ServerSuggestionsOutputSchema,
  },
  async () => {
    const { output } = await ai.generate({
      prompt: `You are a movie and TV show recommendation engine.
      Your task is to suggest a list of 12 popular and critically acclaimed movies and web series.
      Include a mix of genres and release years. Provide the title and the correct type ('movie' or 'tv').`,
      output: { schema: ServerSuggestionsOutputSchema },
    });
    return output!;
  }
);

export async function generateServerSuggestions() {
  try {
    const result = await generateSuggestionsFlow();
    return result.suggestions;
  } catch (error) {
    console.error("AI suggestion generation failed, falling back to a static list.", error);
    // Fallback to a static list if AI fails
    return [
      { title: "Inception", type: "movie" },
      { title: "Breaking Bad", type: "tv" },
      { title: "The Dark Knight", type: "movie" },
      { title: "Stranger Things", type: "tv" },
      { title: "Parasite", type: "movie" },
      { title: "The Office", type: "tv" },
      { title: "Pulp Fiction", type: "movie" },
      { title: "Game of Thrones", type: "tv" },
      { title: "Forrest Gump", type: "movie" },
      { title: "Friends", type: "tv" },
      { title: "The Matrix", type: "movie" },
      { title: "The Simpsons", type: "tv" },
    ];
  }
}

interface SearchInput {
    query: string;
    type: 'movie' | 'tv';
    isAISuggestion?: boolean;
}

export async function searchExternalContent({ query, type }: SearchInput) {
    const tmdbType = type === 'tv' ? 'webseries' : 'movie';
    return await searchContent(query, tmdbType, false);
}

export async function getExternalContentDetails(id: number, type: 'movie' | 'tv') {
  if (!TMDB_API_KEY) return null;
  const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching external content details:", error);
    return null;
  }
}

export async function getRelatedExternalContent(id: number, type: 'movie' | 'tv') {
    if (!TMDB_API_KEY) return [];

    let url;
    if (type === 'movie') {
        // First try to get the movie's collection (for franchises)
        const movieDetailsUrl = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`;
        const movieDetailsRes = await fetch(movieDetailsUrl);
        if (movieDetailsRes.ok) {
            const movieDetails = await movieDetailsRes.json();
            if (movieDetails.belongs_to_collection) {
                url = `${TMDB_BASE_URL}/collection/${movieDetails.belongs_to_collection.id}?api_key=${TMDB_API_KEY}`;
                const collectionRes = await fetch(url);
                if (collectionRes.ok) {
                    const collectionData = await collectionRes.json();
                    return (collectionData.parts || [])
                        .filter((item: any) => item.id !== id) // Exclude the movie itself
                        .map((item: any) => ({
                            id: item.id,
                            title: item.title || item.name,
                            poster_path: item.poster_path,
                            release_date: item.release_date || item.first_air_date,
                            media_type: 'movie',
                        }));
                }
            }
        }
    }
    
    // Fallback to recommendations if no collection or if it's a TV show
    url = `${TMDB_BASE_URL}/${type}/${id}/recommendations?api_key=${TMDB_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.results || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            release_date: item.release_date || item.first_air_date,
            media_type: item.media_type,
        }));
    } catch (error) {
        console.error("Error fetching related content:", error);
        return [];
    }
}


export async function getEmbedUrls(tmdbId: number, type: 'movie' | 'tv'): Promise<EmbedSource[]> {
    return servers.map(server => {
        let url = type === 'movie' ? server.movieUrl : server.tvUrl;
        url = url.replace('{tmdbId}', tmdbId.toString());
        return { name: server.name, url };
    });
}


export async function getSocialImages(id: number, type: 'movie' | 'tv'): Promise<{ posters: any[], backdrops: any[], logos: any[] }> {
    if (!TMDB_API_KEY) return { posters: [], backdrops: [], logos: [] };

    const url = `${TMDB_BASE_URL}/${type}/${id}/images?api_key=${TMDB_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            posters: data.posters || [],
            backdrops: data.backdrops || [],
            logos: data.logos || []
        };
    } catch (error) {
        console.error("Error getting TMDB images:", error);
        return { posters: [], backdrops: [], logos: [] };
    }
}
