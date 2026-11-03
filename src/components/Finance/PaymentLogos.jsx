import React from 'react';

export const PAYMENT_METHODS = [
  // === E-WALLET & QRIS ===
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    group: 'E-Wallet',
    shortLabel: 'SPay',
    bgClass: 'from-[#FF6633] to-[#EE4D2D]',
    borderClass: 'border-[#FF6633]/40',
    badgeClass: 'bg-[#EE4D2D]/15 text-[#FF7A59] border-[#EE4D2D]/30',
    dot: 'bg-[#EE4D2D]',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    group: 'E-Wallet',
    shortLabel: 'GoPay',
    bgClass: 'from-[#00C6F0] to-[#0096BD]',
    borderClass: 'border-[#00AED6]/40',
    badgeClass: 'bg-[#00AED6]/15 text-[#38BDF8] border-[#00AED6]/30',
    dot: 'bg-[#00AED6]',
  },
  {
    id: 'dana',
    name: 'DANA',
    group: 'E-Wallet',
    shortLabel: 'DANA',
    bgClass: 'from-[#28A0F8] to-[#0E74C8]',
    borderClass: 'border-[#118EEA]/40',
    badgeClass: 'bg-[#118EEA]/15 text-[#60A5FA] border-[#118EEA]/30',
    dot: 'bg-[#118EEA]',
  },
  {
    id: 'ovo',
    name: 'OVO',
    group: 'E-Wallet',
    shortLabel: 'OVO',
    bgClass: 'from-[#6D47C7] to-[#432A85]',
    borderClass: 'border-[#6D47C7]/40',
    badgeClass: 'bg-[#6D47C7]/20 text-[#C084FC] border-[#6D47C7]/35',
    dot: 'bg-[#7C3AED]',
  },
  {
    id: 'qris',
    name: 'QRIS',
    group: 'E-Wallet',
    shortLabel: 'QRIS',
    bgClass: 'from-[#F43F5E] to-[#BE123C]',
    borderClass: 'border-[#F43F5E]/40',
    badgeClass: 'bg-[#F43F5E]/15 text-[#FDA4AF] border-[#F43F5E]/30',
    dot: 'bg-[#F43F5E]',
  },

  // === BANK DIGITAL & KONVENSIONAL ===
  {
    id: 'bca',
    name: 'BCA (myBCA / BCA mobile)',
    group: 'Bank',
    shortLabel: 'BCA',
    bgClass: 'from-[#0074D9] to-[#004A8F]',
    borderClass: 'border-[#0074D9]/40',
    badgeClass: 'bg-[#0060AF]/20 text-[#60A5FA] border-[#0074D9]/35',
    dot: 'bg-[#0060AF]',
  },
  {
    id: 'livin',
    name: "Livin' by Mandiri",
    group: 'Bank',
    shortLabel: 'Livin',
    bgClass: 'from-[#004B93] via-[#00366B] to-[#0A2540]',
    borderClass: 'border-[#FFB800]/40',
    badgeClass: 'bg-[#FFB800]/15 text-[#FCD34D] border-[#FFB800]/30',
    dot: 'bg-[#FFB800]',
  },
  {
    id: 'brimo',
    name: 'BRImo (Bank BRI)',
    group: 'Bank',
    shortLabel: 'BRImo',
    bgClass: 'from-[#0066BE] to-[#00417A]',
    borderClass: 'border-[#F37021]/40',
    badgeClass: 'bg-[#00529C]/20 text-[#93C5FD] border-[#0066BE]/35',
    dot: 'bg-[#00529C]',
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    group: 'Bank',
    shortLabel: 'Jago',
    bgClass: 'from-[#FFBE0B] via-[#F59E0B] to-[#7E22CE]',
    borderClass: 'border-[#F59E0B]/40',
    badgeClass: 'bg-[#F59E0B]/15 text-[#FDE047] border-[#F59E0B]/30',
    dot: 'bg-[#F59E0B]',
  },
  {
    id: 'seabank',
    name: 'SeaBank',
    group: 'Bank',
    shortLabel: 'SeaBank',
    bgClass: 'from-[#FF6D2E] to-[#E04107]',
    borderClass: 'border-[#FF6D2E]/40',
    badgeClass: 'bg-[#FF5722]/15 text-[#FDBA74] border-[#FF5722]/30',
    dot: 'bg-[#FF5722]',
  },
  {
    id: 'tunai',
    name: 'Tunai / Cash',
    group: 'Lainnya',
    shortLabel: 'Tunai',
    bgClass: 'from-emerald-500 to-teal-700',
    borderClass: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
];

