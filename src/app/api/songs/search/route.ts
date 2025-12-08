import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/lastfm';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Search Last.fm
    const tracks = await searchTracks(query, limit);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Song search error:', error);
    return NextResponse.json(
      { error: 'Failed to search songs' },
      { status: 500 }
    );
  }
}

