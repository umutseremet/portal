// src/frontend/src/components/WeeklyCalendar/CalendarHeader.js
// ✅ UPDATED VERSION - Revize İşler Butonu Dahil

import React from 'react';

const CalendarHeader = ({ onRefresh, loading, onShowRevisedIssues, weekStart }) => {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-start flex-wrap">
          <div className="page-header mb-3">
            <h2 className="page-title mb-2">
              <i className="bi bi-calendar3 me-2"></i>
              Haftalık Üretim Takvimi
            </h2>
            <p className="page-subtitle text-muted">
              Üretim işlerini planlanan tarihlere göre görüntüleyin ve takip edin
            </p>
          </div>
          
          {/* ✅ Revize İşler Butonu Eklendi */}
          <div className="page-actions d-flex gap-2">
            {/* Revize İşler Butonu */}
            <button 
              className="btn btn-warning"
              onClick={onShowRevisedIssues}
              disabled={loading || !weekStart}
              title="Bu hafta planı revize edilmiş işleri göster"
            >
              <i className="bi bi-arrow-repeat me-2"></i>
              Revize İşler
            </button>

            {/* Yazdır Butonu */}
            <button 
              className="btn btn-outline-secondary"
              onClick={() => window.print()}
            >
              <i className="bi bi-printer me-1"></i>
              Yazdır
            </button>

            {/* Yenile Butonu */}
            <button 
              className="btn btn-danger"
              onClick={onRefresh}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Yenile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;