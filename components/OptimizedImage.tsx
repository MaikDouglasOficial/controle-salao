'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackIcon,
  priority = false,
  sizes,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);

  // Se não tem src ou teve erro, mostrar fallback
  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      >
        {fallbackIcon || <ImageIcon className="w-1/2 h-1/2 text-gray-400 dark:text-gray-500" />}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      priority={priority}
      sizes={sizes}
      quality={85}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    />
  );
}

// Avatar otimizado específico
interface OptimizedAvatarProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackIcon?: React.ReactNode;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallbackIcon,
}: OptimizedAvatarProps) {
  const sizeMap = {
    sm: { width: 40, height: 40, className: 'w-10 h-10' },
    md: { width: 64, height: 64, className: 'w-16 h-16' },
    lg: { width: 96, height: 96, className: 'w-24 h-24' },
    xl: { width: 128, height: 128, className: 'w-32 h-32' },
  };

  const { width, height, className } = sizeMap[size];

  return (
    <div className={`relative ${className} rounded-full overflow-hidden flex-shrink-0`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover"
        fallbackIcon={fallbackIcon}
        sizes={`${width}px`}
      />
    </div>
  );
}
