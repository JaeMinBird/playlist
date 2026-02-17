import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/lastfm';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const tracks = await searchTracks(query, limit);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Song search error:', error);
    return NextResponse.json({ error: 'Failed to search songs' }, { status: 500 });
  }
}
