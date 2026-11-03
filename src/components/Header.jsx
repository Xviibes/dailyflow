import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Palette, 
  Volume2, 
  VolumeX, 
  Database, 
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Quote,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';
import { useJakartaTime } from '../hooks/useJakartaTime';

function ClockBadge({ jakartaTime }) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/15 rounded-2xl px-3.5 py-1.5 shadow-lg shadow-black/20 shrink-0">
      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 animate-pulse shrink-0">
        <Clock className="w-4 h-4" />
      </div>
      <div className="text-center">
        <div className="flex items-baseline gap-1.5 justify-center">
          <span className="font-mono text-base sm:text-2xl font-extrabold tracking-wider text-white drop-shadow-md whitespace-nowrap">
            {jakartaTime.timeString}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 tracking-wider whitespace-nowrap">
            WIB
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
          {jakartaTime.dateString}
        </div>
      </div>
    </div>
  );
}

export function Header({ 
  currentTheme, 
  onOpenThemeModal, 
  soundEnabled, 
  onToggleSound, 
  onOpenDataModal,
  onOpenNotificationModal,
  onOpenSettingsModal,
  sidebarOpen,
  onToggleSidebar,
  desktopSidebarOpen = true,
  onToggleDesktopSidebar,
  currentQuote,
  onRefreshQuote
}) {
  const jakartaTime = useJakartaTime();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Sembunyikan header saat scroll ke bawah, tampilkan kembali saat scroll ke atas
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 15) {
        setHidden(false);
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 40);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHeaderHidden = hidden && !sidebarOpen;

  return (
    <header
      className={`sticky top-0 z-30 bg-slate-950/95 border-b border-white/10 transition-all duration-300 ${
        isHeaderHidden
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile hamburger */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* PC / Desktop Sidebar Toggle (Buka / Tutup Menu Utama agar tampilan lebih luas) */}
          {typeof onToggleDesktopSidebar === 'function' && (
            <button
              onClick={onToggleDesktopSidebar}
              className="hidden lg:flex items-center gap-1.5 shrink-0 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-semibold transition-all active:scale-95"
              title={desktopSidebarOpen ? 'Sembunyikan Menu Utama (Tampilan Luas)' : 'Buka Menu Utama'}
            >
              {desktopSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-indigo-400" />
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
                  <span>Menu</span>
                </>
              )}
            </button>
          )}

          {/* Left: Greeting (bisa menyusut & truncate agar tidak terpotong) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xl shrink-0">{jakartaTime.greetingIcon}</span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {jakartaTime.greeting}, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Sobat Produktif</span>
              </h1>
              <p className="hidden sm:block text-xs text-slate-400 font-medium truncate">
                {jakartaTime.greetingSubtitle}
              </p>
            </div>
          </div>

          {/* Center: Clock (desktop/tablet) */}
          <div className="hidden lg:block">
            <ClockBadge jakartaTime={jakartaTime} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Quote (hanya layar sangat lebar) */}
            {currentQuote && (
              <button
                onClick={onRefreshQuote}
                className="hidden 2xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all max-w-[260px] truncate shrink-0"
                title="Klik untuk kutipan inspirasi baru"
              >
                <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate italic">"{currentQuote.quote}"</span>
                <RefreshCw className="w-3 h-3 text-slate-400 shrink-0 hover:rotate-180 transition-transform" />
              </button>
            )}

            {/* Notification Settings */}
            <button
              onClick={onOpenNotificationModal}
              className="p-2 lg:px-3 lg:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all shrink-0"
              title="Pengingat Notifikasi HP & Browser"
            >
              <Bell className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span className="hidden lg:inline">Notif</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 lg:px-3 lg:py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
              title={soundEnabled ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Senyap (Klik untuk Nyalakan)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
              <span className="hidden lg:inline">{soundEnabled ? 'Audio Aktif' : 'Mute'}</span>
            </button>

            {/* Theme Selector */}
            <button
              onClick={onOpenThemeModal}
              className="p-2 lg:px-3 lg:py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
              title="Ganti Tema & Wallpaper Estetik"
            >
              <Palette className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden lg:inline">Tema:</span>
              <span className="hidden xl:inline font-bold text-indigo-300">{currentTheme?.name}</span>
            </button>

            {/* Data Backup / Export */}
            <button
              onClick={onOpenDataModal}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors shrink-0"
              title="Kelola Data (Backup, Pulihkan, Reset)"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Settings Gear (⚙️) */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition-colors shrink-0"
              title="Pengaturan (⚙️)"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clock baris sendiri khusus mobile agar tidak terpotong */}
        <div className="lg:hidden flex justify-center mt-2.5">
          <ClockBadge jakartaTime={jakartaTime} />
        </div>
      </div>
    </header>
  );
}
