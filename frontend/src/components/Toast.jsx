import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = 'toast-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          colorClass = 'toast-success';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          colorClass = 'toast-error';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          colorClass = 'toast-warning';
        }

        return (
          <div key={toast.id} className={`toast-item ${colorClass}`}>
            <Icon size={20} className="toast-icon" />
            <div className="toast-body">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="toast-close-btn"
              title="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
