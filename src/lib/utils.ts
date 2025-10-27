
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // New: Check for an iframe embed code first and extract the src
  const iframeSrcRegex = /<iframe[^>]+src="([^"]+)"/;
  const iframeMatch = url.match(iframeSrcRegex);
  if (iframeMatch) {
    // If we found an iframe, use its src for the rest of the logic
    url = iframeMatch[1];
  }

  // Check for Dailymotion URL
  const dailymotionRegex = /(?:https?:\/\/)?(?:www\.|geo\.)?dailymotion\.com\/(?:video|embed\/video|player\.html\?video=|partner\/[^/]+\/media\/video\/details\/)([a-zA-Z0-9]+)/;
  const dailymotionMatch = url.match(dailymotionRegex);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
  }
  
  // Check for Vimeo URL
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/[a-zA-Z0-9]+\/)?([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }

  // Check for Google Drive URL
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
  
  // For Dailymotion and Vimeo, downloads are handled by the server-side flow.
  if (url.includes('dailymotion.com') || url.includes('vimeo.com')) {
    return "";
  }

  // For other URLs, assume it's a direct link and return it as is
  return url;
}
