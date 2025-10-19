
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // Check for YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    // Return an embeddable URL for iframe. `rel=0` prevents related videos from showing.
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
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

  // Check for Google Drive URL and create a preview link, which has a download button
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // This URL opens the preview page which is the most reliable way for users to download
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  // For YouTube or other URLs, we don't provide a direct download link.
  if (url.includes('youtube.com')) {
    return "";
  }

  // For other URLs, assume it's a direct link and return it as is
  return url;
}
