import React from 'react'

interface ACWhiskLogoProps {
  className?: string
  size?: number
}

export function ACWhiskLogo({ className = "", size = 32 }: ACWhiskLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chef Hat Base */}
      <defs>
        <linearGradient id="acwhisk-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A18CFF" />
          <stop offset="50%" stopColor="#4FACFE" />
          <stop offset="100%" stopColor="#667EEA" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredblur"/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      {/* Chef Hat Crown */}
      <path
        d="M6 14C6 10.134 9.134 7 13 7C14.282 7 15.474 7.388 16.472 8.056C17.247 6.834 18.539 6 20 6C22.761 6 25 8.239 25 11C25 11.364 24.964 11.719 24.896 12.062C26.136 12.555 27 13.691 27 15C27 16.657 25.657 18 24 18H8C6.895 18 6 17.105 6 16V14Z"
        fill="url(#acwhisk-gradient)"
        filter="url(#glow)"
        opacity="0.9"
      />
      
      {/* Chef Hat Band */}
      <rect
        x="7"
        y="18"
        width="18"
        height="3"
        rx="1.5"
        fill="url(#acwhisk-gradient)"
        opacity="0.8"
      />
      
      {/* Chef Hat Base */}
      <path
        d="M9 21H23C23.552 21 24 21.448 24 22V26C24 27.105 23.105 28 22 28H10C8.895 28 8 27.105 8 26V22C8 21.448 8.448 21 9 21Z"
        fill="url(#acwhisk-gradient)"
        opacity="0.7"
      />
      
      {/* Whisk Lines - Abstract representation */}
      <g opacity="0.6">
        <line x1="12" y1="3" x2="13" y2="6" stroke="url(#acwhisk-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="17" y2="5" stroke="url(#acwhisk-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="3" x2="21" y2="6" stroke="url(#acwhisk-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      
      {/* Sparkle Elements */}
      <g opacity="0.8">
        <circle cx="10" cy="10" r="1" fill="#EACCF8"/>
        <circle cx="22" cy="12" r="0.8" fill="#DDD6FE"/>
        <circle cx="14" cy="24" r="0.6" fill="#C084FC"/>
        <circle cx="19" cy="25" r="0.8" fill="#A855F7"/>
      </g>
      
      {/* Letter 'A' integrated into design */}
      <path
        d="M13.5 22L15 19L16.5 22H18L15.5 17H14.5L12 22H13.5Z"
        fill="rgba(255, 255, 255, 0.9)"
        strokeWidth="0.5"
        stroke="rgba(255, 255, 255, 0.5)"
      />
      
      {/* Small decorative elements */}
      <g opacity="0.5">
        <path d="M26 8L27 9L26 10L25 9Z" fill="#F8FAFC"/>
        <path d="M4 20L5 21L4 22L3 21Z" fill="#F1F5F9"/>
      </g>
    </svg>
  )
}

// Alternative minimal version
export function ACWhiskLogoMinimal({ className = "", size = 32 }: ACWhiskLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="minimal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A18CFF" />
          <stop offset="100%" stopColor="#4FACFE" />
        </linearGradient>
      </defs>
      
      {/* Simple Chef Hat Silhouette */}
      <path
        d="M16 4C20.418 4 24 7.582 24 12V20C24 22.209 22.209 24 20 24H12C9.791 24 8 22.209 8 20V12C8 7.582 11.582 4 16 4Z"
        fill="url(#minimal-gradient)"
        opacity="0.8"
      />
      
      {/* Whisk symbol */}
      <g stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
        <line x1="14" y1="10" x2="14" y2="18"/>
        <line x1="16" y1="10" x2="16" y2="18"/>
        <line x1="18" y1="10" x2="18" y2="18"/>
        <circle cx="16" cy="20" r="1.5" fill="rgba(255, 255, 255, 0.9)"/>
      </g>
      
      {/* Subtle sparkle */}
      <circle cx="20" cy="8" r="1" fill="rgba(255, 255, 255, 0.6)"/>
    </svg>
  )
}