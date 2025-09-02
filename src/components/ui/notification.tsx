import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  timeoutId?: NodeJS.Timeout
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationProviderProps {
  children: React.ReactNode
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000
    const timeoutId = setTimeout(() => {
      removeNotification(id)
    }, duration)
    
    // Store timeout ID to clear if needed
    newNotification.timeoutId = timeoutId
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification?.timeoutId) {
        clearTimeout(notification.timeoutId)
      }
      return prev.filter(n => n.id !== id)
    })
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-400'
      case 'error':
        return 'border-l-red-400'
      case 'warning':
        return 'border-l-yellow-400'
      case 'info':
      default:
        return 'border-l-blue-400'
    }
  }

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`glass-card border-0 shadow-lg border-l-4 ${getBorderColor(notification.type)} p-4 w-full`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
                      onClick={notification.action.onClick}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-auto p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Convenience hooks
export function useSuccessNotification() {
  const { addNotification } = useNotifications()
  return (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'success', title, message, action })
  }
}

export function useErrorNotification() {
  const { addNotification } = useNotifications()
  return (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'error', title, message, action })
  }
}

export function useInfoNotification() {
  const { addNotification } = useNotifications()
  return (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'info', title, message, action })
  }
}

export function useWarningNotification() {
  const { addNotification } = useNotifications()
  return (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'warning', title, message, action })
  }
}

// Main useNotification hook that provides a simple interface
export function useNotification() {
  const { addNotification } = useNotifications()
  
  const showNotification = (notification: {
    title: string
    description: string
    type: 'success' | 'error' | 'info' | 'warning'
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    addNotification({
      type: notification.type,
      title: notification.title,
      message: notification.description,
      action: notification.action
    })
  }
  
  return { showNotification }
}