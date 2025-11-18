import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import Chart from './Chart';
import RecentEvents from './RecentEvents';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      newSales: { value: '93', change: '25%', trend: 'up' },
      eventHeld: { value: '856', change: '12%', trend: 'up' },
      totalRevenue: { value: '90%', change: null, trend: null },
      monthlyGrowth: { value: '25%', change: 'Daily', trend: null }
    },
    chartData: {
      bestSelling: {
        ticketLeft: 21512,
        ticketSold: 45612,
        eventHeld: 275
      },
      salesRevenue: [
        { month: 'Jan', value: 30 },
        { month: 'Feb', value: 45 },
        { month: 'Mar', value: 35 },
        { month: 'Apr', value: 60 },
        { month: 'May', value: 55 },
        { month: 'Jun', value: 75 },
        { month: 'Jul', value: 65 },
        { month: 'Aug', value: 80 }
      ]
    }
  });

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real app, this would be an API call
        // const data = await apiService.getDashboardStats();
        // setDashboardData(data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                  <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="text-muted">Dashboard yükleniyor...</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="welcome-section">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="page-title mb-2">Dashboard</h2>
                  <p className="page-subtitle text-muted">
                    Hoş geldiniz! Sistem genel durumu ve son etkinlik özeti
                  </p>
                </div>
                <div className="welcome-actions d-none d-md-flex">
                  <button className="btn btn-outline-secondary me-2">
                    <i className="bi bi-download me-1"></i>
                    Rapor İndir
                  </button>
                  <button className="btn btn-danger">
                    <i className="bi bi-plus-lg me-1"></i>
                    Yeni Etkinlik
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <StatsCard 
            title="New Sales" 
            value={dashboardData.stats.newSales.value}
            change={dashboardData.stats.newSales.change}
            trend={dashboardData.stats.newSales.trend}
            icon="bi-cart-check-fill"
            color="success"
          />
          <StatsCard 
            title="Event Held" 
            value={dashboardData.stats.eventHeld.value}
            change={dashboardData.stats.eventHeld.change}
            trend={dashboardData.stats.eventHeld.trend}
            icon="bi-calendar-event"
            color="danger"
          />
          <StatsCard 
            title="Total Revenue" 
            value={dashboardData.stats.totalRevenue.value}
            icon="bi-graph-up"
            color="info"
          />
          <StatsCard 
            title="Monthly Growth" 
            value={dashboardData.stats.monthlyGrowth.value}
            change={dashboardData.stats.monthlyGrowth.change}
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
                      aria-expanded="false"
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
                
                <Chart type="donut" data={dashboardData.chartData.bestSelling} />
                
                {/* Chart Stats */}
                <div className="mt-4">
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <div className="chart-stat">
                        <div className="d-flex align-items-center justify-content-center mb-1">
                          <div className="stat-color bg-primary me-2"></div>
                          <small className="text-muted">Ticket Left</small>
                        </div>
                        <div className="stat-value fw-bold">{dashboardData.chartData.bestSelling.ticketLeft.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="chart-stat">
                        <div className="d-flex align-items-center justify-content-center mb-1">
                          <div className="stat-color bg-danger me-2"></div>
                          <small className="text-muted">Ticket Sold</small>
                        </div>
                        <div className="stat-value fw-bold">{dashboardData.chartData.bestSelling.ticketSold.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="chart-stat">
                        <div className="d-flex align-items-center justify-content-center mb-1">
                          <div className="stat-color bg-info me-2"></div>
                          <small className="text-muted">Event Held</small>
                        </div>
                        <div className="stat-value fw-bold">{dashboardData.chartData.bestSelling.eventHeld}</div>
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
                
                <Chart type="line" data={dashboardData.chartData.salesRevenue} />
                
                {/* Revenue Summary */}
                <div className="mt-3">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-success bg-opacity-10 p-2 rounded">
                            <i className="bi bi-arrow-up text-success"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="text-success fw-semibold">+15.3%</div>
                          <small className="text-muted">vs last month</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-primary bg-opacity-10 p-2 rounded">
                            <i className="bi bi-graph-up text-primary"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="text-primary fw-semibold">$45,280</div>
                          <small className="text-muted">Total revenue</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Hızlı İşlemler</h5>
                <div className="row g-3">
                  <div className="col-md-3 col-sm-6">
                    <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                      <i className="bi bi-calendar-plus fs-1 mb-2"></i>
                      <span>Yeni Etkinlik</span>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                      <i className="bi bi-people-fill fs-1 mb-2"></i>
                      <span>Müşteri Ekle</span>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button className="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                      <i className="bi bi-graph-up-arrow fs-1 mb-2"></i>
                      <span>Rapor Oluştur</span>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button className="btn btn-outline-warning w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                      <i className="bi bi-gear-fill fs-1 mb-2"></i>
                      <span>Ayarlar</span>
                    </button>
                  </div>
                </div>
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

export default Dashboard;