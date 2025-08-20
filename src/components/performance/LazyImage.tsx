import React, { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/use-performance';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  className = '',
  priority = false,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const shouldLoad = priority || isIntersecting;

  return (
    <div ref={ref as any} className={`relative ${className}`}>
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