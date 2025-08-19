import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const BottomSheet = ({ isOpen, onClose, children, className }: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlaysElement = document.getElementById('overlays');
  const shouldUseInline = !overlaysElement || import.meta.env.VITE_INLINE_OVERLAYS === 'true';

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.classList.add('body-scroll-lock');
      
      // Focus trap
      const firstFocusable = sheetRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    } else {
      document.body.classList.remove('body-scroll-lock');
    }

    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sheetContent = (
    <div 
      className={cn(
        "fixed inset-0 z-overlay flex items-end justify-center",
        shouldUseInline && "absolute"
      )}
      style={{ zIndex: shouldUseInline ? 2147483647 : undefined }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative bg-background rounded-t-3xl shadow-xl max-w-card w-full max-h-[90vh] overflow-hidden",
          "animate-slide-up",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal if overlays element exists, otherwise render inline
  if (shouldUseInline) {
    return sheetContent;
  }

  return createPortal(sheetContent, overlaysElement);
};

export default BottomSheet;