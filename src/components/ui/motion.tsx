import React from 'react'
import { motion } from 'motion/react'

// Animation variants for common patterns
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
}

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 }
}

// Stagger animation for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
}

export const hoverLift = {
  y: -5,
  transition: { duration: 0.2 }
}

// Loading animations
export const pulseScale = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

// Enhanced motion components
interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'fadeInUp' | 'scaleIn' | 'slideInLeft' | 'slideInRight'
  delay?: number
  duration?: number
  hover?: boolean
}

export function MotionCard({ 
  children, 
  variant = 'fadeInUp', 
  delay = 0, 
  duration = 0.3,
  hover = true,
  className = '',
  ...props 
}: MotionCardProps) {
  const variants = {
    fadeInUp,
    scaleIn,
    slideInLeft,
    slideInRight
  }

  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hover ? hoverLift : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
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
  const hoverVariants = {
    scale: { scale: 1.05 },
    lift: { y: -2 },
    glow: { boxShadow: '0 0 20px rgba(161, 140, 255, 0.4)' }
  }

  return (
    <motion.button
      ref={ref}
      whileHover={hoverVariants[variant]}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
})

MotionButton.displayName = 'MotionButton'

interface MotionListProps {
  children: React.ReactNode
  className?: string
}

export function MotionList({ children, className = '' }: MotionListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Loading spinner component
export function MotionSpinner({ size = 40, color = 'currentColor' }) {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        border: `3px solid transparent`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%'
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

// Notification toast animation
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
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: isVisible ? 0 : 300 
      }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-4 right-4 z-50"
    >
      {children}
    </motion.div>
  )
}

// Progress bar animation
interface MotionProgressProps {
  progress: number
  className?: string
}

export function MotionProgress({ progress, className = '' }: MotionProgressProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full h-3 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

export { motion }