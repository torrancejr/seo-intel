'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Tags,
  MapPin,
  Sparkles,
  FileText,
  Settings,
  Lightbulb,
  Layers,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Topics', href: '/admin/topics', icon: Tags },
  { name: 'Cities', href: '/admin/cities', icon: MapPin },
  { name: 'Generate', href: '/admin/generate', icon: Sparkles },
  { name: 'Batch Generate', href: '/admin/batch-generate', icon: Layers },
  { name: 'Ideas', href: '/admin/ideas', icon: Lightbulb },
  { name: 'Articles', href: '/admin/articles', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-xl font-semibold">SEOIntel</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium mb-1">Need help?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Check out our documentation
          </p>
          <a
            href="#"
            className="text-xs text-primary hover:underline font-medium"
          >
            View docs →
          </a>
        </div>
      </div>
    </aside>
  );
}
