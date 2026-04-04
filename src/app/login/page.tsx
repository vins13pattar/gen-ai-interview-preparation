import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Sign in</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            This deployment requires an app password (set via <code className="text-zinc-700 dark:text-zinc-300">APP_ACCESS_PASSWORD</code>
            ).
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
