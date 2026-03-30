import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">404</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Page not found</p>
        <Link href="/domains" className="text-blue-600 hover:underline">
          Back to domains
        </Link>
      </div>
    </div>
  );
}
