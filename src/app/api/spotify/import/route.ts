import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fetchFullPlaylist, type SpotifyTrack } from '@/lib/spotify';
import { importPlaylist } from '@/lib/store';

const COVERS_DIR = join(process.cwd(), 'public', 'covers');

// Spotify CDN size identifiers — swap any smaller variant to 640px
const SPOTIFY_SIZE_UPGRADES: Record<string, string> = {
  'ab67706c0000da84': 'ab67706c0000bebb',
  'ab67706c0000d72d': 'ab67706c0000bebb',
  'ab67616d00004851': 'ab67616d0000b273',
  'ab67616d00001e02': 'ab67616d0000b273',
};

function upgradeUrl(url: string) {
  for (const [small, large] of Object.entries(SPOTIFY_SIZE_UPGRADES)) {
    if (url.includes(small)) return url.replace(small, large);
  }
  return url;
}

function pickLargest(images: { url: string; width: number | null }[]) {
  if (images.length === 0) return null;
  const withSize = images.filter((img) => img.width != null);
  if (withSize.length > 0) {
    return upgradeUrl(withSize.sort((a, b) => b.width! - a.width!)[0].url);
  }
  return upgradeUrl(images[0].url);
}

async function downloadCover(imageUrl: string, playlistId: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `${playlistId}.${ext}`;

    await mkdir(COVERS_DIR, { recursive: true });
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(join(COVERS_DIR, filename), buffer);

    return `/covers/${filename}`;
  } catch (err) {
    console.error('Failed to download cover:', err);
    return null;
  }
}

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

    const remoteUrl = pickLargest(details.images);
    const localCover = remoteUrl ? await downloadCover(remoteUrl, details.id) : null;

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
        cover_art_url: localCover,
        owner: details.owner
          ? { name: details.owner.display_name, url: `https://open.spotify.com/user/${details.owner.id}` }
          : null,
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
