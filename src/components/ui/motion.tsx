import React from 'react'

// Lightweight components without heavy animations
interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'fadeInUp' | 'scaleIn' | 'slideInLeft' | 'slideInRight'
  delay?: number
  duration?: number
  hover?: boolean
  // Support for motion props from other components (ignored for compatibility)
  initial?: any
  animate?: any
  transition?: any
}

export function MotionCard({ 
  children, 
  variant = 'fadeInUp', 
  delay = 0, 
  duration = 0.3,
  hover = true,
  className = '',
  // Ignore motion props for compatibility
  initial,
  animate,
  transition,
  ...props 
}: MotionCardProps) {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${className} ${hover ? 'hover:transform hover:-translate-y-1' : ''}`}
      style={{ animationDelay: `${delay}s` }}
      {...props}
    >
      {children}
    </div>
  )
}

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'scale' | 'lift' | 'glow'
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(({ 
  children, 
  variant = 'scale',
  className = '',
  ...props 
}, ref) => {
  const variantClasses = {
    scale: 'hover:scale-105 active:scale-95',
    lift: 'hover:-translate-y-0.5',
    glow: 'hover:shadow-lg'
  }

  return (
    <button
      ref={ref}
      className={`${className} ${variantClasses[variant]} transition-all duration-200`}
      {...props}
    >
      {children}
    </button>
  )
})

MotionButton.displayName = 'MotionButton'

interface MotionListProps {
  children: React.ReactNode
  className?: string
}

export function MotionList({ children, className = '' }: MotionListProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Simple loading spinner without heavy animations
export function MotionSpinner({ size = 40, color = 'currentColor' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid transparent`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%'
      }}
      className="animate-spin"
    />
  )
}

// Simple toast without heavy animations
export function MotionToast({ 
  children, 
  isVisible, 
  onClose 
}: { 
  children: React.ReactNode
  isVisible: boolean
  onClose: () => void 
}) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      {children}
    </div>
  )
}

// Simple progress bar
interface MotionProgressProps {
  progress: number
  className?: string
}

export function MotionProgress({ progress, className = '' }: MotionProgressProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full h-3 overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}