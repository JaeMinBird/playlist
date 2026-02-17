'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, animate, useTransform } from 'motion/react';
import type { PlaylistWithStats, Song } from '@/types';

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
  playlist: PlaylistWithStats | null;
  sourceRect: CardRect | null;
  onClose: () => void;
}

const CARD_SIZE = 480;
const GAP = 40;
const TEXT_WIDTH = 340;
const LAYOUT_WIDTH = CARD_SIZE + GAP + TEXT_WIDTH;
const CARD_CENTER_OFFSET = LAYOUT_WIDTH / 2 - CARD_SIZE / 2; // 190

function formatDuration(ms: number | null): string {
  if (!ms) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ViewerTrackRow({ song, index }: { song: Song; index: number }) {
  return (
    <tr className="border-b border-white/10 last:border-b-0">
      <td className="py-2.5 pr-4 text-xs text-gray-500 tabular-nums text-right w-10">
        {index + 1}
      </td>
      <td className="py-2.5 pr-4">
        <p className="text-sm text-white truncate">{song.name}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist_name}</p>
      </td>
      <td className="py-2.5 pr-4 text-sm text-gray-500 truncate max-w-[200px]">
        {song.album_name ?? '—'}
      </td>
      <td className="py-2.5 pr-4 text-xs text-gray-500 whitespace-nowrap">
        {formatDate(song.added_at)}
      </td>
      <td className="py-2.5 text-xs text-gray-500 tabular-nums text-right whitespace-nowrap">
        {formatDuration(song.duration_ms)}
      </td>
    </tr>
  );
}

// Text info that slides in from behind the card
function SlideInfo({
  progress,
  playlist,
}: {
  progress: ReturnType<typeof useSpring>;
  playlist: PlaylistWithStats;
}) {
  const baseX = useTransform(progress, [0, 1], [-500, 0]);
  const opacity = useTransform(progress, [0, 0.4, 1], [0, 0, 1]);

  return (
    <motion.div style={{ x: baseX, opacity }} className="text-white">
      <motion.h2
        className="text-4xl font-bold"
        style={{
          x: useTransform(progress, [0, 1], [-60, 0]),
          opacity: useTransform(progress, [0, 0.3, 0.7], [0, 0, 1]),
        }}
      >
        {playlist.name}
      </motion.h2>
      <motion.p
        className="mt-2 text-sm text-gray-400"
        style={{
          x: useTransform(progress, [0, 1], [-45, 0]),
          opacity: useTransform(progress, [0, 0.4, 0.8], [0, 0, 1]),
        }}
      >
        {playlist.song_count} song{playlist.song_count !== 1 ? 's' : ''}
        <span className="mx-1.5">·</span>
        {formatTotalDuration(playlist.total_duration_ms)}
      </motion.p>
      {playlist.description && (
        <motion.p
          className="mt-4 text-gray-300 leading-relaxed"
          style={{
            x: useTransform(progress, [0, 1], [-30, 0]),
            opacity: useTransform(progress, [0, 0.5, 0.9], [0, 0, 1]),
          }}
        >
          {playlist.description}
        </motion.p>
      )}
      <motion.p
        className="mt-6 text-sm font-medium text-gray-500"
        style={{
          x: useTransform(progress, [0, 1], [-15, 0]),
          opacity: useTransform(progress, [0, 0.6, 1], [0, 0, 1]),
        }}
      >
        Created {formatDate(playlist.created_at)}
      </motion.p>
    </motion.div>
  );
}

function ScrollIndicator({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) {
        setVisible(false);
        return;
      }

      const trackTop = clientHeight / 2 - CARD_SIZE / 2;
      const table = el.querySelector('table');
      const trackBottom = table
        ? Math.min(clientHeight, table.getBoundingClientRect().bottom)
        : clientHeight - 32;
      const trackLen = trackBottom - trackTop;

      if (trackLen <= 0) {
        setVisible(false);
        return;
      }

      if (trackRef.current) {
        trackRef.current.style.top = `${trackTop}px`;
        trackRef.current.style.height = `${trackLen}px`;
      }

      const ratio = clientHeight / scrollHeight;
      const thumbHeight = Math.max(ratio * trackLen, 24);
      const maxScroll = scrollHeight - clientHeight;
      const progress = scrollTop / maxScroll;
      const thumbTravel = trackLen - thumbHeight;

      if (thumbRef.current) {
        thumbRef.current.style.height = `${thumbHeight}px`;
        thumbRef.current.style.transform = `translateY(${progress * thumbTravel}px)`;
      }

      setVisible(true);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    el.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      el.removeEventListener('scroll', update);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [scrollRef]);

  return (
    <div
      ref={trackRef}
      className="fixed z-[56] pointer-events-none"
      style={{
        left: `calc(50% + ${LAYOUT_WIDTH / 2 + 16}px)`,
        width: 2,
      }}
    >
      <div
        ref={thumbRef}
        className="w-full rounded-full transition-opacity duration-500"
        style={{
          opacity: visible ? 1 : 0,
          background: 'rgba(255,255,255,0.3)',
        }}
      />
    </div>
  );
}

