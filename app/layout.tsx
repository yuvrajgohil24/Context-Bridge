import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Inter — the de-facto professional UI font, used across real-world products.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Space Grotesk — geometric display face for headings; distinct identity.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// JetBrains Mono — for token counts and the compressed output.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContextBridge — Compress AI chats into reusable context",
  description:
    "Capture conversations from Claude and ChatGPT and compress them into dense, reusable context blocks with Gemini. Carry context between AI sessions without copy-pasting.",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ContextBridge",
    description: "Compress AI chats into instantly reusable context blocks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-body">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
