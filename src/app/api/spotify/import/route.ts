import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylistDetails, fetchPlaylistTracks, type SpotifyTrack } from '@/lib/spotify';
import { importPlaylist } from '@/lib/store';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 });
  }

  try {
    const { playlist_id } = await request.json();

    if (!playlist_id) {
      return NextResponse.json({ error: 'playlist_id is required' }, { status: 400 });
    }

    const spotifyPlaylist = await fetchPlaylistDetails(accessToken, playlist_id);

    // Fetch all tracks (paginated)
    const allTracks: { track: SpotifyTrack | null }[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const page = await fetchPlaylistTracks(accessToken, playlist_id, 100, offset);
      allTracks.push(...page.items);
      offset += page.items.length;
      hasMore = page.next !== null;
    }

    const coverArtUrl = spotifyPlaylist.images?.[0]?.url || null;

    const songs = allTracks
      .filter((item): item is { track: SpotifyTrack } => item.track !== null)
      .map((item) => ({
        source_id: `spotify_${item.track.id}`,
        name: item.track.name,
        artist_name: item.track.artists.map((a) => a.name).join(', '),
        album_name: item.track.album.name,
        duration_ms: item.track.duration_ms,
        album_art_url: item.track.album.images?.[0]?.url || null,
        url: item.track.external_urls.spotify,
      }));

    const result = await importPlaylist(
      {
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description || null,
        cover_art_url: coverArtUrl,
      },
      songs
    );

    return NextResponse.json({
      success: true,
      playlist: result.playlist,
      tracks_imported: result.tracks_imported,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import playlist' }, { status: 500 });
  }
}
