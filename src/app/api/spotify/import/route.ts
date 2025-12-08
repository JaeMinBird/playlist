import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPlaylistDetails, fetchPlaylistTracks, SpotifyTrack } from '@/lib/spotify';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Spotify' },
      { status: 401 }
    );
  }
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { playlist_id } = await request.json();
    
    if (!playlist_id) {
      return NextResponse.json(
        { error: 'playlist_id is required' },
        { status: 400 }
      );
    }
    
    // Fetch playlist details from Spotify
    const spotifyPlaylist = await fetchPlaylistDetails(accessToken, playlist_id);
    
    // Fetch all tracks
    let allTracks: { track: SpotifyTrack | null }[] = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const tracksData = await fetchPlaylistTracks(accessToken, playlist_id, 100, offset);
      allTracks = [...allTracks, ...tracksData.items];
      offset += tracksData.items.length;
      hasMore = tracksData.next !== null;
    }
    
    // Get cover art URL (largest image)
    const coverArtUrl = spotifyPlaylist.images?.[0]?.url || null;
    
    // Create playlist in our database
    const { data: newPlaylist, error: playlistError } = await (supabase as any)
      .from('playlists')
      .insert({
        user_id: user.id,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description || null,
        cover_art_url: coverArtUrl,
      })
      .select()
      .single();
    
    if (playlistError) {
      console.error('Error creating playlist:', playlistError);
      return NextResponse.json(
        { error: 'Failed to create playlist' },
        { status: 500 }
      );
    }
    
    // Process tracks - insert songs and link to playlist
    let position = 0;
    
    for (const item of allTracks) {
      if (!item.track) continue; // Skip null tracks (deleted songs)
      
      const track = item.track;
      const artistName = track.artists.map(a => a.name).join(', ');
      const albumArtUrl = track.album.images?.[0]?.url || null;
      
      // Create a unique ID for the song based on Spotify ID
      const lastfmId = `spotify_${track.id}`;
      
      // Check if song exists
      let { data: existingSong } = await (supabase as any)
        .from('songs')
        .select('id')
        .eq('lastfm_id', lastfmId)
        .single();
      
      // If not, insert it
      if (!existingSong) {
        const { data: newSong, error: songError } = await (supabase as any)
          .from('songs')
          .insert({
            lastfm_id: lastfmId,
            name: track.name,
            artist_name: artistName,
            album_name: track.album.name,
            duration_ms: track.duration_ms,
            album_art_url: albumArtUrl,
            lastfm_url: track.external_urls.spotify,
          })
          .select('id')
          .single();
        
        if (songError) {
          // Handle race condition
          if (songError.code === '23505') {
            const { data: retryFetch } = await (supabase as any)
              .from('songs')
              .select('id')
              .eq('lastfm_id', lastfmId)
              .single();
            existingSong = retryFetch;
          } else {
            console.error('Error inserting song:', songError);
            continue;
          }
        } else {
          existingSong = newSong;
        }
      }
      
      if (existingSong) {
        // Add to playlist
        await (supabase as any)
          .from('playlist_songs')
          .insert({
            playlist_id: newPlaylist.id,
            song_id: existingSong.id,
            position,
          });
        
        position++;
      }
    }
    
    return NextResponse.json({
      success: true,
      playlist: newPlaylist,
      tracks_imported: position,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import playlist' },
      { status: 500 }
    );
  }
}

