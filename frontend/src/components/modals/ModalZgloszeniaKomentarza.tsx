import React, { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';

interface ReportCommentModalProps {
  isVisible: boolean;
  commentId: number | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
  loading?: boolean;
}

const ModalZgloszeniaKomentarza: React.FC<ReportCommentModalProps> = ({ isVisible, commentId, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setReason('');
      setTouched(false);
    }
  }, [isVisible, commentId]);

  if (!isVisible || commentId === null) return null;

  const disabled = loading || reason.trim().length < 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-5 sm:p-6 transform transition-all">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 flex items-center justify-center">
          <Flag className="w-6 h-6 mr-2 text-red-600" />
          Zgłoś komentarz
        </h3>
        <p className="text-sm text-gray-600 mb-4 text-center">Podaj krótko powód zgłoszenia. Trafi do moderatora / administratora.</p>
        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); if (!touched) setTouched(true); }}
          placeholder="Np. Wulgarny język / spam / nie na temat..."
          className="w-full min-h-[120px] p-3 rounded-xl border border-gray-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y text-sm"
        />
        {touched && reason.trim().length < 5 && (
          <div className="mt-2 text-xs text-red-600">Powód musi mieć min. 5 znaków.</div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Anuluj
          </button>
          <button
            onClick={() => onSubmit(reason.trim())}
            disabled={disabled}
            className={`flex-1 py-2 rounded-xl font-semibold transition-colors shadow ${disabled ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {loading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
          </button>
        </div>
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          onClick={onClose}
          aria-label="Zamknij"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ModalZgloszeniaKomentarza;
