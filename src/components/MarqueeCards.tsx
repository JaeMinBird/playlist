'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function MarqueeCards() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomedCardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marqueeRef.current) return;

    const marquee = marqueeRef.current;
    const cards = marquee.querySelectorAll('.card');

    // Initialize card transforms with GSAP
    gsap.set(cards, {
      transformPerspective: 1143,
      rotateY: -50,
      skewY: 20,
      opacity: 0.7,
    });

    // Calculate total width
    const cardWidth = (cards[0] as HTMLElement).offsetWidth;
    const gap = 7.2;
    const totalWidth = (cardWidth + gap) * 12;

    // Infinite scroll animation
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(marquee, { x: 0 }, { x: -totalWidth, duration: totalWidth / 40, ease: 'none' });
    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed && zoomedCardRef.current) {
        handleCardClick({ currentTarget: zoomedCardRef.current } as any);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isZoomed]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) return;
    gsap.to(e.currentTarget, {
      transformPerspective: 1143,
      y: -60,
      rotateY: -40,
      skewY: 14,
      scale: 1.05,
      opacity: 0.9,
      duration: 0.5,
      ease: 'power3.out',
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) return;
    gsap.to(e.currentTarget, {
      transformPerspective: 1143,
      y: 0,
      rotateY: -50,
      skewY: 20,
      scale: 1,
      opacity: 0.7,
      duration: 0.5,
      ease: 'power3.out',
    });
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) {
      // Zoom out
      if (zoomedCardRef.current && timelineRef.current) {
        // Fade out overlay
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
              if (overlayRef.current) {
                overlayRef.current.style.pointerEvents = 'none';
              }
            },
          });
        }

        gsap.to(zoomedCardRef.current, {
          transformPerspective: 1143,
          x: 0,
          y: 0,
          rotateY: -50,
          skewY: 20,
          scale: 1,
          opacity: 0.7,
          zIndex: 0,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            timelineRef.current?.play();
            setIsZoomed(false);
            zoomedCardRef.current = null;
          },
        });
      }
    } else {
      // Zoom in
      const card = e.currentTarget;
      zoomedCardRef.current = card;
      setIsZoomed(true);

      // Pause carousel
      timelineRef.current?.pause();

      // Fade in overlay
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'auto';
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      // Get card position
      const rect = card.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      // Calculate translation to center
      const translateX = centerX - cardCenterX;
      const translateY = centerY - cardCenterY;

      gsap.to(card, {
        transformPerspective: 1143,
        x: translateX,
        y: translateY,
        rotateY: 0,
        skewY: 0,
        scale: 3,
        opacity: 1,
        zIndex: 50,
        duration: 0.8,
        ease: 'power3.inOut',
      });
    }
  };

  // Create 36 cards (3 sets of 12)
  const cards = Array.from({ length: 36 }, (_, i) => i);

  return (
    <>
      {/* Overlay when zoomed */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/80 pointer-events-none"
        style={{ opacity: 0 }}
        onClick={() => isZoomed && zoomedCardRef.current && handleCardClick({ currentTarget: zoomedCardRef.current } as any)}
      />
      
      <div className="relative w-full pb-12 pt-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-white via-white/80 to-transparent" />

        <div ref={marqueeRef} className="flex" style={{ gap: '7.2px' }}>
          {cards.map((i) => (
            <div
              key={i}
              className="card h-40 w-40 flex-shrink-0 cursor-pointer bg-white shadow-xl transition-shadow hover:shadow-2xl"
              style={{
                willChange: 'transform',
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </>
  );
}