/**
 * Deteksi otomatis metode pembayaran dari data transaksi (mendukung transaksi lama
 * yang belum punya field `wallet`, misal tertulis "Shopeepay" di catatan/judul).
 */
export function resolvePaymentMethod(tx) {
  if (tx?.wallet) {
    const found = PAYMENT_METHODS.find((m) => m.id === tx.wallet);
    if (found) return found;
  }

  const haystack = `${tx?.title || ''} ${tx?.notes || ''} ${tx?.category || ''}`.toLowerCase();
  if (haystack.includes('shopeepay') || haystack.includes('spay') || haystack.includes('shopee')) {
    return PAYMENT_METHODS.find((m) => m.id === 'shopeepay');
  }
  if (haystack.includes('gopay') || haystack.includes('gojek')) {
    return PAYMENT_METHODS.find((m) => m.id === 'gopay');
  }
  if (haystack.includes('dana')) {
    return PAYMENT_METHODS.find((m) => m.id === 'dana');
  }
  if (haystack.includes('ovo')) {
    return PAYMENT_METHODS.find((m) => m.id === 'ovo');
  }
  if (haystack.includes('qris')) {
    return PAYMENT_METHODS.find((m) => m.id === 'qris');
  }
  if (haystack.includes('bca')) {
    return PAYMENT_METHODS.find((m) => m.id === 'bca');
  }
  if (haystack.includes('livin') || haystack.includes('mandiri')) {
    return PAYMENT_METHODS.find((m) => m.id === 'livin');
  }
  if (haystack.includes('brimo') || haystack.includes('bri')) {
    return PAYMENT_METHODS.find((m) => m.id === 'brimo');
  }
  if (haystack.includes('jago')) {
    return PAYMENT_METHODS.find((m) => m.id === 'jago');
  }
  if (haystack.includes('seabank')) {
    return PAYMENT_METHODS.find((m) => m.id === 'seabank');
  }
  if (haystack.includes('tunai') || haystack.includes('cash')) {
    return PAYMENT_METHODS.find((m) => m.id === 'tunai');
  }

  // Default fallback jika belum ditentukan
  return PAYMENT_METHODS[0];
}

/**
 * Komponen SVG Logo E-Wallet & Bank yang tajam, ringan, dan 100% bisa offline
 */
export function PaymentLogo({ id, size = 'md' }) {
  const method = PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[0];

  const dimensions =
    size === 'sm'
      ? 'w-5 h-5 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-11 h-11 rounded-2xl';

  return (
    <div
      className={`relative ${dimensions} bg-gradient-to-br ${method.bgClass} border ${method.borderClass} flex items-center justify-center shrink-0 shadow-md select-none overflow-hidden`}
      title={method.name}
    >
      {renderSvgIcon(method.id, size === 'sm')}
    </div>
  );
}

