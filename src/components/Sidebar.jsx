import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  SunMoon,
  StickyNote,
  Target,
  HeartPulse,
  WalletCards,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  X
} from 'lucide-react';

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  isDesktopOpen = true,
  onToggleDesktop,
  todoCount,
  notesCount,
  themeColor = 'indigo'
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Ringkasan & Pusat Kontrol'
    },
    {
      id: 'todo',
      label: 'To-Do Harian',
      icon: CheckSquare,
      badge: todoCount > 0 ? `${todoCount}` : null,
      badgeColor: 'bg-indigo-500 text-white',
      desc: 'Tugas Hari Ini & Prioritas'
    },
    {
      id: 'planning',
      label: 'Life & Planning',
      icon: CalendarRange,
      badge: '3-in-1',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      desc: 'Harian, Mingguan, Bulanan'
    },
    {
      id: 'routines',
      label: 'Morning & Night Routine',
      icon: SunMoon,
      badge: null,
      desc: 'Kebiasaan Pagi & Malam'
    },
    {
      id: 'notes',
      label: 'Notes & Memo',
      icon: StickyNote,
      badge: notesCount > 0 ? `${notesCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      desc: 'Catatan Estetik & Ide'
    },
    {
      id: 'goals',
      label: 'Quick Goals',
      icon: Target,
      badge: null,
      desc: 'Hari, Minggu, Bulan, Hidup'
    },
    {
      id: 'wellness',
      label: 'Wellness & Health',
      icon: HeartPulse,
      badge: 'Sehat',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      desc: 'Air, Mood, Tidur, Olahraga'
    },
    {
      id: 'finance',
      label: 'Finance Tracker',
      icon: WalletCards,
      badge: 'Kas',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      desc: 'Pemasukan & Pengeluaran'
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950/95 border-r border-white/10
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight text-white font-display">
                  Daily<span className="text-indigo-400">Flow</span>
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Life Planner & Productivity</p>
            </div>
          </div>

          {/* Tombol Close di Mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tombol Close / Sembunyikan Sidebar di PC */}
          {typeof onToggleDesktop === 'function' && (
            <button
              onClick={onToggleDesktop}
              className="hidden lg:flex p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Sembunyikan Menu Utama (Tampilan Lebih Luas)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border border-indigo-500/40 text-white shadow-lg shadow-indigo-950/50' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`
                    p-2 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40' 
                      : 'bg-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:bg-white/10'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold truncate leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / System Badge */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-semibold text-white">WIB Real-Time Mode</div>
                <div className="text-[10px] text-slate-400">Jakarta, Indonesia (UTC+7)</div>
              </div>
            </div>
            <span className="text-xs">🇮🇩</span>
          </div>
        </div>
      </aside>
    </>
  );
}
