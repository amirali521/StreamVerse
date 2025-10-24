
"use client";

import { useAd } from "@/context/ad-provider";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { X } from "lucide-react";

function AdBanner({ showCloseButton, setShowCloseButton }: { showCloseButton: boolean, setShowCloseButton: (show: boolean) => void }) {
  useEffect(() => {
    // This is a workaround to execute the ad script logic when the component mounts.
    // The ad script relies on document.write, which is not ideal for React,
    // but this ensures it gets triggered.
    try {
      // @ts-ignore
      const atOptions = {
        'key' : '3ef6b43be86c164e70f43a3be65f84b8',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
      
      const container = document.getElementById('ad-container-3ef6b43be86c164e70f43a3be65f84b8');
      if (container) {
         const script = document.createElement('script');
         script.type = 'text/javascript';
         script.innerHTML = `
            atOptions = ${JSON.stringify(atOptions)};
         `;
         const invokeScript = document.createElement('script');
         invokeScript.type = 'text/javascript';
         invokeScript.src = '//consumeairlinercalligraphy.com/3ef6b43be86c164e70f43a3be65f84b8/invoke.js';
         
         container.innerHTML = '';
         container.appendChild(script);
         container.appendChild(invokeScript);
      }

    } catch (e) {
      console.error("Ad script error:", e);
    }
  }, []);

  return (
    <div className="relative w-[300px] h-[250px] bg-secondary">
      <div 
        id="ad-container-3ef6b43be86c164e70f43a3be65f84b8" 
        className={cn("transition-all", showCloseButton && "blur-sm")}
      />
      {showCloseButton && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full h-12 w-12 p-0 bg-background/80 hover:bg-background">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
         </div>
      )}
    </div>
  );
}


export function AdInterstitial() {
  const { isAdVisible, setAdVisible } = useAd();
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    const handleBlur = () => {
      if (isAdVisible) {
        setShowCloseButton(true);
      }
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [isAdVisible]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setShowCloseButton(false);
    }
    setAdVisible(open);
  };

  return (
    <Dialog open={isAdVisible} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[90%] md:max-w-lg flex items-center justify-center"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside click
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Advertisement</DialogTitle>
          <DialogDescription>
            This is an advertisement. Click to close.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-background p-4 rounded-md">
           <AdBanner showCloseButton={showCloseButton} setShowCloseButton={setShowCloseButton} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
