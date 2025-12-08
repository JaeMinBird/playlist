import MarqueeCards from "@/components/MarqueeCards";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ overflowX: 'hidden', overflowY: 'visible' }}>
      {/* Hero text */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <h1 
          className="font-segment text-6xl tracking-wider text-black uppercase"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.15em' }}
        >
          every playlist.
        </h1>
        <h2 
          className="font-segment text-4xl tracking-wider text-black uppercase mt-1"
          style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.15em' }}
        >
          one place
        </h2>
      </div>
      
      {/* Marquee cards */}
      <div className="flex flex-1 items-center justify-center">
        <MarqueeCards />
      </div>
    </div>
  );
}
