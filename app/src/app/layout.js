import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import AppLayoutWrapper from '@/components/navigation/AppLayoutWrapper';

export const metadata = {
  title: 'PayFear — Delegate Your Fears, Flawlessly',
  description: 'A trusted marketplace for emotional delegation. Get help with tasks you find intimidating.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
