'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import PlaylistGrid from '@/components/PlaylistGrid';
import Header from '@/components/Header';

export default function LibraryPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Ensure profile exists for the user
  useEffect(() => {
    const ensureProfile = async () => {
      if (!user) return;
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If no profile, create one
      if (!profile) {
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || null,
          });
      }
    };
    
    ensureProfile();
  }, [user, supabase]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    
    setCreating(true);
    setCreateError(null);

    const { error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || null,
      });

    if (error) {
      console.error('Error creating playlist:', error.message, error.code, error.details, error.hint);
      setCreateError(error.message || 'Failed to create playlist');
      setCreating(false);
      return;
    }

    // Reset and close modal, then refresh grid
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setShowCreateModal(false);
    setCreating(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Page content */}
      <div className="pt-20 px-8">
        <h1 
          className="text-4xl font-bold tracking-wider text-black uppercase text-center mb-8"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}
        >
          My Library
        </h1>

        <PlaylistGrid
          key={refreshKey}
          onPlaylistClick={(playlist) => {
            // TODO: Navigate to playlist detail or open viewer
            console.log('Clicked playlist:', playlist);
          }}
          onCreateClick={() => setShowCreateModal(true)}
        />
      </div>

      {/* Create playlist modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white border border-black p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              Create Playlist
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>

                {createError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="flex-1 py-2 border border-black hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || creating}
                  className="flex-1 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

