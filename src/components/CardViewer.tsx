'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'motion/react';

interface CardRect {
  centerX: number;
  centerY: number;
  rotateY: number;
  skewY: number;
  scale: number;
  yOffset: number;
}

interface CardViewerProps {
  isOpen: boolean;
  cardId: number | null;
  sourceRect: CardRect | null;
  onClose: () => void;
}

export default function CardViewer({ 
  isOpen, 
  cardId, 
  sourceRect, 
  onClose,
}: CardViewerProps) {
  // Position (center-based for easier transform handling)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Size
  const size = useMotionValue(160);
  
  // Transforms - use springs for smooth interpolation
  const rotateY = useSpring(-50, { stiffness: 150, damping: 20 });
  const skewY = useSpring(20, { stiffness: 150, damping: 20 });
  const scale = useSpring(1, { stiffness: 150, damping: 20 });
  
  // Opacity
  const cardOpacity = useMotionValue(0);
  const overlayOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  
  // Track animation state
  const isAnimating = useRef(false);
  const hasOpened = useRef(false);
  const animationControls = useRef<ReturnType<typeof animate>[]>([]);

  // Cancel all running animations
  const cancelAnimations = useCallback(() => {
    animationControls.current.forEach(ctrl => ctrl?.stop());
    animationControls.current = [];
  }, []);

  // Animate to open state
  const animateOpen = useCallback(() => {
    if (!sourceRect) return;
    
    cancelAnimations();
    isAnimating.current = true;
    hasOpened.current = true;
    
    const targetSize = 480;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const duration = 0.5;
    const ease = [0.32, 0.72, 0, 1] as const;

    // Start at the source card's position with same transforms
    x.set(sourceRect.centerX);
    y.set(sourceRect.centerY);
    size.set(160 * sourceRect.scale);
    
    // Match source transforms exactly
    rotateY.set(sourceRect.rotateY);
    skewY.set(sourceRect.skewY);
    scale.set(sourceRect.scale);
    
    cardOpacity.set(1);
    overlayOpacity.set(1);
    
    // Animate to center with no transforms
    animationControls.current = [
      animate(x, centerX, { duration, ease }),
      animate(y, centerY, { duration, ease }),
      animate(size, targetSize, { duration, ease }),
    ];
    
    // Springs will animate transforms smoothly
    rotateY.set(0);
    skewY.set(0);
    scale.set(1);
    
    // Track completion
    setTimeout(() => {
      isAnimating.current = false;
    }, duration * 1000);
  }, [sourceRect, cancelAnimations, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity]);

  // Animate to closed state
  const animateClose = useCallback(() => {
    if (!sourceRect) {
      onClose();
      return;
    }
    
    cancelAnimations();
    isAnimating.current = true;
    
    const duration = 0.4;
    const ease = [0.32, 0.72, 0, 1] as const;

    overlayOpacity.set(0);
    
    // Animate back to source position
    animationControls.current = [
      animate(x, sourceRect.centerX, { duration, ease }),
      animate(y, sourceRect.centerY, { duration, ease }),
      animate(size, 160 * sourceRect.scale, { duration, ease, onComplete: () => {
        cardOpacity.set(0);
        isAnimating.current = false;
        hasOpened.current = false;
        onClose();
      }}),
    ];
    
    // Springs animate transforms back
    rotateY.set(sourceRect.rotateY);
    skewY.set(sourceRect.skewY);
    scale.set(sourceRect.scale);
  }, [sourceRect, cancelAnimations, onClose, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity]);

  // Handle open/close state changes
  useEffect(() => {
    if (isOpen && sourceRect && !hasOpened.current) {
      animateOpen();
    }
  }, [isOpen, sourceRect, animateOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isOpen || isAnimating.current)) {
        animateClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, animateClose]);

  // Handle click to close
  const handleClose = useCallback(() => {
    animateClose();
  }, [animateClose]);

  // Don't render if completely closed
  if (!isOpen && cardId === null && !hasOpened.current) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/80"
        style={{ opacity: overlayOpacity }}
        onClick={handleClose}
      />

      {/* Flying card - positioned by center, with matching transforms */}
      <motion.div
        className="fixed z-[60] bg-white shadow-2xl cursor-pointer"
        style={{
          // Position by center using translate
          left: x,
          top: y,
          width: size,
          height: size,
          x: '-50%',
          y: '-50%',
          // Apply same transforms as carousel cards
          rotateY,
          skewY,
          scale,
          opacity: cardOpacity,
          perspective: 1143,
          transformStyle: 'preserve-3d',
          border: '1px solid black',
        }}
        onClick={handleClose}
      >
        {/* Card content */}
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          Card #{cardId}
        </div>
      </motion.div>
    </>
  );
}
