import React from 'react';
import { useWallet } from '../hooks/useWallet';

export default function GlobalToast() {
  const { toast } = useWallet();

  if (!toast) return null;

  return (
    <>
      <style>{`
        .global-toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(17, 17, 17, 0.9);
          backdrop-filter: blur(20px);
          color: #fff;
          padding: 14px 24px;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: slideInToast 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 320px;
          max-width: 420px;
        }

        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          background: #fff;
          color: #000;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .toast-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .toast-title {
          font-weight: 700;
          font-size: 14px;
          letter-spacing: -0.01em;
          color: #fff;
        }

        .toast-link {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary-color, #f97316);
          text-decoration: underline;
          margin-top: 4px;
          transition: opacity 0.2s;
          opacity: 0.7;
        }

        .toast-link:hover {
          opacity: 1;
        }
      `}</style>

      <div className="global-toast">
        <div className="toast-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.message} {toast.detail}</div>
          {toast.txHash && !toast.txHash.startsWith('simulated_') && (
            <a href={`https://sepolia.etherscan.io/tx/${toast.txHash}`} target="_blank" rel="noopener noreferrer" className="toast-link">
              View on Etherscan ↗
            </a>
          )}
          {toast.txHash && toast.txHash.startsWith('simulated_') && (
            <span className="toast-link" style={{ textDecoration: 'none', cursor: 'help', color: '#ffaa00' }} title="Configure AI Wallet for on-chain execution">
              Simulated Execution (Offline)
            </span>
          )}
        </div>
      </div>
    </>
  );
}
