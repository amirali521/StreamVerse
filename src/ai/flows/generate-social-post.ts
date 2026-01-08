
'use server';
/**
 * @fileOverview A flow to generate a social media post for a movie.
 *
 * - generateSocialPost - A function that takes a movie title and description and returns a caption and hashtags.
 * - SocialPostInput - The input type for the generateSocialPost function.
 * - SocialPostOutput - The return type for the generateSocialPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { startCase, camelCase } from 'lodash';

const SocialPostInputSchema = z.object({
  title: z.string().describe('The title of the movie or series.'),
  description: z.string().describe('The official description or overview of the content.'),
  categories: z.array(z.string()).describe('A list of categories or genres for the content.'),
});
export type SocialPostInput = z.infer<typeof SocialPostInputSchema>;

const SocialPostOutputSchema = z.object({
  caption: z.string().describe('A short, engaging social media caption to promote the content. It should be exciting and encourage people to watch.'),
  hashtags: z.array(z.string()).describe('A list of 3 to 5 relevant hashtags, without the # symbol.'),
});
export type SocialPostOutput = z.infer<typeof SocialPostOutputSchema>;

export async function generateSocialPost(input: SocialPostInput): Promise<SocialPostOutput> {
    // First, try to generate with AI
    try {
        const result = await generateSocialPostFlow(input);
        // Ensure hashtags are formatted correctly
        result.hashtags = result.hashtags.map(tag => `#${camelCase(tag)}`);
        return result;
    } catch (error) {
        console.error("AI generation for social post failed, falling back to template.", error);
        
        // Fallback to a template-based approach if AI fails
        const caption = `Now streaming: "${input.title}"! Dive into the action. 🍿✨\n\n${input.description.substring(0, 150)}...`;
        const hashtags = [
            `#${camelCase(input.title)}`,
            '#NowStreaming',
            '#MustWatch',
            ...input.categories.slice(0, 2).map(cat => `#${startCase(cat).replace(/\s/g, '')}`)
        ];

        return {
            caption,
            hashtags,
        };
    }
}

const prompt = ai.definePrompt({
  name: 'generateSocialPostPrompt',
  input: { schema: SocialPostInputSchema },
  output: { schema: SocialPostOutputSchema },
  prompt: `You are a social media manager for a streaming service called StreamVerse. Your goal is to generate an exciting and engaging post to promote a new piece of content.

Based on the title, description, and categories, create:
1.  A short, punchy caption (2-3 sentences) that will make people want to watch. Use emojis.
2.  A list of 4-5 relevant hashtags to maximize reach. Do not include the '#' symbol in the output.

Content Title: {{{title}}}
Description: {{{description}}}
Categories: {{#each categories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate the social media post content.`,
});

const generateSocialPostFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFlow',
    inputSchema: SocialPostInputSchema,
    outputSchema: SocialPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
