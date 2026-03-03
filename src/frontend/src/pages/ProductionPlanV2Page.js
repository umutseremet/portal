// src/frontend/src/pages/ProductionPlanV2Page.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import './ProductionPlanV2Page.css';

// ─── Sabitler ────────────────────────────────────────────────────────────────
const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

const PROJECT_COLORS = [
  '#e74c3c','#3498db','#2ecc71','#9b59b6','#f39c12',
  '#1abc9c','#e67e22','#16a085','#8e44ad','#27ae60',
];

const projectColorCache = {};
let colorCounter = 0;
function getProjectColor(projectId) {
  if (!projectColorCache[projectId]) {
    projectColorCache[projectId] = PROJECT_COLORS[colorCounter % PROJECT_COLORS.length];
    colorCounter++;
  }
  return projectColorCache[projectId];
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ date: new Date(year, month, 1-(startDow-i)), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month+1, cells.length - lastDay.getDate() - startDow + 1), currentMonth: false });
  }
  return cells;
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, date, onClose, onAddPlan }) {
  const dateLabel = new Date(date + 'T00:00:00')
    .toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  return (
    <div
      className="pplan-context-menu"
      style={{ top: y, left: x }}
      onClick={e => e.stopPropagation()}
    >
      <div className="pplan-context-menu-header">{dateLabel}</div>
      <button className="pplan-context-menu-item" onClick={onAddPlan}>
        <i className="bi bi-plus-circle me-2"></i>Yeni Plan Ekle
      </button>
      <button className="pplan-context-menu-item text-muted" onClick={onClose}>
        <i className="bi bi-x me-2"></i>Kapat
      </button>
    </div>
  );
}

