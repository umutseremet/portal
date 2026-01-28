// src/pages/DocumentManagement/EditDocument.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import './DocumentManagement.css';

const EditDocument = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        categoryId: '',
        type: '',
        title: '',
        description: '',
        documentDate: '',
        viewPermission: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCategories();
        loadDocument();
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await api.getDocumentCategories();
            setCategories(response);
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
        }
    };

    const loadDocument = async () => {
        try {
            setLoading(true);
            const doc = await api.getDocument(id);
            setFormData({
                categoryId: doc.categoryId,
                type: doc.type,
                title: doc.title,
                description: doc.description,
                documentDate: doc.documentDate ? doc.documentDate.split('T')[0] : '',
                viewPermission: doc.viewPermission || 0
            });
        } catch (error) {
            console.error('Doküman yüklenirken hata:', error);
            setError('Doküman yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await api.updateDocument(id, formData);
            alert('Doküman başarıyla güncellendi');
            navigate('/documents');
        } catch (error) {
            console.error('Doküman güncellenirken hata:', error);
            setError('Doküman güncellenemedi. Lütfen tüm alanları kontrol edin.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bu dokümanı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await api.deleteDocument(id);
            alert('Doküman başarıyla silindi');
            navigate('/documents');
        } catch (error) {
            console.error('Doküman silinirken hata:', error);
            alert('Doküman silinemedi');
        }
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

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="document-edit-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><i className="fas fa-edit"></i> Doküman Düzenle</h1>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/documents')}
                    >
                        <i className="fas fa-arrow-left"></i> Geri Dön
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Kategori *</label>
                                    <select 
                                        className="form-select" 
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Seçiniz...</option>
                                        {flattenCategories(categories).map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {'  '.repeat(cat.level)}{cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Doküman Tipi *</label>
                                    <select 
                                        className="form-select"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="teknik">Teknik Doküman</option>
                                        <option value="kalite">Kalite Dokümanı</option>
                                        <option value="operasyon">Operasyon Prosedürü</option>
                                        <option value="genel">Genel Doküman</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Başlık *</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Doküman başlığı"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Açıklama</label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Doküman hakkında detaylı açıklama..."
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Tarih</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="documentDate"
                                        value={formData.documentDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Görüntüleme İzni</label>
                                    <select
                                        className="form-select"
                                        name="viewPermission"
                                        value={formData.viewPermission}
                                        onChange={handleInputChange}
                                    >
                                        <option value="0">Herkes</option>
                                        <option value="1">Proje Ekibi</option>
                                        <option value="2">Belirli Kullanıcılar</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between">
                            <button 
                                type="button" 
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                <i className="fas fa-trash"></i> Sil
                            </button>
                            <div className="d-flex gap-2">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/documents')}
                                >
                                    İptal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Güncelleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i> Güncelle
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditDocument;