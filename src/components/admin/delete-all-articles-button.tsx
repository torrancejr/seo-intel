'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmModal, AlertModal } from '@/components/ui/modal';

export function DeleteAllArticlesButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'error' }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'success',
  });

  const handleFirstConfirm = () => {
    setShowConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/v1/articles/delete-all', {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `Successfully deleted ${data.count} articles`,
          variant: 'success',
        });
        router.refresh();
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete articles',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting articles:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete articles',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        {deleting ? 'Deleting...' : 'Delete All Articles'}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFirstConfirm}
        title="Delete All Articles?"
        message="Are you sure you want to delete ALL articles? This action cannot be undone."
        confirmText="Yes, Continue"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showSecondConfirm}
        onClose={() => setShowSecondConfirm(false)}
        onConfirm={handleDeleteAll}
        title="Final Confirmation"
        message="This will permanently delete all articles. Are you absolutely sure?"
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </>
  );
}
