
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAdminStatus } from "@/firebase/auth/use-admin-status";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PlusCircle, Settings, Users, MailQuestion, Share2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

function AdminHeader() {
  const pathname = usePathname();
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/add-content", label: "Add Content", icon: PlusCircle },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/requests", label: "Requests", icon: MailQuestion },
    { href: "/admin/social", label: "Social", icon: Share2 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <Link href="/" className="flex items-center space-x-2 text-foreground">
        <LogoIcon className="h-8 w-8" />
        <span className="font-bold font-headline text-3xl">StreamVerse</span>
      </Link>
      <div className="flex items-center gap-2 rounded-lg bg-card p-1 border">
        {navItems.map(item => (
           <Button key={item.href} asChild variant={pathname.startsWith(item.href) ? "secondary" : "ghost"} className="gap-2">
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAdminStatus();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAdmin) {
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
    <div className="flex flex-col min-h-full items-center justify-start p-4 bg-background">
      <div className="w-full max-w-5xl space-y-8">
        <AdminHeader />
        {children}
      </div>
    </div>
  );
}
