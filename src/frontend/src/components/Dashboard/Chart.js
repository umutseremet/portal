import React from 'react';

const Chart = ({ type, data, height = 300 }) => {
  if (type === 'donut') {
    return (
      <div className="chart-container" style={{ height: `${height}px` }}>
        <div className="donut-chart-wrapper">
          <div className="donut-chart">
            <svg viewBox="0 0 200 200" className="donut-svg">
              {/* Donut Chart Segments */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#007bff"
                strokeWidth="20"
                strokeDasharray="162 400"
                strokeDashoffset="0"
                className="chart-segment"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#dc3545"
                strokeWidth="20"
                strokeDasharray="64 400"
                strokeDashoffset="-162"
                className="chart-segment"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#17a2b8"
                strokeWidth="20"
                strokeDasharray="134 400"
                strokeDashoffset="-226"
                className="chart-segment"
              />
              
              {/* Center */}
              <circle cx="100" cy="100" r="60" fill="white" />
            </svg>
            
            {/* Center Content */}
            <div className="donut-center">
              <div className="donut-center-content">
                <div className="text-center">
                  <h6 className="mb-1">Total</h6>
                  <h4 className="text-primary mb-0">67,399</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="chart-container" style={{ height: `${height}px` }}>
        <div className="line-chart-wrapper">
          <svg viewBox="0 0 800 300" className="line-chart-svg">
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="80" height="60" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 60" fill="none" stroke="#f1f3f4" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Gradient */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0"/>
              </linearGradient>
            </defs>
            
            {/* Area */}
            <path
              d="M50 250 Q150 200 200 180 T350 160 T500 140 T650 120 T750 100 L750 280 L50 280 Z"
              fill="url(#lineGradient)"
              className="chart-area"
            />
            
            {/* Line */}
            <path
              d="M50 250 Q150 200 200 180 T350 160 T500 140 T650 120 T750 100"
              stroke="#FF6B6B"
              strokeWidth="3"
              fill="none"
              className="chart-line"
            />
            
            {/* Data Points */}
            <circle cx="50" cy="250" r="4" fill="#FF6B6B" className="chart-point" />
            <circle cx="200" cy="180" r="4" fill="#FF6B6B" className="chart-point" />
            <circle cx="350" cy="160" r="4" fill="#FF6B6B" className="chart-point" />
            <circle cx="500" cy="140" r="4" fill="#FF6B6B" className="chart-point" />
            <circle cx="650" cy="120" r="4" fill="#FF6B6B" className="chart-point" />
            <circle cx="750" cy="100" r="4" fill="#FF6B6B" className="chart-point" />
          </svg>
          
          {/* Chart Labels */}
          <div className="chart-labels">
            <div className="chart-x-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default/Bar chart
  return (
    <div className="chart-container" style={{ height: `${height}px` }}>
      <div className="bar-chart-wrapper">
        <div className="d-flex align-items-end justify-content-around h-100 px-3 py-4">
          {[65, 85, 45, 95, 70, 80, 60, 90].map((value, index) => (
            <div key={index} className="bar-item">
              <div 
                className="bar bg-danger" 
                style={{ 
                  height: `${value}%`, 
                  width: '20px',
                  borderRadius: '4px 4px 0 0',
                  animation: `growUp 1s ease-out ${index * 0.1}s both`
                }}
              ></div>
              <small className="bar-label mt-2 text-muted">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index]}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chart;