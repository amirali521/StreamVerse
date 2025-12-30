
"use client";

import { useEffect, useState, useRef } from 'react';
import { createEmbedUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  sources: string[];
  poster?: string;
}

export function VideoPlayer({ sources, poster }: VideoPlayerProps) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const currentSource = sources[currentSourceIndex];

  useEffect(() => {
    // Reset state when sources array changes
    setCurrentSourceIndex(0);
    setIsLoading(true);
    setError(false);
  }, [sources]);

  useEffect(() => {
    if (!currentSource) {
      setError(true);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      // If the iframe is still loading after 8 seconds, assume it's a dead link and try the next source.
      // The 'load' event might not fire reliably for cross-origin iframes that are blocked.
      if (isLoading) {
        handleError();
      }
    }, 8000); // 8-second timeout

    return () => clearTimeout(timer);
  }, [currentSource, isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    if (currentSourceIndex < sources.length - 1) {
      // Move to the next source
      setCurrentSourceIndex(prevIndex => prevIndex + 1);
      setIsLoading(true); // Reset loading state for the new source
    } else {
      // No more sources to try
      setError(true);
      setIsLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="aspect-video bg-black flex flex-col items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg text-center">
        <p className="text-destructive font-semibold">Could not load video.</p>
        <p className="text-muted-foreground mt-2 text-sm">All available sources failed.</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black relative">
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">
                    Loading player...
                    {sources.length > 1 && ` (trying source ${currentSourceIndex + 1} of ${sources.length})`}
                </p>
            </div>
        )}
        <iframe
            key={currentSource} // This is crucial to force re-render the iframe when the source changes
            ref={iframeRef}
            src={createEmbedUrl(currentSource)}
            title="Embedded video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
        ></iframe>
    </div>
  );
}
