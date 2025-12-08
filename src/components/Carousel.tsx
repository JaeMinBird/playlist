'use client';

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, useSpring } from 'motion/react';

interface CardRect {
  // Original untransformed position (center point)
  centerX: number;
  centerY: number;
  // Current transform values
  rotateY: number;
  skewY: number;
  scale: number;
  yOffset: number;
}

interface CarouselProps {
  cardCount?: number;
  isPaused?: boolean;
  onCardClick?: (cardId: number, rect: CardRect) => void;
  selectedCardId?: number | null;
}

export interface CarouselHandle {
  resetAllCards: () => void;
}

// Individual card component with motion
const CarouselCard = forwardRef<
  { reset: () => void },
  { 
    id: number; 
    isPaused: boolean;
    isHidden: boolean;
    onClick: (id: number, rect: CardRect) => void;
  }
>(({ id, isPaused, isHidden, onClick }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  // Spring-based hover animations
  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(-50, { stiffness: 200, damping: 25 });
  const skewY = useSpring(20, { stiffness: 200, damping: 25 });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });
  const opacity = useSpring(0.7, { stiffness: 300, damping: 30 });

  // Track current values for click handler
  const currentState = useRef({ rotateY: -50, skewY: 20, scale: 1, yOffset: 0 });

  // Update tracked state when springs change
  useEffect(() => {
    const unsubRotateY = rotateY.on('change', (v) => { currentState.current.rotateY = v; });
    const unsubSkewY = skewY.on('change', (v) => { currentState.current.skewY = v; });
    const unsubScale = scale.on('change', (v) => { currentState.current.scale = v; });
    const unsubY = y.on('change', (v) => { currentState.current.yOffset = v; });
    
    return () => {
      unsubRotateY();
      unsubSkewY();
      unsubScale();
      unsubY();
    };
  }, [rotateY, skewY, scale, y]);

  // Check if cursor is within card bounds
  const isCursorOverCard = useCallback(() => {
    if (!cardRef.current) return false;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = (window as any).__cursorX ?? -1;
    const mouseY = (window as any).__cursorY ?? -1;
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }, []);

  // Expose reset function - but apply hover state if cursor is still on card
  useImperativeHandle(ref, () => ({
    reset: () => {
      // Check both: direct hover tracking AND cursor position over card bounds
      // The latter handles when cursor is over the viewer card that's positioned over this card
      if (isHoveredRef.current || isCursorOverCard()) {
        // Cursor is on/over this card, apply hover effect
        isHoveredRef.current = true; // Sync the ref
        y.set(-60);
        rotateY.set(-40);
        skewY.set(14);
        scale.set(1.05);
        opacity.set(0.9);
      } else {
        // Cursor is not on this card, reset to default
        y.set(0);
        rotateY.set(-50);
        skewY.set(20);
        scale.set(1);
        opacity.set(0.7);
      }
    }
  }));

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    if (isPaused) return;
    y.set(-60);
    rotateY.set(-40);
    skewY.set(14);
    scale.set(1.05);
    opacity.set(0.9);
  }, [isPaused, y, rotateY, skewY, scale, opacity]);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (isPaused) return;
    y.set(0);
    rotateY.set(-50);
    skewY.set(20);
    scale.set(1);
    opacity.set(0.7);
  }, [isPaused, y, rotateY, skewY, scale, opacity]);

  const handleClick = useCallback(() => {
    if (!cardRef.current) return;
    
    // Get the element's position in the document
    const rect = cardRef.current.getBoundingClientRect();
    const state = currentState.current;
    
    // The center of the bounding box is where our card visually appears
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    onClick(id, {
      centerX,
      centerY,
      rotateY: state.rotateY,
      skewY: state.skewY,
      scale: state.scale,
      yOffset: state.yOffset,
    });
  }, [id, onClick]);

  return (
    <motion.div
      ref={cardRef}
      data-card-id={id}
      className="h-40 w-40 flex-shrink-0 cursor-pointer shadow-xl bg-white"
      style={{
        y,
        rotateY,
        skewY,
        scale,
        opacity: isHidden ? 0 : opacity,
        perspective: 1143,
        transformStyle: 'preserve-3d',
        border: '1px solid black',
        backfaceVisibility: 'hidden',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
    />
  );
});

CarouselCard.displayName = 'CarouselCard';

const Carousel = forwardRef<CarouselHandle, CarouselProps>(({ 
  cardCount = 36, 
  isPaused = false, 
  onCardClick,
  selectedCardId = null,
}, ref) => {
  const cardRefs = useRef<{ reset: () => void }[]>([]);

  // Track global cursor position for hover detection after viewer closes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      (window as any).__cursorX = e.clientX;
      (window as any).__cursorY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate dimensions
  const cardWidth = 160;
  const gap = 7.2;
  const singleSetWidth = (cardWidth + gap) * 12;
  const duration = singleSetWidth / 40; // seconds

  // Expose reset function to parent
  useImperativeHandle(ref, () => ({
    resetAllCards: () => {
      cardRefs.current.forEach(cardRef => cardRef?.reset());
    }
  }));

  const handleCardClick = useCallback((id: number, rect: CardRect) => {
    onCardClick?.(id, rect);
  }, [onCardClick]);

  // Create cards array
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div className="relative w-full py-20">
      {/* Fade gradients on sides */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-gradient-to-r from-white via-white/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-32 bg-gradient-to-l from-white via-white/80 to-transparent" />

      {/* Scrolling marquee container */}
      <div className="overflow-visible">
        <div 
          className="flex"
          style={{ 
            gap: `${gap}px`,
            animation: `carousel-scroll ${duration}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {cards.map((i) => (
            <CarouselCard
              key={i}
              ref={(el) => { if (el) cardRefs.current[i] = el; }}
              id={i}
              isPaused={isPaused}
              isHidden={selectedCardId === i}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* CSS Keyframes for carousel scroll */}
      <style>{`
        @keyframes carousel-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-${singleSetWidth}px, 0, 0);
          }
        }
      `}</style>
    </div>
  );
});

Carousel.displayName = 'Carousel';

export default Carousel;
