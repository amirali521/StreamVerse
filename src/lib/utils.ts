
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // Check for Dailymotion URL
  const dailymotionRegex = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/;
  const dailymotionMatch = url.match(dailymotionRegex);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
  }

  // Check for Google Drive URL and create a preview/embed link
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // Construct the embeddable preview URL for iframe
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  // Return the original URL if it's a direct video link but not a recognized service
  return url;
}

export function createDownloadUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // Check for Google Drive URL and create a direct download link
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // This URL attempts to force a direct download.
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // For Dailymotion, we don't provide a direct download link from the client.
  // This should be handled by a server-side process (like yt-dlp).
  if (url.includes('dailymotion.com')) {
    return "";
  }

  // For other URLs, assume it's a direct link and return it as is
  return url;
}
