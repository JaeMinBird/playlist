import { NextRequest, NextResponse } from 'next/server';
import { fetchFullPlaylist, type SpotifyTrack } from '@/lib/spotify';
import { importPlaylist } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'A Spotify playlist URL is required' }, { status: 400 });
    }

    const result = await fetchFullPlaylist(url);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not parse that URL. Paste a Spotify playlist link.' },
        { status: 400 }
      );
    }

    const { details, tracks } = result;

    const pickLargest = (images: { url: string; width: number }[]) =>
      images.length > 0
        ? [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url
        : null;

    const coverArtUrl = pickLargest(details.images) || null;

    const songs = tracks
      .filter((item): item is { added_at: string; track: SpotifyTrack } => item.track !== null)
      .map((item) => ({
        source_id: `spotify_${item.track.id}`,
        name: item.track.name,
        artist_name: item.track.artists.map((a) => a.name).join(', '),
        album_name: item.track.album.name,
        duration_ms: item.track.duration_ms,
        album_art_url: pickLargest(item.track.album.images) || null,
        url: item.track.external_urls.spotify,
        added_at: item.added_at,
      }));

    const imported = await importPlaylist(
      {
        name: details.name,
        description: details.description || null,
        cover_art_url: coverArtUrl,
        owner: details.owner?.display_name || null,
      },
      songs
    );

    return NextResponse.json({
      success: true,
      playlist: imported.playlist,
      tracks_imported: imported.tracks_imported,
    });
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Failed to import playlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
