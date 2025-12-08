import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/spotify/callback`;
  
  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  try {
    const authUrl = getSpotifyAuthUrl(redirectUri, state);
    
    // Store state in a cookie for verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(`${origin}/library?error=spotify_config`);
  }
}

