import Link from "next/link";

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

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background/50 border-t">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <FilmReelIcon className="h-6 w-6" />
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
