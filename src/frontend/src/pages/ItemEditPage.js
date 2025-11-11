// src/frontend/src/pages/ItemEditPage.js
// Bu dosyaya ItemFileUpload component'i eklenecek şekilde güncelleme

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import ItemFileUpload from '../components/Items/ItemFileUpload';
import PDFPreviewModal from '../components/Items/PDFPreviewModal';
import { useToast } from '../contexts/ToastContext'; // ← BU SATIRI EKLEYİN

const ItemEditPage = () => { 
  const { id } = useParams(); // URL'den ID alınıyor: /definitions/items/edit/:id
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id; // ID varsa edit mode, yoksa new mode
  const toast = useToast(); // ← BU SATIRI EKLEYİN

  const [item, setItem] = useState(location.state?.item || null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    code: '',
    name: '',
    docNumber: '',
    groupId: '',
    x: '',
    y: '',
    z: '',
    imageUrl: '',
    supplierCode: '',
    price: '',
    supplier: '',
    unit: 'Adet'
  });

  // Load item data
  useEffect(() => {
    if (isEdit) {
      if (item) {
        populateForm(item);
      } else {
        fetchItem();
      }
    }
  }, [id, isEdit]);

  // Load groups
  useEffect(() => {
    fetchGroups();
  }, []);

  // Load files if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchFiles();
    }
  }, [isEdit, id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await apiService.getItem(id);
      setItem(data);
      populateForm(data);
    } catch (err) {
      console.error('Error loading item:', err);
      toast.error('Ürün bilgisi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiService.getItemGroups({
        page: 1,
        pageSize: 100,
        includeCancelled: false
      });
      setGroups(response.itemGroups || []);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const fetchFiles = async () => {
    if (!id) return;

    try {
      setFilesLoading(true);
      const files = await apiService.getItemFiles(parseInt(id));
      setUploadedFiles(Array.isArray(files) ? files : []);
      console.log('✅ Files loaded:', files.length);
    } catch (err) {
      console.error('❌ Error loading files:', err);
      toast.error('Dosyalar yüklenirken hata oluştu: ' + err.message);
    } finally {
      setFilesLoading(false);
    }
  };

  const populateForm = (itemData) => {
    setFormData({
      number: itemData.number || '',
      code: itemData.code || '',
      name: itemData.name || '',
      docNumber: itemData.docNumber || '',
      groupId: itemData.groupId || '',
      x: itemData.x || '',
      y: itemData.y || '',
      z: itemData.z || '',
      imageUrl: itemData.imageUrl || '',
      supplierCode: itemData.supplierCode || '',
      price: itemData.price || '',
      supplier: itemData.supplier || '',
      unit: itemData.unit || 'Adet'
    });
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

    if (!formData.code || !formData.name || !formData.groupId) {
      toast.warning('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        number: parseInt(formData.number) || 0,
        code: formData.code.trim(),
        name: formData.name.trim(),
        docNumber: formData.docNumber.trim(),
        groupId: parseInt(formData.groupId),
        x: formData.x ? parseFloat(formData.x) : null,
        y: formData.y ? parseFloat(formData.y) : null,
        z: formData.z ? parseFloat(formData.z) : null,
        imageUrl: formData.imageUrl?.trim(),
        supplierCode: formData.supplierCode?.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
        supplier: formData.supplier?.trim(),
        unit: formData.unit || 'Adet'
      };

      if (isEdit) {
        await apiService.updateItem(item.id, submitData);
        toast.success('Ürün başarıyla güncellendi');
      } else {
        await apiService.createItem(submitData);
        toast.success('Ürün başarıyla oluşturuldu');
      }
      
      navigate('/definitions/items');
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(err.message || 'Ürün kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/definitions/items');
  };

  // File upload handlers
  const handleFileUpload = async (files) => {
    if (!id) {
      toast.warning('Dosya yüklemek için önce ürünü kaydedin');
      return;
    }

    setUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      try {
        console.log('📤 Uploading file:', file.name);
        const result = await apiService.uploadItemFile(parseInt(id), file);
        console.log('✅ File uploaded:', result);
        successCount++;
      } catch (err) {
        console.error('❌ Error uploading file:', err);
        toast.error(`${file.name} yüklenirken hata oluştu: ${err.message}`);
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} dosya başarıyla yüklendi.${errorCount > 0 ? ` ${errorCount} dosya yüklenemedi.` : ''}`);
    }
    
    await fetchFiles();
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setFilesLoading(true);
      await apiService.deleteItemFile(fileId);
      
      setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
      
      console.log('✅ File deleted:', fileId);
      toast.success('Dosya başarıyla silindi.');
    } catch (err) {
      console.error('❌ Error deleting file:', err);
      toast.error('Dosya silinirken hata oluştu: ' + err.message);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleDeleteMultiple = async (fileIds) => {
    if (!fileIds || fileIds.length === 0) {
      return;
    }

    try {
      setFilesLoading(true);
      
      let successCount = 0;
      let errorCount = 0;

      for (const fileId of fileIds) {
        try {
          await apiService.deleteItemFile(fileId);
          successCount++;
          console.log(`✅ File ${fileId} deleted`);
        } catch (err) {
          errorCount++;
          console.error(`❌ Error deleting file ${fileId}:`, err);
        }
      }

      setUploadedFiles(prev => prev.filter(file => !fileIds.includes(file.id)));

      if (successCount > 0) {
        toast.success(`${successCount} dosya silindi.${errorCount > 0 ? ` ${errorCount} dosya silinemedi.` : ''}`);
      } else {
        toast.error('Hiçbir dosya silinemedi.');
      }
    } catch (err) {
      console.error('❌ Error in bulk delete:', err);
      toast.error('Dosyalar silinirken hata oluştu: ' + err.message);
    } finally {
      setFilesLoading(false);
    }
  };

  const handlePreviewFile = (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file && file.isPdf) {
      setPreviewFile(file);
      setShowPreview(true);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!item && isEdit) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Ürün bilgisi bulunamadı. Lütfen ürün listesinden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/definitions/items')}>
          <i className="bi bi-arrow-left me-2"></i>
          Ürün Listesine Dön
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
                onClick={handleCancel}
                disabled={submitting}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri
              </button>
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-box me-2"></i>
                  {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
                </h2>
                <p className="text-muted mb-0">
                  {isEdit ? `Ürün: ${item?.code}` : 'Yeni ürün oluştur'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="row">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Numara *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* Code */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Kod *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      maxLength={50}
                    />
                  </div>

                  {/* Name */}
                  <div className="col-12 mb-3">
                    <label className="form-label">İsim *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      maxLength={500}
                    />
                  </div>

                  {/* Doc Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Doküman No</label>
                    <input
                      type="text"
                      className="form-control"
                      name="docNumber"
                      value={formData.docNumber}
                      onChange={handleInputChange}
                      disabled={submitting}
                      maxLength={50}
                    />
                  </div>

                  {/* Group */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Grup *</label>
                    <select
                      className="form-select"
                      name="groupId"
                      value={formData.groupId}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">Grup Seçin</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dimensions */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">X</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="x"
                      value={formData.x}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="y"
                      value={formData.y}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Z</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="z"
                      value={formData.z}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  {/* Supplier Info */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tedarikçi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tedarikçi Kodu</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplierCode"
                      value={formData.supplierCode}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  {/* Price & Unit */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fiyat</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Birim</label>
                    <input
                      type="text"
                      className="form-control"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  {/* Image URL */}
                  <div className="col-12 mb-3">
                    <label className="form-label">Resim URL</label>
                    <input
                      type="text"
                      className="form-control"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      disabled={submitting}
                      maxLength={500}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        {isEdit ? 'Güncelle' : 'Kaydet'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* File Upload Section - Only show when editing */}
        {isEdit && id && (
          <div className="col-12 col-lg-5">
            <ItemFileUpload
              itemId={parseInt(id)}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onDeleteFile={handleDeleteFile}
              onDeleteMultiple={handleDeleteMultiple}
              onPreviewFile={handlePreviewFile}
              uploading={uploading}
              loading={filesLoading}
            />
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        show={showPreview}
        file={previewFile}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
};

export default ItemEditPage;