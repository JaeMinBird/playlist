'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PlaylistWithStats } from '@/types';

interface PlaylistGridProps {
  selectedId?: string | null;
  selectMode: boolean;
  selectedIds: Set<string>;
  onPlaylistClick: (playlist: PlaylistWithStats) => void;
  onToggleSelect: (id: string) => void;
  onImportClick: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

function PlaylistCard({
  playlist,
  isSelected,
  selectMode,
  isChecked,
  onToggleSelect,
  onClick,
  index,
}: {
  playlist: PlaylistWithStats;
  isSelected: boolean;
  selectMode: boolean;
  isChecked: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  const displayDate = playlist.earliest_added_at
    ? formatDate(playlist.earliest_added_at)
    : formatDate(playlist.created_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Selection checkbox */}
      <AnimatePresence>
        {selectMode && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className="absolute top-3 left-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer"
            style={{
              borderColor: isChecked ? '#000' : 'rgba(255,255,255,0.7)',
              backgroundColor: isChecked ? '#000' : 'rgba(0,0,0,0.3)',
            }}
          >
            {isChecked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={selectMode ? onToggleSelect : onClick}
        className={`w-full text-left overflow-hidden transition-all duration-300 cursor-pointer aspect-square relative ${
          isChecked ? 'ring-2 ring-black' : ''
        }`}
        style={{
          filter: isSelected && !selectMode ? 'brightness(0.85)' : undefined,
        }}
      >
        {/* Cover art — full bleed */}
        {playlist.cover_art_url ? (
          <img
            src={playlist.cover_art_url}
            alt={playlist.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Info overlay — slides up from bottom on hover */}
        <motion.div
          initial={false}
          animate={{
            y: hovered || isSelected ? 0 : '100%',
            opacity: hovered || isSelected ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent px-4 pt-10 pb-4"
        >
          <p className="font-medium text-sm text-black truncate">{playlist.name}</p>
          <p className="text-xs text-black/50 mt-1 truncate">
            {playlist.owner && <>{playlist.owner}<span className="mx-1">·</span></>}
            {playlist.song_count} song{playlist.song_count !== 1 ? 's' : ''}
            <span className="mx-1">·</span>
            {formatDuration(playlist.total_duration_ms)}
          </p>
          <p className="text-[11px] text-black/40 mt-1">{displayDate}</p>
        </motion.div>
      </button>
    </motion.div>
  );
}

export default function PlaylistGrid({
  selectedId,
  selectMode,
  selectedIds,
  onPlaylistClick,
  onToggleSelect,
  onImportClick,
}: PlaylistGridProps) {
  const [playlists, setPlaylists] = useState<PlaylistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error('Failed to load playlists');
      const data = await res.json();
      setPlaylists(data.playlists ?? []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__refetchPlaylists = fetchPlaylists;
    return () => { delete (window as unknown as Record<string, unknown>).__refetchPlaylists; };
  }, [fetchPlaylists]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 max-w-6xl mx-auto">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-gray-500 mb-3">{error}</p>
        <button onClick={fetchPlaylists} className="text-sm text-black underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 max-w-6xl mx-auto">
      <AnimatePresence mode="popLayout">
        {playlists.map((playlist, i) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            index={i}
            isSelected={selectedId === playlist.id}
            selectMode={selectMode}
            isChecked={selectedIds.has(playlist.id)}
            onToggleSelect={() => onToggleSelect(playlist.id)}
            onClick={() => onPlaylistClick(playlist)}
          />
        ))}
      </AnimatePresence>

      {/* Import card */}
      <motion.button
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: playlists.length * 0.04 + 0.1 }}
        onClick={onImportClick}
        className="aspect-square border border-dashed border-gray-200 hover:border-gray-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
      >
        <svg
          width="36" height="36" viewBox="0 0 24 24" fill="currentColor"
          className="text-gray-300 group-hover:text-[#1DB954] transition-colors"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-sm text-gray-400 group-hover:text-black transition-colors">
          Import from Spotify
        </span>
      </motion.button>
    </div>
  );
}
