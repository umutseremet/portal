// src/pages/DocumentManagement/CategoryManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DocumentManagement.css';

const CategoryManagement = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '📁',
        parentId: null
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await api.get('/api/DocumentManagement/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
            setError('Kategoriler yüklenemedi');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (editingCategory) {
                // Güncelleme
                await api.put(`/api/DocumentManagement/categories/${editingCategory.id}`, formData);
                alert('Kategori başarıyla güncellendi');
            } else {
                // Yeni oluşturma
                await api.post('/api/DocumentManagement/categories', formData);
                alert('Kategori başarıyla oluşturuldu');
            }
            
            loadCategories();
            resetForm();
        } catch (error) {
            console.error('Kategori kaydedilirken hata:', error);
            setError('Kategori kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon,
            parentId: category.parentId
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/api/DocumentManagement/categories/${id}`);
            alert('Kategori başarıyla silindi');
            loadCategories();
        } catch (error) {
            console.error('Kategori silinirken hata:', error);
            alert('Kategori silinemedi');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            icon: '📁',
            parentId: null
        });
        setEditingCategory(null);
        setShowForm(false);
    };

    const flattenCategories = (cats, level = 0) => {
        let result = [];
        cats.forEach(cat => {
            result.push({ ...cat, level });
            if (cat.children && cat.children.length > 0) {
                result = result.concat(flattenCategories(cat.children, level + 1));
            }
        });
        return result;
    };

    const renderCategoryTree = (cats, level = 0) => {
        return cats.map(cat => (
            <div key={cat.id} className="category-tree-item" style={{ paddingLeft: `${level * 30}px` }}>
                <div className="category-item-content">
                    <div className="category-info">
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-name">{cat.name}</span>
                    </div>
                    <div className="category-actions">
                        <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(cat)}
                        >
                            <i className="fas fa-edit"></i>
                        </button>
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(cat.id)}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                {cat.children && cat.children.length > 0 && (
                    <div className="category-children">
                        {renderCategoryTree(cat.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="category-management-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><i className="fas fa-folder-tree"></i> Kategori Yönetimi</h1>
                    <div className="header-actions">
                        <button 
                            className="btn btn-success"
                            onClick={() => setShowForm(!showForm)}
                        >
                            <i className="fas fa-plus"></i> Yeni Kategori
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => navigate('/documents')}
                        >
                            <i className="fas fa-arrow-left"></i> Geri Dön
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            <div className="row">
                {showForm && (
                    <div className="col-lg-4">
                        <div className="card">
                            <div className="card-header">
                                <h5>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Üst Kategori</label>
                                        <select
                                            className="form-select"
                                            name="parentId"
                                            value={formData.parentId || ''}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Ana Kategori</option>
                                            {flattenCategories(categories)
                                                .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {'  '.repeat(cat.level)}{cat.icon} {cat.name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Kategori Adı *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Kategori adı"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">İkon</label>
                                        <select
                                            className="form-select"
                                            name="icon"
                                            value={formData.icon}
                                            onChange={handleInputChange}
                                        >
                                            <option value="📁">📁 Klasör</option>
                                            <option value="📘">📘 Kitap</option>
                                            <option value="📄">📄 Doküman</option>
                                            <option value="⚙️">⚙️ Ayarlar</option>
                                            <option value="📊">📊 Grafik</option>
                                            <option value="✓">✓ Onay</option>
                                            <option value="📋">📋 Liste</option>
                                            <option value="📝">📝 Not</option>
                                        </select>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary flex-fill"
                                            onClick={resetForm}
                                        >
                                            İptal
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary flex-fill"
                                            disabled={saving}
                                        >
                                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <div className={showForm ? 'col-lg-8' : 'col-lg-12'}>
                    <div className="card">
                        <div className="card-header">
                            <h5>Kategori Listesi</h5>
                        </div>
                        <div className="card-body">
                            {categories.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-folder-open fa-4x mb-3"></i>
                                    <p>Henüz kategori eklenmemiş</p>
                                </div>
                            ) : (
                                <div className="category-tree">
                                    {renderCategoryTree(categories)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;