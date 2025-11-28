// src/frontend/src/pages/PermissionManagementPage.js
// Liste sayfası - Modal yerine detay sayfasına yönlendirme

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../styles/permissions.css';

const PermissionManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userCustomFields, setUserCustomFields] = useState([]);
  const [groupCustomFields, setGroupCustomFields] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPermissionData();
  }, []);

  const loadPermissionData = async () => {
    try {
      setLoading(true);

      console.log('🔄 Loading permission data...');
      const response = await apiService.getPermissionManagement();
      console.log('✅ Permission data loaded:', response);

      setUsers(response.users || []);
      setGroups(response.groups || []);
      setUserCustomFields(response.userCustomFields || []);
      setGroupCustomFields(response.groupCustomFields || []);

      // Log permissions for debugging
      console.log('📊 Users with permissions:', response.users?.filter(u => u.permissions?.length > 0).length);
      console.log('📊 Groups with permissions:', response.groups?.filter(g => g.permissions?.length > 0).length);
      console.log('📋 User Custom Fields:', response.userCustomFields);
      console.log('📋 Group Custom Fields:', response.groupCustomFields);
    } catch (error) {
      console.error('❌ Yetki bilgileri yüklenemedi:', error);
      alert('Yetki bilgileri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPermissions = (entity, type) => {
    // Detay sayfasına yönlendir
    navigate(`/permissions/${type}/${entity.id}`, {
      state: { entity }
    });
  };

  const filteredUsers = users.filter(u =>
    `${u.firstname} ${u.lastname} ${u.login}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserRow = (user) => (
    <tr key={user.id} style={{ cursor: 'pointer' }}>
      <td onClick={() => handleViewPermissions(user, 'user')}>
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
      <td onClick={() => handleViewPermissions(user, 'user')}>
        {user.mail || '-'}
      </td>
      <td onClick={() => handleViewPermissions(user, 'user')}>
        <span className={`badge ${user.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
          {user.status === 1 ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td onClick={() => handleViewPermissions(user, 'user')}>
        {user.permissions && user.permissions.length > 0 ? (
          <span className="badge bg-primary">
            {user.permissions.length} Yetki
          </span>
        ) : (
          <span className="badge bg-secondary">
            Yetki Yok
          </span>
        )}
      </td>
      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleViewPermissions(user, 'user')}
        >
          <i className="bi bi-shield-lock me-1"></i>
          Yetkileri Görüntüle
        </button>
      </td>
    </tr>
  );

  const renderGroupRow = (group) => (
    <tr key={group.id} style={{ cursor: 'pointer' }}>
      <td onClick={() => handleViewPermissions(group, 'group')}>
        <div className="group-info">
          <i className="bi bi-people-fill me-2 text-primary"></i>
          <strong>{group.name}</strong>
        </div>
      </td>
      <td onClick={() => handleViewPermissions(group, 'group')}>
        <span className="badge bg-info">
          {group.users?.length || 0} Kullanıcı
        </span>
      </td>
      <td onClick={() => handleViewPermissions(group, 'group')}>
        {group.permissions && group.permissions.length > 0 ? (
          <span className="badge bg-primary">
            {group.permissions.length} Yetki
          </span>
        ) : (
          <span className="badge bg-secondary">
            Yetki Yok
          </span>
        )}
      </td>
      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleViewPermissions(group, 'group')}
        >
          <i className="bi bi-shield-lock me-1"></i>
          Yetkileri Görüntüle
        </button>
      </td>
    </tr>
  );

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

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-shield-lock me-2 text-primary"></i>
                Yetki Yönetimi
              </h2>
              <p className="text-muted mb-0">
                Kullanıcı ve grup yetkilerini görüntüleyin ve düzenleyin
              </p>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={loadPermissionData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Bilgi:</strong> Yetkiler Redmine'da tanımlanan özel alanlar üzerinden yönetilir.
            Açıklama alanında <code>#yetki_kullanici</code> veya <code>#yetki_grup</code> öneki
            olan alanlar yetki alanı olarak kullanılır. Detay sayfasında tüm yetki alanlarını görüntüleyebilir,
            mevcut değerleri güncelleyebilir veya yeni değerler atayabilirsiniz.
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <i className="bi bi-person text-primary fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Toplam Kullanıcı</h6>
                  <h3 className="mb-0">{users.length}</h3>
                  <small className="text-success">
                    {users.filter(u => u.permissions?.length > 0).length} kullanıcıda yetki tanımlı
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <i className="bi bi-people text-info fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Toplam Grup</h6>
                  <h3 className="mb-0">{groups.length}</h3>
                  <small className="text-success">
                    {groups.filter(g => g.permissions?.length > 0).length} grupta yetki tanımlı
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-3">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="bi bi-person me-2"></i>
                Kullanıcılar ({users.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`}
                onClick={() => setActiveTab('groups')}
              >
                <i className="bi bi-people me-2"></i>
                Gruplar ({groups.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Search */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={activeTab === 'users' ? 'Kullanıcı ara...' : 'Grup ara...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      {activeTab === 'users' ? (
                        <>
                          <th>Kullanıcı</th>
                          <th>E-posta</th>
                          <th>Durum</th>
                          <th>Yetki Durumu</th>
                          <th>İşlemler</th>
                        </>
                      ) : (
                        <>
                          <th>Grup Adı</th>
                          <th>Üye Sayısı</th>
                          <th>Yetki Durumu</th>
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
                          <td colSpan="5" className="text-center text-muted py-4">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                          </td>
                        </tr>
                      )
                    ) : (
                      filteredGroups.length > 0 ? (
                        filteredGroups.map(renderGroupRow)
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-4">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
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
        </div>
      </div>
    </div>
  );
};

export default PermissionManagementPage;