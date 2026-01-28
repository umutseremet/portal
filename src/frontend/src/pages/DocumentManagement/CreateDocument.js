// src/pages/DocumentManagement/CreateDocument.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DocumentManagement.css';

const CreateDocument = () => {
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
    const [files, setFiles] = useState([]);
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
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('categoryId', formData.categoryId);
            data.append('type', formData.type);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('documentDate', formData.documentDate);
            data.append('viewPermission', formData.viewPermission);

            files.forEach(file => {
                data.append('files', file);
            });

            await api.post('/api/DocumentManagement/documents', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Doküman başarıyla oluşturuldu');
            navigate('/documents');
        } catch (error) {
            console.error('Doküman oluşturulurken hata:', error);
            setError('Doküman oluşturulamadı. Lütfen tüm alanları kontrol edin.');
        } finally {
            setSaving(false);
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

    return (
        <div className="document-create-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><i className="fas fa-file-plus"></i> Yeni Doküman Oluştur</h1>
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

                        <div className="mb-3">
                            <label className="form-label">Dosyalar</label>
                            <input
                                type="file"
                                className="form-control"
                                multiple
                                onChange={handleFileChange}
                            />
                            <small className="text-muted">
                                Çoklu dosya seçebilirsiniz (En fazla 542 MB)
                            </small>
                            {files.length > 0 && (
                                <div className="mt-2">
                                    <strong>Seçilen dosyalar:</strong>
                                    <ul className="mb-0">
                                        {files.map((file, index) => (
                                            <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="d-flex justify-content-end gap-2">
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
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i> Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateDocument;