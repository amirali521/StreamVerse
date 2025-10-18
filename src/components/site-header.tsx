
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
  SheetHeader,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useAdminStatus } from "@/firebase/auth/use-admin-status";

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
      <path d="M7.5 4.5L16.5 12L7.5 19.5V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 19.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20.5 19.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UserNav() {
  const { app } = useFirebase();
  const { user, loaded } = useUser();
  const { isAdmin } = useAdminStatus();

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
        {isAdmin && (
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
  const { user, loaded } = useUser();
  const { isAdmin } = useAdminStatus();
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
          <Menu className="h-9 w-9" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader className="p-4 text-left">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
            <LogoIcon className="h-8 w-8" />
            <span className="font-bold font-headline text-xl">StreamVerse</span>
          </Link>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation and account options.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-4 p-4">
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
              {isAdmin && <Link href="/admin" className="font-bold text-lg" onClick={() => setOpen(false)}>Admin</Link>}
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
            <LogoIcon className="h-8 w-8" />
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
