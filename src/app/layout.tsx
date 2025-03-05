import type { Metadata } from 'next';
import { DotGothic16, Press_Start_2P } from 'next/font/google';
import './globals.css';

const dotGothic = DotGothic16({ 
  weight: '400',
  subsets: ['latin'],
  preload: true,
  display: 'swap',
});

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  preload: true,
  display: 'swap',
  variable: '--font-press-start',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: '#8b0000',
  interactiveWidget: 'resizes-visual'
};

export const metadata: Metadata = {
  title: 'Retro Pokedex',
  description: 'A retro-styled Pokedex application',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/poke-doll.png',
    apple: '/icons/poke-doll.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Retro Pokedex'
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'application-name': 'Retro Pokedex',
    'msapplication-TileColor': '#8b0000',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#8b0000'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <head>
        <link rel="icon" href="/icons/poke-doll.png" />
        <link rel="apple-touch-icon" href="/icons/poke-doll.png" />
      </head>
      <body className={dotGothic.className}>
        <div className="pokedex-container">
          {children}
        </div>
      </body>
    </html>
  );
}
