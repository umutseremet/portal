// src/frontend/src/pages/ItemEditPage.js
// ✅ DataCam entegrasyonu ve validation ile güncellenmiş versiyon

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import ItemFileUpload from '../components/Items/ItemFileUpload';
import PDFPreviewModal from '../components/Items/PDFPreviewModal';
import { useToast } from '../contexts/ToastContext';

const ItemEditPage = () => { 
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const isEdit = !!id;
  
  // ✅ DataCam entegrasyonu
  const fromDataCam = location.state?.fromDataCam || false;
  const returnPath = location.state?.returnPath || '/definitions/items';

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

  // ✅ Validation errors state
  const [errors, setErrors] = useState({});

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
      showToast('Ürün bilgisi yüklenirken hata oluştu', 'error');
      navigate('/definitions/items');
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
      showToast('Ürün grupları yüklenirken hata oluştu', 'error');
    }
  };

  const fetchFiles = async () => {
    if (!id) return;

    try {
      setFilesLoading(true);
      const files = await apiService.getItemFiles(parseInt(id));
      setUploadedFiles(Array.isArray(files) ? files : []);
    } catch (err) {
      console.error('Error loading files:', err);
      showToast('Dosyalar yüklenirken hata oluştu', 'error');
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
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ VALIDATION METODU
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.code || !formData.code.trim()) {
      newErrors.code = 'Ürün kodu zorunludur';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Ürün kodu en fazla 50 karakter olabilir';
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Ürün adı zorunludur';
    } else if (formData.name.length > 500) {
      newErrors.name = 'Ürün adı en fazla 500 karakter olabilir';
    }

    if (!formData.docNumber || !formData.docNumber.trim()) {
      newErrors.docNumber = 'Doküman numarası zorunludur';
    } else if (formData.docNumber.length > 50) {
      newErrors.docNumber = 'Doküman numarası en fazla 50 karakter olabilir';
    }

    if (!formData.groupId) {
      newErrors.groupId = 'Ürün grubu seçilmelidir';
    }

    // Number validation
    if (formData.number && isNaN(parseInt(formData.number))) {
      newErrors.number = 'Geçerli bir numara giriniz';
    }

    // Dimension validations (optional but if provided, must be valid)
    if (formData.x && isNaN(parseFloat(formData.x))) {
      newErrors.x = 'Geçerli bir X değeri giriniz';
    }
    if (formData.y && isNaN(parseFloat(formData.y))) {
      newErrors.y = 'Geçerli bir Y değeri giriniz';
    }
    if (formData.z && isNaN(parseFloat(formData.z))) {
      newErrors.z = 'Geçerli bir Z değeri giriniz';
    }

    // Price validation
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Geçerli bir fiyat giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ HANDLE SUBMIT - DataCam entegrasyonu ile
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation kontrolü
    if (!validateForm()) {
      showToast('Lütfen zorunlu alanları doldurun', 'warning');
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
        imageUrl: formData.imageUrl?.trim() || null,
        supplierCode: formData.supplierCode?.trim() || null,
        price: formData.price ? parseFloat(formData.price) : 0,
        supplier: formData.supplier?.trim() || null,
        unit: formData.unit?.trim() || 'Adet'
      };

      if (isEdit) {
        // Ürünü güncelle
        await apiService.updateItem(id, submitData);
        
        // ✅ CRITICAL: DataCam ekranından açıldıysa, teknik resim tamamlandı olarak işaretle
        if (fromDataCam) {
          try {
            await apiService.markTechnicalDrawingCompleted(id);
            showToast('Ürün güncellendi ve teknik resim çalışması tamamlandı olarak işaretlendi', 'success');
          } catch (markError) {
            console.error('Mark completed error:', markError);
            // Ürün güncellenmiş ama mark failed - yine de başarılı say
            showToast('Ürün güncellendi', 'success');
          }
        } else {
          showToast('Ürün başarıyla güncellendi', 'success');
        }
        
        // Geri dön
        navigate(returnPath);
      } else {
        // Yeni ürün oluştur
        const result = await apiService.createItem(submitData);
        showToast('Ürün başarıyla oluşturuldu', 'success');
        navigate('/definitions/items');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast(
        err.response?.data?.message || 'Ürün kaydedilirken hata oluştu',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  const handleFileUploaded = (newFile) => {
    setUploadedFiles(prev => [...prev, newFile]);
    showToast('Dosya başarıyla yüklendi', 'success');
  };

  const handleFileDeleted = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    showToast('Dosya silindi', 'success');
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
                  </h2>
                  <p className="text-muted mb-0">
                    {isEdit ? `Ürün: ${item?.code}` : 'Yeni ürün oluştur'}
                  </p>
                  
                  {/* ✅ DataCam bilgilendirme banner'ı */}
                  {fromDataCam && (
                    <div className="alert alert-info mt-2 mb-0 py-2 px-3">
                      <i className="bi bi-info-circle me-2"></i>
                      <small>
                        <strong>Data/CAM Hazırlama:</strong> Kaydet butonuna bastığınızda 
                        bu ürün için teknik resim çalışması tamamlanmış olarak işaretlenecektir.
                      </small>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    {fromDataCam ? 'Listeye Dön' : 'İptal'}
                  </button>
                </div>
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
                    <label className="form-label">Numara</label>
                    <input
                      type="number"
                      className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.number && (
                      <div className="invalid-feedback">{errors.number}</div>
                    )}
                  </div>

                  {/* Code */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Kod *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      disabled={submitting}
                      maxLength={50}
                    />
                    {errors.code && (
                      <div className="invalid-feedback">{errors.code}</div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-12 mb-3">
                    <label className="form-label">İsim *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={submitting}
                      maxLength={500}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Doc Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Doküman No *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.docNumber ? 'is-invalid' : ''}`}
                      name="docNumber"
                      value={formData.docNumber}
                      onChange={handleInputChange}
                      disabled={submitting}
                      maxLength={50}
                    />
                    {errors.docNumber && (
                      <div className="invalid-feedback">{errors.docNumber}</div>
                    )}
                  </div>

                  {/* Group */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Grup *</label>
                    <select
                      className={`form-select ${errors.groupId ? 'is-invalid' : ''}`}
                      name="groupId"
                      value={formData.groupId}
                      onChange={handleInputChange}
                      disabled={submitting}
                    >
                      <option value="">Grup Seçiniz</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    {errors.groupId && (
                      <div className="invalid-feedback">{errors.groupId}</div>
                    )}
                  </div>

                  {/* Dimensions */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">X</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors.x ? 'is-invalid' : ''}`}
                      name="x"
                      value={formData.x}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.x && (
                      <div className="invalid-feedback">{errors.x}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors.y ? 'is-invalid' : ''}`}
                      name="y"
                      value={formData.y}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.y && (
                      <div className="invalid-feedback">{errors.y}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Z</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors.z ? 'is-invalid' : ''}`}
                      name="z"
                      value={formData.z}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.z && (
                      <div className="invalid-feedback">{errors.z}</div>
                    )}
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
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price}</div>
                    )}
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
                        {isEdit ? 'Güncelle' : 'Oluştur'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* File Upload Section - Only for Edit Mode */}
        {isEdit && (
          <div className="col-12 col-lg-5">
            <ItemFileUpload
              itemId={parseInt(id)}
              uploadedFiles={uploadedFiles}
              loading={filesLoading}
              uploading={uploading}
              onFileUploaded={handleFileUploaded}
              onFileDeleted={handleFileDeleted}
              onPreviewFile={handlePreviewFile}
            />
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {showPreview && previewFile && (
        <PDFPreviewModal
          file={previewFile}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ItemEditPage;