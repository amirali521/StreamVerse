import type { ReactNode } from "react";
import Link from "next/link";
import { Film } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <Film className="h-8 w-8 text-primary" />
                <span className="font-bold font-headline text-3xl">StreamVerse</span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
