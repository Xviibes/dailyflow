import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  ClipboardPaste,
  FileJson,
  X,
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useConfirm } from './ConfirmDialog';
import { ModalPortal } from '../UI/ModalPortal';

export function DataManagementModal({
  isOpen,
  onClose,
  allData,
  onImportData,
  onResetData,
  soundEnabled,
}) {
  const fileInputRef = useRef(null);
  const confirm = useConfirm();

  const [copiedJson, setCopiedJson] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [pasteError, setPasteError] = useState('');

  if (!isOpen) return null;

  const getFormattedJson = () => JSON.stringify(allData, null, 2);
  const getBackupFileName = () =>
    `dailyflow-backup-${new Date().toISOString().split('T')[0]}.json`;

  // Fungsi Unduh Berkas JSON yang kompatibel dengan Android WebView (navigator.share File + fallback data URI)
  const handleExport = async () => {
    const jsonString = getFormattedJson();
    const fileName = getBackupFileName();

    // 1. Coba gunakan Web Share API dengan objek File (Sangat kompatibel di Android untuk simpan ke File Manager/Drive/WA)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      try {
        const file = new File([jsonString], fileName, {
          type: 'application/json',
        });
        const canShareFile =
          typeof navigator.canShare === 'function'
            ? navigator.canShare({ files: [file] })
            : true;

        if (canShareFile) {
          await navigator.share({
            title: 'Backup Data DailyFlow',
            text: `Cadangan data DailyFlow (${fileName})`,
            files: [file],
          });
          playSound('success', soundEnabled);
          return;
        }
      } catch (shareErr) {
        if (shareErr && shareErr.name === 'AbortError') {
          return;
        }
        // Lanjut ke fallback data URI jika share gagal
      }
    }

    // 2. Fallback ke Data URI (data:text/json;charset=utf-8,...)
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playSound('success', soundEnabled);
    } catch (err) {
      alert(
        'Gagal mengunduh berkas secara langsung. Silakan gunakan tombol "Salin Teks Backup (Copy JSON)" di sebelahnya: ' +
          err.message
      );
    }
  };

  // Fungsi Salin Teks Backup (Copy JSON) ke Clipboard (100% pasti berhasil di Android WebView & Browser)
  const handleCopyJson = async () => {
    const jsonString = getFormattedJson();
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(jsonString);
      } else {
        const tempArea = document.createElement('textarea');
        tempArea.value = jsonString;
        tempArea.style.position = 'fixed';
        tempArea.style.opacity = '0';
        document.body.appendChild(tempArea);
        tempArea.focus();
        tempArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempArea);
      }
      setCopiedJson(true);
      playSound('success', soundEnabled);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch (err) {
      alert('Gagal menyalin teks JSON: ' + err.message);
    }
  };

  const applyRestoredObject = (parsed) => {
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      onImportData(parsed);
      playSound('success', soundEnabled);
      setPasteJsonText('');
      setPasteError('');
      alert('Data berhasil dipulihkan!');
      onClose();
    } else {
      setPasteError('Format JSON tidak valid. Pastikan teks merupakan objek backup DailyFlow.');
      alert('Format berkas/teks JSON tidak valid.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        applyRestoredObject(parsed);
      } catch (err) {
        alert('Gagal membaca berkas JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPasteJsonText(text);
          setPasteError('');
          playSound('click', soundEnabled);
        }
      }
    } catch {
      // Abaikan jika izin baca otomatis ditolak, user bisa tekan tahan -> Tempel manual
    }
  };

  const handleRestoreFromText = (e) => {
    e.preventDefault();
    const trimmed = pasteJsonText.trim();
    if (!trimmed) {
      setPasteError('Silakan tempel (paste) teks JSON backup terlebih dahulu.');
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      applyRestoredObject(parsed);
    } catch {
      setPasteError('Teks JSON tidak valid atau terpotong. Pastikan seluruh teks backup disalin utuh.');
    }
  };

  const handleReset = async () => {
    if (
      await confirm(
        'Apakah kamu yakin ingin mereset semua data kembali ke data contoh bawaan? Perubahan tersimpan saat ini akan digantikan.',
        { title: 'Reset Semua Data', confirmLabel: 'Ya, Reset', tone: 'warning' }
      )
    ) {
      onResetData();
      playSound('success', soundEnabled);
      alert('Data berhasil direset ke setelan demo bawaan.');
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-400/30 text-indigo-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Kelola & Cadangkan Data
              </h3>
              <p className="text-xs text-slate-300">
                Backup & Restore aman untuk Android maupun Desktop
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions List */}
        <div className="space-y-3.5">
          {/* 1. Export / Backup */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 border border-white/15 shadow-inner space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor & Cadangkan Data (Backup JSON)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Unduh/bagikan berkas JSON ke perangkatmu, atau salin teks JSON langsung ke clipboard untuk disimpan di catatan/WhatsApp.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Unduh Berkas JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  copiedJson
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/45 border-indigo-400/40 text-indigo-100'
                }`}
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    <span>Salin Teks Backup (Copy JSON)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Import / Restore (File Upload + Paste JSON Text) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 border border-white/15 shadow-inner space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Pulihkan Data (Restore / Impor JSON)</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json,text/plain"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Pilih Berkas JSON</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pilih berkas <code className="text-indigo-300">.json</code> dari penyimpanan, atau <strong>tempel (paste) teks JSON backup</strong> langsung pada kotak di bawah ini:
            </p>

            <form onSubmit={handleRestoreFromText} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={3}
                  value={pasteJsonText}
                  onChange={(e) => {
                    setPasteJsonText(e.target.value);
                    if (pasteError) setPasteError('');
                  }}
                  placeholder='Tempel (Paste) teks JSON backup di sini... contoh: {"todos": [...]}'
                  className="w-full p-2.5 rounded-xl glass-input text-[11px] font-mono leading-relaxed resize-y"
                />
                {!pasteJsonText && (
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="absolute right-2 bottom-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold text-slate-200 flex items-center gap-1 transition-all"
                    title="Tempel dari Clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3 text-indigo-300" />
                    <span>Tempel Clipboard</span>
                  </button>
                )}
              </div>

              {pasteError && (
                <p className="text-[11px] text-rose-400 font-semibold">{pasteError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Pulihkan dari Teks JSON</span>
              </button>
            </form>
          </div>

          {/* 3. Reset */}
          <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/25 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset ke Data Demo Bawaan</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Kembalikan seluruh daftar contoh to-do, rutinitas, dan jadwal agar aplikasi kembali terisi segar.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
            >
              Reset ke Pengaturan Awal
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
