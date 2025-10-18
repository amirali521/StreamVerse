import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";

function MovieCameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M16 8.41L16 6a2 2 0 00-2-2H2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2.41L22 18V6zM6 14a2 2 0 11-4 0 2 2 0 014 0zm6-4a2 2 0 11-4 0 2 2 0 014 0z" />
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
                <MovieCameraIcon className="h-8 w-8 text-primary" />
                <span className="font-bold font-headline text-3xl">StreamVerse</span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
