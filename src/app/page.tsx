import MarqueeCards from "@/components/MarqueeCards";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black" style={{ overflowX: 'hidden', overflowY: 'visible' }}>
      <MarqueeCards />
    </div>
  );
}
