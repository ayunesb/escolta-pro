import { useState, useRef, useEffect, FC, ImgHTMLAttributes, ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/use-performance';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  priority?: boolean;
}

export const LazyImage: FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  className = '',
  priority = false,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Bridge our local ref to the hook's expected ref without using 'any'.
  useEffect(() => {
    if (containerRef.current) {
      // Assign through casting to the hook's internal ref type.
      (ref as unknown as { current: HTMLDivElement | null }).current = containerRef.current;
    }
  }, [ref]);

  const shouldLoad = priority || isIntersecting;

  return (
  <div ref={containerRef} className={`relative ${className}`}>
      {shouldLoad && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
      
      {!loaded && !error && (
        <div className={`bg-muted animate-pulse ${className}`} />
      )}
      
      {error && fallback && (
        <div className={className}>
          {fallback}
        </div>
      )}
    </div>
  );
};