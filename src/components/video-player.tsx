
"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  // This logic is simplified. It assumes any URL with a common video file extension
  // is a direct link. Everything else is treated as an embeddable URL for an iframe.
  const isDirectVideoLink = /\.(mp4|webm|ogg)$/i.test(src);

  if (isDirectVideoLink) {
    // Use HTML5 video player for direct links
    return (
      <div className="w-full aspect-video bg-black">
        <video
          key={src} // Re-mounts the component when src changes
          controls
          autoPlay
          preload="auto"
          poster={poster}
          className="w-full h-full"
        >
          <source src={src} type={`video/${src.split('.').pop()}`} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Use iframe for everything else (Doodstream, Mixdrop, YouTube, etc.)
  return (
    <div className="w-full aspect-video bg-black">
      <iframe
        key={src} // Re-mounts the iframe when src changes
        src={src}
        title="Embedded video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}
