'use client';

import { useRef, useEffect } from 'react';
import type { PlaylistWithStats, Song } from '@/types';

interface TrackListProps {
  playlist: PlaylistWithStats;
  onDelete?: () => void;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

function TrackRow({ song, index }: { song: Song; index: number }) {
  return (
    <tr className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-400 tabular-nums w-12 text-right">
        {index + 1}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          {song.album_art_url ? (
            <img
              src={song.album_art_url}
              alt={song.album_name ?? song.name}
              className="w-10 h-10 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            {song.url ? (
              <a href={song.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-black truncate block hover:underline">{song.name}</a>
            ) : (
              <p className="text-sm font-medium text-black truncate">{song.name}</p>
            )}
            <p className="text-xs text-gray-500 truncate">{song.artist_name}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-[200px] hidden md:table-cell">
        {song.album_name ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400 whitespace-nowrap hidden lg:table-cell">
        {formatDate(song.added_at)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400 tabular-nums whitespace-nowrap text-right">
        {formatDuration(song.duration_ms)}
      </td>
    </tr>
  );
}

export default function TrackList({ playlist, onDelete }: TrackListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [playlist.id]);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-8 pb-16 scroll-mt-8">
      {/* Playlist header */}
      <div className="flex items-start gap-6 mb-8 pt-6 relative">
        {/* Cover art */}
        <div className="w-48 h-48 flex-shrink-0 border border-black bg-gray-50 overflow-hidden">
          {playlist.cover_art_url ? (
            <img
              src={playlist.cover_art_url}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-6 right-0 text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Delete playlist
          </button>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 pt-2">
          <h2
            className="text-3xl font-bold tracking-wider text-black uppercase truncate"
            style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.08em' }}
          >
            {playlist.name}
          </h2>
          {playlist.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{playlist.description}</p>
          )}
          {playlist.owner && (
            <p className="text-sm text-gray-500 mt-1">
              {playlist.owner.url ? (
                <a href={playlist.owner.url} target="_blank" rel="noopener noreferrer" className="hover:underline">@{playlist.owner.name}</a>
              ) : (
                <>@{playlist.owner.name}</>
              )}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            {playlist.song_count} song{playlist.song_count !== 1 ? 's' : ''}
            <span className="mx-2">·</span>
            {formatTotalDuration(playlist.total_duration_ms)}
            <span className="mx-2">·</span>
            {playlist.earliest_added_at
              ? formatDate(playlist.earliest_added_at)
              : formatDate(playlist.created_at)}
          </p>
        </div>
      </div>

      {/* Track table */}
      {playlist.songs.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          No tracks in this playlist yet.
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="pb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-12 text-right">#</th>
              <th className="pb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
              <th className="pb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Album</th>
              <th className="pb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date Added</th>
              <th className="pb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {playlist.songs.map((song, i) => (
              <TrackRow key={song.id} song={song} index={i} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
