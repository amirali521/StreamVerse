
'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export function WatchPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith('/watch/');

  if (isWatchPage) {
    return <main>{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-grow">{children}</main>
      <SiteFooter />
    </>
  );
}

    