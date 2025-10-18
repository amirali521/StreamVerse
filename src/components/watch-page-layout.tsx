
'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export function WatchPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith('/watch/');

  // For watch pages, we want the header for navigation but not the footer.
  if (isWatchPage) {
    return (
      <>
        <SiteHeader />
        <main className="flex-grow">{children}</main>
      </>
    );
  }

  // For all other pages, show header and footer.
  return (
    <>
      <SiteHeader />
      <main className="flex-grow">{children}</main>
      <SiteFooter />
    </>
  );
}
