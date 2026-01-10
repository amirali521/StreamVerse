'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchContent } from '../admin/add-content/actions';

const ServerSuggestionSchema = z.object({
  title: z.string().describe("The title of the movie or web series."),
  type: z.enum(["movie", "tv"]).describe("The type of content, either 'movie' or 'tv' for a series."),
});

const ServerSuggestionsOutputSchema = z.object({
  suggestions: z.array(ServerSuggestionSchema).describe("A list of 5 diverse and popular movie and TV series suggestions."),
});
export type ServerSuggestionsOutput = z.infer<typeof ServerSuggestionsOutputSchema>;

const analyzeSearchQueryInputSchema = z.object({
  query: z.string().describe("The user's natural language search query."),
});

const analyzeSearchQueryOutputSchema = z.object({
    keywords: z.string().describe("The primary keywords or title from the user's query. This should be the most specific part of the search, like a movie title."),
    genre: z.string().optional().describe("The genre extracted from the query, if any (e.g., 'action', 'comedy', 'sci-fi')."),
    type: z.enum(["movie", "tv", "any"]).optional().describe("The type of content if specified (movie or tv series). Default to 'any' if not specified."),
});
export type AnalyzeSearchQueryOutput = z.infer<typeof analyzeSearchQueryOutputSchema>;


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

const analyzeSearchQueryFlow = ai.defineFlow(
    {
        name: 'analyzeSearchQueryFlow',
        inputSchema: analyzeSearchQueryInputSchema,
        outputSchema: analyzeSearchQueryOutputSchema,
    },
    async ({ query }) => {
        const { output } = await ai.generate({
            prompt: `Analyze the following user search query for a streaming service. Extract the main keywords (like a movie or series title), a single primary genre if mentioned, and the content type (movie or tv).

            Examples:
            - Query: "action movies with Tom Cruise" -> keywords: "Tom Cruise", genre: "action", type: "movie"
            - Query: "funny tv shows" -> keywords: "funny", genre: "comedy", type: "tv"
            - Query: "The Dark Knight" -> keywords: "The Dark Knight", genre: null, type: "any"
            - Query: "new sci-fi series" -> keywords: "sci-fi", genre: "tv"

            User Query: "${query}"`,
            output: { schema: analyzeSearchQueryOutputSchema },
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

export async function searchExternalContent(query: string, type: 'movie' | 'tv', useAiAnalysis: boolean = true) {
    if (useAiAnalysis) {
        const aiAnalysis = await analyzeSearchQueryFlow({ query });
        
        // Construct a more targeted query for TMDB
        const searchKeywords = [aiAnalysis.keywords, aiAnalysis.genre].filter(Boolean).join(" ");
        const searchType = aiAnalysis.type === 'any' ? type : aiAnalysis.type;

        return await searchContent(searchKeywords, searchType, false);
    } else {
        // Bypass AI for simple searches (like from category tabs)
        const searchType = type === 'tv' && query.toLowerCase().includes('series') ? 'tv' : 'movie';
        return await searchContent(query, searchType, false);
    }
}
