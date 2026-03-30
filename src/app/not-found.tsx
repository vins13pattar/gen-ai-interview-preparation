import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="px-4 text-center">
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">404</h1>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">Page not found</p>
        <Link
          href="/domains"
          className="text-base font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Back to domains
        </Link>
      </div>
    </div>
  );
}
