import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastConfig = {
  success: { 
    bg: 'bg-emerald-600', 
    Icon: CheckCircle,
    border: 'border-emerald-500'
  },
  error: { 
    bg: 'bg-red-600', 
    Icon: XCircle,
    border: 'border-red-500'
  },
  warning: { 
    bg: 'bg-amber-500', 
    Icon: AlertTriangle,
    border: 'border-amber-400'
  },
  info: { 
    bg: 'bg-blue-600', 
    Icon: Info,
    border: 'border-blue-500'
  },
};

export function Toast({ message, type = 'info', duration = 2500, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = toastConfig[type];
  const Icon = config.Icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`px-5 py-3 rounded-xl text-white shadow-xl transition-all duration-300 ${config.bg} border-2 ${config.border} ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
}

// Toast 管理器
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let setToastsExternal: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  useEffect(() => {
    setToastsExternal = setToasts;
    return () => { setToastsExternal = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}

export function showToast(message: string, type: ToastType = 'info') {
  if (setToastsExternal) {
    const id = ++toastId;
    setToastsExternal((prev) => [...prev, { id, message, type }]);
  }
}
