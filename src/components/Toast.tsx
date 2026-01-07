import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastConfig = {
  success: { bg: 'bg-emerald-600', icon: '✓' },
  error: { bg: 'bg-red-600', icon: '✕' },
  warning: { bg: 'bg-amber-500', icon: '⚠' },
  info: { bg: 'bg-teal-600', icon: 'ℹ' },
};

export function Toast({ message, type = 'info', duration = 2500, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = toastConfig[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`px-4 py-2.5 rounded-lg text-white shadow-lg transition-all duration-200 ${config.bg} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{config.icon}</span>
        <span className="text-sm">{message}</span>
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
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2">
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
