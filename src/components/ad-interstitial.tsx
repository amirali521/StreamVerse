
"use client";

import { useAd } from "@/context/ad-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function AdInterstitial() {
  const { isAdVisible, setAdVisible } = useAd();

  // The Dialog's onOpenChange will automatically handle closing
  // when the user navigates away after clicking the ad.
  return (
    <Dialog open={isAdVisible} onOpenChange={setAdVisible}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[90%] md:max-w-lg flex items-center justify-center">
        <DialogHeader className="sr-only">
          <DialogTitle>Advertisement</DialogTitle>
          <DialogDescription>
            This is an advertisement. Clicking it will open a new tab and close this window.
          </DialogDescription>
        </DialogHeader>
        {/* 
          Paste your banner ad script here.
          The user must click the ad to be redirected, which will close this modal.
        */}
        <div className="bg-background p-4 rounded-md">
           {/* Example 300x250 ad placeholder */}
           <div className="w-[300px] h-[250px] bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground">300x250 Ad Unit</span>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
