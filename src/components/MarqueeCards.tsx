'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Carousel, { CarouselHandle } from './Carousel';
import CardViewer from './CardViewer';

interface CardRect {
  centerX: number;
  centerY: number;
  rotateY: number;
  skewY: number;
  scale: number;
  yOffset: number;
}

export default function MarqueeCards() {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [sourceRect, setSourceRect] = useState<CardRect | null>(null);
  const carouselRef = useRef<CarouselHandle>(null);

  const handleCardClick = useCallback((cardId: number, rect: CardRect) => {
    setSelectedCardId(cardId);
    setSourceRect(rect);
    setIsViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    carouselRef.current?.resetAllCards();
    setIsViewerOpen(false);
    setSelectedCardId(null);
    setSourceRect(null);
  }, []);

  // Reset cards on ESC press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isViewerOpen) {
        carouselRef.current?.resetAllCards();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isViewerOpen]);

  return (
    <>
      {/* Card Viewer */}
      <CardViewer
        isOpen={isViewerOpen}
        cardId={selectedCardId}
        sourceRect={sourceRect}
        onClose={handleCloseViewer}
      />

      {/* Carousel */}
      <Carousel
        ref={carouselRef}
        cardCount={36}
        isPaused={isViewerOpen}
        selectedCardId={selectedCardId}
        onCardClick={handleCardClick}
      />
    </>
  );
}
