'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
