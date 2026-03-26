import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * OptimizedImage - Lazy-loads and responsively sizes images for better WebView performance
 * - Lazy loads images with IntersectionObserver
 * - Provides responsive sizing (mobile, tablet, desktop)
 * - Handles KYC documents and profile images
 * - Falls back gracefully if image fails to load
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  imageType = 'document', // 'document' | 'profile' | 'thumbnail'
  width,
  height,
  priority = false, // If true, loads immediately without lazy loading
}) {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (priority || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    const element = document.querySelector(`[data-image-id="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  // Determine responsive sizes based on image type
  const getSizes = () => {
    switch (imageType) {
      case 'profile':
        // Profile pictures: 96px on mobile, 128px on desktop
        return '(max-width: 768px) 96px, 128px';
      case 'thumbnail':
        // Thumbnails: 60px on mobile, 80px on desktop
        return '(max-width: 768px) 60px, 80px';
      case 'document':
      default:
        // Documents: full width on mobile, 80% on desktop
        return '(max-width: 768px) 100vw, 80vw';
    }
  };

  const getSrcSet = () => {
    if (!src) return '';
    
    // Generate responsive srcset for serving different sizes
    // This assumes images are accessible via URL parameters for resizing
    // Adjust based on your image hosting service
    const params = src.includes('?') ? '&' : '?';
    return `${src} 1x, ${src}${params}quality=85&dpr=2 2x`;
  };

  if (error) {
    return (
      <div
        className={cn(
          'bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm',
          containerClassName
        )}
        style={{ width, height, minHeight: '200px' }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div
      className={containerClassName}
      data-image-id={src}
      style={{ position: 'relative', overflow: 'hidden', width, height }}
    >
      {/* Placeholder background while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
      )}

      {shouldLoad && src && (
        <img
          src={src}
          srcSet={getSrcSet()}
          sizes={getSizes()}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setError(true);
            setIsLoaded(true);
          }}
          decoding="async"
        />
      )}
    </div>
  );
}