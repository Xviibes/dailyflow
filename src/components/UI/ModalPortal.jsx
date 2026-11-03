import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal Modal Global agar seluruh modal dirender langsung di `document.body` (di luar
 * `.glass-panel` / `backdrop-filter` yang memotong `position: fixed`).
 * Mendukung scroll penuh di layar kecil/laptop, klik di luar untuk tutup, & tombol Escape.
 */
export function ModalPortal({ isOpen = true, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] overflow-y-auto bg-slate-950/85 flex p-3 sm:p-6 animate-fade-in"
      onClick={() => {
        if (typeof onClose === 'function') onClose();
      }}
    >
      <div
        className={`glass-panel w-full ${maxWidth} m-auto p-5 sm:p-6 rounded-3xl border border-white/20 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
