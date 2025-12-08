import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTrackWithAlbumArt, type SongData } from '@/lib/lastfm';

// POST /api/playlists/[id]/songs - Add a song to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { track, artist, song_data } = body;

    // Either provide track/artist to fetch from Last.fm, or provide song_data directly
    let songData: SongData | null = song_data || null;

    if (!songData && track && artist) {
      // Fetch from Last.fm
      songData = await getTrackWithAlbumArt(track, artist);
      
      if (!songData) {
        return NextResponse.json({ error: 'Song not found on Last.fm' }, { status: 404 });
      }
    }

    if (!songData) {
      return NextResponse.json(
        { error: 'Either track/artist or song_data is required' },
        { status: 400 }
      );
    }

    // Check if song exists in our cache
    let { data: existingSong } = await supabase
      .from('songs')
      .select('id')
      .eq('lastfm_id', songData.lastfm_id)
      .single();

    // If not, insert it
    if (!existingSong) {
      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert({
          lastfm_id: songData.lastfm_id,
          name: songData.name,
          artist_name: songData.artist_name,
          album_name: songData.album_name,
          duration_ms: songData.duration_ms,
          album_art_url: songData.album_art_url,
          lastfm_url: songData.lastfm_url,
        })
        .select('id')
        .single();

      if (insertError) {
        // Handle race condition - song might have been inserted by another request
        if (insertError.code === '23505') {
          const { data: retryFetch } = await supabase
            .from('songs')
            .select('id')
            .eq('lastfm_id', songData.lastfm_id)
            .single();
          existingSong = retryFetch;
        } else {
          console.error('Error inserting song:', insertError);
          return NextResponse.json({ error: 'Failed to cache song' }, { status: 500 });
        }
      } else {
        existingSong = newSong;
      }
    }

    if (!existingSong) {
      return NextResponse.json({ error: 'Failed to get song ID' }, { status: 500 });
    }

    // Get current max position in playlist
    const { data: maxPosition } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosition?.position ?? -1) + 1;

    // Add song to playlist
    const { error: linkError } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: existingSong.id,
        position: newPosition,
      });

    if (linkError) {
      if (linkError.code === '23505') {
        return NextResponse.json({ error: 'Song already in playlist' }, { status: 409 });
      }
      console.error('Error adding song to playlist:', linkError);
      return NextResponse.json({ error: 'Failed to add song to playlist' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      song_id: existingSong.id,
      position: newPosition,
    }, { status: 201 });
  } catch (error) {
    console.error('Add song error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/playlists/[id]/songs - Remove a song from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { song_id } = body;

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', song_id);

    if (error) {
      console.error('Error removing song from playlist:', error);
      return NextResponse.json({ error: 'Failed to remove song' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove song error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

