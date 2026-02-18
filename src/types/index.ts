export interface Song {
  id: string;
  source_id: string;
  name: string;
  artist_name: string;
  album_name: string | null;
  duration_ms: number | null;
  album_art_url: string | null;
  url: string | null;
  added_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  cover_art_url: string | null;
  created_at: string;
  updated_at: string;
  songs: Song[];
}

export interface PlaylistWithStats extends Playlist {
  song_count: number;
  total_duration_ms: number;
  earliest_added_at: string | null;
}

export interface StoreData {
  playlists: Playlist[];
}
