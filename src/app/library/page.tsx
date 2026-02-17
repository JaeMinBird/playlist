'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PlaylistGrid from '@/components/PlaylistGrid';
import Header from '@/components/Header';

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotifyError = searchParams.get('error');

  const handleImportClick = () => {
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
            console.log('Clicked playlist:', playlist);
          }}
          onCreateClick={handleImportClick}
        />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
