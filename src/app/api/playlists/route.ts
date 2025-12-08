import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/playlists - Get all playlists for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: playlists, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs (
          position,
          songs (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlists:', error);
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }

    // Transform to include song count and total duration
    const playlistsWithStats = playlists?.map(playlist => {
      const songs = playlist.playlist_songs || [];
      const totalDuration = songs.reduce((acc, ps) => {
        return acc + (ps.songs?.duration_ms || 0);
      }, 0);

      return {
        ...playlist,
        song_count: songs.length,
        total_duration_ms: totalDuration,
      };
    });

    return NextResponse.json({ playlists: playlistsWithStats });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/playlists - Create a new playlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, cover_art_url } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        cover_art_url: cover_art_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating playlist:', error);
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
    }

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Playlists POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

