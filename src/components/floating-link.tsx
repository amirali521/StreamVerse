
"use client";

import Link from "next/link";
import { Button } from "./ui/button";

export function FloatingLink() {
  return (
    <div className="relative my-8 h-14 overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full flex justify-start animate-marquee whitespace-nowrap">
            <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
            <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
            <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
        </div>
        <div className="absolute top-0 w-full flex justify-start animate-marquee2 whitespace-nowrap">
             <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
            <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
            <Button asChild variant="link" className="text-lg font-bold text-accent hover:text-accent/80 mx-8">
                <Link href="/servers">
                    Looking for more? Click here to search our external servers for any movie or series!
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
