
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
    // `showinfo=0` is deprecated but good to have. `autoplay=1` is for UX.
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }

  // Check for Google Drive URL
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // Construct the direct access URL for video tag
    return `https://drive.google.com/uc?id=${fileId}`;
  }
  
  // Return the original URL if no match
  return url;
}
