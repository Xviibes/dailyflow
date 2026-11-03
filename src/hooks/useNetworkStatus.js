import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pemantau koneksi jaringan secara real-time (Network Guard).
 * Operasi manual (CRUD lokal) tidak pernah bergantung pada hook ini,
 * namun komponen AI menggunakannya untuk menampilkan status "AI Offline"
 * dan mencegah pengiriman request saat tidak ada sinyal.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fungsi pengecekan aktif tepat sebelum mengirim pesan ke API AI
  const checkOnlineNow = useCallback(() => {
    const current = typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true;
    setIsOnline(current);
    return current;
  }, []);

  return { isOnline, checkOnlineNow };
}
