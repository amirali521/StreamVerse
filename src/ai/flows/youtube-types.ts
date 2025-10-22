
import { z } from 'genkit';

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

export const ListFormatsOutputSchema = z.object({
  formats: z.array(YouTubeFormatSchema).optional(),
  error: z.string().optional(),
});
export type ListFormatsOutput = z.infer<typeof ListFormatsOutputSchema>;

export const DownloadUrlOutputSchema = z.object({
  videoUrl: z.string().optional(),
  error: z.string().optional(),
});
export type DownloadUrlOutput = z.infer<typeof DownloadUrlOutputSchema>;
