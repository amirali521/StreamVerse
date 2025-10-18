import Link from "next/link";

function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <polygon points="10 8 16 12 10 16 10 8" />
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
            <LogoIcon className="h-6 w-6" />
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
