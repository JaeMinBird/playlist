import { NextRequest, NextResponse } from 'next/server';
import { addSong, removeSong } from '@/lib/store';
import { getTrackWithAlbumArt, type SongData } from '@/lib/lastfm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const { track, artist, song_data } = await request.json();

    let songData: SongData | null = song_data || null;

    if (!songData && track && artist) {
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

    const song = await addSong(playlistId, {
      source_id: songData.lastfm_id,
      name: songData.name,
      artist_name: songData.artist_name,
      album_name: songData.album_name,
      duration_ms: songData.duration_ms,
      album_art_url: songData.album_art_url,
      url: songData.lastfm_url,
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Playlist not found or song already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, song }, { status: 201 });
  } catch (error) {
    console.error('Add song error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const { song_id } = await request.json();

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 });
    }

    const removed = await removeSong(playlistId, song_id);

    if (!removed) {
      return NextResponse.json({ error: 'Song or playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove song error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
