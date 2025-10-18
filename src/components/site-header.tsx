"use client";

import Link from "next/link";
import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/auth/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuth, signOut } from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

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
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12c0-.9.18-1.75.5-2.54V10h2.14c.2-.84.48-1.63.83-2.36L5.61 5.61A8.96 8.96 0 014 12zm1.61-6.39l1.86 1.86c.73-.35 1.52-.63 2.36-.83V4.5c-.79.32-1.55.7-2.22 1.11zM10 4.5v2.14c.64-.13 1.3-.21 1.99-.21v-2a9.01 9.01 0 00-1.99.07zM14 4.55v2.02c.69 0 1.35-.08 2 .21V4.5A9.01 9.01 0 0014 4.55zm3.11 2.06c.35.73.63 1.52.83 2.36H20v-.96c-.32-.79-.7-1.55-1.11-2.22l-1.78 1.82zM10 10.5v3l2.25-1.5L10 10.5zm9.5 0v.96c.13.64.21 1.3.21 2.01h2.02c0-.69-.08-1.35-.21-2h-2.02zm-.21 4.01c-.13.64-.29 1.26-.5 1.84h2.21v-.96a8.95 8.95 0 01-.5-2.84zm-4.18 2.38c-.73.35-1.52.63-2.36.83v2.14c.79-.32 1.55-.7 2.22-1.11l.14-.14zm-4.44.83c-.64.13-1.3.21-1.99.21v2c.69 0 1.35-.08 2-.21v-2zm-3.8-2.29c-.35-.73-.63-1.52-.83-2.36H4v.96c.32.79.7 1.55 1.11 2.22l1.78-1.82z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UserNav() {
  const { app } = useFirebase();
  const { user, claims, loaded } = useUser();

  const handleSignOut = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await signOut(auth);
  };

  if (!loaded) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {claims?.admin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { user, claims, loaded } = useUser();
  const { app } = useFirebase();
  const handleSignOut = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await signOut(auth);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 pl-4 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-8 w-8" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 pt-12">
        <nav className="flex flex-col gap-4">
        <Link
            href="/"
            className="font-bold text-lg transition-colors hover:text-foreground/80 text-foreground/60"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="#"
            className="font-bold text-lg transition-colors hover:text-foreground/80 text-foreground/60"
            onClick={() => setOpen(false)}
          >
            Movies
          </Link>
          <Link
            href="#"
            className="font-bold text-lg transition-colors hover:text-foreground/80 text-foreground/60"
            onClick={() => setOpen(false)}
          >
            Series
          </Link>
          <Link
            href="#"
            className="font-bold text-lg transition-colors hover:text-foreground/80 text-foreground/60"
            onClick={() => setOpen(false)}
          >
            Dramas
          </Link>
          <DropdownMenuSeparator />
          {loaded && user && (
            <>
              {claims?.admin && <Link href="/admin" className="font-bold text-lg" onClick={() => setOpen(false)}>Admin</Link>}
              <Link href="#" className="font-bold text-lg" onClick={() => setOpen(false)}>Profile</Link>
              <button onClick={() => {
                handleSignOut();
                setOpen(false);
              }} className="font-bold text-lg text-left">Logout</button>
            </>
          )}
          {loaded && !user && (
            <div className="flex flex-col gap-4">
              <Link href="/login" className="font-bold text-lg" onClick={() => setOpen(false)}>Login</Link>
              <Link href="/signup" className="font-bold text-lg" onClick={() => setOpen(false)}>Sign up</Link>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}


export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <MobileNav open={open} setOpen={setOpen} />
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <PlayReelIcon className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-xl">StreamVerse</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Home
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Movies
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Series
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dramas
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="flex items-center gap-2">
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
