import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Toast } from '../../types';
import clsx from 'clsx';

const ICONS = {
  success: <CheckCircle2 size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const BORDERS = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useData();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 p-4 flex items-start gap-3 pointer-events-auto',
            BORDERS[t.type]
          )}
        >
          {ICONS[t.type]}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900">{t.title}</div>
            {t.message && <div className="text-xs text-gray-500 mt-0.5">{t.message}</div>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
