'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, animate, useTransform } from 'motion/react';

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

// Sample data for cards
const getCardData = (id: number) => {
  const titles = ['Summer Vibes', 'Late Night Drives', 'Morning Coffee', 'Workout Mix', 'Chill Beats'];
  const users = ['@melodylover', '@nightowl', '@coffeeaddict', '@fitnessguru', '@chillmaster'];
  const descriptions = [
    'A collection of warm, sunny tracks perfect for beach days and road trips.',
    'The perfect soundtrack for those late night drives through the city.',
    'Gentle acoustic melodies to start your morning right.',
    'High-energy beats to power through your workout session.',
    'Relaxing lo-fi beats for studying and unwinding.',
  ];
  
  const index = id % 5;
  return {
    title: titles[index],
    date: 'Dec 8, 2024',
    description: descriptions[index],
    username: users[index],
  };
};

export default function CardViewer({ 
  isOpen, 
  cardId, 
  sourceRect, 
  onClose,
}: CardViewerProps) {
  const [showContent, setShowContent] = useState(false);
  
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
  
  // Content animation progress (0 to 1)
  const contentProgress = useSpring(0, { stiffness: 100, damping: 20 });
  
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
    setShowContent(false);
    contentProgress.set(0);
    
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
      animate(size, targetSize, { duration, ease, onComplete: () => {
        isAnimating.current = false;
        setShowContent(true);
        contentProgress.set(1);
      }}),
    ];
    
    // Springs will animate transforms smoothly
    rotateY.set(0);
    skewY.set(0);
    scale.set(1);
  }, [sourceRect, cancelAnimations, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity, contentProgress]);

  // Animate to closed state
  const animateClose = useCallback(() => {
    if (!sourceRect) {
      onClose();
      return;
    }
    
    cancelAnimations();
    isAnimating.current = true;
    
    // Hide content first
    contentProgress.set(0);
    
    const duration = 0.4;
    const ease = [0.32, 0.72, 0, 1] as const;

    overlayOpacity.set(0);
    
    // Small delay before card animates back
    setTimeout(() => {
      setShowContent(false);
      
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
    }, 150);
  }, [sourceRect, cancelAnimations, onClose, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity, contentProgress]);

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

  const cardData = cardId !== null ? getCardData(cardId) : null;

  return (
    <>
      {/* Overlay backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/80"
        style={{ opacity: overlayOpacity }}
        onClick={handleClose}
      />

      {/* Text content - positioned absolutely to the right of center */}
      {showContent && cardData && (
        <div 
          className="fixed z-[55]"
          style={{
            // Position: center of screen + half card width + gap
            left: `calc(50% + 240px + 48px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 380,
          }}
        >
          <SlideAnimation progress={contentProgress} data={cardData} />
        </div>
      )}

      {/* Flying card - positioned by center, with matching transforms */}
      <motion.div
        className="fixed z-[60] shadow-2xl cursor-pointer bg-white"
        style={{
          left: x,
          top: y,
          width: size,
          height: size,
          x: '-50%',
          y: '-50%',
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
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
          <span className="text-gray-400">Card #{cardId}</span>
        </div>
      </motion.div>
    </>
  );
}

// Slide animation - text slides in from behind the card
function SlideAnimation({ progress, data }: { progress: ReturnType<typeof useSpring>; data: { title: string; date: string; description: string; username: string } }) {
  // Start behind the card (negative X, since card is to our left) and slide to final position
  const baseX = useTransform(progress, [0, 1], [-500, 0]);
  const opacity = useTransform(progress, [0, 0.4, 1], [0, 0, 1]);
  
  return (
    <motion.div style={{ x: baseX, opacity }} className="text-white">
      <motion.h2 
        className="text-4xl font-bold"
        style={{ 
          x: useTransform(progress, [0, 1], [-60, 0]),
          opacity: useTransform(progress, [0, 0.3, 0.7], [0, 0, 1])
        }}
      >
        {data.title}
      </motion.h2>
      <motion.p 
        className="mt-2 text-sm text-gray-400"
        style={{ 
          x: useTransform(progress, [0, 1], [-45, 0]),
          opacity: useTransform(progress, [0, 0.4, 0.8], [0, 0, 1])
        }}
      >
        {data.date}
      </motion.p>
      <motion.p 
        className="mt-4 text-gray-300 leading-relaxed"
        style={{ 
          x: useTransform(progress, [0, 1], [-30, 0]),
          opacity: useTransform(progress, [0, 0.5, 0.9], [0, 0, 1])
        }}
      >
        {data.description}
      </motion.p>
      <motion.p 
        className="mt-6 text-sm font-medium text-gray-400"
        style={{ 
          x: useTransform(progress, [0, 1], [-15, 0]),
          opacity: useTransform(progress, [0, 0.6, 1], [0, 0, 1])
        }}
      >
        {data.username}
      </motion.p>
    </motion.div>
  );
}
