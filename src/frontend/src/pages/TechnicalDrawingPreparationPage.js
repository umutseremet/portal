// src/frontend/src/pages/TechnicalDrawingPreparationPage.js
// Teknik Resim Hazırlama - BOM çalışmalarına göre ürün grupları seçerek teknik resim kontrolü

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import { useToast } from '../contexts/ToastContext';

const TechnicalDrawingPreparationPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // States
  const [loading, setLoading] = useState(false);
  const [works, setWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [itemGroups, setItemGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [items, setItems] = useState([]);
  const [filterMissing, setFilterMissing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load BOM works on mount
  useEffect(() => {
    loadWorks();
  }, []);

  // Load item groups when work is selected
  useEffect(() => {
    if (selectedWorkId) {
      loadItemGroups();
    } else {
      setItemGroups([]);
      setSelectedGroupIds([]);
      setItems([]);
    }
  }, [selectedWorkId]);

  // Load items when groups are selected
  useEffect(() => {
    if (selectedWorkId && selectedGroupIds.length > 0) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedGroupIds]);

  const loadWorks = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTechnicalDrawingWorks();
      setWorks(data || []);
    } catch (err) {
      console.error('Error loading works:', err);
      toast.error('Çalışmalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadItemGroups = async () => {
    if (!selectedWorkId) return;

    try {
      setLoading(true);
      const data = await apiService.getTechnicalDrawingItemGroups(selectedWorkId);
      setItemGroups(data || []);
    } catch (err) {
      console.error('Error loading item groups:', err);
      toast.error('Ürün grupları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!selectedWorkId || selectedGroupIds.length === 0) return;

    try {
      setLoading(true);
      const data = await apiService.getTechnicalDrawingItems({
        workId: selectedWorkId,
        itemGroupIds: selectedGroupIds
      });
      setItems(data || []);
    } catch (err) {
      console.error('Error loading items:', err);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkChange = (e) => {
    const workId = parseInt(e.target.value);
    setSelectedWorkId(workId || null);
    setSelectedGroupIds([]);
    setItems([]);
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === itemGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(itemGroups.map(g => g.id));
    }
  };

  const handleDownloadZip = async () => {
    if (!selectedWorkId || selectedGroupIds.length === 0) {
      toast.warning('Lütfen çalışma ve ürün grupları seçin');
      return;
    }

    const itemsWithFiles = items.filter(i => i.hasTechnicalDrawing);
    if (itemsWithFiles.length === 0) {
      toast.warning('İndirilecek teknik resim bulunamadı');
      return;
    }

    try {
      setDownloading(true);

      // Dosya adı: WorkName_tarih.zip
      const selectedWork = works.find(w => w.id === selectedWorkId);
      const workName = selectedWork?.workName || 'technical-drawings';
      const timestamp = new Date().toISOString().split('T')[0];
      const zipFileName = `${workName}_${timestamp}.zip`;

      // API endpoint
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
      const downloadUrl = `${apiBaseUrl}/TechnicalDrawingPreparation/download-zip`;

      console.log('📦 Downloading technical drawings ZIP...');

      // Fetch ile indir
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workId: selectedWorkId,
          itemGroupIds: selectedGroupIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Blob olarak al
      const blob = await response.blob();

      // İndir
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Teknik resimler başarıyla indirildi');
      console.log('✅ ZIP downloaded:', zipFileName);
    } catch (err) {
      console.error('❌ ZIP download error:', err);
      toast.error('ZIP dosyası oluşturulurken hata oluştu');
    } finally {
      setDownloading(false);
    }
  };

  const handleItemClick = (itemId) => {
    // Teknik resim hazırlama ekranından açıldığını belirtmek için state gönder
    navigate(`/definitions/items/${itemId}/edit`, { 
      state: { 
        fromDataCam: true, // ItemEditPage'de bu flag kontrol ediliyor
        returnPath: '/production/technical-drawing-preparation'
      } 
    });
  };

  // Filtered items
  const displayedItems = filterMissing
    ? items.filter(i => !i.hasTechnicalDrawing)
    : items;

  // Stats
  const totalItems = items.length;
  const itemsWithDrawings = items.filter(i => i.hasTechnicalDrawing).length;
  const itemsWithoutDrawings = totalItems - itemsWithDrawings;
  const completionRate = totalItems > 0 ? ((itemsWithDrawings / totalItems) * 100).toFixed(1) : 0;

  const selectedWork = works.find(w => w.id === selectedWorkId);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Teknik Resim Hazırlama</h2>
          <p className="text-muted mb-0">
            Çalışma bazlı teknik resim kontrolü ve indirme
          </p>
        </div>
      </div>

      {/* Work Selection */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FileText size={18} className="me-2" />
            Çalışma Seçimi
          </h5>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">BOM Çalışması</label>
              <select
                className="form-select"
                value={selectedWorkId || ''}
                onChange={handleWorkChange}
                disabled={loading}
              >
                <option value="">-- Çalışma Seçin --</option>
                {works.map(work => (
                  <option key={work.id} value={work.id}>
                    {work.workName} {work.projectName && `(${work.projectName})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedWork && (
              <div className="col-md-6">
                <label className="form-label fw-medium">Çalışma Bilgileri</label>
                <div className="p-3 bg-light rounded">
                  <div className="small">
                    <strong>Proje:</strong> {selectedWork.projectName || `Proje #${selectedWork.projectId}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Groups Selection */}
      {selectedWorkId && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">
                Ürün Grupları ({itemGroups.length})
              </h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleSelectAllGroups}
                disabled={loading || itemGroups.length === 0}
              >
                {selectedGroupIds.length === itemGroups.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            ) : itemGroups.length === 0 ? (
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Bu çalışmaya ait ürün grubu bulunamadı
              </div>
            ) : (
              <div className="row g-2">
                {itemGroups.map(group => (
                  <div key={group.id} className="col-md-4 col-lg-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                      />
                      <label className="form-check-label" htmlFor={`group-${group.id}`}>
                        {group.excelName || group.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats & Actions */}
      {items.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              {/* Stats */}
              <div className="col-md-8">
                <div className="row g-3">
                  <div className="col-sm-3">
                    <div className="text-center">
                      <div className="h4 mb-1 text-primary">{totalItems}</div>
                      <div className="small text-muted">Toplam Ürün</div>
                    </div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-center">
                      <div className="h4 mb-1 text-success">{itemsWithDrawings}</div>
                      <div className="small text-muted">Teknik Resim Var</div>
                    </div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-center">
                      <div className="h4 mb-1 text-danger">{itemsWithoutDrawings}</div>
                      <div className="small text-muted">Teknik Resim Yok</div>
                    </div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-center">
                      <div className="h4 mb-1 text-info">{completionRate}%</div>
                      <div className="small text-muted">Tamamlanma</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="col-md-4">
                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-success"
                    onClick={handleDownloadZip}
                    disabled={downloading || itemsWithDrawings === 0}
                  >
                    {downloading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        ZIP Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Archive size={18} className="me-2" />
                        Teknik Resimleri İndir ({itemsWithDrawings})
                      </>
                    )}
                  </button>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filterMissing"
                      checked={filterMissing}
                      onChange={(e) => setFilterMissing(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="filterMissing">
                      Sadece teknik resmi eksik olanları göster
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {selectedGroupIds.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">
              Ürünler ({displayedItems.length})
            </h5>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <div className="mt-2 text-muted">Ürünler yükleniyor...</div>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                {filterMissing
                  ? 'Tüm ürünlerin teknik resmi tamamlanmış!'
                  : 'Seçilen kriterlere uygun ürün bulunamadı'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>Durum</th>
                      <th style={{ width: '100px' }}>Ürün No</th>
                      <th style={{ width: '150px' }}>Ürün Kodu</th>
                      <th>Ürün Adı</th>
                      <th style={{ width: '200px' }}>Ürün Grubu</th>
                      <th style={{ width: '200px' }}>Excel Dosyası</th>
                      <th style={{ width: '100px' }} className="text-center">Dosya Sayısı</th>
                      <th style={{ width: '100px' }} className="text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map(item => (
                      <tr key={item.itemId}>
                        <td className="text-center">
                          {item.hasTechnicalDrawing ? (
                            <CheckCircle size={20} className="text-success" title="Teknik resim var" />
                          ) : (
                            <XCircle size={20} className="text-danger" title="Teknik resim yok" />
                          )}
                        </td>
                        <td>{item.itemNumber}</td>
                        <td>
                          <code className="text-primary">{item.itemCode}</code>
                        </td>
                        <td>{item.itemName}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {item.itemGroupName}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {item.excelFileName || '-'}
                        </td>
                        <td className="text-center">
                          {item.fileCount > 0 ? (
                            <span className="badge bg-success">{item.fileCount}</span>
                          ) : (
                            <span className="badge bg-danger">0</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleItemClick(item.itemId)}
                            title="Ürün detayına git"
                          >
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedWorkId && (
        <div className="text-center py-5">
          <AlertCircle size={64} className="text-muted mb-3" />
          <h5 className="text-muted">Başlamak için bir çalışma seçin</h5>
          <p className="text-muted">
            Yukarıdan bir BOM çalışması seçerek başlayın
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicalDrawingPreparationPage;