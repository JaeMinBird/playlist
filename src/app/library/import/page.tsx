'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setSuccess(`Imported "${data.playlist.name}" — ${data.tracks_imported} tracks`);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-20 px-8 max-w-xl mx-auto">
        <h1
          className="text-4xl font-bold tracking-wider text-black uppercase text-center mb-2"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}
        >
          Import Playlist
        </h1>
        <p className="text-center text-gray-500 mb-10">
          Paste a Spotify playlist link
        </p>

        <form onSubmit={handleImport} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full px-4 py-3 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
            disabled={loading}
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!url.trim() || loading}
              className="flex-1 py-3 bg-black text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/library')}
              className="px-6 py-3 border border-black hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
