// src/hooks/useConfirm.js
// window.confirm() yerine kullanılacak React hook

import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: 'Onay',
    message: '',
    description: '',
    confirmText: 'Onayla',
    cancelText: 'İptal',
    confirmButtonClass: 'btn-primary',
    icon: 'bi-question-circle',
    iconColor: 'text-primary',
    onConfirm: null,
    loading: false
  });

  // Onay modalını göster
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        show: true,
        title: options.title || 'Onay',
        message: options.message || 'Bu işlemi yapmak istediğinizden emin misiniz?',
        description: options.description || '',
        confirmText: options.confirmText || 'Onayla',
        cancelText: options.cancelText || 'İptal',
        confirmButtonClass: options.confirmButtonClass || 'btn-primary',
        icon: options.icon || 'bi-question-circle',
        iconColor: options.iconColor || 'text-primary',
        loading: false,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, loading: false, show: false }));
          resolve(true);
        }
      });
    });
  }, []);

  // Silme onayı için özel fonksiyon
  const confirmDelete = useCallback((itemName = '') => {
    return confirm({
      title: 'Silme Onayı',
      message: itemName 
        ? `"${itemName}" öğesini silmek istediğinizden emin misiniz?`
        : 'Bu öğeyi silmek istediğinizden emin misiniz?',
      description: 'Bu işlem geri alınamaz.',
      confirmText: 'Sil',
      confirmButtonClass: 'btn-danger',
      icon: 'bi-trash',
      iconColor: 'text-danger'
    });
  }, [confirm]);

  // İptal
  const handleCancel = useCallback(() => {
    setConfirmState(prev => ({ ...prev, show: false }));
  }, []);

  // Onay
  const handleConfirm = useCallback(() => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm();
    }
  }, [confirmState.onConfirm]);

  return {
    confirm,
    confirmDelete,
    confirmState,
    handleConfirm,
    handleCancel
  };
};

export default useConfirm;