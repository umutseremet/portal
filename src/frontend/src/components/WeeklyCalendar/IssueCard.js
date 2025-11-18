// src/frontend/src/components/WeeklyCalendar/IssueCard.js
import React from 'react';

const IssueCard = ({ issue }) => {
  // ⚠️ GEÇİCİ DEBUG KODU - CONSOLE'DA GÖRECEKSİNİZ
  console.log('🚀 COMPACT IssueCard render ediliyor:', {
    projectName: issue.projectName,
    issueId: issue.issueId,
    productionType: issue.productionType
  });

  const getProductionTypeColor = (type) => {
    const colors = {
      'Lazer': '#e74c3c',
      'Abkant': '#3498db',
      'Kaynak': '#f39c12',
      'Boya': '#9b59b6',
      'Freze': '#1abc9c',
      'Kaplama': '#34495e',
      'Delik': '#95a5a6',
      'Torna': '#e67e22',
      'Data Hazırlama': '#16a085',
      'Montaj': '#27ae60'  // ✅ YENİ: Yeşil ton
    };
    return colors[type] || '#7f8c8d';
  };

  const getCompletionBadgeClass = (percentage) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-info';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div
      className="issue-card-compact"
      style={{
        borderLeftColor: getProductionTypeColor(issue.productionType),
        backgroundColor: '#f8f9fa', //'#ffeb3b' // ⚠️ GEÇİCİ: SARI ARKA PLAN - GÖRECEKSINIZ
      }}
    >
      {/* Üst Satır: İş Tipi + Tamamlanma */}
      <div className="issue-compact-header">
        <span
          className="production-badge-compact"
          style={{ backgroundColor: getProductionTypeColor(issue.productionType) }}
        >
          {issue.productionType}
        </span>
        <span className={`badge-compact ${getCompletionBadgeClass(issue.completionPercentage)}`}>
          %{issue.completionPercentage}
        </span>
      </div>

      {/* Orta Satır: Proje Adı */}
      <div className="project-name-compact">
        {issue.projectName}
      </div>

      {/* Alt Satır: İş Numarası */}
      <div className="issue-id-compact">
        #{issue.issueId}
      </div>
    </div>
  );
};

export default IssueCard;