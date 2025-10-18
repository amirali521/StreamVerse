
"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const isYouTube = src.includes('youtube.com/embed');

  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      videoRef.current.load();
    }
  }, [src, isYouTube]);

  if (isYouTube) {
    return (
      <div className="w-full aspect-video bg-black">
        <iframe
          key={src} // Re-mounts the component when src changes
          src={src}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black">
      <video
        key={src} // Re-mounts the component when src changes
        ref={videoRef}
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
