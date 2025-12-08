'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  
  // Error info might be in hash, which we can't read server-side
  // But we can show a generic helpful message
  
  const getErrorMessage = () => {
    // Check URL params (some errors come through query params)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorDescription) {
      return decodeURIComponent(errorDescription);
    }
    
    if (error === 'access_denied') {
      return 'Access was denied. Please try again.';
    }
    
    return null;
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 
            className="text-3xl font-bold tracking-wider text-black uppercase mb-4"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            Authentication Error
          </h1>
          
          {errorMessage && (
            <p className="text-gray-600 mb-6">{errorMessage}</p>
          )}
          
          <div className="space-y-4 text-left bg-gray-50 p-4 rounded mb-6">
            <p className="text-sm text-gray-700 font-medium">Common causes:</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span><strong>Spotify email not verified</strong> - Check your Spotify account settings and verify your email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span><strong>Not added as test user</strong> - The app may be in development mode. Ask the developer to add your Spotify email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span><strong>Access denied</strong> - You may have clicked &quot;Cancel&quot; on the authorization screen</span>
              </li>
            </ul>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="px-6 py-2 border border-black hover:bg-gray-50 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

