import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gen AI Interview Prep",
  description: "Study Gen AI interview questions at your own pace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-zinc-50 font-sans text-base leading-relaxed text-foreground dark:bg-zinc-950">
        <a
          href="#main-content"
          className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-[220%] rounded-lg bg-zinc-900 px-4 py-2 text-base font-medium text-white opacity-0 transition-[transform,opacity] focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:focus:outline-zinc-100"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
