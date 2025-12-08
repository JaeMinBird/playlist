'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import PlaylistGrid from '@/components/PlaylistGrid';
import Header from '@/components/Header';

export default function LibraryPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for Spotify errors in URL
  const spotifyError = searchParams.get('error');

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

  const handleImportClick = () => {
    // Redirect to Spotify auth flow
    router.push('/api/spotify/auth');
  };

  const getSpotifyErrorMessage = (error: string) => {
    switch (error) {
      case 'spotify_config':
        return 'Spotify is not configured. Please add your Spotify API credentials.';
      case 'spotify_denied':
        return 'Spotify access was denied. Please try again.';
      case 'state_mismatch':
        return 'Security check failed. Please try again.';
      case 'token_exchange':
        return 'Failed to connect to Spotify. Please try again.';
      default:
        return 'An error occurred with Spotify. Please try again.';
    }
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

        {spotifyError && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-center">
            {getSpotifyErrorMessage(spotifyError)}
          </div>
        )}

        <PlaylistGrid
          onPlaylistClick={(playlist) => {
            // TODO: Navigate to playlist detail or open viewer
            console.log('Clicked playlist:', playlist);
          }}
          onCreateClick={handleImportClick}
        />
      </div>
    </div>
  );
}
