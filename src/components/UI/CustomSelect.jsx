import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

// Preset visual otomatis (dot warna / ikon) agar setiap opsi tampil hidup & estetik
const COLOR_DOT_PRESETS = {
  amber: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)] ring-2 ring-amber-400/30',
  emerald: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] ring-2 ring-emerald-400/30',
  indigo: 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)] ring-2 ring-indigo-400/30',
  rose: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)] ring-2 ring-rose-400/30',
  cyan: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] ring-2 ring-cyan-400/30',
  purple: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.7)] ring-2 ring-purple-400/30',
  Tinggi: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] ring-2 ring-rose-500/30',
  Sedang: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] ring-2 ring-amber-400/30',
  Rendah: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] ring-2 ring-emerald-400/30',
};

const ICON_PRESETS = {
  Semua: '✨',
  Kerja: '💼',
  Belajar: '📚',
  Pribadi: '🏠',
  Kesehatan: '💪',
  Belanja: '🛒',
  Finansial: '💰',
  Sosial: '🤝',
  Ide: '💡',
  Resep: '🥗',
  Buku: '📖',
  Kutipan: '💬',
  'Gaji Utama': '💵',
  'Freelance / Proyek': '💻',
  Investasi: '📈',
  'Bonus / Hadiah': '🎁',
  'Makanan & Minuman': '🍽️',
  Transportasi: '🚗',
  'Belanja Bulanan': '🛍️',
  'Tagihan & Utilitas': '⚡',
  'Hiburan & Hobi': '🎮',
  'Kesehatan & Gym': '🏋️',
  Pendidikan: '🎓',
  Lainnya: '📌',
};

/**
 * Komponen Dropdown Estetik Glassmorphism (menggantikan <select> bawaan browser/OS)
 * Bisa menerima prop `options` berupa array [{ value, label, icon, dot }]
 * ATAU anak `<option value="...">Label</option>` secara langsung.
 */
export function CustomSelect({
  value,
  onChange,
  options: propOptions,
  children,
  className = '',
  placeholder = 'Pilih opsi...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalisasi daftar opsi dari prop `options` maupun dari `<option>` children
  const normalizedOptions = useMemo(() => {
    if (Array.isArray(propOptions) && propOptions.length > 0) {
      return propOptions.map((opt) =>
        typeof opt === 'object'
          ? opt
          : { value: opt, label: String(opt) }
      );
    }

    const items = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const optValue = child.props.value;
      const rawLabel = React.Children.toArray(child.props.children).join('');
      items.push({
        value: optValue,
        label: rawLabel || String(optValue),
        icon: child.props.icon,
        dot: child.props.dot,
      });
    });
    return items;
  }, [propOptions, children]);

  const selectedOption = useMemo(() => {
    return (
      normalizedOptions.find((o) => String(o.value) === String(value)) ||
      normalizedOptions[0] || { value: '', label: placeholder }
    );
  }, [normalizedOptions, value, placeholder]);

  // Hitung posisi floating menu agar selalu pas & otomatis flip ke atas bila dekat batas bawah layar
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedHeight = Math.min(normalizedOptions.length * 44 + 16, 260);
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const width = Math.max(rect.width, 185);
    const left = Math.min(Math.max(8, rect.left), viewportWidth - width - 8);

    setMenuStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      ...(openUpward
        ? { bottom: `${viewportHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optValue) => {
    if (onChange) {
      // Kirim event sintetis `{ target: { value } }` agar kompatibel penuh dengan handler `<select>`
      onChange({ target: { value: optValue } });
    }
    setIsOpen(false);
  };

  // Tutup saat klik di luar, tekan Escape, atau layar di-resize/scroll di luar menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, normalizedOptions.length]);

  // Helper visual untuk tiap item (dot warna atau ikon)
  const renderOptionVisual = (opt) => {
    const dotClass = opt.dot || COLOR_DOT_PRESETS[opt.value];
    if (dotClass) {
      return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />;
    }
    // Jika label sudah diawali emoji (mis. "🔴 Tinggi"), jangan duplikasi ikon
    const startsWithEmoji = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(
      opt.label.trim()
    );
    if (startsWithEmoji) return null;

    const icon = opt.icon || ICON_PRESETS[opt.value];
    if (icon) {
      return <span className="text-sm leading-none shrink-0">{icon}</span>;
    }
    return (
      <span className="w-2 h-2 rounded-full bg-indigo-400/70 shrink-0" />
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`glass-input flex items-center justify-between gap-2 text-left transition-all select-none ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/25 bg-slate-900/85'
            : 'hover:border-white/25 hover:bg-slate-900/75'
        } ${className}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {renderOptionVisual(selectedOption)}
          <span className="truncate text-slate-100 font-medium">
            {selectedOption.label}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="z-[100] p-1.5 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl shadow-black/80 ring-1 ring-indigo-500/20 animate-fade-in max-h-64 overflow-y-auto"
          >
            <div className="space-y-1">
              {normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600/35 via-purple-600/25 to-indigo-600/15 border border-indigo-500/40 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent active:scale-[0.99]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                      {renderOptionVisual(opt)}
                      <span className="truncate">{opt.label}</span>
                    </span>

                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/50 scale-100'
                          : 'border border-white/20 text-transparent scale-90'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
