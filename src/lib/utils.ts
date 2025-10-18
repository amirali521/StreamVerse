import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return "";
  }
  // Regular expression to find the file ID in various Google Drive URL formats
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // Construct the direct access URL for embedding/playing
    return `https://drive.google.com/uc?id=${fileId}`;
  }
  // Return the original URL if it doesn't match the expected format
  return url;
}