export default function CardViewer({
  isOpen,
  playlist,
  sourceRect,
  onClose,
}: CardViewerProps) {
  const [showContent, setShowContent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Flying card motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const size = useMotionValue(160);
  const rotateY = useSpring(-50, { stiffness: 150, damping: 20 });
  const skewY = useSpring(20, { stiffness: 150, damping: 20 });
  const scale = useSpring(1, { stiffness: 150, damping: 20 });
  const cardOpacity = useMotionValue(0);
  const overlayOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  // Content slide-in progress
  const contentProgress = useSpring(0, { stiffness: 100, damping: 20 });

  const isAnimating = useRef(false);
  const hasOpened = useRef(false);
  const animationControls = useRef<ReturnType<typeof animate>[]>([]);

  const cancelAnimations = useCallback(() => {
    animationControls.current.forEach((ctrl) => ctrl?.stop());
    animationControls.current = [];
  }, []);

  const animateOpen = useCallback(() => {
    if (!sourceRect) return;

    cancelAnimations();
    isAnimating.current = true;
    hasOpened.current = true;
    setShowContent(false);
    contentProgress.set(0);

    const targetSize = CARD_SIZE;
    const centerX = window.innerWidth / 2 - CARD_CENTER_OFFSET;
    const centerY = window.innerHeight / 2;
    const duration = 0.5;
    const ease = [0.32, 0.72, 0, 1] as const;

    x.set(sourceRect.centerX);
    y.set(sourceRect.centerY);
    size.set(160 * sourceRect.scale);
    rotateY.set(sourceRect.rotateY);
    skewY.set(sourceRect.skewY);
    scale.set(sourceRect.scale);
    cardOpacity.set(1);
    overlayOpacity.set(1);

    animationControls.current = [
      animate(x, centerX, { duration, ease }),
      animate(y, centerY, { duration, ease }),
      animate(size, targetSize, {
        duration,
        ease,
        onComplete: () => {
          isAnimating.current = false;
          setShowContent(true);
          contentProgress.set(1);
        },
      }),
    ];

    rotateY.set(0);
    skewY.set(0);
    scale.set(1);
  }, [sourceRect, cancelAnimations, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity, contentProgress]);

  const animateClose = useCallback(() => {
    if (!sourceRect) {
      onClose();
      return;
    }

    cancelAnimations();
    isAnimating.current = true;

    contentProgress.set(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    const duration = 0.4;
    const ease = [0.32, 0.72, 0, 1] as const;

    overlayOpacity.set(0);

    setTimeout(() => {
      setShowContent(false);

      animationControls.current = [
        animate(x, sourceRect.centerX, { duration, ease }),
        animate(y, sourceRect.centerY, { duration, ease }),
        animate(size, 160 * sourceRect.scale, {
          duration,
          ease,
          onComplete: () => {
            cardOpacity.set(0);
            isAnimating.current = false;
            hasOpened.current = false;
            onClose();
          },
        }),
      ];

      rotateY.set(sourceRect.rotateY);
      skewY.set(sourceRect.skewY);
      scale.set(sourceRect.scale);
    }, 150);
  }, [sourceRect, cancelAnimations, onClose, x, y, size, rotateY, skewY, scale, cardOpacity, overlayOpacity, contentProgress]);

  useEffect(() => {
    if (isOpen && sourceRect && !hasOpened.current) {
      animateOpen();
    }
  }, [isOpen, sourceRect, animateOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isOpen || isAnimating.current)) {
        animateClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, animateClose]);

  const handleClose = useCallback(() => {
    animateClose();
  }, [animateClose]);

  if (!isOpen && playlist === null && !hasOpened.current) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/80"
        style={{ opacity: overlayOpacity }}
        onClick={handleClose}
      />

      {/* Scrollable content layer (appears after fly-in animation) */}
      {showContent && playlist && (
        <>
        <ScrollIndicator scrollRef={scrollRef} />
        <div
          ref={scrollRef}
          className="fixed inset-0 z-[55] overflow-y-auto hide-scrollbar"
          style={{ scrollbarWidth: 'none' }}
          onClick={handleClose}
        >
          <div
            className="min-h-full"
            style={{ paddingTop: `calc(50vh - ${CARD_SIZE / 2}px)` }}
          >
            {/* Top row: cover art + text info */}
            <div
              className="flex items-start mx-auto"
              style={{
                width: LAYOUT_WIDTH,
                gap: GAP,
              }}
            >
              {/* Static card replica */}
              <div
                className="flex-shrink-0 bg-white shadow-2xl overflow-hidden cursor-pointer"
                style={{ width: CARD_SIZE, height: CARD_SIZE, border: '1px solid black' }}
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
              >
                {playlist.cover_art_url ? (
                  <img
                    src={playlist.cover_art_url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Slide-in text info */}
              <div
                className="flex-1 min-w-0 flex items-center"
                style={{ height: CARD_SIZE }}
                onClick={(e) => e.stopPropagation()}
              >
                <SlideInfo progress={contentProgress} playlist={playlist} />
              </div>
            </div>

            {/* Tracklist spanning full layout width */}
            <div
              className="pt-8 pb-16 mx-auto"
              style={{ width: LAYOUT_WIDTH }}
              onClick={(e) => e.stopPropagation()}
            >
              {playlist.songs.length > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 text-left">
                      <th className="pb-2 pr-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider w-10 text-right">#</th>
                      <th className="pb-2 pr-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="pb-2 pr-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Album</th>
                      <th className="pb-2 pr-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {playlist.songs.map((song, i) => (
                      <ViewerTrackRow key={song.id} song={song} index={i} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Flying card (animated, hidden once scrollable content appears) */}
      <motion.div
        className="fixed z-[60] shadow-2xl cursor-pointer bg-white overflow-hidden"
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
          visibility: showContent ? 'hidden' : 'visible',
        }}
        onClick={handleClose}
      >
        {playlist?.cover_art_url ? (
          <img
            src={playlist.cover_art_url}
            alt={playlist.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
      </motion.div>
    </>
  );
}
