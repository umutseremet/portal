// src/frontend/src/pages/PermissionDetailPage.js
// Kullanıcı/Grup yetki detay ve düzenleme sayfası

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const PermissionDetailPage = () => {
  const { type, id } = useParams(); // type: 'user' veya 'group'
  const navigate = useNavigate();
  const location = useLocation();

  const [entity, setEntity] = useState(location.state?.entity || null);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const isUser = type === 'user';

  useEffect(() => {
    loadData();
  }, [id, type]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Tüm verileri çek
      const response = await apiService.getPermissionManagement();

      // Entity'yi bul
      const entityList = isUser ? response.users : response.groups;
      const foundEntity = entityList.find(e => e.id === parseInt(id));

      if (!foundEntity) {
        alert('Kullanıcı/Grup bulunamadı');
        navigate('/permissions');
        return;
      }

      setEntity(foundEntity);
      setCustomFields(isUser ? response.userCustomFields : response.groupCustomFields);

      console.log('📋 Entity:', foundEntity);
      console.log('📋 Custom Fields:', isUser ? response.userCustomFields : response.groupCustomFields);
    } catch (error) {
      console.error('❌ Veri yüklenemedi:', error);
      alert('Veriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPermissionValue = (customFieldId) => {
    const permissions = entity?.permissions || [];
    const permission = permissions.find(p => p.customFieldId === customFieldId);
    return permission?.permissionValue || '';
  };

  const handleStartEdit = (field) => {
    const currentValue = getCurrentPermissionValue(field.id);
    setEditingFieldId(field.id);
    setEditValues({ ...editValues, [field.id]: currentValue });
  };

  const handleCancelEdit = () => {
    setEditingFieldId(null);
  };

  const handleSavePermission = async (field) => {
    try {
      setSaving(true);

      const value = editValues[field.id] || '';

      console.log('💾 Saving permission:', {
        entityId: entity.id,
        customFieldId: field.id,
        value
      });

      if (isUser) {
        await apiService.updateUserPermission(entity.id, {
          customFieldId: field.id,
          value
        });
      } else {
        await apiService.updateGroupPermission(entity.id, {
          customFieldId: field.id,
          value
        });
      }

      // Başarılı - yenile
      await loadData();
      setEditingFieldId(null);

      alert('Yetki başarıyla güncellendi');
    } catch (error) {
      console.error('❌ Yetki güncellenemedi:', error);
      alert('Yetki güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3 text-muted">Yetki bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {isUser ? 'Kullanıcı' : 'Grup'} bilgisi bulunamadı. Lütfen listeden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/permissions')}>
          <i className="bi bi-arrow-left me-2"></i>
          Yetki Yönetimi Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate('/permissions')}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri
              </button>
              <div>
                <h2 className="mb-1">
                  <i className={`bi ${isUser ? 'bi-person' : 'bi-people'} me-2`}></i>
                  {isUser ? 'Kullanıcı' : 'Grup'} Yetkileri
                </h2>
                <p className="text-muted mb-0">
                  {isUser
                    ? `${entity.firstname} ${entity.lastname} (${entity.login})`
                    : entity.name
                  }
                </p>
              </div>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={loadData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      {isUser && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <small className="text-muted">E-posta</small>
                    <div className="fw-bold">{entity.mail || '-'}</div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Durum</small>
                    <div>
                      <span className={`badge ${entity.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                        {entity.status === 1 ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Oluşturma</small>
                    <div className="fw-bold">
                      {entity.createdOn ? new Date(entity.createdOn).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Son Giriş</small>
                    <div className="fw-bold">
                      {entity.lastLoginOn ? new Date(entity.lastLoginOn).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isUser && entity.users && entity.users.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">
                  <i className="bi bi-people me-2"></i>
                  Grup Üyeleri ({entity.users.length})
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {entity.users.map(user => (
                    <span key={user.id} className="badge bg-info-subtle text-info">
                      {user.firstname || user.login}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-shield-check me-2"></i>
                Yetki Alanları
              </h5>
            </div>
            <div className="card-body">
              {customFields.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Henüz yetki alanı tanımlanmamış. Redmine'da özel alanları oluşturun ve açıklama kısmına{' '}
                  <code>#yetki_{isUser ? 'kullanici' : 'grup'}</code> ekleyin.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30%' }}>Yetki Alanı</th>
                        <th style={{ width: '45%' }}>Değer</th>
                        <th style={{ width: '25%' }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customFields.map(field => {
                        const currentValue = getCurrentPermissionValue(field.id);
                        const hasValue = currentValue !== '';
                        const isEditing = editingFieldId === field.id;

                        return (
                          <tr key={field.id}>
                            <td>
                              <div>
                                <strong>{field.name}</strong>
                                {hasValue ? (
                                  <span className="badge bg-success-subtle text-success ms-2">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Tanımlı
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary ms-2">
                                    <i className="bi bi-dash-circle me-1"></i>
                                    Tanımlı Değil
                                  </span>
                                )}
                              </div>
                              {field.description && (
                                <small className="text-muted d-block mt-1">
                                  {field.description}
                                </small>
                              )}
                              {field.possibleValues && field.possibleValues.length > 0 && (
                                <small className="text-info d-block mt-1">
                                  <i className="bi bi-list-check me-1"></i>
                                  Seçenekler: {field.possibleValues.join(', ')}
                                </small>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div>
                                  {field.fieldFormat === 'bool' ? (
                                    <select
                                      className="form-select"
                                      value={editValues[field.id] || ''}
                                      onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                      disabled={saving}
                                    >
                                      <option value="">Seçiniz</option>
                                      <option value="1">Evet</option>
                                      <option value="0">Hayır</option>
                                    </select>
                                  ) : field.possibleValues && field.possibleValues.length > 0 ? (
                                    <select
                                      className="form-select"
                                      value={editValues[field.id] || ''}
                                      onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                      disabled={saving}
                                    >
                                      <option value="">Seçiniz</option>
                                      {field.possibleValues.map((val, idx) => (
                                        <option key={idx} value={val}>{val}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={editValues[field.id] || ''}
                                      onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                      placeholder="Değer giriniz"
                                      disabled={saving}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {hasValue ? (
                                    <code className="text-success fw-bold">{currentValue}</code>
                                  ) : (
                                    <span className="text-muted fst-italic">Henüz değer atanmamış</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleSavePermission(field)}
                                    disabled={saving}
                                  >
                                    {saving ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        Kaydediliyor...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-check-lg me-1"></i>
                                        Kaydet
                                      </>
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                  >
                                    <i className="bi bi-x-lg me-1"></i>
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className={`btn btn-sm ${hasValue ? 'btn-outline-primary' : 'btn-primary'}`}
                                  onClick={() => handleStartEdit(field)}
                                >
                                  <i className={`bi ${hasValue ? 'bi-pencil' : 'bi-plus-circle'} me-1`}></i>
                                  {hasValue ? 'Düzenle' : 'Ekle'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDetailPage;