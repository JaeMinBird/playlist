import { NextRequest, NextResponse } from 'next/server';

export function checkAuth(request: NextRequest): NextResponse | null {
  const password = process.env.LIBRARY_PASSWORD;
  if (!password) return null; // no password configured = open access

  const cookie = request.cookies.get('library_auth')?.value;
  if (cookie === password) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
