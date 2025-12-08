'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Playlist } from '@/types/database';

interface PlaylistWithStats extends Playlist {
  song_count: number;
  total_duration_ms: number;
}

interface PlaylistGridProps {
  onPlaylistClick?: (playlist: PlaylistWithStats) => void;
  onCreateClick?: () => void;
}

export default function PlaylistGrid({ onPlaylistClick, onCreateClick }: PlaylistGridProps) {
  const [playlists, setPlaylists] = useState<PlaylistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs (
            position,
            songs (duration_ms)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Check if it's a "table doesn't exist" error
        if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
          setError('Database tables not set up yet. Please run the schema.sql in your Supabase SQL Editor.');
        } else {
          console.error('Error fetching playlists:', fetchError.message, fetchError.code, fetchError);
          setError(fetchError.message || 'Failed to load playlists');
        }
        setLoading(false);
        return;
      }

      const playlistsWithStats = (data || []).map((playlist) => {
        const songs = playlist.playlist_songs || [];
        const totalDuration = songs.reduce((acc: number, ps: { songs: { duration_ms: number | null } | null }) => {
          return acc + (ps.songs?.duration_ms || 0);
        }, 0);

        return {
          ...playlist,
          song_count: songs.length,
          total_duration_ms: totalDuration,
          playlist_songs: undefined,
        } as PlaylistWithStats;
      });

      setPlaylists(playlistsWithStats);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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

      {/* Plus card for creating new playlist */}
      <button
        onClick={onCreateClick}
        className="aspect-square bg-white border border-black border-dashed hover:border-solid hover:shadow-lg transition-all cursor-pointer flex items-center justify-center group"
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 group-hover:text-black transition-colors"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

