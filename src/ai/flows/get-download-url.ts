
'use server';
/**
 * @fileOverview A flow to resolve video download URLs.
 *
 * - getDownloadUrl - A function that takes a video page URL and returns a direct download link.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import YTDlpWrap from 'yt-dlp-wrap';

const DownloadUrlInputSchema = z.object({
  url: z.string().url(),
});
export type DownloadUrlInput = z.infer<typeof DownloadUrlInputSchema>;

const DownloadUrlOutputSchema = z.object({
  downloadUrl: z.string().url(),
});
export type DownloadUrlOutput = z.infer<typeof DownloadUrlOutputSchema>;


const getDownloadUrlFlow = ai.defineFlow(
  {
    name: 'getDownloadUrlFlow',
    inputSchema: DownloadUrlInputSchema,
    outputSchema: DownloadUrlOutputSchema,
  },
  async (input) => {
    // Specify a writable path for the yt-dlp binary
    const ytDlpPath = '/tmp/yt-dlp';
    
    // Download the yt-dlp binary if it doesn't exist
    await YTDlpWrap.downloadFromGithub(ytDlpPath);
    const ytDlpWrap = new YTDlpWrap(ytDlpPath);
    
    const metadata = await ytDlpWrap.getVideoInfo(input.url);
    
    // Find the best quality direct video URL
    // We prefer formats that are a single file (not DASH video + audio separate) and have a URL
    const bestFormat = metadata.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
      .sort((a, b) => (b.filesize || b.height || 0) - (a.filesize || a.height || 0))[0];

    if (!bestFormat || !bestFormat.url) {
      // If no single file format, try to find best video and audio and let the client handle it if possible
      // This is a more advanced case, for now we throw an error.
      // A future improvement could be to return separate video and audio URLs.
      const videoOnly = metadata.formats.filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.url).sort((a, b) => (b.height || 0) - (a.height || 0))[0];
      if (videoOnly && videoOnly.url) {
          return { downloadUrl: videoOnly.url };
      }
      throw new Error('Could not find a downloadable format for the given URL.');
    }
    
    return {
      downloadUrl: bestFormat.url,
    };
  }
);

export async function getDownloadUrl(input: DownloadUrlInput): Promise<DownloadUrlOutput> {
  return getDownloadUrlFlow(input);
}
