import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Check for errors from Spotify
  if (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(`${origin}/library?error=spotify_denied`);
  }
  
  // Verify state
  const storedState = request.cookies.get('spotify_auth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${origin}/library?error=state_mismatch`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${origin}/library?error=no_code`);
  }
  
  try {
    const redirectUri = `${origin}/api/spotify/callback`;
    const tokens = await exchangeCodeForToken(code, redirectUri);
    
    // Redirect to import page with token in a secure cookie
    const response = NextResponse.redirect(`${origin}/library/import`);
    
    // Store access token in httpOnly cookie
    response.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });
    
    // Clear the state cookie
    response.cookies.delete('spotify_auth_state');
    
    return response;
  } catch (err) {
    console.error('Token exchange error:', err);
    return NextResponse.redirect(`${origin}/library?error=token_exchange`);
  }
}

