import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        offline: resolve(__dirname, "offline.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Dicoding Story Platform",
        short_name: "Story App",
        description: "Platform berbagi cerita",
        theme_color: "#4a90e2",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/desktop-home.png",
            sizes: "1280x695",
            type: "image/png",
            form_factor: "wide",
            label: "Homescreen of Story App",
          },
          {
            src: "/screenshots/mobile-home.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
            label: "Mobile homescreen of Story App",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/story-api\.dicoding\.dev\/.*\/stories/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /^https:\/\/story-api\.dicoding\.dev\/images\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "story-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      strategies: "generateSW",
      filename: "sw.js",
      sw: {
        scriptInjectFirstLine: `
          // Import Workbox
          importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

          // Handle Push Event
          self.addEventListener('push', (event) => {
            console.log('Push event received:', event);
            
            let notificationData;
            try {
              notificationData = event.data.json();
              console.log('Parsed notification data:', notificationData);
            } catch (e) {
              console.error('Error parsing notification data:', e);
              notificationData = {
                title: 'Story Baru',
                options: {
                  body: event.data ? event.data.text() : 'Ada story baru telah dibuat',
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                  data: {
                    url: '/'
                  }
                }
              };
            }

            const options = {
              ...notificationData.options,
              icon: notificationData.options?.icon || '/icons/icon-192x192.png',
              badge: notificationData.options?.badge || '/icons/icon-72x72.png',
              vibrate: [100, 50, 100],
              data: {
                dateOfArrival: Date.now(),
                primaryKey: 1,
                url: notificationData.options?.url || '/'
              }
            };

            event.waitUntil(
              self.registration.showNotification(notificationData.title, options)
            );
          });

          // Handle Notification Click
          self.addEventListener('notificationclick', (event) => {
            console.log('Notification click event:', event);
            
            event.notification.close();

            event.waitUntil(
              clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                  const hadWindowToFocus = clientList.some((client) => {
                    if (client.url === event.notification.data.url) {
                      client.focus();
                      return true;
                    }
                    return false;
                  });

                  if (!hadWindowToFocus) {
                    clients.openWindow(event.notification.data.url)
                      .then((windowClient) => windowClient && windowClient.focus());
                  }
                })
            );
          });
        `,
      },
    }),
  ],
});
