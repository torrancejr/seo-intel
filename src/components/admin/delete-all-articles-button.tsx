'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteAllArticlesButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL articles? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all articles. Are you absolutely sure?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/v1/articles/delete-all', {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully deleted ${data.count} articles`);
        router.refresh();
      } else {
        alert('Failed to delete articles');
      }
    } catch (error) {
      console.error('Error deleting articles:', error);
      alert('Failed to delete articles');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDeleteAll}
      disabled={deleting}
      className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? 'Deleting...' : 'Delete All Articles'}
    </button>
  );
}
