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
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'Retro Pokedex',
  description: 'A retro-styled Pokedex application'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dotGothic.className}>
      <body>
        <div className="pokedex-container">
          {children}
        </div>
      </body>
    </html>
  );
}
