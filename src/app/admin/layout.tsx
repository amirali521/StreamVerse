import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";

function FilmReelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="8" y1="2" x2="8" y2="4" />
      <line x1="16" y1="2" x2="16" y2="4" />
      <line x1="8" y1="20" x2="8" y2="22" />
      <line x1="16" y1="20" x2="16" y2="22" />
      <line x1="2" y1="8" x2="4" y2="8" />
      <line x1="2" y1="16" x2="4" y2="16" />
      <line x1="20" y1="8" x2="22" y2="8" />
      <line x1="20" y1="16" x2="22" y2="16" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { claims, loaded } = useUser();

  if (!loaded) {
    // You can return a loading spinner or a blank page here
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  // A simple check if user is not admin.
  // For more complex scenarios, you might use middleware or higher-order components.
  if (!claims?.admin) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="mt-4">You do not have permission to view this page.</p>
            <Link href="/" className="mt-6 inline-block rounded bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring">
                Go to Homepage
            </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <FilmReelIcon className="h-8 w-8" />
                <span className="font-bold font-headline text-3xl">StreamVerse</span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
