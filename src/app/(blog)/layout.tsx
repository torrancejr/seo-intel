import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/blog" className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-bold">SEOIntel Blog</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/blog"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Articles
              </Link>
              <Link
                href="/blog/topics"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Topics
              </Link>
              <Link
                href="/blog/cities"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cities
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} SEOIntel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
