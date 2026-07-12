import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Script Database",
  description: "Emily's play & musical script collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/plays" className="text-lg font-semibold tracking-tight">
              Script Database
            </a>
            <nav className="text-sm flex gap-4 text-black/60 dark:text-white/60">
              <a href="/plays" className="hover:text-black dark:hover:text-white">
                Browse
              </a>
              <a
                href="/plays?favorite=1"
                className="hover:text-black dark:hover:text-white"
              >
                Favorites
              </a>
              <a
                href="/plays/new"
                className="hover:text-black dark:hover:text-white"
              >
                Add a play
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
