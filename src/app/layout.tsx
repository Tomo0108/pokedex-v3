import type { Metadata } from 'next';
import { DotGothic16 } from 'next/font/google';
import './globals.css';

const dotGothic = DotGothic16({ 
  weight: '400',
  subsets: ['latin'],
  preload: true,
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  minimumScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: 'Retro Pokedex',
  description: 'A retro-styled Pokedex application',
  manifest: '/manifest.json',
  themeColor: '#8b0000',
  icons: {
    icon: '/icons/poke-doll.png',
    apple: '/icons/poke-doll.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    userScalable: false,
    minimumScale: 1,
    maximumScale: 1
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dotGothic.className}>
      <head>
        <link rel="icon" href="/icons/poke-doll.png" />
        <link rel="apple-touch-icon" href="/icons/poke-doll.png" />
      </head>
      <body>
        <div className="pokedex-container">
          {children}
        </div>
      </body>
    </html>
  );
}
