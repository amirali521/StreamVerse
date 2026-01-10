
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchTMDB } from '../admin/add-content/actions';

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
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    return await searchTMDB(query, tmdbType);
}

export async function getVidSrcUrl(tmdbId: number, type: 'movie' | 'tv'): Promise<string | null> {
    const mediaType = type === 'tv' ? 'show' : 'movie';
    try {
        const url = `https://vidsrc.to/embed/${mediaType}/${tmdbId}`;
        // We can't directly check if the URL is valid without a headless browser,
        // but we can check if the base URL resolves. This is a basic check.
        const response = await fetch(`https://vidsrc.to`, { method: 'HEAD' });
        if (response.ok) {
            return url;
        }
        return null;
    } catch (error) {
        console.error("Error generating VidSrc URL:", error);
        return null;
    }
}
