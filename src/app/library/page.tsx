'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import PlaylistGrid from '@/components/PlaylistGrid';
import TrackList from '@/components/TrackList';
import Header from '@/components/Header';
import type { PlaylistWithStats } from '@/types';

export default function LibraryPage() {
  const router = useRouter();
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithStats | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const handlePlaylistClick = (playlist: PlaylistWithStats) => {
    setSelectedPlaylist((prev) => (prev?.id === playlist.id ? null : playlist));
  };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleEnterSelectMode = () => {
    setSelectMode(true);
    setSelectedPlaylist(null);
  };

  const handleExitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const refetch = () => {
    const fn = (window as unknown as Record<string, unknown>).__refetchPlaylists;
    if (typeof fn === 'function') fn();
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
      refetch();
    } catch {
      alert('Failed to delete playlist');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Delete ${count} playlist${count > 1 ? 's' : ''}?`)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      if (selectedPlaylist && selectedIds.has(selectedPlaylist.id)) setSelectedPlaylist(null);
      setSelectedIds(new Set());
      setSelectMode(false);
      refetch();
    } catch {
      alert('Failed to delete playlists');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-20 px-8 pb-8">
        {/* Title row */}
        <div className="max-w-6xl mx-auto flex items-end justify-between mb-8">
          <h1
            className="text-4xl font-bold tracking-wider text-black uppercase"
            style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}
          >
            My Library
          </h1>

          {!selectMode ? (
            <button
              onClick={handleEnterSelectMode}
              className="text-sm text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              Select
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleExitSelectMode}
                className="text-sm text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Batch action bar */}
        <AnimatePresence>
          {selectMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between bg-black text-white rounded-lg px-5 py-3">
                <span className="text-sm">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBatchDelete}
                  disabled={deleting}
                  className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete selected'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PlaylistGrid
          selectedId={selectedPlaylist?.id ?? null}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onPlaylistClick={handlePlaylistClick}
          onToggleSelect={handleToggleSelect}
          onImportClick={() => router.push('/library/import')}
        />
      </div>

      <AnimatePresence>
        {selectedPlaylist && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <TrackList
              playlist={selectedPlaylist}
              onDelete={() => handleDeleteOne(selectedPlaylist.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
