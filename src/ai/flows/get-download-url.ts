
'use server';
/**
 * @fileOverview A flow to resolve video download URLs.
 *
 * - getDownloadUrl - A function that takes a video page URL and returns a direct download link.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
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
    const ytDlpWrap = new YTDlpWrap();
    const metadata = await ytDlpWrap.getVideoInfo(input.url);
    
    // Find the best quality direct video URL
    // We prefer formats that are a single file (not DASH video + audio separate)
    const bestFormat = metadata.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
      .sort((a, b) => (b.filesize || 0) - (a.filesize || 0))[0];

    if (!bestFormat || !bestFormat.url) {
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
