import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display face for landing headings. 400 plus italic, per the design tokens. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://benco.ba'),
  title: {
    default: 'Ben&Co - Real Estate & Construction Company',
    template: '%s | Ben&Co'
  },
  description: 'Vodeća kompanija za nekretnine i gradnju u Sarajevu. Pronađite svoju savršenu nekretninu.',
  keywords: ['nekretnine', 'real estate', 'Sarajevo', 'gradnja', 'construction', 'stanovi', 'vile', 'apartmani'],
  authors: [{ name: 'Ben&Co' }],
  openGraph: {
    type: 'website',
    locale: 'bs_BA',
    alternateLocale: 'en_US',
    url: 'https://benco.ba',
    siteName: 'Ben&Co',
    title: 'Ben&Co - Real Estate & Construction Company',
    description: 'Vodeća kompanija za nekretnine i gradnju u Sarajevu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
