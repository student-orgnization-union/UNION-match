import Image from 'next/image'
import { useState } from 'react'
import { Building2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackIcon?: React.ReactNode
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 64, 
  height = 64, 
  className = '',
  fallbackIcon = <Building2 className="h-6 w-6 text-white/60" />
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!src || imageError) {
    return (
      <div className={`bg-white/5 flex items-center justify-center ${className}`}>
        {fallbackIcon}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover transition-opacity duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        unoptimized={src.startsWith('http')} // 外部URLの場合は最適化を無効化
      />
    </div>
  )
}
