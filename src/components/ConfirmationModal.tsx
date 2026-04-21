import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X as CloseIcon } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Abort',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmationModalProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-soft-orange"
          >
            <div className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  isDanger 
                    ? 'bg-red-50 text-red-500 border-red-100' 
                    : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                }`}>
                  {isDanger ? <Trash2 size={28} /> : <AlertCircle size={28} />}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-bold text-slate-900">{title}</h2>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-4">
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`px-6 py-3 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest shadow-lg transition-all ${
                      isDanger 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                        : 'bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20'
                    }`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <CloseIcon size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
