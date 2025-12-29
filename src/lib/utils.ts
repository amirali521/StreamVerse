
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(url: string, platform: 'doodstream' | 'mixdrop'): string {
  if (!url || typeof url !== 'string') {
    return "";
  }
  
  try {
    const urlObject = new URL(url);

    if (platform === 'doodstream' || urlObject.hostname.includes('dood') || urlObject.hostname.includes('myvidplay.com')) {
      const pathParts = urlObject.pathname.split('/');
      const videoId = pathParts.pop() || pathParts.pop(); // Handle trailing slash
      return `https://dood.yt/e/${videoId}`;
    }

    if (platform === 'mixdrop' || urlObject.hostname.includes('mixdrop')) {
      const pathParts = urlObject.pathname.split('/');
      const videoId = pathParts.pop() || pathParts.pop();
       if (pathParts[1] === 'e') {
         return url; // already an embed link
       }
      return `https://mixdrop.co/e/${videoId}`;
    }

  } catch(e) {
      console.error("Invalid URL provided to createEmbedUrl", e);
      return "";
  }


  // Fallback for any other URL
  return url;
}

export function createDownloadUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }

  // yt-dlp will be used for downloads, so we just return the original URL
  // for the server-side flow to process.
  return url;
}
