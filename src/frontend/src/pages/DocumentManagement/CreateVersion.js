// src/pages/DocumentManagement/CreateVersion.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import './DocumentManagement.css';

const CreateVersion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [formData, setFormData] = useState({
        versionNumber: '',
        changeNote: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDocument();
    }, [id]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            const doc = await api.getDocument(id);
            setDocument(doc);
            
            // Otomatik versiyon numarası önerisi
            const currentVersion = doc.currentVersion;
            const versionParts = currentVersion.replace('v', '').split('.');
            const major = parseInt(versionParts[0]);
            const minor = parseInt(versionParts[1]);
            setFormData(prev => ({
                ...prev,
                versionNumber: `v${major}.${minor + 1}`
            }));
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

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (files.length === 0) {
            alert('Lütfen en az bir dosya seçin');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('documentId', id);
            data.append('versionNumber', formData.versionNumber);
            data.append('changeNote', formData.changeNote);

            files.forEach(file => {
                data.append('files', file);
            });

            await api.createDocumentVersion(id, data);

            alert('Yeni versiyon başarıyla oluşturuldu');
            navigate('/documents');
        } catch (error) {
            console.error('Versiyon oluşturulurken hata:', error);
            setError('Versiyon oluşturulamadı. Lütfen tüm alanları kontrol edin.');
        } finally {
            setSaving(false);
        }
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

    if (!document) {
        return (
            <div className="alert alert-danger">
                Doküman bulunamadı
            </div>
        );
    }

    return (
        <div className="version-create-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><i className="fas fa-upload"></i> Yeni Versiyon Yükle</h1>
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
                <div className="card-header">
                    <h5>{document.title}</h5>
                    <span className="badge bg-primary">Mevcut Versiyon: {document.currentVersion}</span>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Versiyon Numarası *</label>
                            <input
                                type="text"
                                className="form-control"
                                name="versionNumber"
                                value={formData.versionNumber}
                                onChange={handleInputChange}
                                placeholder="v2.0"
                                required
                            />
                            <small className="text-muted">
                                Mevcut versiyon: {document.currentVersion}
                            </small>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Değişiklik Notu *</label>
                            <textarea
                                className="form-control"
                                name="changeNote"
                                value={formData.changeNote}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Bu versiyonda yapılan değişiklikleri açıklayın..."
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Dosyalar *</label>
                            <input
                                type="file"
                                className="form-control"
                                multiple
                                onChange={handleFileChange}
                                required
                            />
                            <small className="text-muted">
                                Yeni versiyon için güncellenmiş dosyaları seçin
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
                                className="btn btn-success"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-upload"></i> Yükle
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

export default CreateVersion;