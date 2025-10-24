
"use client";

import { useAd } from "@/context/ad-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import Script from "next/script";
import { useEffect, useState } from "react";

function AdBanner() {
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

  return <div id="ad-container-3ef6b43be86c164e70f43a3be65f84b8" className="w-[300px] h-[250px] bg-secondary" />;
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
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Advertisement</DialogTitle>
          <DialogDescription>
            This is an advertisement.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-background p-4 rounded-md">
           <AdBanner />
        </div>
      </DialogContent>
    </Dialog>
  );
}
