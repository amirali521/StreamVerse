
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { getSrcFromIframe } from '@/lib/utils';
import { Loader2, ServerCrash } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


export interface VideoSource {
    name: string;
    url: string;
}

interface VideoPlayerProps {
  source: VideoSource | null;
  poster?: string;
}

export function VideoPlayer({ source, poster }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const videoUrl = useMemo(() => {
    if (!source) return "";
    return getSrcFromIframe(source.url);
  }, [source]);

  useEffect(() => {
    // Reset state when sources array changes or a new source is selected
    setIsLoading(true);
    setError(false);
  }, [source]);


  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    // A source failed to load, just show an error for this source.
    setError(true);
    setIsLoading(false);
  };
  
  return (
    <div className="w-full space-y-4">
        <div className="video-player-container w-full aspect-video bg-black relative rounded-lg overflow-hidden border border-muted/20">
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">
                        Loading: {source?.name || 'player'}...
                    </p>
                </div>
            )}

             {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 text-center p-4">
                    <ServerCrash className="h-10 w-10 text-destructive" />
                    <p className="mt-4 font-semibold text-destructive">Could not load video from {source?.name}.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Please try a different server.</p>
                </div>
            )}
            
            {source && videoUrl && (
                <iframe
                    key={videoUrl} // This is crucial to force re-render the iframe when the source changes
                    ref={iframeRef}
                    src={videoUrl}
                    title="Embedded video player"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                    onLoad={handleLoad}
                    onError={handleError}
                ></iframe>
            )}
        </div>
    </div>
  );
}
