import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recycle, LayoutDashboard, Camera, Home, Search, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/scan', label: 'Scan', icon: Camera },
  { href: '/demand', label: 'Requests', icon: Search },
  { href: '/items', label: 'My Items', icon: Package },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg"
          aria-label="CampusCycle AI Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30">
            <Recycle className="h-4 w-4 text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-white sm:text-base">
            Campus<span className="text-teal-400">Cycle</span>{' '}
            <span className="font-normal text-slate-400">AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
                  active ? 'text-teal-400' : 'text-slate-400 hover:text-slate-100'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-teal-500/10 ring-1 ring-teal-500/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
