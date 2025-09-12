import React, { useState, useRef, useEffect } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

interface IntersectionObserverEntry {
  isIntersecting: boolean
  target: Element
}

const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]: IntersectionObserverEntry[]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [ref, options])

  return isIntersecting
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  priority = false,
  sizes = '100vw',
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const imgRef = useRef<HTMLDivElement>(null)
  const isInView = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  })

  // Generate responsive image URLs if needed
  const generateResponsiveUrls = (originalSrc: string) => {
    // For external URLs, return as-is
    if (originalSrc.startsWith('http') && !originalSrc.includes('supabase')) {
      return {
        mobile: originalSrc,
        tablet: originalSrc,
        desktop: originalSrc
      }
    }

    // For Supabase URLs, we could implement transformations here
    // For now, return the original URL
    return {
      mobile: originalSrc,
      tablet: originalSrc,
      desktop: originalSrc
    }
  }

  const responsiveUrls = generateResponsiveUrls(src)

  // Create optimized srcSet
  const createSrcSet = () => {
    return `
      ${responsiveUrls.mobile} 400w,
      ${responsiveUrls.tablet} 800w,
      ${responsiveUrls.desktop} 1200w
    `.trim()
  }

  // Generate blur placeholder
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    
    // Generate a simple blur placeholder
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#grad)" />
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const shouldLoad = priority || isInView || loading === 'eager'

  useEffect(() => {
    if (shouldLoad && !currentSrc && !hasError) {
      setCurrentSrc(src)
    }
  }, [shouldLoad, src, currentSrc, hasError])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const imageStyle: React.CSSProperties = {
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
    background: placeholder === 'blur' ? `url(${generateBlurDataURL()})` : 'transparent',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    ...(!isLoaded && placeholder === 'blur' && {
      filter: 'blur(4px)',
      transform: 'scale(1.02)'
    })
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: placeholder === 'blur' ? `url(${generateBlurDataURL()})` : '#f1f5f9',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }

  return (
    <div 
      ref={imgRef} 
      className={`relative ${className}`}
      style={containerStyle}
    >
      {/* Blur placeholder background */}
      {!isLoaded && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"
          style={{
            backgroundImage: `url(${generateBlurDataURL()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Main image */}
      {shouldLoad && (
        <ImageWithFallback
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          width={width}
          height={height}
          sizes={sizes}
          // Add srcSet for responsive images
          srcSet={createSrcSet()}
        />
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && currentSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Lazy loading placeholder */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
    </div>
  )
}

// Hook for optimized image loading
export const useOptimizedImage = (src: string, options: { 
  preload?: boolean
  priority?: boolean 
} = {}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src || (!options.preload && !options.priority)) return

    const img = new Image()
    
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setHasError(true)
    
    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, options.preload, options.priority])

  return { isLoaded, hasError }
}

// Component for recipe card images with optimized loading
export function RecipeCardImage({ 
  src, 
  alt, 
  className = "" 
}: { 
  src: string
  alt: string
  className?: string 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`aspect-video ${className}`}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
    />
  )
}

// Component for profile avatars with optimized loading
export function ProfileAvatar({ 
  src, 
  alt, 
  size = 'md',
  className = "" 
}: { 
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      loading="lazy"
      sizes={size === 'xl' ? '96px' : size === 'lg' ? '64px' : size === 'md' ? '48px' : '32px'}
      placeholder="blur"
    />
  )
}