const CACHE_NAME = 'acwhisk-v1'
const STATIC_CACHE = 'acwhisk-static-v1'
const DYNAMIC_CACHE = 'acwhisk-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/App.tsx',
  '/styles/globals.css',
  '/components/ui/button.tsx',
  '/components/ui/card.tsx',
  '/components/ui/avatar.tsx',
  '/components/figma/ImageWithFallback.tsx'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/recipes/,
  /\/api\/posts/,
  /\/api\/users/,
  /\/api\/auth/
]

// Offline fallback pages
const OFFLINE_FALLBACKS = {
  '/recipes': '/offline/recipes.html',
  '/forum': '/offline/forum.html',
  '/learning': '/offline/learning.html'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - Network first, cache fallback
    event.respondWith(handlePageRequest(request))
  } else if (request.destination === 'image') {
    // Images - Cache first, network fallback
    event.respondWith(handleImageRequest(request))
  } else if (isAPIRequest(request)) {
    // API requests - Network first with cache fallback
    event.respondWith(handleAPIRequest(request))
  } else {
    // Other assets - Cache first
    event.respondWith(handleAssetRequest(request))
  }
})

// Handle page requests
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for page')
    
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback if available
    const pathname = new URL(request.url).pathname
    const fallback = OFFLINE_FALLBACKS[pathname]
    if (fallback) {
      return caches.match(fallback)
    }
    
    // Return generic offline page
    return new Response(
\`<!DOCTYPE html>
      <html>
        <head>
          <title>ACWhisk - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%);
              margin: 0;
              padding: 2rem;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.4);
              backdrop-filter: blur(16px);
              border-radius: 1.5rem;
              padding: 3rem;
              text-align: center;
              max-width: 400px;
              border: 1px solid rgba(255, 255, 255, 0.18);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
            }
            h1 { color: #2D3748; margin-bottom: 1rem; }
            p { color: #4A5568; margin-bottom: 2rem; }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()" 
                    style="background: linear-gradient(135deg, #A18CFF 0%, #4FACFE 100%); 
                           color: white; border: none; padding: 0.75rem 1.5rem; 
                           border-radius: 2rem; cursor: pointer;">
              Try Again
            </button>
          </div>
        </body>
      </html>\`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Handle image requests
async function handleImageRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to load image, returning placeholder')
    
    // Return placeholder image
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#f3f4f6"/>
        <text x="150" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif">
          Image unavailable offline
        </text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    )
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful GET responses
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: API request failed, trying cache')
    
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This request failed because you are offline. Please try again when you have an internet connection.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle asset requests
async function handleAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Asset request failed')
    throw error
  }
}

// Check if request is to API
function isAPIRequest(request) {
  const url = new URL(request.url)
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Perform background sync operations
async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync')
  
  try {
    // Sync pending data, update cache, etc.
    const cache = await caches.open(DYNAMIC_CACHE)
    // Add any sync logic here
    
    // Notify clients that sync completed
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_RECIPE':
      if (payload && payload.url) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.add(payload.url)
        })
      }
      break
      
    case 'CLEAR_CACHE':
      caches.delete(DYNAMIC_CACHE).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    default:
      console.log('Service Worker: Unknown message type', type)
  }
})