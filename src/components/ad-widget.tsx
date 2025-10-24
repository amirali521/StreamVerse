"use client";

import Script from 'next/script';
import { Card, CardContent } from "@/components/ui/card";

export function AdWidget() {
  return (
    <div className="w-[150px] md:w-[180px] h-full flex-shrink-0">
       <Card className="w-full h-full bg-card">
        <CardContent className="p-0 h-full flex items-center justify-center">
            <div id="container-4180eb1115aacee88b3b0d4729ad08f5"></div>
        </CardContent>
       </Card>
        <Script
            async
            data-cfasync="false"
            src="//pl27916747.effectivegatecpm.com/4180eb1115aacee88b3b0d4729ad08f5/invoke.js"
        />
    </div>
  );
}
