import React, { useRef } from 'react';
import { Database, Download, Upload, RotateCcw, AlertTriangle, Check, X } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useConfirm } from './ConfirmDialog';
import { ModalPortal } from '../UI/ModalPortal';

export function DataManagementModal({
  isOpen,
  onClose,
  allData,
  onImportData,
  onResetData,
  soundEnabled
}) {
  const fileInputRef = useRef(null);
  const confirm = useConfirm();

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `dailyflow-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playSound('success', soundEnabled);
    } catch (err) {
      alert('Gagal mengekspor data: ' + err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (typeof parsed === 'object' && parsed !== null) {
          onImportData(parsed);
          playSound('success', soundEnabled);
          alert('Data berhasil dipulihkan!');
          onClose();
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (await confirm('Apakah kamu yakin ingin mereset semua data kembali ke data contoh bawaan? Perubahan tersimpan saat ini akan digantikan.', { title: 'Reset Semua Data', confirmLabel: 'Ya, Reset', tone: 'warning' })) {
      onResetData();
      playSound('success', soundEnabled);
      alert('Data berhasil direset ke setelan demo bawaan.');
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Kelola & Cadangkan Data
              </h3>
              <p className="text-xs text-slate-400">
                Data disimpan otomatis di peramban (LocalStorage)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          
          {/* Export */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor & Unduh Cadangan (Backup JSON)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unduh salinan berkas semua catatan, to-do, keuangan, dan tujuan untuk disimpan di komputermu.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Unduh Berkas JSON Sekarang
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Pulihkan Data dari Berkas Cadangan</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unggah berkas JSON cadangan yang pernah kamu unduh sebelumnya.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Pilih Berkas JSON
            </button>
          </div>

          {/* Reset */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset ke Data Demo Bawaan</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kembalikan seluruh daftar contoh to-do, rutinitas, dan jadwal agar aplikasi kembali terisi segar.
            </p>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
            >
              Reset ke Pengaturan Awal
            </button>
          </div>

        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </ModalPortal>
  );
}
