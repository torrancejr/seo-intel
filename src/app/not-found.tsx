import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center max-w-md">
        <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-3">404</h1>
        <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Browse Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
