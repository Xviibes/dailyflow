import React from 'react';
import { Palette, Check, Sparkles, X, Sliders, Image } from 'lucide-react';
import { THEMES } from '../../constants/themes';
import { playSound } from '../../utils/audio';
import { ModalPortal } from '../UI/ModalPortal';

export function ThemeSelectorModal({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  bgOpacity,
  setBgOpacity,
  bgBlur,
  setBgBlur,
  soundEnabled
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Pilih Tema & Suasana Estetik
              </h3>
              <p className="text-xs text-slate-400">
                Ubah wallpaper dinamis resolusi tinggi dan palet warna visual aplikasi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {THEMES.map((theme) => {
            const isSelected = theme.id === currentThemeId;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  playSound('click', soundEnabled);
                }}
                className={`
                  relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group
                  ${isSelected 
                    ? 'border-indigo-400 ring-4 ring-indigo-500/30 scale-[1.02] shadow-xl' 
                    : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'}
                `}
              >
                {/* Background Image Preview */}
                <div className="h-32 w-full relative overflow-hidden">
                  <img
                    src={theme.bgImage}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 ${theme.overlay} transition-opacity`} />
                  
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                      <Check className="w-3 h-3" />
                      <span>Aktif</span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/95 text-white border border-white/20">
                      {theme.badge}
                    </span>
                  </div>
                </div>

                {/* Theme Info */}
                <div className="p-3.5 bg-slate-900/90 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white font-display">
                      {theme.name}
                    </h4>
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {theme.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Adjustments: Opacity & Blur */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kustomisasi Lapisan Wallpaper</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Tingkat Kegelapan Lapisan (Dimming):</span>
                <span className="font-mono text-indigo-400 font-bold">{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={bgOpacity}
                onChange={e => setBgOpacity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Tingkat Efek Blur Latar:</span>
                <span className="font-mono text-indigo-400 font-bold">{bgBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={bgBlur}
                onChange={e => setBgBlur(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25"
          >
            Selesai Memilih
          </button>
        </div>

      </div>
    </ModalPortal>
  );
}
