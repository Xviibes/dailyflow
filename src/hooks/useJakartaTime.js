import { useState, useEffect } from 'react';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Hook waktu Jakarta (WIB) yang ringan tanpa background setInterval per detik/menit
 * agar tidak memicu CPU thrashing atau re-render berulang di Android WebView.
 * Hanya menyegarkan data saat aplikasi kembali aktif (visibilitychange / focus).
 */
export function useJakartaTime() {
  const [timeData, setTimeData] = useState(() => getJakartaTimeData());

  useEffect(() => {
    const refreshOnResume = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setTimeData((prev) => {
          const next = getJakartaTimeData();
          if (
            prev.hour === next.hour &&
            prev.minute === next.minute &&
            prev.dayName === next.dayName
          ) {
            return prev;
          }
          return next;
        });
      }
    };

    window.addEventListener('focus', refreshOnResume, { passive: true });
    document.addEventListener('visibilitychange', refreshOnResume, { passive: true });

    return () => {
      window.removeEventListener('focus', refreshOnResume);
      document.removeEventListener('visibilitychange', refreshOnResume);
    };
  }, []);

  return timeData;
}

const JAKARTA_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour12: false,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

export function getJakartaTimeData(now = new Date()) {
  const parts = JAKARTA_FORMATTER.formatToParts(now);
  const partMap = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const hour = parseInt(partMap.hour || '0', 10);
  const minute = partMap.minute?.padStart(2, '0') || '00';
  const second = partMap.second?.padStart(2, '0') || '00';
  const hourStr = String(hour).padStart(2, '0');

  // Convert to date object adjusted to Jakarta
  const jakartaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const dayName = DAYS_ID[jakartaDate.getDay()];
  const dateNum = jakartaDate.getDate();
  const monthName = MONTHS_ID[jakartaDate.getMonth()];
  const year = jakartaDate.getFullYear();

  // Dynamic greeting based on Jakarta local hour
  let greeting = 'Selamat Pagi';
  let greetingIcon = '🌅';
  let greetingSubtitle = 'Awali hari dengan niat baik & fokus pada impianmu.';

  if (hour >= 4 && hour < 11) {
    greeting = 'Selamat Pagi';
    greetingIcon = '🌅';
    greetingSubtitle = 'Semangat pagi! Hari baru, peluang baru menantimu.';
  } else if (hour >= 11 && hour < 15) {
    greeting = 'Selamat Siang';
    greetingIcon = '☀️';
    greetingSubtitle = 'Pertahankan ritme produktivitasmu & luangkan waktu istirahat sejenak.';
  } else if (hour >= 15 && hour < 18) {
    greeting = 'Selamat Sore';
    greetingIcon = '🌇';
    greetingSubtitle = 'Waktu sore yang tenang untuk menyelesaikan sisa tugas hari ini.';
  } else {
    greeting = 'Selamat Malam';
    greetingIcon = '🌙';
    greetingSubtitle = 'Evaluasi pencapaian hari ini & bersiaplah untuk istirahat yang berkualitas.';
  }

  return {
    timeString: `${hourStr}:${minute} WIB`,
    timeWithZone: `${hourStr}:${minute}:${second} WIB`,
    hour: hourStr,
    minute,
    second,
    rawHour: hour,
    dayName,
    dateString: `${dayName}, ${dateNum} ${monthName} ${year}`,
    shortDate: `${dateNum} ${monthName.slice(0, 3)}`,
    greeting,
    greetingIcon,
    greetingSubtitle,
    timezone: 'WIB (Asia/Jakarta)'
  };
}
