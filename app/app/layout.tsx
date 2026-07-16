import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-display",
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
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/plays" className="font-serif text-xl italic tracking-tight">
              Script Database
            </Link>
            <nav className="text-sm flex gap-5 text-black/60 dark:text-white/60">
              <Link href="/plays" className="transition-colors hover:text-accent">
                Browse
              </Link>
              <Link href="/plays?favorite=1" className="transition-colors hover:text-accent">
                Favorites
              </Link>
              <Link
                href="/plays/new"
                className="rounded-full bg-accent px-3 py-1 text-accent-foreground transition-opacity hover:opacity-90"
              >
                Add a play
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
