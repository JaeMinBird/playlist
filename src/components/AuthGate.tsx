'use client';

import { useState, useEffect } from 'react';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Probe a protected endpoint to check if we're already authed
    fetch('/api/playlists').then((res) => {
      setAuthed(res.ok);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        setAuthed(true);
      } else {
        setError('Wrong password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </div>
    );
  }

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1
          className="text-3xl font-bold tracking-wider text-black uppercase text-center"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}
        >
          Library
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 border border-black bg-white text-black text-center placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full py-3 bg-black text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Enter'}
        </button>
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
