import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { StoreData, Playlist, Song, PlaylistWithStats } from '@/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'playlists.json');

const EMPTY_STORE: StoreData = { playlists: [] };

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function read(): Promise<StoreData> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    return EMPTY_STORE;
  }
}

async function write(data: StoreData): Promise<void> {
  await ensureDataDir();
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function withStats(playlist: Playlist): PlaylistWithStats {
  const total = playlist.songs.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);
  const earliest = playlist.songs.length > 0
    ? playlist.songs.reduce((min, s) => (s.added_at < min ? s.added_at : min), playlist.songs[0].added_at)
    : null;
  return { ...playlist, song_count: playlist.songs.length, total_duration_ms: total, earliest_added_at: earliest };
}

// ── Playlists ────────────────────────────────────────────────

export async function getAllPlaylists(): Promise<PlaylistWithStats[]> {
  const data = await read();
  return data.playlists
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(withStats);
}

export async function getPlaylist(id: string): Promise<PlaylistWithStats | null> {
  const data = await read();
  const playlist = data.playlists.find((p) => p.id === id);
  return playlist ? withStats(playlist) : null;
}

export async function createPlaylist(
  fields: Pick<Playlist, 'name'> & Partial<Pick<Playlist, 'description' | 'cover_art_url' | 'owner'>>
): Promise<Playlist> {
  const data = await read();
  const now = new Date().toISOString();

  const playlist: Playlist = {
    id: generateId(),
    name: fields.name,
    description: fields.description ?? null,
    owner: fields.owner ?? null,
    cover_art_url: fields.cover_art_url ?? null,
    created_at: now,
    updated_at: now,
    songs: [],
  };

  data.playlists.push(playlist);
  await write(data);
  return playlist;
}

export async function updatePlaylist(
  id: string,
  fields: Partial<Pick<Playlist, 'name' | 'description' | 'cover_art_url'>>
): Promise<Playlist | null> {
  const data = await read();
  const idx = data.playlists.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const playlist = data.playlists[idx];
  if (fields.name !== undefined) playlist.name = fields.name;
  if (fields.description !== undefined) playlist.description = fields.description;
  if (fields.cover_art_url !== undefined) playlist.cover_art_url = fields.cover_art_url;
  playlist.updated_at = new Date().toISOString();

  data.playlists[idx] = playlist;
  await write(data);
  return playlist;
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const data = await read();
  const before = data.playlists.length;
  data.playlists = data.playlists.filter((p) => p.id !== id);
  if (data.playlists.length === before) return false;
  await write(data);
  return true;
}

export async function deletePlaylists(ids: string[]): Promise<number> {
  const data = await read();
  const before = data.playlists.length;
  const idSet = new Set(ids);
  data.playlists = data.playlists.filter((p) => !idSet.has(p.id));
  const deleted = before - data.playlists.length;
  if (deleted > 0) await write(data);
  return deleted;
}

// ── Songs ────────────────────────────────────────────────────

export async function addSong(playlistId: string, song: Omit<Song, 'id' | 'added_at'>): Promise<Song | null> {
  const data = await read();
  const playlist = data.playlists.find((p) => p.id === playlistId);
  if (!playlist) return null;

  const duplicate = playlist.songs.some((s) => s.source_id === song.source_id);
  if (duplicate) return null;

  const newSong: Song = {
    ...song,
    id: generateId(),
    added_at: new Date().toISOString(),
  };

  playlist.songs.push(newSong);
  playlist.updated_at = new Date().toISOString();
  await write(data);
  return newSong;
}

export async function removeSong(playlistId: string, songId: string): Promise<boolean> {
  const data = await read();
  const playlist = data.playlists.find((p) => p.id === playlistId);
  if (!playlist) return false;

  const before = playlist.songs.length;
  playlist.songs = playlist.songs.filter((s) => s.id !== songId);
  if (playlist.songs.length === before) return false;

  playlist.updated_at = new Date().toISOString();
  await write(data);
  return true;
}

// ── Bulk import helper ───────────────────────────────────────

export async function importPlaylist(
  fields: Pick<Playlist, 'name'> & Partial<Pick<Playlist, 'description' | 'cover_art_url' | 'owner'>>,
  songs: (Omit<Song, 'id'> & { added_at?: string })[]
): Promise<{ playlist: Playlist; tracks_imported: number }> {
  const data = await read();
  const now = new Date().toISOString();

  const playlist: Playlist = {
    id: generateId(),
    name: fields.name,
    description: fields.description ?? null,
    owner: fields.owner ?? null,
    cover_art_url: fields.cover_art_url ?? null,
    created_at: now,
    updated_at: now,
    songs: songs.map((s) => ({ ...s, id: generateId(), added_at: s.added_at || now })),
  };

  data.playlists.push(playlist);
  await write(data);
  return { playlist, tracks_imported: playlist.songs.length };
}
