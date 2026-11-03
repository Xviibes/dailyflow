import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarRange, 
  Dumbbell, 
  WalletCards, 
  StickyNote 
} from 'lucide-react';

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  todoCount
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Sembunyikan saat scroll ke bawah, tampilkan saat scroll ke atas
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'todo', label: 'To-Do', icon: CheckSquare, badge: todoCount },
    { id: 'planning', label: 'Planner', icon: CalendarRange },
    { id: 'wellness', label: 'Workout', icon: Dumbbell },
    { id: 'finance', label: 'Kas', icon: WalletCards },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden p-2.5 pb-4 pointer-events-none transition-all duration-300 ${
        hidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto pointer-events-auto bg-slate-950/95 border border-white/15 rounded-3xl p-1.5 shadow-2xl shadow-black/60 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all
                ${isActive 
                  ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-md' 
                  : 'text-slate-400 hover:text-white'}
              `}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-white font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
