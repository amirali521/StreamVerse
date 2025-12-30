
'use server';
/**
 * @fileOverview An AI flow to find movies and TV shows from a natural language query.
 *
 * - findContent - A function that takes a text query and returns TMDB search results.
 * - FindContentInput - The input type for the findContent function.
 * - FindContentOutput - The return type for the findContent function.
 */

import { ai } from '@/ai/genkit';
import { searchTMDB } from '@/lib/tmdb';
import { z } from 'genkit';

const FindContentInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query for movies or TV shows. For example: "popular action movies from 2023" or "latest hindi dubbed series"'),
});
export type FindContentInput = z.infer<typeof FindContentInputSchema>;

const SearchResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  release_date: z.string(),
  poster_path: z.string().nullable(),
  media_type: z.enum(['movie', 'tv']),
});

const FindContentOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe('An array of search results from TMDB.'),
});
export type FindContentOutput = z.infer<typeof FindContentOutputSchema>;


export async function findContent(input: FindContentInput): Promise<FindContentOutput> {
  return findContentFlow(input);
}


// Define a tool for the AI to use to search TMDB
const searchTmdbTool = ai.defineTool(
  {
    name: 'searchTmdb',
    description: 'Search for movies or TV shows on The Movie Database (TMDB). Use "movie" for movies, and "tv" for web series or dramas.',
    input: {
      schema: z.object({
        query: z.string().describe('The search query. This should be as specific as possible, including years, genres, etc. if available.'),
        type: z.enum(['movie', 'tv', 'multi']).describe('The type of content to search for.'),
      }),
    },
    output: {
      schema: z.array(SearchResultSchema),
    },
  },
  async ({ query, type }) => {
    return await searchTMDB(query, type);
  }
);


const findContentFlow = ai.defineFlow(
  {
    name: 'findContentFlow',
    inputSchema: FindContentInputSchema,
    outputSchema: FindContentOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
      prompt: `You are an expert at parsing user requests to find movies and TV shows. Your goal is to translate the user's query into the best possible search query for the TMDB API.
      
      User Query: "${input.query}"
      
      - If the query mentions "movie", "film", or a specific movie title, use the 'movie' type.
      - If the query mentions "series", "drama", "show", or a tv show title, use the 'tv' type.
      - If it's ambiguous, use the 'multi' type.
      - Extract keywords, years, and genres to make the search query as accurate as possible.`,
      tools: [searchTmdbTool],
      model: 'googleai/gemini-2.5-flash',
    });

    const toolCalls = llmResponse.toolCalls();

    if (toolCalls.length > 0) {
      const searchResults = await toolCalls[0].result();
      return { results: searchResults };
    }
    
    // Fallback if the AI fails to use the tool
    const results = await searchTMDB(input.query, 'multi');
    return { results };
  }
);
