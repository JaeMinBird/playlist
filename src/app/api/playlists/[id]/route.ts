import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/playlists/[id] - Get a specific playlist with songs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs (
          position,
          added_at,
          songs (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !playlist) {
      if (error?.code === 'PGRST116' || !playlist) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }
      console.error('Error fetching playlist:', error);
      return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
    }

    // Sort songs by position
    const playlistSongs = (playlist as { playlist_songs?: { position: number; added_at: string; songs: { duration_ms: number | null } | null }[] }).playlist_songs;
    if (playlistSongs) {
      playlistSongs.sort((a, b) => a.position - b.position);
    }

    // Calculate stats
    const songs = playlistSongs || [];
    const totalDuration = songs.reduce((acc, ps) => {
      return acc + (ps.songs?.duration_ms || 0);
    }, 0);

    return NextResponse.json({
      playlist: {
        ...playlist,
        playlist_songs: playlistSongs,
        song_count: songs.length,
        total_duration_ms: totalDuration,
      }
    });
  } catch (error) {
    console.error('Playlist GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/playlists/[id] - Update a playlist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, cover_art_url } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (cover_art_url !== undefined) updates.cover_art_url = cover_art_url || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating playlist:', error);
      return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Playlist PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/playlists/[id] - Delete a playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting playlist:', error);
      return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Playlist DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

