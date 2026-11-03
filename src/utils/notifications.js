// Native Android (@capacitor/local-notifications) & Web Notification Fallback Helper
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let swRegistration = null;
let cachedNativePermission = 'default';
let channelInitialized = false;
let isSyncingNotifications = false;
let lastSyncedSignature = '';

const ALARM_CHANNEL_ID = 'dailyflow-alarms';

// Notification IDs for deterministic scheduling & cancellation
const NOTIFICATION_IDS = {
  TEST: 999,
  WATER_BASE: 1000, // 1001..1012
  MORNING_ROUTINE: 1101,
  NIGHT_ROUTINE: 1102,
  WORKOUT: 1103,
  TODO_BASE: 2000,
};

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Helper to compute next occurrence Date for (hour, minute)
function getNextTimeOccurrence(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

// Deterministic numeric ID from string ID (for To-Do items)
function hashStringIdToInt(str, offset = NOTIFICATION_IDS.TODO_BASE) {
  let hash = 0;
  const text = String(str || '');
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000000;
  }
  return offset + Math.abs(hash);
}

// Ensure Android Notification Channel is created once for high-priority alarms
export async function ensureNotificationChannel() {
  if (!isNativeApp() || channelInitialized) return;
  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'DailyFlow Alarms & Reminders',
      description: 'Notifikasi alarm pengingat minum air, rutinitas pagi/malam, workout, dan tugas To-Do',
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    channelInitialized = true;
  } catch (error) {
    console.warn('Gagal membuat channel notifikasi:', error);
  }
}

