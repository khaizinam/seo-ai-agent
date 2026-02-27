'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

export const DeleteArticleButton = ({ id, title, showIconOnly = false }: { id: string, title: string, showIconOnly?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        setErrorModal({ isOpen: true, message: 'Có lỗi khi xoá bài viết' });
      }
    } catch (e) {
      console.error(e);
      setErrorModal({ isOpen: true, message: 'Lỗi hệ thống khi xoá' });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="danger" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className={showIconOnly ? "h-9 w-9 p-0 flex items-center justify-center bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 transition-all" : ""}
      >
        {showIconOnly ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : (
          "Delete"
        )}
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        isConfirming={isDeleting}
      />
      
      <Modal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Lỗi Cập Nhật"
        footer={<Button variant="outline" size="sm" onClick={() => setErrorModal({ isOpen: false, message: '' })}>Đóng</Button>}
      >
        <p>{errorModal.message}</p>
      </Modal>
    </>
  );
};
