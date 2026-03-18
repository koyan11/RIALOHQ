import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '../hooks/useWallet';

export default function Navbar() {
  const { isConnected, shortAddress, connecting, connect, disconnect } = useWallet();
  const router = useRouter();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/swap', label: 'Swap' },
    { href: '/bridge', label: 'Bridge' },
    { href: '/staking', label: 'Staking' },
    { href: '/rewards', label: 'Reward' },
    { href: '/learn', label: 'Learn' },
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-black border-b border-white/5 shadow-2xl">
      <div className="flex justify-between items-center px-8 py-4 max-w-[1200px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Rialo Logo" className="h-11 w-auto opacity-95 transition-opacity hover:opacity-100" />
        </Link>

        <div className="hidden md:flex gap-8 items-center font-body text-sm font-medium tracking-tight">
          {links.map(({ href, label }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={active
                  ? 'text-white font-bold border-b-2 border-white pb-1'
                  : 'text-white/60 hover:text-white transition-colors'}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {isConnected ? (
          <button
            onClick={disconnect}
            className="bg-white/10 text-white px-6 py-2.5 rounded-xl font-headline font-bold text-sm transition-all hover:bg-white/20 border border-white/10"
          >
            {shortAddress}
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="bg-white text-black px-6 py-2.5 rounded-xl font-headline font-bold text-sm scale-95 active:opacity-80 transition-all hover:bg-white/90 disabled:opacity-50"
          >
            {connecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}