// Register Service Worker for PWA & Web Notifications, and initialize Native channel
export async function registerServiceWorker() {
  if (isNativeApp()) {
    await ensureNotificationChannel();
    await checkNotificationPermission();
    return null;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    swRegistration = reg;
    return reg;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

// Get current permission status synchronously (with cached state for Native)
export function getNotificationPermission() {
  if (isNativeApp()) {
    return cachedNativePermission;
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'granted', 'denied', or 'default'
}

// Check current permission status asynchronously
export async function checkNotificationPermission() {
  if (isNativeApp()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      const display = status?.display === 'prompt' ? 'default' : (status?.display || 'default');
      cachedNativePermission = display;
      return display;
    } catch (error) {
      console.warn('Gagal memeriksa izin LocalNotifications:', error);
      return cachedNativePermission;
    }
  }
  return getNotificationPermission();
}

// Request permission from user (Native LocalNotifications + Web Fallback)
export async function requestNotificationPermission() {
  if (isNativeApp()) {
    try {
      await ensureNotificationChannel();
      const result = await LocalNotifications.requestPermissions();
      const display = result?.display === 'prompt' ? 'default' : (result?.display || 'denied');
      cachedNativePermission = display;
      return display;
    } catch (error) {
      console.warn('Error requesting native notification permission:', error);
      return 'denied';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('Peramban ini tidak mendukung Web Notifications.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Send Immediate or Scheduled Notification (Works on Native Android & Web Fallback)
export async function sendAppNotification(title, options = {}) {
  if (isNativeApp()) {
    try {
      let perm = await checkNotificationPermission();
      if (perm !== 'granted') {
        perm = await requestNotificationPermission();
      }
      if (perm !== 'granted') {
        return false;
      }

      await ensureNotificationChannel();
      const id = options.id || Math.floor((Date.now() % 100000) + 5000);
      const scheduleAt = options.scheduleAt || new Date(Date.now() + 1000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body: options.body || 'DailyFlow: Saatnya cek target produktivitasmu!',
            channelId: ALARM_CHANNEL_ID,
            schedule: {
              at: scheduleAt,
              allowWhileIdle: true,
              ...(options.schedule || {}),
            },
            extra: options.extra || { tag: options.tag || 'dailyflow-reminder' },
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Gagal menjadwalkan LocalNotification native:', err);
    }
  }

  // Fallback to Web Notification API if opened via web browser
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  const defaultOptions = {
    body: 'DailyFlow: Saatnya cek target produktivitasmu!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [150, 80, 150],
    tag: 'dailyflow-reminder',
    renotify: true,
    ...options,
  };

  try {
    if (!swRegistration && 'serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => null);
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, defaultOptions);
      return true;
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, defaultOptions);
      return true;
    }
  } catch (err) {
    console.warn('Gagal menampilkan notifikasi web:', err);
  }
  return false;
}

// Pre-defined Reminders (Immediate / Test / Fallback triggers)
export function sendTestNotification() {
  return sendAppNotification('✨ Notifikasi DailyFlow Berhasil!', {
    id: NOTIFICATION_IDS.TEST,
    body: 'Keren! Alarm & notifikasi latar belakang sudah aktif di perangkat ini untuk mengingatkan to-do, minum air, rutinitas, dan jadwal workout.',
    icon: '/icon.svg',
    tag: 'test-notification',
  });
}

export function sendWaterReminder() {
  return sendAppNotification('💧 Waktunya Minum Air Putih!', {
    id: NOTIFICATION_IDS.WATER_BASE,
    body: 'Tubuhmu butuh hidrasi segar. Minum segelas air (250ml) sekarang untuk menjaga fokus!',
    icon: '/icon.svg',
    tag: 'water-reminder',
  });
}

export function sendWorkoutReminder(dayName = 'Hari Ini', workoutFocus = 'Sesi Latihan') {
  return sendAppNotification(`🏋️‍♂️ Pengingat Workout Hari Ini (${dayName})!`, {
    id: NOTIFICATION_IDS.WORKOUT,
    body: `Target hari ini: ${workoutFocus}. Luangkan waktu untuk peregangan & lakukan sesi latihanmu!`,
    icon: '/icon.svg',
    tag: 'workout-reminder',
  });
}

export function sendMorningRoutineReminder() {
  return sendAppNotification('🌅 Selamat Pagi! Waktunya Rutinitas Pagi (07:00 WIB)', {
    id: NOTIFICATION_IDS.MORNING_ROUTINE,
    body: 'Awali harimu dengan penuh semangat! Cek daftar kebiasaan pagi dan target prioritasmu di DailyFlow.',
    icon: '/icon.svg',
    tag: 'morning-routine-reminder',
  });
}

export function sendNightRoutineReminder() {
  return sendAppNotification('🌙 Waktunya Rutinitas Malam (21:30 WIB)', {
    id: NOTIFICATION_IDS.NIGHT_ROUTINE,
    body: 'Saatnya evaluasi pencapaian hari ini, lengkapi checklist malam, dan bersiap istirahat berkualitas.',
    icon: '/icon.svg',
    tag: 'night-routine-reminder',
  });
}

export function sendTodoReminder(todo) {
  if (!todo) return Promise.resolve(false);
  return sendAppNotification(`📌 Pengingat Tugas: ${todo.title}`, {
    id: hashStringIdToInt(todo.id),
    body: `Kategori: ${todo.category || 'Umum'} • Prioritas: ${todo.priority || 'Sedang'} (${todo.dueTime || 'Sekarang'} WIB)`,
    icon: '/icon.svg',
    tag: `todo-${todo.id}`,
  });
}

/**
 * Buat signature ringan dari pengaturan pengingat & daftar tugas To-Do aktif
 * agar sinkronisasi HANYA dieksekusi jika benar-benar ada perubahan jadwal.
 */
export function buildNotificationSyncSignature({
  notificationSettings = {},
  todayWorkout = {},
  currentDayName = '',
  todos = [],
} = {}) {
  const settingsKey = `${Boolean(notificationSettings.waterReminder)}-${Boolean(
    notificationSettings.morningReminder
  )}-${Boolean(notificationSettings.nightReminder)}-${Boolean(
    notificationSettings.workoutReminder
  )}`;
  const workoutKey = `${currentDayName}:${todayWorkout?.focus || ''}`;
  const activeTodosKey = (Array.isArray(todos) ? todos : [])
    .filter((t) => t && !t.completed && t.dueDate && t.dueTime)
    .map((t) => `${t.id}:${t.title}:${t.dueDate}:${t.dueTime}:${t.priority}`)
    .join('|');
  return `${settingsKey}__${workoutKey}__${activeTodosKey}`;
}

/**
 * Fungsi Terpusat Sinkronisasi Notifikasi Background (@capacitor/local-notifications).
 * HANYA dipanggil saat:
 * - Inisialisasi awal aplikasi
 * - User mengubah toggle pengingat (notificationSettings)
 * - User menambah / mengedit / menghapus / mencentang tugas To-Do
 *
 * Selalu membatalkan jadwal lama (LocalNotifications.getPending() -> LocalNotifications.cancel())
 * sebelum menjadwalkan ulang dengan allowWhileIdle: true agar alarm tidak menumpuk/dobel.
 */
export async function syncAllScheduledNotifications({
  notificationSettings = {},
  todayWorkout = {},
  currentDayName = 'Hari Ini',
  todos = [],
  force = false,
} = {}) {
  if (!isNativeApp()) {
    return false;
  }

  const nextSignature = buildNotificationSyncSignature({
    notificationSettings,
    todayWorkout,
    currentDayName,
    todos,
  });

  if (!force && nextSignature === lastSyncedSignature) {
    return true;
  }

  if (isSyncingNotifications) {
    return false;
  }

  isSyncingNotifications = true;

  try {
    const perm = await checkNotificationPermission();
    if (perm !== 'granted') {
      return false;
    }

    await ensureNotificationChannel();

    // PENTING: Selalu batalkan jadwal lama sebelum menjadwalkan ulang agar alarm tidak menumpuk/dobel
    const pending = await LocalNotifications.getPending();
    if (pending?.notifications?.length > 0) {
      const toCancel = pending.notifications
        .filter((n) => n.id !== NOTIFICATION_IDS.TEST)
        .map((n) => ({ id: n.id }));
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel });
      }
    }

    const notificationsToSchedule = [];
    const now = new Date();

    // 1. Pengingat Minum Air Putih setiap 60 menit (allowWhileIdle: true)
    if (notificationSettings.waterReminder) {
      for (let hourOffset = 1; hourOffset <= 12; hourOffset++) {
        const triggerTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
        notificationsToSchedule.push({
          id: NOTIFICATION_IDS.WATER_BASE + hourOffset,
          title: '💧 Waktunya Minum Air Putih!',
          body: 'Tubuhmu butuh hidrasi segar. Minum segelas air (250ml) sekarang untuk menjaga fokus!',
          channelId: ALARM_CHANNEL_ID,
          schedule: {
            at: triggerTime,
            allowWhileIdle: true,
            ...(hourOffset === 1 ? { every: 'hour' } : {}),
          },
          extra: { type: 'water-reminder' },
        });
      }
    }

    // 2. Pengingat Rutinitas Pagi pukul 07:00 WIB (allowWhileIdle: true)
    if (notificationSettings.morningReminder) {
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.MORNING_ROUTINE,
        title: '🌅 Rutinitas Pagi DailyFlow (07:00 WIB)',
        body: 'Awali hari dengan memeriksa checklist kebiasaan pagi dan target utamamu!',
        channelId: ALARM_CHANNEL_ID,
        schedule: {
          at: getNextTimeOccurrence(7, 0),
          every: 'day',
          allowWhileIdle: true,
        },
        extra: { type: 'morning-routine' },
      });
    }

    // 3. Pengingat Rutinitas Malam pukul 21:30 WIB (allowWhileIdle: true)
    if (notificationSettings.nightReminder) {
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.NIGHT_ROUTINE,
        title: '🌙 Rutinitas Malam DailyFlow (21:30 WIB)',
        body: 'Evaluasi pencapaian hari ini, isi jurnal syukur & relaksasi sebelum tidur.',
        channelId: ALARM_CHANNEL_ID,
        schedule: {
          at: getNextTimeOccurrence(21, 30),
          every: 'day',
          allowWhileIdle: true,
        },
        extra: { type: 'night-routine' },
      });
    }

    // 4. Pengingat Workout Harian pukul 16:30 WIB (allowWhileIdle: true)
    if (notificationSettings.workoutReminder) {
      const focusText = todayWorkout?.focus || 'Sesi Latihan Harian';
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.WORKOUT,
        title: `🏋️‍♂️ Pengingat Workout (${currentDayName})!`,
        body: `Target latihan: ${focusText}. Luangkan waktu untuk sesi workoutmu hari ini!`,
        channelId: ALARM_CHANNEL_ID,
        schedule: {
          at: getNextTimeOccurrence(16, 30),
          every: 'day',
          allowWhileIdle: true,
        },
        extra: { type: 'workout-reminder' },
      });
    }

    // 5. Pengingat Tugas To-Do berdasarkan dueDate & dueTime (allowWhileIdle: true)
    if (Array.isArray(todos)) {
      todos.forEach((todo) => {
        if (!todo || todo.completed || !todo.dueDate || !todo.dueTime) return;
        const [year, month, day] = todo.dueDate.split('-').map(Number);
        const [hour, minute] = todo.dueTime.split(':').map(Number);
        if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return;

        const dueDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
        if (dueDateTime > now) {
          notificationsToSchedule.push({
            id: hashStringIdToInt(todo.id),
            title: `📌 Pengingat Tugas: ${todo.title}`,
            body: `Kategori: ${todo.category || 'Tugas'} • Prioritas: ${todo.priority || 'Sedang'} (${todo.dueTime} WIB)`,
            channelId: ALARM_CHANNEL_ID,
            schedule: {
              at: dueDateTime,
              allowWhileIdle: true,
            },
            extra: { type: 'todo-reminder', todoId: todo.id },
          });
        }
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
    }

    lastSyncedSignature = nextSignature;
    return true;
  } catch (error) {
    console.warn('Gagal menyinkronkan jadwal LocalNotifications:', error);
    return false;
  } finally {
    isSyncingNotifications = false;
  }
}
