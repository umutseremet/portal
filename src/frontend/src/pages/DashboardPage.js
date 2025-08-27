import React from 'react';
import StatsCard from '../components/Dashboard/StatsCard';
import Chart from '../components/Dashboard/Chart';
import RecentEvents from '../components/Dashboard/RecentEvents';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <h2 className="page-title mb-2">Dashboard</h2>
              <p className="page-subtitle text-muted">
                Sistem genel durumu ve son etkinlik özeti
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <StatsCard 
            title="New Sales" 
            value="93" 
            change="25%" 
            trend="up"
            icon="bi-cart-check-fill"
            color="success"
          />
          <StatsCard 
            title="Event Held" 
            value="856" 
            change="12%" 
            trend="up"
            icon="bi-calendar-event"
            color="danger"
          />
          <StatsCard 
            title="Total Revenue" 
            value="90%" 
            icon="bi-graph-up"
            color="info"
          />
          <StatsCard 
            title="Monthly Growth" 
            value="25%" 
            change="Daily" 
            icon="bi-trending-up"
            color="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          {/* Best Selling Chart */}
          <div className="col-xl-4 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Best Selling</h5>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                      type="button" 
                      data-bs-toggle="dropdown"
                    >
                      This Week
                    </button>
                    <ul className="dropdown-menu">
                      <li><a className="dropdown-item" href="#">This Week</a></li>
                      <li><a className="dropdown-item" href="#">This Month</a></li>
                      <li><a className="dropdown-item" href="#">This Year</a></li>
                    </ul>
                  </div>
                </div>
                <Chart type="donut" />
                
                {/* Chart Stats */}
                <div className="mt-4">
                  <div className="row g-3">
                    <div className="col-4 text-center">
                      <div className="chart-stat">
                        <div className="stat-color bg-primary"></div>
                        <div className="stat-value">21,512</div>
                        <div className="stat-label">Ticket Left</div>
                      </div>
                    </div>
                    <div className="col-4 text-center">
                      <div className="chart-stat">
                        <div className="stat-color bg-danger"></div>
                        <div className="stat-value">45,612</div>
                        <div className="stat-label">Ticket Sold</div>
                      </div>
                    </div>
                    <div className="col-4 text-center">
                      <div className="chart-stat">
                        <div className="stat-color bg-info"></div>
                        <div className="stat-value">275</div>
                        <div className="stat-label">Event Held</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Revenue Chart */}
          <div className="col-xl-8 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Sales Revenue</h5>
                  <div className="btn-group btn-group-sm" role="group">
                    <input type="radio" className="btn-check" name="period" id="monthly" defaultChecked />
                    <label className="btn btn-outline-danger" htmlFor="monthly">Monthly</label>
                    
                    <input type="radio" className="btn-check" name="period" id="weekly" />
                    <label className="btn btn-outline-secondary" htmlFor="weekly">Weekly</label>
                    
                    <input type="radio" className="btn-check" name="period" id="today" />
                    <label className="btn btn-outline-secondary" htmlFor="today">Today</label>
                  </div>
                </div>
                <Chart type="line" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="row">
          <div className="col-12">
            <RecentEvents />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;