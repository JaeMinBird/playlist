'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistWithStats } from '@/types';

interface PlaylistGridProps {
  onPlaylistClick?: (playlist: PlaylistWithStats) => void;
  onCreateClick?: () => void;
}

export default function PlaylistGrid({ onPlaylistClick, onCreateClick }: PlaylistGridProps) {
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

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6 p-8 max-w-5xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-6 border border-red-200 bg-red-50 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <button 
            onClick={fetchPlaylists}
            className="text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6 p-8 max-w-5xl mx-auto">
      {/* Existing playlists */}
      {playlists.map((playlist) => (
        <button
          key={playlist.id}
          onClick={() => onPlaylistClick?.(playlist)}
          className="group aspect-square bg-white border border-black hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
        >
          {/* Cover art area */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden">
            {playlist.cover_art_url ? (
              <img
                src={playlist.cover_art_url}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </div>
          
          {/* Info area */}
          <div className="p-3 border-t border-black text-left">
            <p className="font-medium text-sm truncate">{playlist.name}</p>
            <p className="text-xs text-gray-500">
              {playlist.song_count} song{playlist.song_count !== 1 ? 's' : ''}
            </p>
          </div>
        </button>
      ))}

      {/* Import from Spotify card */}
      <button
        onClick={onCreateClick}
        className="aspect-square bg-white border border-black border-dashed hover:border-solid hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
      >
        {/* Spotify icon */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-gray-400 group-hover:text-[#1DB954] transition-colors"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        <span className="text-sm text-gray-400 group-hover:text-black transition-colors">
          Import from Spotify
        </span>
      </button>
    </div>
  );
}
