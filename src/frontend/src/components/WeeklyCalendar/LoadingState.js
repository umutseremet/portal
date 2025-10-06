// src/frontend/src/components/WeeklyCalendar/LoadingState.js
import React from 'react';

export const LoadingState = () => {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
      <p className="mt-3 text-muted">Takvim verileri yükleniyor...</p>
    </div>
  );
};

export const EmptyState = () => {
  return (
    <div className="text-center py-5">
      <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
      <h5 className="mt-3 text-muted">Bu hafta için üretim işi bulunmamaktadır</h5>
      <p className="text-muted">Farklı bir hafta seçebilir veya filtreleri değiştirebilirsiniz.</p>
    </div>
  );
};