function renderSvgIcon(id, isSmall) {
  const svgClass = isSmall ? 'w-3.5 h-3.5' : 'w-7 h-7';

  switch (id) {
    case 'shopeepay':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Gagang tas Shopee */}
          <path
            d="M13 11.5C13 8.5 15.2 6.5 18 6.5C20.8 6.5 23 8.5 23 11.5"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Bodi tas Shopee */}
          <rect
            x="7.5"
            y="11"
            width="21"
            height="18.5"
            rx="4"
            stroke="white"
            strokeWidth="2.2"
            fill="white"
            fillOpacity="0.14"
          />
          {/* Huruf S khas Shopee */}
          <path
            d="M20.8 16.2C20.2 15.3 19.1 14.9 17.8 14.9C15.9 14.9 14.7 15.9 14.7 17.2C14.7 18.6 16.1 19.1 18.1 19.6C20.1 20.1 21.4 20.9 21.4 22.6C21.4 24.4 19.8 25.5 17.6 25.5C15.8 25.5 14.5 24.8 13.9 23.7"
            stroke="white"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'gopay':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Dompet GoPay */}
          <rect
            x="6.5"
            y="9"
            width="23"
            height="18"
            rx="4.5"
            fill="white"
            fillOpacity="0.18"
            stroke="white"
            strokeWidth="2.2"
          />
          <path
            d="M22 15H29.5V21H22C20.34 21 19 19.66 19 18C19 16.34 20.34 15 22 15Z"
            fill="white"
          />
          <circle cx="22.5" cy="18" r="1.6" fill="#00AED6" />
          <circle cx="13.5" cy="18" r="3" fill="white" />
        </svg>
      );

    case 'dana':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          <path
            d="M7 13.5C11.5 10.5 16 16.5 20.5 13.5C23.5 11.5 26.5 12 29 13.5V23C25 25.5 20.5 20 15.5 23C12.5 24.8 9.5 24 7 22.5V13.5Z"
            fill="white"
            fillOpacity="0.22"
          />
          <text
            x="18"
            y="21.5"
            textAnchor="middle"
            fill="white"
            fontSize="9.8"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
            letterSpacing="0.4"
          >
            DANA
          </text>
        </svg>
      );

    case 'ovo':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          <circle
            cx="18"
            cy="18"
            r="12"
            stroke="white"
            strokeOpacity="0.3"
            strokeWidth="1.8"
          />
          <text
            x="18"
            y="21.5"
            textAnchor="middle"
            fill="white"
            fontSize="10.5"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
            letterSpacing="0.6"
          >
            OVO
          </text>
        </svg>
      );

    case 'qris':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Sudut QRIS */}
          <rect x="7.5" y="7.5" width="8" height="8" rx="1.8" stroke="white" strokeWidth="2.2" />
          <rect x="10.3" y="10.3" width="2.4" height="2.4" fill="white" />
          <rect x="20.5" y="7.5" width="8" height="8" rx="1.8" stroke="white" strokeWidth="2.2" />
          <rect x="23.3" y="10.3" width="2.4" height="2.4" fill="white" />
          <rect x="7.5" y="20.5" width="8" height="8" rx="1.8" stroke="white" strokeWidth="2.2" />
          <rect x="10.3" y="23.3" width="2.4" height="2.4" fill="white" />
          {/* Blok QR kanan bawah */}
          <rect x="20.5" y="20.5" width="3.5" height="3.5" rx="0.8" fill="white" />
          <rect x="25" y="20.5" width="3.5" height="3.5" rx="0.8" fill="white" />
          <rect x="20.5" y="25" width="3.5" height="3.5" rx="0.8" fill="white" />
          <rect x="25" y="25" width="3.5" height="3.5" rx="0.8" fill="#FDE047" />
        </svg>
      );

    case 'bca':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          <text
            x="18"
            y="22"
            textAnchor="middle"
            fill="white"
            fontSize="11.5"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="Outfit, sans-serif"
            letterSpacing="0.5"
          >
            BCA
          </text>
          <path
            d="M8 25.5H28"
            stroke="#93C5FD"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'livin':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Pita emas Mandiri */}
          <path
            d="M8 13.5C13 9 19.5 15.5 27.5 10.5"
            stroke="#FFB800"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text
            x="18"
            y="24.5"
            textAnchor="middle"
            fill="white"
            fontSize="9.8"
            fontWeight="800"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            livin&apos;
          </text>
        </svg>
      );

    case 'brimo':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          <text
            x="18"
            y="20"
            textAnchor="middle"
            fill="white"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
          >
            BRI
          </text>
          <rect x="9" y="22.5" width="18" height="5" rx="2.5" fill="#F37021" />
          <text
            x="18"
            y="26.4"
            textAnchor="middle"
            fill="white"
            fontSize="4.6"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            BRImo
          </text>
        </svg>
      );

    case 'jago':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Jago Check / Crest */}
          <path
            d="M12 15.5L16.5 20L25 10.5"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="18"
            y="27.5"
            textAnchor="middle"
            fill="white"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
            letterSpacing="0.6"
          >
            JAGO
          </text>
        </svg>
      );

    case 'seabank':
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          {/* Ombak SeaBank */}
          <path
            d="M7.5 22.5C11 19.5 14.5 24.5 18 21.5C21.5 18.5 25 23.5 28.5 20.5"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <text
            x="18"
            y="17.5"
            textAnchor="middle"
            fill="white"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="Outfit, sans-serif"
          >
            Sea
          </text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 36 36" className={svgClass} fill="none">
          <rect
            x="7"
            y="10"
            width="22"
            height="16"
            rx="3.5"
            stroke="white"
            strokeWidth="2.2"
          />
          <circle cx="18" cy="18" r="3.5" fill="white" />
        </svg>
      );
  }
}
