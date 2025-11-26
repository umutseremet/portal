// src/frontend/src/pages/PermissionManagementPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/permissions.css';

const PermissionManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userCustomFields, setUserCustomFields] = useState([]);
  const [groupCustomFields, setGroupCustomFields] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissionData();
  }, []);

  const loadPermissionData = async () => {
    try {
      setLoading(true);

      // JWT token'dan otomatik alınacak - body göndermeye gerek YOK
      const response = await apiService.getPermissionManagement();

      setUsers(response.users || []);
      setGroups(response.groups || []);
      setUserCustomFields(response.userCustomFields || []);
      setGroupCustomFields(response.groupCustomFields || []);
    } catch (error) {
      console.error('Yetki bilgileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermission = (entity, customField) => {
    const currentValue = getCurrentPermissionValue(entity, customField.id);
    setEditingPermission({
      entity,
      customField,
      value: currentValue || ''
    });
  };

  const getCurrentPermissionValue = (entity, customFieldId) => {
    const permissions = activeTab === 'users' ? entity.permissions : entity.permissions;
    const permission = permissions?.find(p => p.customFieldId === customFieldId);
    return permission?.permissionValue || '';
  };

  const handleSavePermission = async () => {
    if (!editingPermission) return;

    try {
      setSaving(true);

      // Yeni API metodlarını kullan - JWT'den credentials alınacak
      if (activeTab === 'users') {
        await apiService.updateUserPermission(
          editingPermission.entity.id,
          {
            customFieldId: editingPermission.customField.id,
            value: editingPermission.value
          }
        );
      } else {
        await apiService.updateGroupPermission(
          editingPermission.entity.id,
          {
            customFieldId: editingPermission.customField.id,
            value: editingPermission.value
          }
        );
      }

      // Başarılı - listeyi yenile
      await loadPermissionData();
      setEditingPermission(null);
    } catch (error) {
      console.error('Yetki güncellenemedi:', error);
      alert('Yetki güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.firstname} ${u.lastname} ${u.login}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserRow = (user) => (
    <tr key={user.id}>
      <td>
        <div className="user-info">
          <div className="user-avatar">
            {user.firstname?.[0]}{user.lastname?.[0]}
          </div>
          <div>
            <div className="user-name">{user.firstname} {user.lastname}</div>
            <div className="user-login">{user.login}</div>
          </div>
        </div>
      </td>
      <td>{user.mail || '-'}</td>
      <td>
        <span className={`badge ${user.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
          {user.status === 1 ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setSelectedEntity(user)}
        >
          <i className="bi bi-shield-lock me-1"></i>
          Yetkileri Görüntüle
        </button>
      </td>
    </tr>
  );

  const renderGroupRow = (group) => (
    <tr key={group.id}>
      <td>
        <div className="group-info">
          <i className="bi bi-people-fill me-2 text-primary"></i>
          <strong>{group.name}</strong>
        </div>
      </td>
      <td>
        <span className="badge bg-info">
          {group.users?.length || 0} Kullanıcı
        </span>
      </td>
      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setSelectedEntity(group)}
        >
          <i className="bi bi-shield-lock me-1"></i>
          Yetkileri Görüntüle
        </button>
      </td>
    </tr>
  );

  const renderPermissionModal = () => {
    if (!selectedEntity) return null;

    const customFields = activeTab === 'users' ? userCustomFields : groupCustomFields;
    const isUser = activeTab === 'users';

    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-shield-lock me-2"></i>
                {isUser
                  ? `${selectedEntity.firstname} ${selectedEntity.lastname} - Yetkiler`
                  : `${selectedEntity.name} - Yetkiler`
                }
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedEntity(null)}
              ></button>
            </div>
            <div className="modal-body">
              {customFields.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Henüz yetki alanı tanımlanmamış. Portal'da özel alanları oluşturun.
                </div>
              ) : (
                <div className="permission-list">
                  {customFields.map(field => {
                    const currentValue = getCurrentPermissionValue(selectedEntity, field.id);
                    return (
                      <div key={field.id} className="permission-item card mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{field.name}</h6>
                              {field.description && (
                                <small className="text-muted d-block mb-2">
                                  {field.description}
                                </small>
                              )}
                              <div className="permission-value">
                                <strong>Mevcut Değer:</strong>{' '}
                                <span className={currentValue ? 'text-success' : 'text-muted'}>
                                  {currentValue || 'Tanımlı değil'}
                                </span>
                              </div>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditPermission(selectedEntity, field)}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Düzenle
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isUser && selectedEntity.permissions && selectedEntity.permissions.length > 0 && (
                <div className="mt-4">
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Mevcut Yetkiler
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Yetki</th>
                          <th>Değer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntity.permissions.map((perm, idx) => (
                          <tr key={idx}>
                            <td>{perm.permissionKey}</td>
                            <td><code>{perm.permissionValue}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedEntity(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingPermission) return null;

    const { entity, customField, value } = editingPermission;

    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-pencil me-2"></i>
                Yetki Düzenle
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingPermission(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  <strong>
                    {activeTab === 'users'
                      ? `${entity.firstname} ${entity.lastname}`
                      : entity.name
                    }
                  </strong>
                </label>
              </div>
              <div className="mb-3">
                <label className="form-label">Yetki Alanı</label>
                <input
                  type="text"
                  className="form-control"
                  value={customField.name}
                  disabled
                />
                {customField.description && (
                  <small className="text-muted">{customField.description}</small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Değer</label>
                {customField.fieldFormat === 'bool' ? (
                  <select
                    className="form-select"
                    value={value}
                    onChange={(e) => setEditingPermission({ ...editingPermission, value: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="1">Evet</option>
                    <option value="0">Hayır</option>
                  </select>
                ) : customField.possibleValues && customField.possibleValues.length > 0 ? (
                  <select
                    className="form-select"
                    value={value}
                    onChange={(e) => setEditingPermission({ ...editingPermission, value: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    {customField.possibleValues.map((val, idx) => (
                      <option key={idx} value={val}>{val}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => setEditingPermission({ ...editingPermission, value: e.target.value })}
                    placeholder="Değer giriniz"
                  />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingPermission(null)}
                disabled={saving}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePermission}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-3 text-muted">Yetki bilgileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="permission-management-page">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">
              <i className="bi bi-shield-lock me-2 text-primary"></i>
              Yetki Yönetimi
            </h2>
            <p className="text-muted mb-0">
              Kullanıcı ve grup yetkilerini yönetin
            </p>
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={loadPermissionData}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Yenile
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Bilgi:</strong> Yetkiler Portal'da tanımlanan özel alanlar üzerinden yönetilir.
        Açıklama alanında <code>#yetki_kullanici</code> veya <code>#yetki_grup</code> öneki
        olan alanlar yetki alanı olarak kullanılır.
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSelectedEntity(null);
            }}
          >
            <i className="bi bi-person me-2"></i>
            Kullanıcılar ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('groups');
              setSelectedEntity(null);
            }}
          >
            <i className="bi bi-people me-2"></i>
            Gruplar ({groups.length})
          </button>
        </li>
      </ul>

      {/* Search */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder={activeTab === 'users' ? 'Kullanıcı ara...' : 'Grup ara...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  {activeTab === 'users' ? (
                    <>
                      <th>Kullanıcı</th>
                      <th>E-posta</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </>
                  ) : (
                    <>
                      <th>Grup Adı</th>
                      <th>Üye Sayısı</th>
                      <th>İşlemler</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'users' ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map(renderUserRow)
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                      </td>
                    </tr>
                  )
                ) : (
                  filteredGroups.length > 0 ? (
                    filteredGroups.map(renderGroupRow)
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        {searchTerm ? 'Grup bulunamadı' : 'Henüz grup yok'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderPermissionModal()}
      {renderEditModal()}
    </div>
  );
};

export default PermissionManagementPage;