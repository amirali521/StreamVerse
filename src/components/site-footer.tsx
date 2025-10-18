import Link from "next/link";

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


export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background/50 border-t">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <MovieCameraIcon className="h-6 w-6 text-primary" />
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
