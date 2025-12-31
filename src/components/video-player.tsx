
"use client";

import { useEffect, useState, useRef } from 'react';
import { createEmbedUrl } from '@/lib/utils';
import { Loader2, ServerCrash } from 'lucide-react';
import { Button } from './ui/button';

export interface VideoSource {
    name: string;
    url: string;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  poster?: string;
}

function IframeRenderer({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        }
    }, [html]);

    // This is a simple container iframe. The actual player iframe will be written inside it.
    return <iframe ref={iframeRef} title="Embedded video player" className="w-full h-full" frameBorder="0" allowFullScreen />;
}


export function VideoPlayer({ sources, poster }: VideoPlayerProps) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const currentSource = sources[currentSourceIndex];
  const isIframeSnippet = currentSource?.url.trim().startsWith('<iframe');

  useEffect(() => {
    // Reset state when sources array changes or a new source is selected
    setIsLoading(true);
    setError(false);
  }, [currentSource]);


  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    // A source failed to load, just show an error for this source.
    setError(true);
    setIsLoading(false);
  };
  
  const handleSourceChange = (index: number) => {
    if (index !== currentSourceIndex) {
        setCurrentSourceIndex(index);
    }
  }

  return (
    <div className="w-full space-y-4">
        <div className="w-full aspect-video bg-black relative rounded-lg overflow-hidden border border-muted/20">
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">
                        Loading: {currentSource?.name || 'player'}...
                    </p>
                </div>
            )}

             {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 text-center p-4">
                    <ServerCrash className="h-10 w-10 text-destructive" />
                    <p className="mt-4 font-semibold text-destructive">Could not load video from {currentSource.name}.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Please try a different server.</p>
                </div>
            )}
            
            {currentSource && (
              isIframeSnippet ? (
                 <div
                    className={`w-full h-full transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                    dangerouslySetInnerHTML={{ __html: currentSource.url }}
                    onLoad={handleLoad} // This might not fire consistently for nested iframes
                 ></div>
              ) : (
                <iframe
                    key={currentSource.url} // This is crucial to force re-render the iframe when the source changes
                    ref={iframeRef}
                    src={createEmbedUrl(currentSource.url)}
                    title="Embedded video player"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className={`w-full h-full transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                ></iframe>
              )
            )}
        </div>
        
        {sources.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Servers</h3>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, index) => (
                        <Button
                            key={source.name}
                            variant={index === currentSourceIndex ? "secondary" : "outline"}
                            onClick={() => handleSourceChange(index)}
                        >
                            {source.name}
                        </Button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}
