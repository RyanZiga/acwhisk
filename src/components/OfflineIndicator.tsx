import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
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

  // Only show persistent offline indicator, notifications are handled by ServiceWorkerManager
  if (!isOnline) {
    return (
      <div className="offline-indicator">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    )
  }

  return null
}