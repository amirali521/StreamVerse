
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { WatchPageLayout } from "@/components/watch-page-layout";
import { AdProvider } from "@/context/ad-provider";
import { AdInterstitial } from "@/components/ad-interstitial";

export const metadata: Metadata = {
  title: "StreamVerse",
  description: "Your universe of movies and web series.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <AdProvider>
            <WatchPageLayout>
              {children}
            </WatchPageLayout>
            <Toaster />
            <AdInterstitial />
          </AdProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
