'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Carousel, { CarouselHandle } from './Carousel';
import CardViewer from './CardViewer';
import type { PlaylistWithStats } from '@/types';

interface CardRect {
  centerX: number;
  centerY: number;
  rotateY: number;
  skewY: number;
  scale: number;
  yOffset: number;
}

const CARD_COUNT = 36;

export default function MarqueeCards() {
  const [playlists, setPlaylists] = useState<PlaylistWithStats[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithStats | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [sourceRect, setSourceRect] = useState<CardRect | null>(null);
  const carouselRef = useRef<CarouselHandle>(null);

  useEffect(() => {
    fetch('/api/playlists')
      .then((res) => res.json())
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(() => {});
  }, []);

  // Build an image URL array that cycles playlists across all 36 cards
  const imageUrls = playlists.length > 0
    ? Array.from({ length: CARD_COUNT }, (_, i) => playlists[i % playlists.length]?.cover_art_url ?? null)
    : undefined;

  const handleCardClick = useCallback((cardId: number, rect: CardRect) => {
    if (playlists.length === 0) return;
    const playlist = playlists[cardId % playlists.length];
    setSelectedPlaylist(playlist);
    setSelectedCardId(cardId);
    setSourceRect(rect);
    setIsViewerOpen(true);
  }, [playlists]);

  const handleCloseViewer = useCallback(() => {
    carouselRef.current?.resetAllCards();
    setIsViewerOpen(false);
    setSelectedCardId(null);
    setSelectedPlaylist(null);
    setSourceRect(null);
  }, []);

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
      <CardViewer
        isOpen={isViewerOpen}
        playlist={selectedPlaylist}
        sourceRect={sourceRect}
        onClose={handleCloseViewer}
      />

      <Carousel
        ref={carouselRef}
        cardCount={CARD_COUNT}
        imageUrls={imageUrls}
        isPaused={isViewerOpen}
        selectedCardId={selectedCardId}
        onCardClick={handleCardClick}
      />
    </>
  );
}
