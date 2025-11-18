import React, { useState } from 'react';

const ProductionList = ({ activeFilter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const orders = [
    {
      id: "001451",
      date: "04/08/2024",
      time: "12:34 AM",
      productName: "Widget Pro 2024",
      customer: "Andrew Stevano",
      location: "Jakarta, Indonesia",
      quantity: "2 Pcs",
      status: "completed",
      revenue: "$124.95",
      priority: "high"
    },
    {
      id: "001452", 
      date: "04/08/2024",
      time: "12:34 AM",
      productName: "Super Component X",
      customer: "Elisabeth Queen",
      location: "Medan, Indonesia", 
      quantity: "4 Pcs",
      status: "pending",
      revenue: "$536.00",
      priority: "medium"
    },
    {
      id: "001453",
      date: "04/08/2024", 
      time: "12:34 AM",
      productName: "Mega Tool Kit",
      customer: "David Bekam",
      location: "Sydney, Australia",
      quantity: "4 Pcs", 
      status: "active",
      revenue: "$65.22",
      priority: "low"
    },
    {
      id: "001454",
      date: "04/08/2024",
      time: "12:34 AM", 
      productName: "Advanced Module",
      customer: "Cive Slauw",
      location: "Penang, Malaysia",
      quantity: "4 Pcs",
      status: "preparing",
      revenue: "$536.00",
      priority: "medium"
    },
    {
      id: "001455",
      date: "04/08/2024",
      time: "12:34 AM",
      productName: "Premium Package", 
      customer: "Bella Simatupang",
      location: "London, UK",
      quantity: "1 Pcs",
      status: "completed",
      revenue: "$125.70",
      priority: "high"
    },
    {
      id: "001456",
      date: "05/08/2024",
      time: "09:15 AM",
      productName: "Basic Starter Kit",
      customer: "John Mitchell",
      location: "New York, USA",
      quantity: "3 Pcs",
      status: "cancelled",
      revenue: "$89.99",
      priority: "low"
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { class: 'bg-success', text: 'Tamamlandı' },
      active: { class: 'bg-primary', text: 'Üretimde' },
      pending: { class: 'bg-warning text-dark', text: 'Beklemede' },
      preparing: { class: 'bg-info', text: 'Hazırlanıyor' },
      cancelled: { class: 'bg-danger', text: 'İptal' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPriorityIcon = (priority) => {
    const priorityConfig = {
      high: { class: 'text-danger', icon: 'bi-arrow-up-circle-fill' },
      medium: { class: 'text-warning', icon: 'bi-dash-circle-fill' },
      low: { class: 'text-success', icon: 'bi-arrow-down-circle-fill' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <i className={`bi ${config.icon} ${config.class}`}></i>;
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return order.status === 'active' || order.status === 'preparing';
    if (activeFilter === 'completed') return order.status === 'completed';
    if (activeFilter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return 'bi-arrow-down-up';
    return sortOrder === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  };

  return (
    <div className="production-list">
      {/* Table Stats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {filteredOrders.length} sipariş gösteriliyor
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-funnel me-1"></i>
            Filtre
          </button>
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-download me-1"></i>
            Excel
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('id')}
                >
                  Sipariş ID
                  <i className={`bi ${getSortIcon('id')} ms-1 small`}></i>
                </button>
              </th>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('date')}
                >
                  Tarih
                  <i className={`bi ${getSortIcon('date')} ms-1 small`}></i>
                </button>
              </th>
              <th>Ürün Adı</th>
              <th>Müşteri</th>
              <th>Lokasyon</th>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('quantity')}
                >
                  Adet
                  <i className={`bi ${getSortIcon('quantity')} ms-1 small`}></i>
                </button>
              </th>
              <th>Durum</th>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('revenue')}
                >
                  Toplam Tutar
                  <i className={`bi ${getSortIcon('revenue')} ms-1 small`}></i>
                </button>
              </th>
              <th>Öncelik</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <div className="fw-semibold text-primary">#{order.id}</div>
                </td>
                <td>
                  <div>{order.date}</div>
                  <small className="text-muted">{order.time}</small>
                </td>
                <td>
                  <div className="fw-semibold">{order.productName}</div>
                  <small className="text-muted">Production Item</small>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                      <small>{order.customer.split(' ').map(n => n[0]).join('')}</small>
                    </div>
                    <div>
                      <div className="fw-semibold">{order.customer}</div>
                      <small className="text-muted">Customer</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{order.location.split(',')[0]},</div>
                  <small className="text-muted">{order.location.split(',')[1]}</small>
                </td>
                <td>
                  <span className="fw-semibold">{order.quantity}</span>
                  <div>
                    <small className="text-muted">56% left</small>
                  </div>
                </td>
                <td>
                  {getStatusBadge(order.status)}
                </td>
                <td>
                  <div className={`fw-semibold ${
                    order.status === 'completed' ? 'text-success' : 'text-dark'
                  }`}>
                    {order.revenue}
                  </div>
                </td>
                <td className="text-center">
                  {getPriorityIcon(order.priority)}
                </td>
                <td>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <a className="dropdown-item" href="#">
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#">
                          <i className="bi bi-pencil me-2"></i>Düzenle
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#">
                          <i className="bi bi-printer me-2"></i>Yazdır
                        </a>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <a className="dropdown-item text-warning" href="#">
                          <i className="bi bi-pause-circle me-2"></i>Duraklat
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item text-danger" href="#">
                          <i className="bi bi-trash me-2"></i>İptal Et
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted small">
          1-{filteredOrders.length} of {filteredOrders.length} entries
        </div>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>
            {[1, 2, 3].map(page => (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className="page-item">
              <button 
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ProductionList;