// src/frontend/src/components/BOM/BOMExcelDetails.js

import React from 'react';
import { Eye, Search } from 'lucide-react';

const BOMExcelDetails = ({ selectedExcel }) => {
  // Örnek excel detayları
  const sampleExcelDetails = [
    { id: 1, ogeNo: '1', parcaNo: '7', dokumanNo: 'N364286', malzeme: 'Siyah SAC (ŞASİ)', miktar1: 4, miktar2: 1, xYonu: 2265, yYonu: 210, zYonu: 210, eskiKod: '1001-122505WS' },
    { id: 2, ogeNo: '2', parcaNo: '73', dokumanNo: 'N364338', malzeme: 'Siyah SAC (ŞASİ)', miktar1: 16, miktar2: 4, xYonu: 199.5, yYonu: 8, zYonu: 199.5, eskiKod: '1051-122505WS' },
    { id: 3, ogeNo: '3', parcaNo: '74', dokumanNo: 'N364339', malzeme: 'Siyah SAC (ŞASİ)', miktar1: 16, miktar2: 4, xYonu: 199.5, yYonu: 8, zYonu: 199.5, eskiKod: '1052-122505WS' },
    { id: 4, ogeNo: '4', parcaNo: '94', dokumanNo: 'N364284', malzeme: 'STOK', miktar1: 148, miktar2: 37, xYonu: 15, yYonu: 86, zYonu: 16.5, eskiKod: '1000-122505WS-UF-0136' },
    { id: 5, ogeNo: '5', parcaNo: '76', dokumanNo: 'N364374', malzeme: '5000 AL SAC', miktar1: 4, miktar2: 1, xYonu: 70, yYonu: 131.2, zYonu: 4, eskiKod: '1110-122505WS' },
  ];

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Eye size={20} className="text-success me-2" />
              <div>
                <h5 className="card-title mb-0">Excel Detayları</h5>
                <p className="card-text text-muted small mb-0">
                  {selectedExcel.fileName} - {selectedExcel.rowCount} kayıt
                </p>
              </div>
            </div>
            
            <div className="position-relative" style={{ width: '280px' }}>
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  zIndex: 1
                }}
              />
              <input
                type="text"
                placeholder="Parça no, malzeme ara..."
                className="form-control form-control-sm"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }}>Öğe No</th>
                    <th style={{ width: '80px' }}>Parça No</th>
                    <th>Doküman No</th>
                    <th>Malzeme</th>
                    <th className="text-center" style={{ width: '70px' }}>Mikt. 1</th>
                    <th className="text-center" style={{ width: '70px' }}>Mikt. 2</th>
                    <th className="text-center" style={{ width: '70px' }}>X Yönü</th>
                    <th className="text-center" style={{ width: '70px' }}>Y Yönü</th>
                    <th className="text-center" style={{ width: '70px' }}>Z Yönü</th>
                    <th>Eski Kod</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleExcelDetails.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-medium">{item.ogeNo}</td>
                      <td className="fw-medium">{item.parcaNo}</td>
                      <td>{item.dokumanNo}</td>
                      <td>{item.malzeme}</td>
                      <td className="text-center">{item.miktar1}</td>
                      <td className="text-center">{item.miktar2}</td>
                      <td className="text-center text-muted small">{item.xYonu}</td>
                      <td className="text-center text-muted small">{item.yYonu}</td>
                      <td className="text-center text-muted small">{item.zYonu}</td>
                      <td className="text-muted small">{item.eskiKod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              1-5 arası gösteriliyor (toplam 325 kayıt)
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                {[1, 2, 3, '...', 65].map((page, idx) => (
                  <li key={idx} className={`page-item ${page === 1 ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMExcelDetails;