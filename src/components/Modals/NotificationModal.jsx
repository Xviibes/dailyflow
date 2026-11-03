import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  Smartphone, 
  Clock, 
  Droplets, 
  Dumbbell, 
  Moon, 
  Sun, 
  Sparkles, 
  X, 
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { 
  getNotificationPermission, 
  checkNotificationPermission,
  requestNotificationPermission, 
  sendTestNotification,
  sendWaterReminder,
  sendWorkoutReminder 
} from '../../utils/notifications';
import { playSound } from '../../utils/audio';
import { ModalPortal } from '../UI/ModalPortal';

export function NotificationModal({
  isOpen,
  onClose,
  notificationSettings,
  setNotificationSettings,
  soundEnabled,
  todayWorkout,
  currentDayName
}) {
  const [permission, setPermission] = useState(getNotificationPermission());

  useEffect(() => {
    if (isOpen) {
      checkNotificationPermission().then(res => setPermission(res));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      playSound('fanfare', soundEnabled);
      sendTestNotification();
    } else {
      playSound('delete', soundEnabled);
    }
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') {
        alert('Izin notifikasi belum diberikan di perambanmu. Klik tombol "Aktifkan Izin Notifikasi" terlebih dahulu.');
        return;
      }
    }
    playSound('success', soundEnabled);
    sendTestNotification();
  };

  const handleToggleSetting = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    playSound('click', soundEnabled);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Notifikasi & Pengingat HP
              </h3>
              <p className="text-xs text-slate-400">
                Kirim notifikasi ke peramban Chrome & HP untuk menjaga disiplin rutinitas.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card & Permission Action */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Status Izin Peramban:</span>
            </div>

            {permission === 'granted' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Notifikasi Aktif 🟢</span>
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                Diblokir di Browser 🔴
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                Belum Diaktifkan 🟡
              </span>
            )}
          </div>

          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Aktifkan Izin Notifikasi Peramban</span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kirim Notifikasi Uji Coba Sekarang 🔔</span>
          </button>
        </div>

        {/* Automatic Reminders Toggles */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pengaturan Pengingat Otomatis</span>
          </div>

          {/* Water Reminder Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Pengingat Minum Air Putih</div>
                <div className="text-[11px] text-slate-400">Kirim notifikasi setiap 60 menit untuk hidrasi</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.waterReminder}
              onChange={() => handleToggleSetting('waterReminder')}
              className="w-5 h-5 rounded text-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Workout Reminder Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Pengingat Workout ({currentDayName}: {todayWorkout?.focus})</div>
                <div className="text-[11px] text-slate-400">Pengingat sesi latihan sesuai jadwal split harian</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.workoutReminder}
              onChange={() => handleToggleSetting('workoutReminder')}
              className="w-5 h-5 rounded text-indigo-500 cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Morning Routine Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Pengingat Rutinitas Pagi (07:00 WIB)</div>
                <div className="text-[11px] text-slate-400">Awali hari dengan memeriksa checklist kebiasaan</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.morningReminder}
              onChange={() => handleToggleSetting('morningReminder')}
              className="w-5 h-5 rounded text-amber-500 cursor-pointer accent-amber-500"
            />
          </div>

          {/* Night Routine Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Pengingat Rutinitas Malam (21:30 WIB)</div>
                <div className="text-[11px] text-slate-400">Evaluasi pencapaian hari ini & relaksasi sebelum tidur</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.nightReminder}
              onChange={() => handleToggleSetting('nightReminder')}
              className="w-5 h-5 rounded text-purple-500 cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* 📱 Cara Akses & Install di HP Guide */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5 text-xs">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>Cara Akses & Install di Chrome HP Android / iOS:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed text-[11px]">
            <li>Buka aplikasi ini di <strong className="text-indigo-300">Chrome di HP</strong>.</li>
            <li>Masukkan alamat URL aplikasi ini (alamat situs yang sedang kamu buka sekarang) di Chrome HP.</li>
            <li>Ketuk tombol menu Chrome (titik tiga ⋮ di kanan atas).</li>
            <li>Pilih <strong className="text-indigo-300">"Tambahkan ke Layar Utama" (Add to Home screen)</strong> atau <strong className="text-indigo-300">"Install Aplikasi"</strong>.</li>
            <li>DailyFlow akan terpasang layaknya aplikasi Android asli dengan ikon sendiri dan layar penuh tanpa bilah URL!</li>
          </ol>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </ModalPortal>
  );
}
