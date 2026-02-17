import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommandSearch } from './CommandSearch';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <CommandSearch />
      <main className={isMobile ? 'pt-14' : 'pl-64'}>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
