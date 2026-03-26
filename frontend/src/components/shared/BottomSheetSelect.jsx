import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function BottomSheetSelect({
  open,
  onOpenChange,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  options,
  renderOption,
  children,
}) {
  const contentRef = useRef(null);
  const startYRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      const delta = endY - startYRef.current;
      if (delta > 50) {
        onOpenChange(false);
      }
    };

    if (open && contentRef.current) {
      contentRef.current.addEventListener('touchstart', handleTouchStart);
      contentRef.current.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('touchstart', handleTouchStart);
        contentRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [open, onOpenChange]);

  const filteredOptions = options && searchQuery
    ? options.filter(opt =>
        (opt.label || opt.name || opt.value || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const sheetVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  };

  return (
    <>
      {children && (
        <button
          onClick={() => onOpenChange(true)}
          className="w-full text-left"
        >
          {children}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              ref={contentRef}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-w-lg mx-auto shadow-2xl"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ 
                maxHeight: '70vh',
                // Prevent keyboard from pushing the sheet
                position: 'fixed',
                bottom: 0
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>

              {/* Content */}
              <div className="px-4 pt-2 pb-6 flex flex-col h-full" style={{ maxHeight: 'calc(70vh - 24px)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h2 className="text-lg font-semibold">{placeholder || 'Select option'}</h2>
                    <button
                      onClick={() => onOpenChange(false)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label="Close bottom sheet"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                {/* Search input if many options */}
                {options && options.length > 5 && (
                  <div className="mb-3 relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={searchPlaceholder || 'Search...'}
                      className="pl-10 rounded-xl"
                      id="bottom-sheet-search"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}

                {/* Options list - scrollable area starting from top */}
                <div 
                  className="flex-1 overflow-y-auto space-y-2 overscroll-contain -mx-4 px-4"
                  style={{ 
                    maxHeight: 'calc(70vh - 140px)',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {filteredOptions?.map((option) => (
                    <button
                      key={option.id || option.value}
                      onClick={() => {
                        onValueChange(option.id || option.value);
                        onOpenChange(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        value === (option.id || option.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border hover:border-primary/50'
                      }`}
                    >
                      {renderOption
                        ? renderOption(option)
                        : option.label || option.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}