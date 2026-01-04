
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { WatchPageLayout } from "@/components/watch-page-layout";
import { AdProvider } from "@/context/ad-provider";
import { AdInterstitial } from "@/components/ad-interstitial";
import Script from "next/script";

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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-1111111111"
        ></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1111111111');
          `}
        </Script>
        <meta name="monetag" content="0208fe0f0196da351b14246835a2460b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
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
