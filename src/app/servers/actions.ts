
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ServerSuggestionSchema = z.object({
  title: z.string().describe("The title of the movie or web series."),
  type: z.enum(["movie", "tv"]).describe("The type of content, either 'movie' or 'tv' for a series."),
});

const ServerSuggestionsOutputSchema = z.object({
  suggestions: z.array(ServerSuggestionSchema).describe("A list of 5 diverse and popular movie and TV series suggestions."),
});
export type ServerSuggestionsOutput = z.infer<typeof ServerSuggestionsOutputSchema>;

const generateServerSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateServerSuggestionsFlow',
    inputSchema: z.void(),
    outputSchema: ServerSuggestionsOutputSchema,
  },
  async () => {
    const { output } = await ai.generate({
      prompt: `You are a movie and TV show recommendation engine.
      Your task is to suggest a list of 5 popular and critically acclaimed movies and web series.
      Include a mix of genres and release years. Provide the title and the correct type ('movie' or 'tv').`,
      output: { schema: ServerSuggestionsOutputSchema },
    });
    return output!;
  }
);

export async function generateServerSuggestions(): Promise<ServerSuggestionsOutput> {
  return generateServerSuggestionsFlow();
}

export async function getVidSrcUrl(tmdbId: string, type: 'movie' | 'tv', season?: string, episode?: string): Promise<{ url: string } | null> {
    try {
        let url = "";
        if (type === 'tv') {
            // This API uses `s` for season and `e` for episode.
            url = `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
        } else {
            url = `https://vidsrc.to/embed/movie/${tmdbId}`;
        }

        // We don't fetch here, we just return the URL to be used in an iframe
        // The API at vidsrc.to handles the redirect to the actual video source.
        return { url };
    } catch (error) {
        console.error('Error constructing VidSrc URL:', error);
        return null;
    }
}
