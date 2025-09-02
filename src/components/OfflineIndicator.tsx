import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion } from 'motion/react'

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
      <motion.div 
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-3 bg-destructive/90 text-white rounded-xl backdrop-blur-sm border border-white/20"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">You're offline</span>
      </motion.div>
    )
  }

  return null
}