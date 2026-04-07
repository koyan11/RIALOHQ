import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', txHash, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const icons = { success: 'check_circle', error: 'error', loading: 'hourglass_top' };
  const colors = {
    success: 'bg-primary text-on-primary',
    error: 'bg-[#ba1a1a] text-white',
    loading: 'bg-surface-container text-on-surface',
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-md ${type === 'error' ? 'bg-red-500/90' : 'bg-white/90'}`}>
      <span className={`material-symbols-outlined text-xl ${type === 'error' ? 'text-white' : 'text-black'}`}>{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-headline font-bold text-sm ${type === 'error' ? 'text-white' : 'text-black'}`}>{message}</p>
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[10px] font-bold uppercase tracking-wider underline opacity-60 hover:opacity-100 mt-0.5 block truncate ${type === 'error' ? 'text-white' : 'text-black'}`}
          >
            Verify on Explorer ↗
          </a>
        )}
      </div>
      <button onClick={() => { setVisible(false); onClose?.(); }} className={`opacity-40 hover:opacity-100 ml-2 ${type === 'error' ? 'text-white' : 'text-black'}`}>
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
