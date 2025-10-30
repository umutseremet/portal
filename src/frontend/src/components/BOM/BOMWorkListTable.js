// src/frontend/src/components/BOM/BOMWorkListTable.js

import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';

const BOMWorkListTable = ({ works, onOpenWork, onDeleteWork }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Çalışma Adı</th>
            <th>Proje</th>
            <th style={{ width: '180px' }}>Oluşturma Tarihi</th>
            <th className="text-center" style={{ width: '120px' }}>Excel Sayısı</th>
            <th className="text-center" style={{ width: '120px' }}>Toplam Satır</th>
            <th className="text-center" style={{ width: '200px' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {works.map((work) => (
            <tr key={work.id}>
              <td className="fw-semibold">
                <i className="bi bi-clipboard-data me-2 text-primary"></i>
                {work.workName}
              </td>
              <td className="text-muted small">
                {work.projectName}
              </td>
              <td className="text-muted small">
                {work.createdAt}
              </td>
              <td className="text-center fw-medium">
                {work.excelCount}
              </td>
              <td className="text-center fw-medium">
                {work.totalRows}
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