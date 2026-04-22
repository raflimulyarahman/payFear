'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: t.type === 'success' ? 'rgba(34,197,94,0.15)' :
                         t.type === 'error' ? 'rgba(239,68,68,0.15)' :
                         'rgba(138,92,245,0.15)',
            border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.3)' :
                                  t.type === 'error' ? 'rgba(239,68,68,0.3)' :
                                  'rgba(138,92,245,0.3)'}`,
            color: t.type === 'success' ? '#22c55e' :
                   t.type === 'error' ? '#ef4444' : '#ab8aff',
            fontSize: '0.875rem',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            animation: 'fadeInUp 0.3s ease',
            maxWidth: 360,
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
