
"use client";

import { useAd } from "@/context/ad-provider";
import { Dialog, DialogContent } from "./ui/dialog";

export function AdInterstitial() {
  const { isAdVisible, setAdVisible } = useAd();

  // The Dialog's onOpenChange will automatically handle closing
  // when the user navigates away after clicking the ad.
  return (
    <Dialog open={isAdVisible} onOpenChange={setAdVisible}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[90%] md:max-w-lg flex items-center justify-center">
        {/* 
          Paste your banner ad script here.
          The ad content should be the only thing inside this DialogContent.
          The user must click the ad to be redirected, which will close this modal.
        */}
        <div className="bg-background p-4 rounded-md">
           <p className="text-center text-foreground">Your Ad Banner Here</p>
           {/* Example ad placeholder */}
           <div className="w-[300px] h-[250px] bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground">300x250 Ad Unit</span>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
