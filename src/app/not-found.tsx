import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">404</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Page not found</p>
        <Link
          href="/domains"
          className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
        >
          Back to domains
        </Link>
      </div>
    </div>
  );
}
