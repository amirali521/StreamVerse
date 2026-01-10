
"use client";

import Link from "next/link";
import { Button } from "./ui/button";

export function FloatingLink() {
  return (
    <div className="relative my-8 flex h-14 overflow-x-hidden bg-transparent">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        <Button asChild variant="link" className="text-lg font-bold text-white hover:text-white/80 mx-8">
          <Link href="/servers">
            Looking for more? Click here to search our external servers for any movie or series!
          </Link>
        </Button>
        <Button asChild variant="link" className="text-lg font-bold text-white hover:text-white/80 mx-8">
          <Link href="/servers">
            Looking for more? Click here to search our external servers for any movie or series!
          </Link>
        </Button>
      </div>

      <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center">
         <Button asChild variant="link" className="text-lg font-bold text-white hover:text-white/80 mx-8">
          <Link href="/servers">
            Looking for more? Click here to search our external servers for any movie or series!
          </Link>
        </Button>
        <Button asChild variant="link" className="text-lg font-bold text-white hover:text-white/80 mx-8">
          <Link href="/servers">
            Looking for more? Click here to search our external servers for any movie or series!
          </Link>
        </Button>
      </div>
    </div>
  );
}
