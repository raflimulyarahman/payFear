'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/navigation/Sidebar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

export default function AppLayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  // Use sidebar only on dashboard and task inner pages
  const showAppNav = user && !isLandingPage && !isAuthPage;

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  if (!showAppNav) {
    return <main>{children}</main>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)', 
        paddingBottom: '80px', // For mobile bottom nav
        backgroundColor: 'var(--bg-primary)'
      }} className="app-content">
        {children}
      </main>
      <MobileBottomNav />
      <style jsx global>{`
        @media (max-width: 1023px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
