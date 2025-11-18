import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  subtitle,
  icon, 
  trend, 
  color = "primary",
  className = "" 
}) => {
  return (
    <div className={`col-xl-3 col-lg-6 col-md-6 col-sm-12 ${className}`}>
      <div className="stats-card">
        <div className="d-flex justify-content-between align-items-start">
          <div className="stats-content">
            <p className="card-category text-muted mb-2">{title}</p>
            <h3 className="card-title mb-2">{value}</h3>
            
            {change && (
              <p className={`card-change mb-0 ${
                trend === 'up' ? 'text-success' : 
                trend === 'down' ? 'text-danger' : 
                'text-warning'
              }`}>
                {trend && (
                  <i className={`bi ${
                    trend === 'up' ? 'bi-arrow-up' : 
                    trend === 'down' ? 'bi-arrow-down' : 
                    'bi-clock'
                  } me-1`}></i>
                )}
                {change}
              </p>
            )}
            
            {subtitle && (
              <p className="card-subtitle text-muted small mb-0 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className={`stats-icon bg-${color}`}>
            <i className={`bi ${icon} text-white`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;