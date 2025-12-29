
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createEmbedUrl(urlOrIframe: string): string {
  if (!urlOrIframe || typeof urlOrIframe !== 'string') {
    return "";
  }
  
  let url = urlOrIframe;

  // Check if the input is an iframe tag
  if (url.trim().startsWith('<iframe')) {
    const srcMatch = url.match(/src="([^"]*)"/);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    } else {
      // If no src is found, return empty to avoid a broken player
      return "";
    }
  }

  // Handle protocol-relative URLs (e.g., //mxdrop.to/...)
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }
  
  try {
    const urlObject = new URL(url);
    const hostname = urlObject.hostname;
    const path = urlObject.pathname;

    if (hostname.includes('dood')) {
      // It's a DoodStream link. Convert '/d/' to '/e/'
      if (path.startsWith('/d/')) {
        return `https://${hostname}/e/${path.substring(3)}`;
      }
    }

    if (hostname.includes('mixdrop')) {
      // It's a Mixdrop link. Convert '/f/' to '/e/'
       if (path.startsWith('/f/')) {
        return `https://${hostname}/e/${path.substring(3)}`;
      }
    }
    
    // For other links (like direct mp4, or ones that are already embed links), return as is.
    return url;
    
  } catch (error) {
    console.error("Invalid URL for createEmbedUrl:", error);
    // If URL is invalid, return it as is and let the iframe handle it.
    return url;
  }
}

export function createDownloadUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }
  
  // This function now just returns the URL as-is, assuming it's already a download link.
  return url;
}
