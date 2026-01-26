// src/frontend/src/components/Reports/ProjectStatusCard.js
import React from 'react';

const ProjectStatusCard = ({ project }) => {
  const {
    projectCode,
    projectName,
    totalIssues,
    completedIssues,
    completionPercentage,
    plannedIssuesToday,
    plannedIssuesThisWeek,
    purchase,
    production
  } = project;

  // Progress bar renk belirleme
  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  // Yüzde hesaplama helper
  const calculatePercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        {/* Kart Başlık */}
        <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)' }}>
          <h5 className="card-title mb-0">
            <i className="bi bi-folder-fill me-2"></i>
            {projectCode}
          </h5>
          <small className="d-block mt-1 opacity-75">{projectName}</small>
        </div>

        <div className="card-body">
          {/* Tamamlanma Durumu */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">
                <i className="bi bi-check-circle me-1"></i>
                Tamamlanma
              </h6>
              <span className="badge bg-secondary">
                {completedIssues} / {totalIssues}
              </span>
            </div>
            <div className="progress" style={{ height: '20px' }}>
              <div
                className={`progress-bar bg-${getProgressBarColor(completionPercentage)}`}
                role="progressbar"
                style={{ width: `${completionPercentage}%` }}
                aria-valuenow={completionPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <strong>{completionPercentage.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Planlanmış İşler */}
          <div className="mb-4">
            <h6 className="mb-3">
              <i className="bi bi-calendar-event me-1"></i>
              Planlanmış İşler
            </h6>
            <div className="row g-2">
              <div className="col-6">
                <div className="card bg-light border-0">
                  <div className="card-body p-2 text-center">
                    <div className="text-primary fw-bold" style={{ fontSize: '1.5rem' }}>
                      {plannedIssuesToday}
                    </div>
                    <small className="text-muted">Bugün</small>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="card bg-light border-0">
                  <div className="card-body p-2 text-center">
                    <div className="text-info fw-bold" style={{ fontSize: '1.5rem' }}>
                      {plannedIssuesThisWeek}
                    </div>
                    <small className="text-muted">Bu Hafta</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Satınalma */}
          <div className="mb-4">
            <h6 className="mb-2">
              <i className="bi bi-cart-check me-1"></i>
              Satınalma
            </h6>
            {purchase.totalPurchaseIssues > 0 ? (
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span>
                    <i className="bi bi-calendar-check text-success me-1"></i>
                    Sipariş Tarihi:
                  </span>
                  <span className="fw-bold">
                    {purchase.withOrderDate} / {purchase.totalPurchaseIssues}
                    <span className="text-muted ms-1">
                      ({calculatePercentage(purchase.withOrderDate, purchase.totalPurchaseIssues)}%)
                    </span>
                  </span>
                </div>
                <div className="progress mb-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${calculatePercentage(purchase.withOrderDate, purchase.totalPurchaseIssues)}%`
                    }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span>
                    <i className="bi bi-alarm text-warning me-1"></i>
                    Termin Tarihi:
                  </span>
                  <span className="fw-bold">
                    {purchase.withDeadlineDate} / {purchase.totalPurchaseIssues}
                    <span className="text-muted ms-1">
                      ({calculatePercentage(purchase.withDeadlineDate, purchase.totalPurchaseIssues)}%)
                    </span>
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width: `${calculatePercentage(purchase.withDeadlineDate, purchase.totalPurchaseIssues)}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted small py-2">
                <i className="bi bi-inbox"></i> Satınalma işi yok
              </div>
            )}
          </div>

          {/* Üretim */}
          <div>
            <h6 className="mb-2">
              <i className="bi bi-gear-fill me-1"></i>
              Üretim (Üretim, Montaj, Elektrik)
            </h6>
            {production.totalProductionIssues > 0 ? (
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span>
                    <i className="bi bi-calendar3 text-info me-1"></i>
                    Planlama Yapılan:
                  </span>
                  <span className="fw-bold">
                    {production.withPlannedDates} / {production.totalProductionIssues}
                    <span className="text-muted ms-1">
                      ({calculatePercentage(production.withPlannedDates, production.totalProductionIssues)}%)
                    </span>
                  </span>
                </div>
                <div className="progress mb-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-info"
                    style={{
                      width: `${calculatePercentage(production.withPlannedDates, production.totalProductionIssues)}%`
                    }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <span>
                    <i className="bi bi-arrow-repeat text-primary me-1"></i>
                    Revize Tarihi Girilen:
                  </span>
                  <span className="fw-bold">
                    {production.withRevisedDates} / {production.withPlannedDates}
                    <span className="text-muted ms-1">
                      ({calculatePercentage(production.withRevisedDates, production.withPlannedDates)}%)
                    </span>
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{
                      width: `${calculatePercentage(production.withRevisedDates, production.withPlannedDates)}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted small py-2">
                <i className="bi bi-inbox"></i> Üretim işi yok
              </div>
            )}
          </div>
        </div>

        {/* Kart Footer - Detay Butonu */}
        <div className="card-footer bg-light">
          <a
            href={`/production/weekly-calendar?parentIssueId=${project.parentIssueId}`}
            className="btn btn-sm btn-outline-primary w-100"
          >
            <i className="bi bi-arrow-right-circle me-1"></i>
            Detaylara Git
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusCard;