
"use client";

import Script from 'next/script';
import { Card, CardContent } from "@/components/ui/card";

export function AdWidget() {
  // This is a placeholder for your Adstera Native Banner (Widget).
  // Adstera provides a <div> and a <script> tag.
  // 1. The <div> goes inside the CardContent.
  // 2. The <script> tag is handled by Next.js's <Script> component below.

  // **ACTION REQUIRED:** Replace the placeholder content below with your actual Adstera code.

  // Example from Adstera docs might look like this:
  // <div id="container-535d76b13b1851e7374c54016259f33b"></div>

  return (
    <div className="w-[150px] md:w-[180px] h-full flex-shrink-0">
       <Card className="w-full h-full bg-card">
        <CardContent className="p-0 h-full flex items-center justify-center">
            {/*
              PASTE YOUR ADSTERA DIV-BASED WIDGET CODE HERE.
              For example:
              <div id="container-535d76b13b1851e7374c54016259f33b"></div>
            */}
             <div className="text-center text-muted-foreground p-4">
                <p className="text-xs">Advertisement</p>
             </div>
        </CardContent>
       </Card>
      {/*
        PASTE YOUR ADSTERA SCRIPT HERE.
        Make sure the 'src' attribute points to the correct Adstera URL.
        The 'async' and 'data-cfasync' attributes are important.
        For example:
        <Script
            async
            data-cfasync="false"
            src="//pl27921969.effectivegatecpm.com/535d76b13b1851e7374c54016259f33b/invoke.js"
        />
       */}
    </div>
  );
}
