const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: { url: string; height: number; width: number }[];
  tracks: {
    total: number;
    href: string;
  };
  external_urls: {
    spotify: string;
  };
  owner: {
    display_name: string;
    id: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack | null;
}

let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Client Credentials token — no user login required.
 * Can access any public playlist.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token request failed: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

/**
 * Extract a playlist ID from various Spotify URL formats:
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123
 *   spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 *   37i9dQZF1DXcBWIGoYBM5M  (bare ID)
 */
export function parsePlaylistUrl(input: string): string | null {
  const trimmed = input.trim();

  // Spotify URI
  const uriMatch = trimmed.match(/^spotify:playlist:([a-zA-Z0-9]+)$/);
  if (uriMatch) return uriMatch[1];

  // Web URL
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
    if (match) return match[1];
  } catch {
    // Not a URL — try bare ID
  }

  // Bare ID (alphanumeric, typically 22 chars)
  if (/^[a-zA-Z0-9]{15,}$/.test(trimmed)) return trimmed;

  return null;
}

export async function fetchPlaylistDetails(playlistId: string): Promise<SpotifyPlaylist> {
  const token = await getAccessToken();
  const response = await fetch(`${SPOTIFY_API_URL}/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }

  return response.json();
}

export async function fetchPlaylistTracks(
  playlistId: string,
  limit = 100,
  offset = 0
): Promise<{ items: SpotifyPlaylistTrack[]; total: number; next: string | null }> {
  const token = await getAccessToken();
  const response = await fetch(
    `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch a full playlist (details + all tracks) from a URL or ID.
 * Returns null if the input can't be parsed.
 */
export async function fetchFullPlaylist(input: string) {
  const playlistId = parsePlaylistUrl(input);
  if (!playlistId) return null;

  const details = await fetchPlaylistDetails(playlistId);

  const allTracks: SpotifyPlaylistTrack[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchPlaylistTracks(playlistId, 100, offset);
    allTracks.push(...page.items);
    offset += page.items.length;
    hasMore = page.next !== null;
  }

  return { details, tracks: allTracks };
}
