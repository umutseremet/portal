// src/pages/DocumentManagement/DocumentManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DocumentManagement.css';

const DocumentManagement = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCategories();
        loadDocuments();
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [selectedCategory, selectedType, searchTerm]);

    const loadCategories = async () => {
        try {
            const response = await api.getDocumentCategories();
            setCategories(response);
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
            setError('Kategoriler yüklenemedi');
        }
    };

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const params = {
                categoryId: selectedCategory,
                type: selectedType !== 'all' ? selectedType : null,
                search: searchTerm || null
            };
            const response = await api.getDocuments(params);
            setDocuments(response);
        } catch (error) {
            console.error('Dokümanlar yüklenirken hata:', error);
            setError('Dokümanlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const loadDocumentDetail = async (id) => {
        try {
            const response = await api.getDocument(id);
            setSelectedDocument(response);
        } catch (error) {
            console.error('Doküman detayı yüklenirken hata:', error);
        }
    };

    const handleDocumentClick = (doc) => {
        loadDocumentDetail(doc.id);
    };

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            const blob = await api.downloadDocumentFile(fileId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Dosya indirilirken hata:', error);
            alert('Dosya indirilemedi');
        }
    };

    const getTypeName = (type) => {
        const types = {
            'teknik': 'Teknik Doküman',
            'kalite': 'Kalite Dokümanı',
            'operasyon': 'Operasyon Prosedürü',
            'genel': 'Genel Doküman'
        };
        return types[type] || type;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            'pdf': '📕', 'xlsx': '📊', 'xls': '📊', 'docx': '📝', 'doc': '📝',
            'dwg': '📐', 'dxf': '📐', 'jpg': '🖼️', 'png': '🖼️', 'zip': '📦'
        };
        return icons[ext] || '📄';
    };

    return (
        <div className="document-management-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><i className="fas fa-folder-open"></i> Doküman Yönetimi</h1>
                    <div className="header-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/documents/new')}
                        >
                            <i className="fas fa-plus"></i> Yeni Doküman
                        </button>
                        <button 
                            className="btn btn-success"
                            onClick={() => navigate('/documents/categories')}
                        >
                            <i className="fas fa-folder-plus"></i> Kategori Yönetimi
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

            <div className="document-content">
                <div className="row">
                    <div className="col-lg-3">
                        <div className="card category-panel">
                            <div className="card-header">
                                <h5><i className="fas fa-sitemap"></i> Kategoriler</h5>
                            </div>
                            <div className="card-body">
                                <CategoryTree 
                                    categories={categories} 
                                    selectedCategory={selectedCategory}
                                    onCategoryClick={handleCategoryClick}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="card document-list-panel">
                            <div className="card-header">
                                <h5>
                                    {selectedCategory ? 
                                        categories.find(c => c.id === selectedCategory)?.name || 'Dokümanlar' 
                                        : 'Tüm Dokümanlar'}
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="search-box mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Doküman ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="filter-tags mb-3">
                                    <span 
                                        className={`badge ${selectedType === 'all' ? 'bg-primary' : 'bg-light text-dark'} filter-tag`}
                                        onClick={() => setSelectedType('all')}
                                    >
                                        Tümü
                                    </span>
                                    <span 
                                        className={`badge ${selectedType === 'teknik' ? 'bg-primary' : 'bg-light text-dark'} filter-tag`}
                                        onClick={() => setSelectedType('teknik')}
                                    >
                                        Teknik Doküman
                                    </span>
                                    <span 
                                        className={`badge ${selectedType === 'kalite' ? 'bg-primary' : 'bg-light text-dark'} filter-tag`}
                                        onClick={() => setSelectedType('kalite')}
                                    >
                                        Kalite Dokümanı
                                    </span>
                                    <span 
                                        className={`badge ${selectedType === 'operasyon' ? 'bg-primary' : 'bg-light text-dark'} filter-tag`}
                                        onClick={() => setSelectedType('operasyon')}
                                    >
                                        Operasyon Prosedürü
                                    </span>
                                    <span 
                                        className={`badge ${selectedType === 'genel' ? 'bg-primary' : 'bg-light text-dark'} filter-tag`}
                                        onClick={() => setSelectedType('genel')}
                                    >
                                        Genel Doküman
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </div>
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="empty-state">
                                        <i className="fas fa-search fa-4x mb-3"></i>
                                        <p>Doküman bulunamadı</p>
                                    </div>
                                ) : (
                                    documents.map(doc => (
                                        <div 
                                            key={doc.id}
                                            className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                            onClick={() => handleDocumentClick(doc)}
                                        >
                                            <div className="document-header-row">
                                                <div>
                                                    <div className="document-title">{doc.title}</div>
                                                    <span className={`badge document-type type-${doc.type}`}>
                                                        {getTypeName(doc.type)}
                                                    </span>
                                                </div>
                                                <span className="badge bg-primary version-badge">{doc.currentVersion}</span>
                                            </div>
                                            <div className="text-muted small mb-2">{doc.description}</div>
                                            <div className="document-meta">
                                                <span><i className="far fa-calendar"></i> {formatDate(doc.createdDate)}</span>
                                                <span><i className="far fa-file"></i> {doc.fileCount} Dosya</span>
                                                <span><i className="far fa-user"></i> {doc.createdBy}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3">
                        <div className="card detail-panel">
                            <div className="card-body">
                                {selectedDocument ? (
                                    <div className="document-detail">
                                        <div className="detail-header mb-3">
                                            <h5>{selectedDocument.title}</h5>
                                            <span className={`badge type-${selectedDocument.type}`}>
                                                {getTypeName(selectedDocument.type)}
                                            </span>
                                        </div>

                                        <div className="detail-section mb-3">
                                            <h6 className="text-primary">Açıklama</h6>
                                            <p className="text-muted">{selectedDocument.description}</p>
                                        </div>

                                        <div className="detail-section mb-3">
                                            <h6 className="text-primary">Genel Bilgiler</h6>
                                            <div className="small">
                                                <div className="mb-1"><strong>Oluşturan:</strong> {selectedDocument.createdBy}</div>
                                                <div className="mb-1"><strong>Oluşturma Tarihi:</strong> {formatDate(selectedDocument.createdDate)}</div>
                                                {selectedDocument.updatedDate && (
                                                    <div className="mb-1"><strong>Güncellenme:</strong> {formatDate(selectedDocument.updatedDate)}</div>
                                                )}
                                                <div className="mb-1"><strong>Güncel Versiyon:</strong> {selectedDocument.currentVersion}</div>
                                            </div>
                                        </div>

                                        <div className="detail-section mb-3">
                                            <h6 className="text-primary">Dosyalar ({selectedDocument.files.length})</h6>
                                            {selectedDocument.files.map(file => (
                                                <div key={file.id} className="file-item">
                                                    <div className="file-icon">{getFileIcon(file.fileName)}</div>
                                                    <div className="file-info">
                                                        <div className="file-name">{file.fileName}</div>
                                                        <div className="file-meta">
                                                            {file.fileSizeFormatted} • {formatDate(file.uploadDate)}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => downloadFile(file.id, file.fileName)}
                                                    >
                                                        <i className="fas fa-download"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="detail-section mb-3">
                                            <h6 className="text-primary">Versiyon Geçmişi</h6>
                                            <div className="version-history">
                                                {selectedDocument.versions.map(version => (
                                                    <div key={version.id} className="version-item">
                                                        <div>
                                                            <span className="version-number">{version.versionNumber}</span>
                                                            <span className="text-muted small ms-2">{formatDate(version.createdDate)}</span>
                                                        </div>
                                                        <div className="small text-muted">
                                                            <strong>{version.createdBy}:</strong> {version.changeNote}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-sm btn-primary"
                                                onClick={() => navigate(`/documents/edit/${selectedDocument.id}`)}
                                            >
                                                <i className="fas fa-edit"></i> Düzenle
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-success"
                                                onClick={() => navigate(`/documents/${selectedDocument.id}/new-version`)}
                                            >
                                                <i className="fas fa-upload"></i> Yeni Versiyon
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <i className="fas fa-file-alt fa-4x mb-3"></i>
                                        <p>Detayları görmek için bir doküman seçin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CategoryTree = ({ categories, selectedCategory, onCategoryClick, level = 0 }) => {
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="category-tree">
            {categories.map(category => (
                <div key={category.id} className={`category-item level-${level}`}>
                    <div 
                        className={`category-row ${selectedCategory === category.id ? 'active' : ''}`}
                        style={{ paddingLeft: `${level * 20}px` }}
                    >
                        {category.children && category.children.length > 0 && (
                            <span 
                                className="toggle-icon"
                                onClick={() => toggleCategory(category.id)}
                            >
                                {expandedCategories[category.id] ? '▼' : '▶'}
                            </span>
                        )}
                        <span onClick={() => onCategoryClick(category.id)} className="category-name">
                            {category.icon} {category.name}
                        </span>
                    </div>
                    {category.children && category.children.length > 0 && expandedCategories[category.id] && (
                        <CategoryTree
                            categories={category.children}
                            selectedCategory={selectedCategory}
                            onCategoryClick={onCategoryClick}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default DocumentManagement;