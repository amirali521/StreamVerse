import Link from "next/link";

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


export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background/50 border-t">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <VintageCameraIcon className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-xl">StreamVerse</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">About</Link>
            <Link href="#" className="hover:text-foreground">Help Center</Link>
            <Link href="#" className="hover:text-foreground">Terms of Use</Link>
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/admin/login" className="hover:text-foreground">Admin</Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; {year} StreamVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
