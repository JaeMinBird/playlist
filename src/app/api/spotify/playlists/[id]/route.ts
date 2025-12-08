import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylistDetails, fetchPlaylistTracks } from '@/lib/spotify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Spotify' },
      { status: 401 }
    );
  }
  
  try {
    // Fetch playlist details and tracks in parallel
    const [playlist, tracksData] = await Promise.all([
      fetchPlaylistDetails(accessToken, id),
      fetchPlaylistTracks(accessToken, id),
    ]);
    
    // Fetch remaining tracks if there are more
    let allTracks = tracksData.items;
    let nextUrl = tracksData.next;
    
    while (nextUrl) {
      const offset = allTracks.length;
      const moreTracksData = await fetchPlaylistTracks(accessToken, id, 100, offset);
      allTracks = [...allTracks, ...moreTracksData.items];
      nextUrl = moreTracksData.next;
    }
    
    return NextResponse.json({
      ...playlist,
      tracks: {
        ...playlist.tracks,
        items: allTracks,
      },
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

