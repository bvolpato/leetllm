import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from "@/components/google-analytics";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  preload: false,
  display: "optional",
});
// Adobe's Source Serif release 80d3f889; its OFL license ships with the font.
const sourceSerif = localFont({
  src: "../assets/fonts/source-serif/SourceSerif4Variable-Roman.woff2",
  variable: "--font-source-serif",
  weight: "400 700",
  style: "normal",
  adjustFontFallback: "Times New Roman",
  preload: false,
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leetllm.com"),
  title: {
    default: "LeetLLM - Master AI & LLMs",
    template: "%s | LeetLLM",
  },
  description: "Learn AI engineering from first principles with free lessons, focused tracks, coding practice, and deep dives on LLM systems.",
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "LeetLLM - Master AI & LLMs",
    description: "Learn AI engineering from first principles with free lessons, focused tracks, coding practice, and deep dives on LLM systems.",
    url: "https://leetllm.com",
    siteName: "LeetLLM",
    images: [
      {
        url: "https://leetllm.com/default-og-image.png",
        width: 1200,
        height: 630,
        alt: "LeetLLM Open Graph Image",
        type: "image/png",
      }
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetLLM - Master AI & LLMs",
    description: "Learn AI engineering from first principles with free lessons, focused tracks, coding practice, and deep dives on LLM systems.",
    images: ["https://leetllm.com/default-og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${jetBrainsMono.variable} ${sourceSerif.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
