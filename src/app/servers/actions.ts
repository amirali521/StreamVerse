
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
      Your task is to suggest a list of 5 popular and critically acclaimed movies and web series.
      Include a mix of genres and release years. Provide the title and the correct type ('movie' or 'tv').`,
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

export async function getEmbedUrls(tmdbId: number, type: 'movie' | 'tv', season: number = 1, episode: number = 1): Promise<EmbedSource[]> {
    return servers.map(server => {
        let url = type === 'movie' ? server.movieUrl : server.tvUrl;
        url = url.replace('{tmdbId}', tmdbId.toString())
                 .replace('{season}', season.toString())
                 .replace('{episode}', episode.toString());
        return { name: server.name, url };
    });
}
