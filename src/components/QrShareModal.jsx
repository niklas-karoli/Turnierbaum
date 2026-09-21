import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check } from 'lucide-react';

export const QrShareModal = ({ tournament, onClose }) => {
  const [qrCanvas, setQrCanvas] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;

  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, { width: 220, margin: 2 })
        .then((url) => setQrCanvas(url))
        .catch((err) => console.error(err));
    }
  }, [shareUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden text-center p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <span>Turnier Teilen</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {qrCanvas ? (
          <div className="flex justify-center bg-white p-3 rounded-2xl shadow-inner max-w-[200px] mx-auto">
            <img src={qrCanvas} alt="Turnier QR Code" className="w-full h-auto" />
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500">
            Erstelle QR Code...
          </div>
        )}

        <p className="text-xs text-slate-400">
          Scanne den QR-Code, um die Turnierseite schnell auf einem Smartphone oder Tablet zu öffnen.
        </p>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs text-slate-300">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent flex-1 focus:outline-none truncate text-slate-400 px-2"
          />
          <button
            onClick={handleCopyLink}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
