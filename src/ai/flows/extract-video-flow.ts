
'use server';
/**
 * @fileOverview A flow for extracting video URLs from webpages.
 *
 * - extractVideo - A function that takes a webpage URL and returns a direct video URL.
 * - ExtractVideoInput - The input type for the extractVideo function.
 * - ExtractVideoOutput - The return type for the extractVideo function.
 */

import { ai } from '@/ai/genkit';
import YTDlpWrap from 'yt-dlp-wrap';
import { z } from 'genkit';

const ExtractVideoInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the webpage containing the video.'),
});
export type ExtractVideoInput = z.infer<typeof ExtractVideoInputSchema>;

const ExtractVideoOutputSchema = z.object({
  videoUrl: z.string().optional().describe('The direct, playable URL of the extracted video.'),
  error: z.string().optional().describe('An error message if the extraction failed.'),
});
export type ExtractVideoOutput = z.infer<typeof ExtractVideoOutputSchema>;

// This wrapper function is what the client-side code will call.
export async function extractVideo(input: ExtractVideoInput): Promise<ExtractVideoOutput> {
  return extractVideoFlow(input);
}

const extractVideoFlow = ai.defineFlow(
  {
    name: 'extractVideoFlow',
    inputSchema: ExtractVideoInputSchema,
    outputSchema: ExtractVideoOutputSchema,
  },
  async (input) => {
    try {
      const ytDlpWrap = new YTDlpWrap();
      
      // We use the '-g' flag to get the direct URL
      // We use '-f best' to select the best available quality format
      const videoUrl = await ytDlpWrap.execPromise([
        input.sourceUrl,
        '-f',
        'best',
        '-g',
      ]);

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('Could not extract a valid video URL.');
      }

      // The output might contain multiple URLs, we usually want the first one.
      const firstUrl = videoUrl.split('\n')[0].trim();

      return {
        videoUrl: firstUrl,
      };
    } catch (error: any) {
      console.error("yt-dlp error:", error);
      // Clean up the yt-dlp error message to be more user-friendly
      const errorMessage = error.message?.split('ERROR:')[1]?.trim() || 'An unknown extraction error occurred.';
      return {
        error: errorMessage,
      };
    }
  }
);
