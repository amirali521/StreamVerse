
"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // This effect ensures the video element is re-keyed and reloaded when the src changes
    // which is important for switching episodes.
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

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

    