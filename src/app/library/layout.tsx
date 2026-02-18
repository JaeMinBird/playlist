import AuthGate from '@/components/AuthGate';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
