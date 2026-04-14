import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * A reusable, high-fidelity delete confirmation modal.
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Triggered on cancel/close
 * @param {function} onConfirm - Triggered on action confirmation
 * @param {string} title - Main heading (default: 'Remove Classification?')
 * @param {string} message - Supporting description
 * @param {boolean} saving - Shows loading state on action button
 * @param {string} confirmText - Label for action button (default: 'Remove')
 * @param {string} variant - 'danger' (red) or 'warning' (amber)
 */
const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Remove Classification?', 
  message = 'This classification node will be extracted from the active revenue cluster.',
  saving = false,
  confirmText = 'Remove',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const colorClasses = variant === 'danger' 
    ? 'bg-red-50 text-red-600' 
    : 'bg-amber-50 text-amber-600';
    
  const buttonClasses = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${colorClasses}`}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-xs font-bold text-gray-500 mt-2 italic leading-relaxed">
              {message}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className={`py-4 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 ${buttonClasses}`}
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : null}
              {saving ? '...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
