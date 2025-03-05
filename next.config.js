/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['raw.githubusercontent.com'],
  }
};

const withPWAConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pokemon-images',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\/images\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'local-images',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\/sprites\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sprite-images',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\/icons\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'icon-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
};

const withPWA = require('next-pwa');
module.exports = withPWA(withPWAConfig)(nextConfig);
