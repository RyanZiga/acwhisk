import React from 'react'
import logoImage from 'figma:asset/868eb8cd441d8d76debd4a1fae08c51899b81cd8.png'

interface ACWhiskLogoProps {
  className?: string
  size?: number
}

export function ACWhiskLogo({ className = "", size = 32 }: ACWhiskLogoProps) {
  return (
    <img 
      src={logoImage}
      alt="ACWhisk Logo"
      width={size} 
      height={size} 
      className={`${className} object-contain`}
      style={{ filter: 'drop-shadow(0 0 8px rgba(161, 140, 255, 0.3))' }}
    />
  )
}

// Alternative minimal version
export function ACWhiskLogoMinimal({ className = "", size = 32 }: ACWhiskLogoProps) {
  return (
    <img 
      src={logoImage}
      alt="ACWhisk Logo"
      width={size} 
      height={size} 
      className={`${className} object-contain opacity-80`}
      style={{ filter: 'drop-shadow(0 0 4px rgba(161, 140, 255, 0.2))' }}
    />
  )
}