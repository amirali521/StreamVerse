
"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const isYouTube = src.includes('youtube.com/embed');
  const isGoogleDrive = src.includes('drive.google.com/file');

  // Use iframe for both YouTube and Google Drive preview links
  if (isYouTube || isGoogleDrive) {
    return (
      <div className="w-full aspect-video bg-black">
        <iframe
          key={src} // Re-mounts the iframe when src changes
          src={src}
          title="Embedded video player"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }
  
  // Fallback to HTML5 video player for direct links
  return (
    <div className="w-full aspect-video bg-black">
      <video
        key={src} // Re-mounts the component when src changes
        controls
        autoPlay
        preload="auto"
        className="w-full h-full"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
