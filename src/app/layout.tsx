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
  description: 'A retro-styled Pokedex application',
  manifest: '/manifest.json',
  themeColor: '#8b0000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  }
};

// サービスワーカーの登録
const registerServiceWorker = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful');
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dotGothic.className}>
      <head>
        <meta name="application-name" content="Retro Pokedex" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>
        <div className="pokedex-container">
          {children}
        </div>
      </body>
    </html>
  );
}