// ─── Proje Dropdown (arama destekli) ─────────────────────────────────────────
function ProjectDropdown({ projects, loading, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const filtered = search
    ? projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.projectCode || '').toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="pplan-dropdown">
      <button
        type="button"
        className={`form-control text-start pplan-dropdown-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        disabled={loading}
      >
        {loading ? (
          <span className="text-muted">
            <span className="spinner-border spinner-border-sm me-2"></span>
            Projeler yükleniyor...
          </span>
        ) : value ? (
          <span>
            {value.projectCode && (
              <span className="badge bg-secondary me-2">{value.projectCode}</span>
            )}
            {value.name}
          </span>
        ) : (
          <span className="text-muted">Proje seçin...</span>
        )}
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} float-end mt-1`}></i>
      </button>

      {open && (
        <div className="pplan-dropdown-panel">
          <div className="p-2 border-bottom">
            <input
              autoFocus
              className="form-control form-control-sm"
              placeholder="Proje adı veya kodu ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="pplan-dropdown-list">
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-3 small">Proje bulunamadı</div>
            ) : filtered.map(p => (
              <button
                key={p.id}
                type="button"
                className={`pplan-dropdown-item ${value?.id === p.id ? 'active' : ''}`}
                onClick={() => { onChange(p); setOpen(false); setSearch(''); }}
              >
                {p.projectCode && (
                  <span className="badge bg-secondary me-2">{p.projectCode}</span>
                )}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plan Ekleme Modalı ───────────────────────────────────────────────────────
function AddPlanModal({ date, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [planType, setPlanType] = useState('');
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [issueSearch, setIssueSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal açıkken sayfa scroll'unu engelle
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const dateLabel = new Date(date + 'T00:00:00')
    .toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    setProjectsLoading(true);
    apiService.getProjectsForPlanning()
      .then(data => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  const handleGoToStep2 = async () => {
    if (!selectedProject || !planType) return;
    setIssuesLoading(true);
    setIssuesError(null);
    setIssueSearch('');
    try {
      const res = await apiService.getProjectIssuesForPlanning(selectedProject.id, planType);
      setIssues(res.issues || []);
      setSelectedIssues([]);
    } catch (err) {
      setIssuesError('İşler yüklenemedi: ' + (err.message || 'Hata'));
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
    setStep(2);
  };

  // Arama filtresi uygulanmış liste
  const filteredIssues = issueSearch.trim()
    ? issues.filter(i =>
        String(i.issueId).includes(issueSearch.trim()) ||
        i.subject.toLowerCase().includes(issueSearch.trim().toLowerCase()) ||
        (i.trackerName || '').toLowerCase().includes(issueSearch.trim().toLowerCase())
      )
    : issues;

  // "Tümünü seç" sadece filtrelenmiş liste üzerinde çalışsın
  const allFilteredSelected = filteredIssues.length > 0 &&
    filteredIssues.every(i => selectedIssues.includes(i.issueId));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIssues(prev => prev.filter(id => !filteredIssues.some(i => i.issueId === id)));
    } else {
      const toAdd = filteredIssues.map(i => i.issueId).filter(id => !selectedIssues.includes(id));
      setSelectedIssues(prev => [...prev, ...toAdd]);
    }
  };

  const toggleIssue = (id) => {
    setSelectedIssues(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedProject || !planType || selectedIssues.length === 0) return;
    setSaving(true);
    try {
      await onSave({
        planDate: date,
        projectId: selectedProject.id,
        projectCode: selectedProject.projectCode || '',
        projectName: selectedProject.name,
        planType,
        color: getProjectColor(selectedProject.id),
        issueIds: selectedIssues,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ width: 1000, maxWidth: '95vw' }}>
        <div className="modal-content pplan-modal-content">

          {/* Header — inline style ile permissions.css global gradient'ı override et */}
          <div className="modal-header pplan-modal-header">
            <div>
              {step === 2 && (
                <button type="button" className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left"></i>
                </button>
              )}
              <h5 className="modal-title d-inline">
                <i className="bi bi-calendar-plus me-2"></i>
                {step === 1 ? 'Yeni Üretim Planı Ekle' : `İş Seçimi — ${selectedProject?.projectCode} / ${planType}`}
              </h5>
              <div className="small mt-1" style={{ color: '#6c757d' }}>
                <i className="bi bi-calendar3 me-1"></i>{dateLabel}
              </div>
            </div>
            <button type="button" className="btn-close pplan-btn-close" onClick={onClose}></button>
          </div>

          {/* Adım göstergesi */}
          <div className="modal-body pb-0">
            <div className="d-flex align-items-center mb-3">
              {['Proje & Tip', 'İş Seçimi', 'Kaydet'].map((lbl, i) => (
                <React.Fragment key={i}>
                  <span className={`badge ${step > i ? 'bg-success' : step === i+1 ? 'bg-primary' : 'bg-secondary'} me-1`}>
                    {step > i+1 ? <i className="bi bi-check"></i> : i+1}
                  </span>
                  <span className={`me-2 small ${step === i+1 ? 'fw-bold' : 'text-muted'}`}>{lbl}</span>
                  {i < 2 && <i className="bi bi-chevron-right text-muted me-2 small"></i>}
                </React.Fragment>
              ))}
            </div>
            <hr className="mt-0" />
          </div>

          {/* Body */}
          <div className={`modal-body pt-0 ${step === 1 ? 'pplan-body-step1' : 'pplan-body-step2'}`}>
            {step === 1 && (
              /* Step 1: overflow visible — dropdown panel sayfanın üstüne çıkabilsin */
              <div style={{ minHeight: 320, overflow: 'visible' }}>
                {/* Proje seçimi */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-diagram-3 me-1"></i>Proje Seçin
                  </label>
                  <ProjectDropdown
                    projects={projects}
                    loading={projectsLoading}
                    value={selectedProject}
                    onChange={setSelectedProject}
                  />
                </div>

                {/* Plan tipi */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-gear me-1"></i>Plan Tipi
                  </label>
                  <div className="row g-3">
                    {['Üretim', 'Montaj'].map(type => (
                      <div key={type} className="col-6">
                        <div
                          className={`card pplan-type-card ${planType === type ? 'pplan-type-card--active' : ''}`}
                          onClick={() => setPlanType(type)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body text-center py-3">
                            <div className="fs-3 mb-2">
                              {type === 'Üretim' ? '🏭' : '🔧'}
                            </div>
                            <div className="fw-bold">{type}</div>
                            <small className="text-muted">
                              {type === 'Üretim' ? 'İmalat işleri' : 'Montaj işleri'}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {issuesLoading && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-2 text-muted">İşler yükleniyor...</p>
                  </div>
                )}

                {issuesError && (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>{issuesError}
                  </div>
                )}

                {!issuesLoading && !issuesError && issues.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox display-5 d-block mb-2"></i>
                    Bu proje ve tipte iş bulunamadı.
                  </div>
                )}

                {!issuesLoading && issues.length > 0 && (
                  <>
                    {/* Arama kutusu */}
                    <div className="mb-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="İş no, açıklama veya iş tipi ile ara..."
                          value={issueSearch}
                          onChange={e => setIssueSearch(e.target.value)}
                          autoFocus
                        />
                        {issueSearch && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setIssueSearch('')}
                            title="Aramayı temizle"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                      <small className="text-muted ms-1">
                        {filteredIssues.length} / {issues.length} iş gösteriliyor
                        {selectedIssues.length > 0 && (
                          <span className="ms-2 text-primary fw-semibold">
                            · {selectedIssues.length} seçili
                          </span>
                        )}
                      </small>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: 380, overflowY: 'auto' }}>
                      <table className="table table-hover align-middle table-sm">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={allFilteredSelected}
                                onChange={toggleAll}
                                title={allFilteredSelected ? 'Tümünü kaldır' : 'Tümünü seç'}
                              />
                            </th>
                            <th>İş No</th>
                            <th>Açıklama</th>
                            <th>İş Tipi</th>
                            <th>Plan Bitiş</th>
                            <th>Revize</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIssues.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted py-4">
                                <i className="bi bi-search me-2"></i>
                                "<strong>{issueSearch}</strong>" ile eşleşen iş bulunamadı.
                              </td>
                            </tr>
                          ) : filteredIssues.map(issue => {
                            const isSel = selectedIssues.includes(issue.issueId);
                            const hasRevise = issue.revisedStartDate || issue.revisedEndDate;
                            return (
                              <tr
                                key={issue.issueId}
                                className={isSel ? 'table-primary' : ''}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleIssue(issue.issueId)}
                              >
                                <td onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSel}
                                    onChange={() => toggleIssue(issue.issueId)}
                                  />
                                </td>
                                <td>
                                  <span className="text-primary fw-semibold">#{issue.issueId}</span>
                                </td>
                                <td className="text-truncate" style={{ maxWidth: 400 }}>
                                  {issue.subject}
                                </td>
                                <td>
                                  <span className={`badge ${issue.trackerName?.includes('Montaj') ? 'bg-purple' : 'bg-info text-dark'}`}>
                                    {(issue.trackerName || '').replace('Üretim - ', '')}
                                  </span>
                                </td>
                                <td>
                                  <small className="text-muted">
                                    {issue.plannedEndDate
                                      ? new Date(issue.plannedEndDate + 'T00:00:00')
                                          .toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                                      : '—'}
                                  </small>
                                </td>
                                <td>
                                  {hasRevise
                                    ? <span className="badge bg-warning text-dark">REVİZE</span>
                                    : <span className="text-muted">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              İptal
            </button>
            {step === 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGoToStep2}
                disabled={!selectedProject || !planType}
              >
                Devam Et <i className="bi bi-arrow-right ms-1"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSave}
                disabled={selectedIssues.length === 0 || saving}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Kaydediliyor...</>
                ) : (
                  <><i className="bi bi-check-circle me-1"></i>Takvime Ekle ({selectedIssues.length})</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detay Modalı ─────────────────────────────────────────────────────────────
function DetailModal({ entry, date, onClose, onUpdate, onDelete }) {
  // Takvime eklenmiş işler (kopyasını alıyoruz — immutable güncelleme için)
  const [selectedIds, setSelectedIds] = useState([...(entry.issueIds || [])]);

  // "İş Ekle" paneli state'leri
  const [addPanelOpen, setAddPanelOpen]   = useState(false);
  const [allIssues, setAllIssues]         = useState([]);
  const [allLoading, setAllLoading]       = useState(false);
  const [allLoaded, setAllLoaded]         = useState(false);  // bir kez yükle
  const [panelSearch, setPanelSearch]     = useState('');

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false); // değişiklik yapıldı mı

  // Modal açıkken sayfa scroll'unu engelle
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Açılışta sessizce tüm işleri yükle (sol panelde isimler görünsün)
  useEffect(() => {
    apiService.getProjectIssuesForPlanning(entry.projectId, entry.planType)
      .then(res => { setAllIssues(res.issues || []); setAllLoaded(true); })
      .catch(() => {});
  }, [entry.projectId, entry.planType]);

  // "İş Ekle" paneli açılınca tüm işleri yükle (sadece ilk açılışta)
  const openAddPanel = async () => {
    setAddPanelOpen(true);
    if (allLoaded) return;
    setAllLoading(true);
    try {
      const res = await apiService.getProjectIssuesForPlanning(entry.projectId, entry.planType);
      setAllIssues(res.issues || []);
      setAllLoaded(true);
    } catch {
      setAllIssues([]);
    } finally {
      setAllLoading(false);
    }
  };

  // Seçili listeden çıkar
  const removeIssue = (id) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
    setDirty(true);
  };

  // İş ekle panelinden ekle/çıkar
  const toggleFromPanel = (id) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setDirty(true);
      return next;
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try { await onUpdate(entry.id, selectedIds); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu plan girişini silmek istediğinizden emin misiniz?')) return;
    await onDelete(entry.id);
  };

  const dateLabel = new Date(date + 'T00:00:00')
    .toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  // İş ekle paneli — arama filtresi (seçili olmayanlar önce, seçililer sonda)
  const panelFiltered = panelSearch.trim()
    ? allIssues.filter(i =>
        String(i.issueId).includes(panelSearch.trim()) ||
        i.subject.toLowerCase().includes(panelSearch.trim().toLowerCase()) ||
        (i.trackerName || '').toLowerCase().includes(panelSearch.trim().toLowerCase())
      )
    : allIssues;

  // Seçili olmayan / seçili şeklinde grupla
  const panelUnselected = panelFiltered.filter(i => !selectedIds.includes(i.issueId));
  const panelSelected   = panelFiltered.filter(i =>  selectedIds.includes(i.issueId));
  const panelSorted     = [...panelUnselected, ...panelSelected];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ width: 1000, maxWidth: '95vw' }}>
        <div className="modal-content pplan-modal-content" style={{
          height: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>

          {/* Header */}
          <div className="modal-header pplan-modal-header">
            <div>
              <h5 className="modal-title">
                <span className="me-2" style={{
                  display: 'inline-block', width: 12, height: 12,
                  borderRadius: 3, background: entry.color, verticalAlign: 'middle'
                }}></span>
                {entry.projectName}
              </h5>
              <div className="small mt-1" style={{ color: '#6c757d' }}>
                <span className={`badge me-2 ${entry.planType === 'Üretim' ? 'bg-info text-dark' : 'bg-purple'}`}>
                  {entry.planType}
                </span>
                <i className="bi bi-calendar3 me-1"></i>{dateLabel}
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash me-1"></i>Sil
              </button>
              <button type="button" className="btn-close pplan-btn-close" onClick={onClose}></button>
            </div>
          </div>

          {/* Body — sol: seçili işler, sağ: iş ekle paneli */}
          <div className="modal-body p-0" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', overflow: 'hidden' }}>

            {/* Sol panel: takvime eklenmiş işler */}
            <div style={{
              flex: addPanelOpen ? '0 0 420px' : '1 1 auto',
              display: 'flex', flexDirection: 'column',
              borderRight: addPanelOpen ? '1px solid #dee2e6' : 'none',
              overflow: 'hidden'
            }}>
              {/* Sol üst başlık */}
              <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white">
                <span className="fw-semibold small text-muted">
                  TAKVİME EKLİ İŞLER
                  <span className="badge bg-primary ms-2">{selectedIds.length}</span>
                </span>
                {!addPanelOpen && (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={openAddPanel}>
                    <i className="bi bi-plus-circle me-1"></i>İş Ekle
                  </button>
                )}
              </div>

              {/* Seçili işler listesi */}
              <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
                {selectedIds.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-inbox display-5 d-block mb-2"></i>
                    <p className="small">Henüz iş eklenmemiş.</p>
                    <button type="button" className="btn btn-sm btn-primary" onClick={openAddPanel}>
                      <i className="bi bi-plus-circle me-1"></i>İş Ekle
                    </button>
                  </div>
                ) : (
                  <table className="table table-hover align-middle table-sm mb-0">
                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>İş No</th>
                        <th>Açıklama</th>
                        <th>Plan Bitiş</th>
                        <th style={{ width: 48 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIds.map(id => {
                        // allIssues yüklendiyse oradan al, yoksa sadece id göster
                        const issue = allIssues.find(i => i.issueId === id);
                        return (
                          <tr key={id}>
                            <td><span className="text-primary fw-semibold">#{id}</span></td>
                            <td className="text-truncate" style={{ maxWidth: 220 }}>
                              {issue ? issue.subject : <span className="text-muted small">Yükleniyor...</span>}
                            </td>
                            <td>
                              <small className="text-muted">
                                {issue?.plannedEndDate
                                  ? new Date(issue.plannedEndDate + 'T00:00:00')
                                      .toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                                  : '—'}
                              </small>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                title="Listeden çıkar"
                                onClick={() => removeIssue(id)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Sağ panel: İş Ekle */}
            {addPanelOpen && (
              <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Sağ üst başlık */}
                <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white">
                  <span className="fw-semibold small text-muted">
                    İŞ EKLE / ÇIKAR
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => { setAddPanelOpen(false); setPanelSearch(''); }}
                  >
                    <i className="bi bi-x-lg me-1"></i>Kapat
                  </button>
                </div>

                {/* Arama */}
                <div className="px-3 pt-2 pb-1">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      autoFocus
                      type="text"
                      className="form-control"
                      placeholder="İş no, açıklama veya iş tipi ile ara..."
                      value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)}
                    />
                    {panelSearch && (
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setPanelSearch('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  <small className="text-muted">
                    {panelFiltered.length} / {allIssues.length} iş
                    {selectedIds.length > 0 && (
                      <span className="ms-2 text-primary fw-semibold">· {selectedIds.length} seçili</span>
                    )}
                  </small>
                </div>

                {/* Liste */}
                <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
                  {allLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary spinner-border-sm"></div>
                      <p className="small text-muted mt-2">Yükleniyor...</p>
                    </div>
                  ) : (
                    <table className="table table-hover align-middle table-sm mb-0">
                      <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: 36 }}></th>
                          <th>İş No</th>
                          <th>Açıklama</th>
                          <th>İş Tipi</th>
                          <th>Plan Bitiş</th>
                        </tr>
                      </thead>
                      <tbody>
                        {panelSorted.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-muted py-4">
                              Eşleşen iş bulunamadı.
                            </td>
                          </tr>
                        ) : panelSorted.map(issue => {
                          const isIn = selectedIds.includes(issue.issueId);
                          return (
                            <tr
                              key={issue.issueId}
                              className={isIn ? 'table-primary' : ''}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleFromPanel(issue.issueId)}
                            >
                              <td onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isIn}
                                  onChange={() => toggleFromPanel(issue.issueId)}
                                />
                              </td>
                              <td><span className="text-primary fw-semibold">#{issue.issueId}</span></td>
                              <td className="text-truncate" style={{ maxWidth: 200 }}>{issue.subject}</td>
                              <td>
                                <span className={`badge ${issue.trackerName?.includes('Montaj') ? 'bg-purple' : 'bg-info text-dark'}`}>
                                  {(issue.trackerName || '').replace('Üretim - ', '')}
                                </span>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {issue.plannedEndDate
                                    ? new Date(issue.plannedEndDate + 'T00:00:00')
                                        .toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                                    : '—'}
                                </small>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ flexShrink: 0 }}>
            {addPanelOpen && (
              <span className="me-auto small text-muted">
                {selectedIds.length} iş seçili — kaydetmek için Güncelle'ye basın
              </span>
            )}
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Kapat
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={saving || !dirty}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Kaydediliyor...</>
                : <><i className="bi bi-check-circle me-1"></i>Güncelle</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Takvim Hücresi ──────────────────────────────────────────────────────────
function CalendarCell({ cell, entries, today, onContextMenu, onEntryClick }) {
  const dateStr = formatDate(cell.date);
  const isToday = dateStr === formatDate(today);
  const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
  const cellEntries = entries.filter(e => e.planDate === dateStr);

  return (
    <div
      className={`pplan-cell ${isToday ? 'pplan-cell--today' : ''} ${isWeekend ? 'pplan-cell--weekend' : ''} ${!cell.currentMonth ? 'pplan-cell--other-month' : ''}`}
      onContextMenu={e => { e.preventDefault(); if (cell.currentMonth) onContextMenu(e, dateStr); }}
    >
      <div className="pplan-cell-day-num">
        <span className={isToday ? 'pplan-today-badge' : ''}>{cell.date.getDate()}</span>
      </div>

      <div className="pplan-cell-entries">
        {cellEntries.map(entry => (
          <div
            key={entry.id}
            className="pplan-entry-chip"
            style={{ borderLeftColor: entry.color, backgroundColor: entry.color + '18' }}
            onClick={e => { e.stopPropagation(); onEntryClick(entry, dateStr); }}
            title={`${entry.projectName} — ${entry.planType} (${(entry.issueIds || []).length} iş)`}
          >
            <span className="me-1">{entry.planType === 'Üretim' ? '🏭' : '🔧'}</span>
            <strong>{entry.projectCode || entry.projectName}</strong>
            <span className="text-muted ms-1">· {entry.planType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
const ProductionPlanV2Page = () => {
  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  const [contextMenu, setContextMenu]   = useState(null);  // { x, y, date }
  const [addModal, setAddModal]         = useState(null);   // { date }
  const [detailModal, setDetailModal]   = useState(null);   // { entry, date }

  const cells = getMonthGrid(year, month);

  // ─── Veri yükle ─────────────────────────────────────────────────────────
  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getMonthlyPlan(year, month + 1);
      setEntries(res.entries || []);
    } catch (err) {
      setError('Plan verisi yüklenemedi: ' + (err.message || 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // Context menü dışı tıklama kapama
  useEffect(() => {
    const h = () => setContextMenu(null);
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e, dateStr) => {
    setContextMenu({ x: e.clientX, y: e.clientY, date: dateStr });
  }, []);

  const handleSavePlan = useCallback(async (data) => {
    try {
      await apiService.saveMonthlyPlanEntry(data);
      setAddModal(null);
      setSuccess('Plan başarıyla takvime eklendi.');
      await loadPlan();
    } catch (err) {
      setError('Kaydetme hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
  }, [loadPlan]);

  const handleUpdateEntry = useCallback(async (entryId, newIssueIds) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    try {
      await apiService.saveMonthlyPlanEntry({
        planDate: entry.planDate,
        projectId: entry.projectId,
        projectCode: entry.projectCode,
        projectName: entry.projectName,
        planType: entry.planType,
        color: entry.color,
        issueIds: newIssueIds,
      });
      setDetailModal(null);
      setSuccess('Plan güncellendi.');
      await loadPlan();
    } catch (err) {
      setError('Güncelleme hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
  }, [entries, loadPlan]);

  const handleDeleteEntry = useCallback(async (entryId) => {
    try {
      await apiService.deleteMonthlyPlanEntry(entryId);
      setDetailModal(null);
      setSuccess('Plan silindi.');
      await loadPlan();
    } catch (err) {
      setError('Silme hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
  }, [loadPlan]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const uretimCount = entries.filter(e => e.planType === 'Üretim').length;
  const montajCount = entries.filter(e => e.planType === 'Montaj').length;

  return (
    <div className="production-plan-v2-page">

      {/* Sayfa başlığı — LogoInvoiceApprovalPage ile aynı pattern */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h2>
              <i className="bi bi-calendar-month me-2"></i>
              Haftalık Üretim Planı
              <span className="badge bg-secondary ms-2" style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>v2</span>
            </h2>
            <p className="text-muted">
              Aylık takvim üzerinde üretim ve montaj planlarını yönetin.
              Güne sağ tıklayarak yeni plan ekleyin.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {loading && (
              <span className="text-muted small">
                <span className="spinner-border spinner-border-sm me-1"></span>
                Yükleniyor...
              </span>
            )}
            <button className="btn btn-outline-secondary btn-sm" onClick={loadPlan} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i>Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Uyarı / başarı mesajları */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {/* Takvim kartı */}
      <div className="card">
        {/* Navigasyon — kart header'ı olarak */}
        <div className="card-header d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={prevMonth}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={nextMonth}>
              <i className="bi bi-chevron-right"></i>
            </button>
            <h5 className="mb-0 fw-bold ms-1">
              {TR_MONTHS[month]} {year}
            </h5>
            <button className="btn btn-outline-primary btn-sm ms-1" onClick={goToday}>
              Bugün
            </button>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3 flex-wrap">
            {/* İstatistikler */}
            <span className="badge bg-light text-dark border">
              <i className="bi bi-calendar-check me-1"></i>
              Bu ay: {entries.length} plan
            </span>
            <span className="badge bg-info text-dark">
              🏭 {uretimCount} Üretim
            </span>
            <span className="badge bg-secondary">
              🔧 {montajCount} Montaj
            </span>
            {/* Legend */}
            <span className="text-muted small d-none d-md-block">
              <i className="bi bi-mouse2 me-1"></i>Sağ tık → Plan Ekle
            </span>
          </div>
        </div>

        {/* Gün başlıkları */}
        <div className="pplan-day-headers">
          {TR_DAYS.map((d, i) => (
            <div key={d} className={`pplan-day-header-cell ${i >= 5 ? 'pplan-day-header-cell--weekend' : ''}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Takvim grid */}
        <div className="pplan-grid">
          {cells.map((cell, idx) => (
            <CalendarCell
              key={idx}
              cell={cell}
              entries={entries}
              today={today}
              onContextMenu={handleContextMenu}
              onEntryClick={(entry, dateStr) => setDetailModal({ entry, date: dateStr })}
            />
          ))}
        </div>
      </div>

      {/* Context menü */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          date={contextMenu.date}
          onClose={() => setContextMenu(null)}
          onAddPlan={() => { setContextMenu(null); setAddModal({ date: contextMenu.date }); }}
        />
      )}

      {/* Plan ekleme modalı */}
      {addModal && (
        <AddPlanModal
          date={addModal.date}
          onClose={() => setAddModal(null)}
          onSave={handleSavePlan}
        />
      )}

      {/* Detay modalı */}
      {detailModal && (
        <DetailModal
          entry={detailModal.entry}
          date={detailModal.date}
          onClose={() => setDetailModal(null)}
          onUpdate={handleUpdateEntry}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  );
};

export default ProductionPlanV2Page;