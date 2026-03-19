import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '../hooks/useWallet';

export default function Navbar() {
  const { isConnected, shortAddress, connecting, connect, disconnect } = useWallet();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Track scroll to toggle theme
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = router.pathname === '/';
  // If we're on Home and NOT scrolled, we are in "Dark Mode" (inverted)
  const isDarkTheme = isHomePage && !isScrolled;

  const links = [
    { href: '/', label: 'Home' },
    { href: '/swap', label: 'Swap' },
    { href: '/bridge', label: 'Bridge' },
    { href: '/staking', label: 'Staking' },
    { href: '/rewards', label: 'Reward' },
    { href: '/learn', label: 'Learn' },
  ];

  const socialLinks = [
    { 
      label: 'Discord', 
      href: '#', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
        </svg>
      )
    },
    { 
      label: 'Telegram', 
      href: '#', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0C5.346 0 0 5.346 0 11.944c0 6.598 5.346 11.944 11.944 11.944 6.598 0 11.944-5.346 11.944-11.944C23.888 5.346 18.542 0 11.944 0zm5.201 8.243l-1.815 8.56c-.137.6-.492.748-.996.467l-2.763-2.035-1.333 1.282c-.147.147-.271.271-.557.271l.198-2.81 5.115-4.619c.222-.198-.048-.308-.344-.112l-6.321 3.98-2.723-.85c-.593-.185-.605-.593.123-.878l10.643-4.102c.493-.185.924.111.77 1.006z"/>
        </svg>
      )
    },
    { 
      label: 'X', 
      href: '#', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
  ];

  return (
    <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${isDarkTheme ? 'bg-transparent' : 'glass-nav'}`}>
      <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Rialo Logo" 
            className={`h-8 w-auto brightness-0 transition-all ${isDarkTheme ? 'invert' : ''}`} 
          />
        </Link>

        {/* Desktop Menu */}
        <div className={`hidden md:flex rounded-full px-10 py-4 gap-10 items-center shadow-2xl transition-all duration-300 ${
          isDarkTheme 
            ? 'bg-white/5 border border-white/20' 
            : 'bg-black'
        }`}>
          {links.map(({ href, label }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:opacity-100 ${
                  active ? 'text-white opacity-100' : 'text-white/40'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-8">
          {/* Social Icons */}
          <div className={`hidden lg:flex items-center gap-4 transition-all ${isDarkTheme ? 'text-white' : 'text-black'}`}>
            {socialLinks.map(({ label, href, icon }) => (
              <a key={label} href={href} className="opacity-60 hover:opacity-100 transition-opacity">
                {icon}
              </a>
            ))}
          </div>

          {/* Wallet Actions */}
          <div className="flex items-center gap-4">
            {isConnected ? (
              <button
                onClick={disconnect}
                className={`px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${
                  isDarkTheme 
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-black text-white hover:bg-black/80'
                }`}
              >
                {shortAddress}
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className={`px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 ${
                  isDarkTheme 
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-black text-white hover:bg-black/80'
                }`}
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
