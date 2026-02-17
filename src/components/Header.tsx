'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <>
      {/* Home icon - top left */}
      <Link
        href="/"
        className="fixed top-0 left-0 z-40 p-4"
        title="Home"
      >
        <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
      </Link>

      {/* Right side icon */}
      <header className="fixed top-0 right-0 z-40 p-4 flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="My Library"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </Link>
      </header>
    </>
  );
}
