// Spotify API utility
// Documentation: https://developer.spotify.com/documentation/web-api

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Scopes needed to read user's playlists
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

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

/**
 * Generate Spotify OAuth authorization URL
 */
export function getSpotifyAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });

  return `${SPOTIFY_AUTH_URL}?${params}`;
}

/**
 * Exchange authorization code for access token (server-side only)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user's playlists from Spotify
 */
export async function fetchUserPlaylists(
  accessToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SpotifyPlaylist[]; total: number; next: string | null }> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/me/playlists?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlists: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch tracks from a specific playlist
 */
export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ items: SpotifyPlaylistTrack[]; total: number; next: string | null }> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
  }

  return response.json();
}

/**
 * Get playlist details
 */
export async function fetchPlaylistDetails(
  accessToken: string,
  playlistId: string
): Promise<SpotifyPlaylist> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/playlists/${playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }

  return response.json();
}

