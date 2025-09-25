import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for search inputs and API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        // forward parameters to original callback
        // we intentionally ignore the return value to keep signature simple
        // and behavior-preserving for typical event callbacks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(callback as unknown as (...a: Parameters<T>) => unknown)(...args)
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );

  return throttled;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref: elementRef, isIntersecting, entry };
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll
  };
}

// Memory optimization hook
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // Wrap original callback to satisfy useCallback typing without using `any`.
  const wrapped = useCallback((...args: Parameters<T>) => {
    return (callback as unknown as (...a: Parameters<T>) => ReturnType<T>)(...args)
  }, deps)

  return wrapped as unknown as T
}

// Image preloading hook
export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) return;

    setLoadingImages(prev => new Set(prev).add(url));

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(url));
      setLoadingImages(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    };
    img.onerror = () => {
      setLoadingImages(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    };
    img.src = url;
  }, [loadedImages, loadingImages]);

  useEffect(() => {
    imageUrls.forEach(preloadImage);
  }, [imageUrls, preloadImage]);

  return {
    loadedImages,
    loadingImages,
    preloadImage,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url)
  };
}