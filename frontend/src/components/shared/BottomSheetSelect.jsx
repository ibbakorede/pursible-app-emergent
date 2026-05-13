import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

// Animation constants - extracted from inline objects
const BACKDROP_INITIAL = { opacity: 0 };
const BACKDROP_ANIMATE = { opacity: 1 };
const BACKDROP_EXIT = { opacity: 0 };
const SHEET_INITIAL = { y: '100%' };
const SHEET_ANIMATE = { y: 0 };
const SHEET_EXIT = { y: '100%' };
const SHEET_TRANSITION = { type: 'spring', damping: 30, stiffness: 300 };

// Style constants
const SHEET_STYLE = { maxHeight: '75vh' };
const LIST_STYLE = { maxHeight: 'calc(75vh - 140px)' };

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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const filteredOptions = options && searchQuery
    ? options.filter(opt =>
        (opt.label || opt.name || opt.value || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <>
      {children && (
        <button
          onClick={() => onOpenChange(true)}
          className="w-full text-left"
          type="button"
        >
          {children}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[100]"
              initial={BACKDROP_INITIAL}
              animate={BACKDROP_ANIMATE}
              exit={BACKDROP_EXIT}
              onClick={() => onOpenChange(false)}
            />
            
            {/* Sheet */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[101] bg-background rounded-t-3xl shadow-2xl"
              initial={SHEET_INITIAL}
              animate={SHEET_ANIMATE}
              exit={SHEET_EXIT}
              transition={SHEET_TRANSITION}
              style={SHEET_STYLE}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-lg font-bold">{placeholder || 'Select option'}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Close"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input */}
              {options && options.length > 5 && (
                <div className="px-4 pb-3">
                  <div 
                    className="relative flex items-center bg-muted rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                    onClick={handleSearchClick}
                  >
                    <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={searchPlaceholder || 'Search...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent pl-11 pr-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <div 
                ref={listRef}
                className="overflow-y-auto overscroll-contain px-4 pb-6"
                style={LIST_STYLE}
              >
                <div className="space-y-2">
                  {filteredOptions?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No results found</p>
                  ) : (
                    filteredOptions?.map((option) => (
                      <button
                        key={option.id || option.value}
                        onClick={() => {
                          onValueChange(option.id || option.value);
                          onOpenChange(false);
                        }}
                        type="button"
                        className={`w-full text-left px-4 py-3.5 rounded-xl transition-all ${
                          value === (option.id || option.value)
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'bg-card border border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        {renderOption
                          ? renderOption(option)
                          : <span className="font-medium">{option.label || option.name}</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
