import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Body font — highly readable.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Heading/display font — distinctive, modern, geometric.
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "AI Study Buddy",
  description: "Turn your notes into a study partner — chat, quiz, and summarize.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      {/* Each view (Landing / StudyApp) renders its own top bar. */}
      {/*
        suppressHydrationWarning: browser extensions (e.g. ColorZilla, which adds
        `cz-shortcut-listen="true"`) mutate <body> before React hydrates, causing a
        client/server attribute mismatch the app can't control. This flag is shallow
        — it only ignores attribute diffs on <body> itself, not its children — so real
        hydration bugs in the app still surface.
      */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
