
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
  format: z.string().optional().describe('The desired format for download (e.g., mp4, mp3, webm). Requires FFMpeg on the server.')
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
      const isYoutube = /youtube\.com|youtu\.be/.test(input.sourceUrl);

      let videoUrl: string | undefined;

      // If it's a YouTube link and a specific format is requested, we need FFmpeg
      if (isYoutube && input.format) {
        // Set path to FFmpeg binary - this is crucial for format conversion to work in the backend environment.
        ytDlpWrap.setFfmpegPath('/usr/bin/ffmpeg');
        
        const stdout = await ytDlpWrap.execPromise([
          input.sourceUrl,
          '--format',
          // Select best video and best audio, then merge them.
          'bestvideo+bestaudio/best',
          // Use FFmpeg to merge and convert to the desired format.
          '--merge-output-format',
          input.format,
          // Get the direct URL of the final file
          '-g', 
        ]);
        videoUrl = stdout.split('\n')[0].trim();

      } else {
        // Original logic for all other URLs or if no format is specified
        const stdout = await ytDlpWrap.execPromise([
          input.sourceUrl,
          '-f',
          'best', // Select the best available format that doesn't require merging
          '-g',   // Get the direct URL
        ]);
        videoUrl = stdout.split('\n')[0].trim();
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('Could not extract a valid video URL.');
      }

      return {
        videoUrl: videoUrl,
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
