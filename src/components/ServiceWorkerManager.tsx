import { useEffect, useState } from 'react'
import { useNotifications } from './ui/notification'

interface ServiceWorkerManagerProps {
  children: React.ReactNode
}

export function ServiceWorkerManager({ children }: ServiceWorkerManagerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  
  // Only use notifications if available
  let addNotification: any = () => {}
  try {
    const notifications = useNotifications()
    addNotification = notifications.addNotification
  } catch (error) {
    // Notifications not available, use console logging instead
    addNotification = (notification: any) => {
      console.log(`Notification: ${notification.title} - ${notification.message}`)
    }
  }

  useEffect(() => {
    // Register service worker (disabled in development/preview environment and iframes)
    const isInIframe = window !== window.top
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && !isInIframe) {
      registerServiceWorker()
    }

    // Listen for online/offline events (notifications handled by OfflineIndicator)
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addNotification])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      setSwRegistration(registration)
      
      console.log('Service Worker registered successfully:', registration)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
              console.log('Service Worker update available')
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data
        
        switch (type) {
          case 'SYNC_COMPLETE':
            console.log('Service Worker sync complete')
            break
            
          default:
            console.log('Received message from SW:', event.data)
        }
      })

    } catch (error) {
      console.log('Service Worker registration skipped:', error.message)
    }
  }

  const updateServiceWorker = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  // Cache important resources
  const cacheResource = (url: string) => {
    if (swRegistration) {
      swRegistration.active?.postMessage({
        type: 'CACHE_RECIPE',
        payload: { url }
      })
    }
  }

  // Clear cache
  const clearCache = async () => {
    if (swRegistration?.active) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success)
        }
        
        swRegistration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      })
    }
  }

  // Provide context to children if needed
  const serviceWorkerContext = {
    isOnline,
    updateAvailable,
    cacheResource,
    clearCache,
    updateServiceWorker
  }

  return children
}

// Hook to use service worker functionality
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const cacheResource = (url: string) => {
    const isInIframe = window !== window.top
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller && !isInIframe) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_RECIPE',
        payload: { url }
      })
    }
  }

  const clearCache = async () => {
    const isInIframe = window !== window.top
    if ('serviceWorker' in navigator && !isInIframe) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel()
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.success)
          }
          
          registration.active.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          )
        })
      }
    }
  }

  return {
    isOnline,
    cacheResource,
    clearCache
  }
}