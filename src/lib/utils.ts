
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the src URL from an iframe HTML snippet.
 * If the input is not an iframe snippet, it returns the original string.
 * @param iframeString The string that might be an iframe snippet.
 * @returns The extracted URL or the original string.
 */
export function getSrcFromIframe(iframeString: string): string {
  if (!iframeString || typeof iframeString !== 'string') {
    return "";
  }
  
  if (iframeString.trim().startsWith('<iframe')) {
    const match = iframeString.match(/src="([^"]+)"/);
    return match ? match[1] : "";
  }
  
  return iframeString;
}


export function createEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }
  
  if (url.includes('drive.google.com')) {
    const fileId = url.split('/d/')[1]?.split('/')[0];
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  }
  
  return url;
}

export function createDownloadUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }
  
  if (url.includes('drive.google.com')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
  }
  
  return url;
}
