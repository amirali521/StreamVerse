
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // Check for an iframe embed code first and extract the src
  const iframeSrcRegex = /<iframe[^>]+src="([^"]+)"/;
  const iframeMatch = url.match(iframeSrcRegex);
  if (iframeMatch) {
    // If we found an iframe, use its src for the rest of the logic
    url = iframeMatch[1];
  }

  // YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  // Google Drive URL
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    if (url.includes('/preview') || url.includes('/embed')) {
      return url;
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
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
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  // For YouTube downloads are handled by the server-side flow.
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return "";
  }

  // For other URLs, assume it's a direct link and return it as is
  return url;
}
