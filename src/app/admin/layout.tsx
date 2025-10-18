import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";

function VintageCameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.26 2.56a2.5 2.5 0 0 0-2.31 1.18l-1.87 3.51a2.5 2.5 0 0 0 0 2.5l1.87 3.51a2.5 2.5 0 0 0 2.31 1.18h11.48a2.5 2.5 0 0 0 2.31-1.18l1.87-3.51a2.5 2.5 0 0 0 0-2.5l-1.87-3.51a2.5 2.5 0 0 0-2.31-1.18Z" />
      <path d="M12 14.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5.5 4.5h-3" />
      <path d="M18.5 4.5h3" />
      <path d="M3 9.5h-3" />
      <path d="M21 9.5h3" />
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
                <VintageCameraIcon className="h-8 w-8 text-primary" />
                <span className="font-bold font-headline text-3xl">StreamVerse</span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
