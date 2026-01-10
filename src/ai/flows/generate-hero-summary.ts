
'use server';
/**
 * @fileOverview A flow to generate a cinematic summary for a movie hero banner.
 *
 * This file is currently not in use as the hero banner now displays manually featured content.
 * It is kept for potential future use.
 *
 * - generateHeroSummary - A function that takes a movie title and description and returns a short, engaging summary.
 * - HeroSummaryInput - The input type for the generateHeroSummary function.
 * - HeroSummaryOutput - The return type for the generateHeroSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HeroSummaryInputSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  description: z.string().describe('The official description or overview of the movie.'),
});
export type HeroSummaryInput = z.infer<typeof HeroSummaryInputSchema>;

const HeroSummaryOutputSchema = z.object({
  cinematicDescription: z.string().describe('A short, exciting, and cinematic summary of the movie, suitable for a hero banner. It should be one or two sentences long and entice the user to watch.'),
});
export type HeroSummaryOutput = z.infer<typeof HeroSummaryOutputSchema>;

export async function generateHeroSummary(input: HeroSummaryInput): Promise<HeroSummaryOutput> {
  try {
    const result = await generateHeroSummaryFlow(input);
    return result;
  } catch (error) {
    console.error("AI summary generation failed, using original description.", error);
    // Fallback to a shortened version of the original description
    return {
      cinematicDescription: input.description.length > 150 
        ? input.description.substring(0, 147) + "..." 
        : input.description,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'generateHeroSummaryPrompt',
  input: { schema: HeroSummaryInputSchema },
  output: { schema: HeroSummaryOutputSchema },
  prompt: `You are a professional movie trailer editor and copywriter. Your task is to take the provided movie title and description and write a new, short, and punchy summary that would be perfect for a hero banner on a streaming website.

The summary should be cinematic, exciting, and make the user want to watch the movie immediately. Keep it to one or two sentences at most. Focus on action, mystery, or emotion.

Movie Title: {{{title}}}
Original Description: {{{description}}}

Generate the cinematic summary.`,
});

const generateHeroSummaryFlow = ai.defineFlow(
  {
    name: 'generateHeroSummaryFlow',
    inputSchema: HeroSummaryInputSchema,
    outputSchema: HeroSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
