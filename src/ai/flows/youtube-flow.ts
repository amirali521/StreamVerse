
'use server';
/**
 * @fileOverview Flows for interacting with YouTube videos.
 *
 * - listYouTubeFormats - A function that lists available formats for a YouTube URL.
 * - getYouTubeDownloadUrl - A function that gets a downloadable URL for a specific format.
 */

import { ai } from '@/ai/genkit';
import YTDlpWrap from 'yt-dlp-wrap';
import { z } from 'genkit';

// Input for both flows
const YouTubeUrlInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the YouTube video.'),
});

// Output for listYouTubeFormats
export const YouTubeFormatSchema = z.object({
    format_id: z.string(),
    ext: z.string(),
    format_note: z.string().optional(),
    resolution: z.string().optional(),
    filesize_approx: z.number().optional(),
    filesize_approx_str: z.string().optional(),
    vcodec: z.string(),
    acodec: z.string(),
});
export type YouTubeFormat = z.infer<typeof YouTubeFormatSchema>;

const ListFormatsOutputSchema = z.object({
  formats: z.array(YouTubeFormatSchema).optional(),
  error: z.string().optional(),
});
export type ListFormatsOutput = z.infer<typeof ListFormatsOutputSchema>;

// Input for getYouTubeDownloadUrl
const DownloadUrlInputSchema = YouTubeUrlInputSchema.extend({
    formatId: z.string().describe('The format ID to get the download URL for.'),
});

// Output for getYouTubeDownloadUrl
const DownloadUrlOutputSchema = z.object({
  videoUrl: z.string().optional(),
  error: z.string().optional(),
});
export type DownloadUrlOutput = z.infer<typeof DownloadUrlOutputSchema>;


// Client-callable wrapper for listing formats
export async function listYouTubeFormats(input: z.infer<typeof YouTubeUrlInputSchema>): Promise<ListFormatsOutput> {
  return listFormatsFlow(input);
}

// Client-callable wrapper for getting download URL
export async function getYouTubeDownloadUrl(input: z.infer<typeof DownloadUrlInputSchema>): Promise<DownloadUrlOutput> {
  return getDownloadUrlFlow(input);
}


// Genkit Flow to list formats
const listFormatsFlow = ai.defineFlow(
  {
    name: 'listYouTubeFormatsFlow',
    inputSchema: YouTubeUrlInputSchema,
    outputSchema: ListFormatsOutputSchema,
  },
  async (input) => {
    try {
      const ytDlpWrap = new YTDlpWrap();
      
      const metadata = await ytDlpWrap.getVideoInfo(input.sourceUrl);
      const formats = metadata.formats
        .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4') // Filter for MP4s with both video and audio
        .map(f => ({
            ...f,
            format_note: f.format_note || f.resolution,
            filesize_approx_str: f.filesize_approx ? (f.filesize_approx / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'
        }))
        .sort((a, b) => (a.height || 0) - (b.height || 0)); // Sort by resolution

      return { formats };

    } catch (error: any) {
      console.error("yt-dlp error (list formats):", error);
      const errorMessage = error.message?.split('ERROR:')[1]?.trim() || 'An unknown extraction error occurred.';
      return {
        error: errorMessage,
      };
    }
  }
);


// Genkit Flow to get download URL for a specific format
const getDownloadUrlFlow = ai.defineFlow(
  {
    name: 'getYouTubeDownloadUrlFlow',
    inputSchema: DownloadUrlInputSchema,
    outputSchema: DownloadUrlOutputSchema,
  },
  async (input) => {
    try {
      const ytDlpWrap = new YTDlpWrap();
      
      const stdout = await ytDlpWrap.execPromise([
        input.sourceUrl,
        '-f',
        input.formatId, // Get URL for the specified format ID
        '-g',           // Get the direct URL.
      ]);
      
      const videoUrl = stdout.split('\n')[0].trim();

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('Could not extract a valid video URL for the selected format.');
      }

      return { videoUrl };

    } catch (error: any) {
      console.error("yt-dlp error (get download url):", error);
      const errorMessage = error.message?.split('ERROR:')[1]?.trim() || 'An unknown extraction error occurred.';
      return {
        error: errorMessage,
      };
    }
  }
);
