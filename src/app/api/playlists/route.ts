import { NextRequest, NextResponse } from 'next/server';
import { getAllPlaylists, createPlaylist } from '@/lib/store';

export async function GET() {
  try {
    const playlists = await getAllPlaylists();
    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, cover_art_url } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const playlist = await createPlaylist({
      name: name.trim(),
      description: description?.trim() || null,
      cover_art_url: cover_art_url || null,
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Playlists POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
