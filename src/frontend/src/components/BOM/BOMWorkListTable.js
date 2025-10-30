// src/frontend/src/components/BOM/BOMWorkListTable.js

import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';

const BOMWorkListTable = ({ works, onOpenWork, onDeleteWork }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: '50px' }}>#</th>
            <th>Çalışma Adı</th>
            <th>Proje</th>
            <th style={{ width: '180px' }}>Oluşturma Tarihi</th>
            <th className="text-center" style={{ width: '120px' }}>Excel Sayısı</th>
            <th className="text-center" style={{ width: '120px' }}>Toplam Satır</th>
            <th className="text-center" style={{ width: '200px' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {works.map((work, index) => (
            <tr key={work.id}>
              <td className="text-muted small">{index + 1}</td>
              <td className="fw-semibold">
                <i className="bi bi-clipboard-data me-2 text-primary"></i>
                {work.workName}
              </td>
              <td className="text-muted small">
                <i className="bi bi-folder me-1"></i>
                {work.projectName}
              </td>
              <td className="text-muted small">
                <i className="bi bi-calendar me-1"></i>
                {formatDate(work.createdAt)}
              </td>
              <td className="text-center">
                <span className="badge bg-info">
                  {work.excelCount || 0}
                </span>
              </td>
              <td className="text-center">
                <span className="badge bg-secondary">
                  {work.totalRows || 0}
                </span>
              </td>
              <td>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    onClick={() => onOpenWork(work)}
                    className="btn btn-sm btn-info text-white"
                    title="Çalışmayı Aç"
                  >
                    <FolderOpen size={14} className="me-1" />
                    Aç
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWork(work.id);
                    }}
                    className="btn btn-sm btn-danger"
                    title="Çalışmayı Sil"
                  >
                    <Trash2 size={14} className="me-1" />
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BOMWorkListTable;