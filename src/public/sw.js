const CACHE_NAME = 'acwhisk-v1.0.3'
const IMAGE_CACHE_NAME = 'acwhisk-images-v1.0.3'
const STATIC_CACHE = 'acwhisk-static-v1.0.3'
const DYNAMIC_CACHE = 'acwhisk-dynamic-v1.0.3'

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

// Image optimization utilities
const isImageRequest = (url) => {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url.pathname) ||
         url.pathname.includes('/upload/') ||
         url.hostname.includes('supabase.co')
}

const getOptimizedImageUrl = (url, maxWidth = 1200) => {
  // For Supabase storage URLs, we can add transformation parameters
  if (url.includes('supabase.co') && url.includes('/storage/')) {
    const urlObj = new URL(url)
    urlObj.searchParams.set('width', maxWidth.toString())
    urlObj.searchParams.set('quality', '85')
    return urlObj.toString()
  }
  return url
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('ACWhisk Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('ACWhisk Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(IMAGE_CACHE_NAME).then(() => {
        console.log('ACWhisk Service Worker: Image cache initialized')
      })
    ]).then(() => {
      console.log('ACWhisk Service Worker: Static assets cached')
      return self.skipWaiting()
    }).catch(error => {
      console.error('ACWhisk Service Worker: Failed to cache static assets', error)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('ACWhisk Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('ACWhisk Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('ACWhisk Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement optimized caching strategies
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

  // Skip auth requests
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/auth/')) {
    return
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - Network first, cache fallback
    event.respondWith(handlePageRequest(request))
  } else if (request.destination === 'image' || isImageRequest(url)) {
    // Images - Optimized cache strategy
    event.respondWith(handleOptimizedImageRequest(request))
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
    console.log('ACWhisk Service Worker: Network failed, trying cache for page')
    
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return generic offline page
    return new Response(
      `<!DOCTYPE html>
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
              .btn {
                background: linear-gradient(135deg, #A18CFF 0%, #4FACFE 100%);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 2rem;
                cursor: pointer;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="offline-icon">🍳</div>
              <h1>ACWhisk - Offline</h1>
              <p>You're currently offline. Please check your internet connection and try again.</p>
              <button onclick="window.location.reload()" class="btn">
                Try Again
              </button>
            </div>
          </body>
        </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Optimized image request handler
async function handleOptimizedImageRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Check image cache first for faster loading
    const imageCache = await caches.open(IMAGE_CACHE_NAME)
    const cachedResponse = await imageCache.match(request)
    
    if (cachedResponse) {
      console.log('ACWhisk Service Worker: Serving optimized image from cache:', request.url)
      return cachedResponse
    }
    
    // Fetch with optimization headers
    const response = await fetch(request, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8'
      }
    })
    
    if (response.status === 200) {
      // Create optimized response with proper caching headers
      const responseClone = response.clone()
      const optimizedResponse = new Response(responseClone.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'Cache-Control': 'public, max-age=604800', // 7 days
          'Service-Worker-Cached': 'true',
          'X-Optimized': 'true'
        }
      })
      
      // Cache the optimized response
      await imageCache.put(request, optimizedResponse.clone())
      
      return optimizedResponse
    }
    
    return response
  } catch (error) {
    console.log('ACWhisk Service Worker: Optimized image fetch failed, checking cache:', error)
    
    // Try to serve from cache on network failure
    const imageCache = await caches.open(IMAGE_CACHE_NAME)
    const cachedResponse = await imageCache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return optimized placeholder image for failed requests
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <g transform="translate(200,150)">
          <circle r="30" fill="#94a3b8" opacity="0.5"/>
          <text y="5" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">
            Image unavailable
          </text>
        </g>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
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
    console.log('ACWhisk Service Worker: API request failed, trying cache')
    
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
    console.log('ACWhisk Service Worker: Asset request failed')
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
  console.log('ACWhisk Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Perform background sync operations with image cache cleanup
async function doBackgroundSync() {
  console.log('ACWhisk Service Worker: Performing background sync')
  
  try {
    // Clean up old image cache entries (older than 7 days)
    const imageCache = await caches.open(IMAGE_CACHE_NAME)
    const requests = await imageCache.keys()
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    for (const request of requests) {
      const response = await imageCache.match(request)
      if (response) {
        const dateHeader = response.headers.get('date')
        if (dateHeader && new Date(dateHeader).getTime() < oneWeekAgo) {
          await imageCache.delete(request)
          console.log('ACWhisk Service Worker: Cleaned up old cached image:', request.url)
        }
      }
    }
    
    // Notify clients that sync completed
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('ACWhisk Service Worker: Background sync failed', error)
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

    case 'PRELOAD_IMAGES':
      if (payload && payload.urls) {
        const imageCache = caches.open(IMAGE_CACHE_NAME)
        imageCache.then(cache => {
          payload.urls.forEach(url => {
            fetch(url).then(response => {
              if (response.status === 200) {
                cache.put(url, response)
              }
            }).catch(err => {
              console.log('ACWhisk Service Worker: Failed to preload image:', url, err)
            })
          })
        })
      }
      break
      
    case 'CLEAR_CACHE':
      Promise.all([
        caches.delete(DYNAMIC_CACHE),
        caches.delete(IMAGE_CACHE_NAME)
      ]).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break

    case 'GET_CACHE_SIZE':
      Promise.all([
        caches.open(DYNAMIC_CACHE),
        caches.open(IMAGE_CACHE_NAME)
      ]).then(async ([dynamicCache, imageCache]) => {
        const dynamicKeys = await dynamicCache.keys()
        const imageKeys = await imageCache.keys()
        
        event.ports[0].postMessage({ 
          dynamicCacheSize: dynamicKeys.length,
          imageCacheSize: imageKeys.length,
          totalSize: dynamicKeys.length + imageKeys.length
        })
      })
      break
      
    default:
      console.log('ACWhisk Service Worker: Unknown message type', type)
  }
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('ACWhisk Service Worker: Push notification received')
  
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body || 'New notification from ACWhisk',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open ACWhisk'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ACWhisk', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('ACWhisk Service Worker: Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})