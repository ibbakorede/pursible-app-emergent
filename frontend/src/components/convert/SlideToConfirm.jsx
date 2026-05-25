/**
 * SlideToConfirm - Swipe-to-confirm button with keyboard accessibility
 */
import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export default function SlideToConfirm({ 
  onConfirm, 
  isSubmitting,
  disabled = false 
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  
  // Track width dynamically
  const [trackWidth, setTrackWidth] = useState(300);
  const knobSize = 48;
  const maxDrag = trackWidth - knobSize - 8; // 8px for padding
  
  // Transform for opacity of text as knob moves
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.7, maxDrag], [0, 1]);
  
  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.85) {
      // Complete the slide
      animate(x, maxDrag, { duration: 0.2 });
      setIsCompleted(true);
      onConfirm();
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !disabled && !isSubmitting) {
      setIsCompleted(true);
      onConfirm();
    }
  };
  
  // Measure container on mount
  const measureContainer = (node) => {
    if (node) {
      containerRef.current = node;
      setTrackWidth(node.offsetWidth);
    }
  };

  if (isSubmitting) {
    return (
      <div 
        className="w-full h-14 rounded-full flex items-center justify-center gap-2"
        style={{ background: '#5C6B3E' }}
      >
        <Loader2 className="w-5 h-5 animate-spin text-white" />
        <span className="text-white font-semibold">Converting...</span>
      </div>
    );
  }

  return (
    <div
      ref={measureContainer}
      className="relative w-full h-14 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ 
        background: '#5C6B3E',
        focusRingColor: '#7A8C54'
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Slide to confirm conversion"
      data-testid="slide-to-confirm"
    >
      {/* Background text */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-white font-semibold flex items-center gap-2">
          Slide to confirm
          <ArrowRight className="w-4 h-4" />
        </span>
      </motion.div>
      
      {/* Check mark when completed */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: checkOpacity }}
      >
        <Check className="w-6 h-6 text-white" />
      </motion.div>
      
      {/* Draggable knob */}
      <motion.div
        className="absolute top-1 left-1 w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        {isCompleted ? (
          <Check className="w-5 h-5" style={{ color: '#5C6B3E' }} />
        ) : (
          <ArrowRight className="w-5 h-5" style={{ color: '#5C6B3E' }} />
        )}
      </motion.div>
    </div>
  );
}
