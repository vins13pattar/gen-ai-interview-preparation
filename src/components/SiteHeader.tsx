'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`rounded-lg px-3 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950 ${
        isActive
          ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname === '/setup') {
    return null;
  }

  const domainsActive = pathname === '/domains' || pathname.startsWith('/domains/');
  const importActive = pathname === '/import' || pathname.startsWith('/import/');
  const settingsActive = pathname === '/settings' || pathname.startsWith('/settings/');

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-zinc-50/95 shadow-sm shadow-zinc-900/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-950/95 dark:shadow-black/40">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Link
            href="/domains"
            className="shrink-0 rounded-md font-semibold tracking-tight text-zinc-900 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
          >
            Interview Prep
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
            <NavLink href="/domains" isActive={domainsActive}>
              Domains
            </NavLink>
            <NavLink href="/import" isActive={importActive}>
              Import
            </NavLink>
            <NavLink href="/settings" isActive={settingsActive}>
              Settings
            </NavLink>
            <a
              href="/api/export"
              className="rounded-lg px-3 py-2 text-base font-medium text-zinc-600 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            >
              Export
            </a>
          </nav>
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
