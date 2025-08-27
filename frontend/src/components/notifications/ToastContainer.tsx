import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timeout?: number;
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            animate-in slide-in-from-right duration-300
            border rounded-lg p-4 shadow-lg backdrop-blur-sm
            ${getToastStyle(toast.type)}
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{toast.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                </div>
                
                <button
                  onClick={() => onRemoveToast(toast.id)}
                  className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors"
                  aria-label="알림 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Progress bar for timeout */}
          {toast.timeout && toast.timeout > 0 && (
            <div className="mt-3 w-full bg-black bg-opacity-10 rounded-full h-1">
              <div 
                className="bg-current h-1 rounded-full animate-pulse"
                style={{
                  animation: `shrink ${toast.timeout}ms linear forwards`,
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  );
};

export default ToastContainer;