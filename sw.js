importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

workbox.setConfig({ debug: false });

// ✅ PENTING: Diperlukan oleh injectManifest
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
// Import custom event listeners
function eventListeners() {
  self.addEventListener("push", (event) => {
    let notificationData = {};
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: "Story Baru",
        options: {
          body: event.data?.text() || "Ada story baru tersedia",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          data: { url: "/" },
        },
      };
    }

    const options = {
      ...notificationData.options,
      icon: notificationData.options?.icon || "/icons/icon-192x192.png",
      badge: notificationData.options?.badge || "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: notificationData.options?.url || "/",
      },
    };

    event.waitUntil(
      self.registration.showNotification(notificationData.title, options)
    );
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        const hadWindowToFocus = clientList.some((client) => {
          if (client.url === event.notification.data.url) {
            client.focus();
            return true;
          }
          return false;
        });
        if (!hadWindowToFocus) {
          clients.openWindow(event.notification.data.url).then((windowClient) => windowClient?.focus());
        }
      })
    );
  });
}

// Skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Cache for story images - StaleWhileRevalidate strategy
workbox.routing.registerRoute(
  ({ request, url }) => {
    const isImage = request.destination === "image";
    const isDicodingImage =
      url.origin === "https://story-api.dicoding.dev" &&
      url.pathname.includes("/images/");

    if (isImage && isDicodingImage) {
      console.log("[Service Worker] Processing story image:", url.href);
      return true;
    }
    return false;
  },
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "story-images",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache for API responses
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === "https://story-api.dicoding.dev" &&
    !url.pathname.includes("/images/"),
  new workbox.strategies.NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// Cache for static assets
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font",
  new workbox.strategies.CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Offline fallback
workbox.routing.setCatchHandler(async ({ request }) => {
  console.log("[Service Worker] Catch handler for:", request.url);

  if (request.destination === "image") {
    try {
      const cache = await caches.open("story-images");
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log("[Service Worker] Returning cached image:", request.url);
        return cachedResponse;
      }
    } catch (error) {
      console.error("[Service Worker] Cache error:", error);
    }
  }

  if (request.destination === "document") {
    return caches.match("/offline.html");
  }

  return Response.error();
});

workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: "google-fonts-stylesheets",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === "style" || request.url.endsWith(".css"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "styles",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      {
        handlerDidError: async ({ request }) => {
          console.log(
            "[Service Worker] Network error for CSS, trying cache:",
            request.url
          );
          const cache = await caches.open("styles");
          return await cache.match(request);
        },
      },
    ],
  })
);

workbox.routing.registerRoute(
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/,
  new workbox.strategies.CacheFirst({
    cacheName: "font-awesome",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30,
        maxEntries: 30,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === "https://cdnjs.cloudflare.com" ||
    url.origin === "https://unpkg.com",
  new workbox.strategies.CacheFirst({
    cacheName: "cdn-cache",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === "document" ||
    request.url.endsWith(".html") ||
    request.url === self.location.origin + "/",
  new workbox.strategies.NetworkFirst({
    cacheName: "pages",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

workbox.routing.setDefaultHandler(
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "default-cache",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request, url }) => {
    return (
      request.destination === "style" ||
      url.pathname.endsWith(".css") ||
      url.pathname.includes("/src/styles/")
    );
  },
  new workbox.strategies.CacheFirst({
    cacheName: "local-styles",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30,
        maxEntries: 20,
      }),
    ],
  })
);

// Pre-create cache for images
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open("story-images"),
      caches.open("api-cache"),
      caches.open("static-assets"),
      caches.open("pages"),
    ]).then(() => {
      console.log("[Service Worker] Caches have been created");
    })
  );
});

// Handle fetch events manually for better control
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle Dicoding API image requests
  if (
    url.origin === "https://story-api.dicoding.dev" &&
    url.pathname.startsWith("/images/stories/")
  ) {
    console.log("[Service Worker] Fetching story image:", url.href);

    event.respondWith(
      caches.open("story-images").then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[Service Worker] Returning cached image:", url.href);
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                console.log("[Service Worker] Caching new image:", url.href);
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error("[Service Worker] Fetch failed:", error);
              return cache.match(event.request);
            });
        });
      })
    );
    return;
  }
});

workbox.routing.registerRoute(
  /^https:\/\/ui-avatars\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: "ui-avatars",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30,
        maxEntries: 50,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /^https:\/\/api\.maptiler\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: "maptiler-api",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30,
        maxEntries: 100,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request, url }) => {
    return (
      url.origin === self.location.origin &&
      (request.destination === "image" ||
        url.pathname.startsWith("/src/public/"))
    );
  },
  new workbox.strategies.CacheFirst({
    cacheName: "static-images",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache API responses
workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new workbox.strategies.NetworkFirst({
    cacheName: "api-responses",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// Skip waiting and claim clients
self.skipWaiting();
workbox.core.clientsClaim();
