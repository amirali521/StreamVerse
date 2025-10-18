import Link from "next/link";

function PlayReelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12c0-.9.18-1.75.5-2.54V10h2.14c.2-.84.48-1.63.83-2.36L5.61 5.61A8.96 8.96 0 014 12zm1.61-6.39l1.86 1.86c.73-.35 1.52-.63 2.36-.83V4.5c-.79.32-1.55.7-2.22 1.11zM10 4.5v2.14c.64-.13 1.3-.21 1.99-.21v-2a9.01 9.01 0 00-1.99.07zM14 4.55v2.02c.69 0 1.35.08 2 .21V4.5A9.01 9.01 0 0014 4.55zm3.11 2.06c.35.73.63 1.52.83 2.36H20v-.96c-.32-.79-.7-1.55-1.11-2.22l-1.78 1.82zM10 10.5v3l2.25-1.5L10 10.5zm9.5 0v.96c.13.64.21 1.3.21 2.01h2.02c0-.69-.08-1.35-.21-2h-2.02zm-.21 4.01c-.13.64-.29 1.26-.5 1.84h2.21v-.96a8.95 8.95 0 01-.5-2.84zm-4.18 2.38c-.73.35-1.52.63-2.36.83v2.14c.79-.32 1.55-.7 2.22-1.11l.14-.14zm-4.44.83c-.64.13-1.3.21-1.99.21v2c.69 0 1.35-.08 2-.21v-2zm-3.8-2.29c-.35-.73-.63-1.52-.83-2.36H4v.96c.32.79.7 1.55 1.11 2.22l1.78-1.82z"
        clipRule="evenodd"
      />
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
            <PlayReelIcon className="h-6 w-6 text-primary" />
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
