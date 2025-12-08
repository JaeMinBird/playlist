// Last.fm API utility
// Documentation: https://www.last.fm/api

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

interface LastFmImage {
  '#text': string;
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | '';
}

interface LastFmTrack {
  name: string;
  artist: {
    name: string;
    mbid?: string;
  } | string;
  album?: {
    '#text': string;
    mbid?: string;
  };
  duration?: string;
  url: string;
  image?: LastFmImage[];
  mbid?: string;
}

interface LastFmSearchResult {
  results: {
    trackmatches: {
      track: LastFmTrack[];
    };
    'opensearch:totalResults': string;
  };
}

interface LastFmTrackInfo {
  track: {
    name: string;
    mbid?: string;
    url: string;
    duration: string;
    artist: {
      name: string;
      mbid?: string;
      url: string;
    };
    album?: {
      artist: string;
      title: string;
      mbid?: string;
      url: string;
      image: LastFmImage[];
    };
  };
}

export interface SongData {
  lastfm_id: string;
  name: string;
  artist_name: string;
  album_name: string | null;
  duration_ms: number | null;
  album_art_url: string | null;
  lastfm_url: string;
}

function getApiKey(): string {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    throw new Error('LASTFM_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getLargestImage(images: LastFmImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  
  // Priority order for image sizes
  const sizeOrder = ['extralarge', 'large', 'medium', 'small'];
  
  for (const size of sizeOrder) {
    const image = images.find(img => img.size === size && img['#text']);
    if (image) return image['#text'];
  }
  
  // Fallback to any image with content
  const anyImage = images.find(img => img['#text']);
  return anyImage ? anyImage['#text'] : null;
}

function generateLastFmId(track: string, artist: string): string {
  // Create a consistent ID from track and artist names
  const normalized = `${artist.toLowerCase().trim()}-${track.toLowerCase().trim()}`;
  // Simple hash for ID
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `lastfm_${Math.abs(hash).toString(36)}`;
}

/**
 * Search for tracks on Last.fm
 */
export async function searchTracks(query: string, limit: number = 10): Promise<SongData[]> {
  const apiKey = getApiKey();
  
  const params = new URLSearchParams({
    method: 'track.search',
    track: query,
    api_key: apiKey,
    format: 'json',
    limit: limit.toString(),
  });

  const response = await fetch(`${LASTFM_API_URL}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data: LastFmSearchResult = await response.json();
  
  if (!data.results?.trackmatches?.track) {
    return [];
  }

  const tracks = Array.isArray(data.results.trackmatches.track)
    ? data.results.trackmatches.track
    : [data.results.trackmatches.track];

  return tracks.map((track): SongData => {
    const artistName = typeof track.artist === 'string' 
      ? track.artist 
      : track.artist.name;
    
    return {
      lastfm_id: generateLastFmId(track.name, artistName),
      name: track.name,
      artist_name: artistName,
      album_name: null, // Search results don't include album
      duration_ms: null, // Search results don't include duration
      album_art_url: getLargestImage(track.image),
      lastfm_url: track.url,
    };
  });
}

/**
 * Get detailed track info from Last.fm
 */
export async function getTrackInfo(track: string, artist: string): Promise<SongData | null> {
  const apiKey = getApiKey();
  
  const params = new URLSearchParams({
    method: 'track.getInfo',
    track,
    artist,
    api_key: apiKey,
    format: 'json',
  });

  const response = await fetch(`${LASTFM_API_URL}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data: LastFmTrackInfo = await response.json();
  
  if (!data.track) {
    return null;
  }

  const { track: trackData } = data;
  const durationMs = trackData.duration ? parseInt(trackData.duration, 10) : null;

  return {
    lastfm_id: trackData.mbid || generateLastFmId(trackData.name, trackData.artist.name),
    name: trackData.name,
    artist_name: trackData.artist.name,
    album_name: trackData.album?.title || null,
    duration_ms: durationMs && durationMs > 0 ? durationMs : null,
    album_art_url: getLargestImage(trackData.album?.image),
    lastfm_url: trackData.url,
  };
}

/**
 * Get track info with album art (combines search and getInfo for best results)
 */
export async function getTrackWithAlbumArt(track: string, artist: string): Promise<SongData | null> {
  // First try to get detailed info
  const trackInfo = await getTrackInfo(track, artist);
  
  if (trackInfo) {
    // If we got track info but no album art, try searching
    if (!trackInfo.album_art_url) {
      const searchResults = await searchTracks(`${artist} ${track}`, 1);
      if (searchResults.length > 0 && searchResults[0].album_art_url) {
        trackInfo.album_art_url = searchResults[0].album_art_url;
      }
    }
    return trackInfo;
  }

  // Fallback to search
  const searchResults = await searchTracks(`${artist} ${track}`, 1);
  return searchResults.length > 0 ? searchResults[0] : null;
}

