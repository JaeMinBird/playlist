'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import type { SpotifyPlaylist } from '@/lib/spotify';

export default function ImportPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch Spotify playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/spotify/playlists');
        
        if (response.status === 401) {
          // Not authenticated with Spotify, redirect to auth
          router.push('/api/spotify/auth');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        
        const data = await response.json();
        setPlaylists(data.items || []);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError('Failed to load your Spotify playlists');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated, router]);

  const handleImport = async (playlist: SpotifyPlaylist) => {
    setImporting(playlist.id);
    setError(null);
    setImportSuccess(null);

    try {
      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlist_id: playlist.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import playlist');
      }

      const data = await response.json();
      setImportSuccess(`Imported "${playlist.name}" with ${data.tracks_imported} tracks!`);
      
      // Remove from list after successful import
      setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import playlist');
    } finally {
      setImporting(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-20 px-8 max-w-4xl mx-auto">
        <h1 
          className="text-4xl font-bold tracking-wider text-black uppercase text-center mb-2"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}
        >
          Import from Spotify
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Select a playlist to import into your library
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-center">
            {error}
          </div>
        )}

        {importSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-center">
            {importSuccess}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No playlists found on your Spotify account</p>
            <button
              onClick={() => router.push('/library')}
              className="px-6 py-2 border border-black hover:bg-gray-50 transition-colors"
            >
              Back to Library
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleImport(playlist)}
                  disabled={importing !== null}
                  className="group text-left border border-black hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Cover art */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {playlist.images?.[0]?.url ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
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
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 border-t border-black">
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-gray-500">
                      {playlist.tracks.total} track{playlist.tracks.total !== 1 ? 's' : ''}
                    </p>
                    {importing === playlist.id && (
                      <p className="text-xs text-black mt-1">Importing...</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/library')}
                className="px-6 py-2 border border-black hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

