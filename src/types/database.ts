export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_art_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_art_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_art_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          lastfm_id: string;
          name: string;
          artist_name: string;
          album_name: string | null;
          duration_ms: number | null;
          album_art_url: string | null;
          lastfm_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lastfm_id: string;
          name: string;
          artist_name: string;
          album_name?: string | null;
          duration_ms?: number | null;
          album_art_url?: string | null;
          lastfm_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lastfm_id?: string;
          name?: string;
          artist_name?: string;
          album_name?: string | null;
          duration_ms?: number | null;
          album_art_url?: string | null;
          lastfm_url?: string | null;
          created_at?: string;
        };
      };
      playlist_songs: {
        Row: {
          playlist_id: string;
          song_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          playlist_id: string;
          song_id: string;
          position: number;
          added_at?: string;
        };
        Update: {
          playlist_id?: string;
          song_id?: string;
          position?: number;
          added_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Playlist = Database['public']['Tables']['playlists']['Row'];
export type Song = Database['public']['Tables']['songs']['Row'];
export type PlaylistSong = Database['public']['Tables']['playlist_songs']['Row'];

// Extended types with relations
export type PlaylistWithSongs = Playlist & {
  playlist_songs: (PlaylistSong & { songs: Song })[];
};

