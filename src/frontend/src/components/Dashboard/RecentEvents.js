import React, { useState } from 'react';

const RecentEvents = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const events = [
    {
      id: 1,
      name: "The Story of Danau Toba (Drama Theater)",
      date: "04/08/2024",
      location: "Jakarta, Indonesia",
      tickets: "4 Pcs",
      revenue: "$124.95",
      status: "active",
      customer: "Steffany Humble",
      avatar: "SH"
    },
    {
      id: 2,
      name: "Envato Authors Meetup 2024",
      date: "04/08/2024", 
      location: "Medan, Indonesia",
      tickets: "4 Pcs",
      revenue: "$536.00",
      status: "pending",
      customer: "Elisabeth Queen",
      avatar: "EQ"
    },
    {
      id: 3,
      name: "Great Big Fireworks at Newyork City",
      date: "04/08/2024",
      location: "Sydney, Australia", 
      tickets: "4 Pcs",
      revenue: "$65.22",
      status: "active",
      customer: "David Bekam",
      avatar: "DB"
    },
    {
      id: 4,
      name: "Indonesian Envato Authors Fun Run",
      date: "04/08/2024",
      location: "Penang, Malaysia",
      tickets: "4 Pcs", 
      revenue: "$536.00",
      status: "completed",
      customer: "Cive Slauw",
      avatar: "CS"
    },
    {
      id: 5,
      name: "The Story of Danau Toba (Musical Drama)",
      date: "04/08/2024",
      location: "London, UK",
      tickets: "1 Pcs",
      revenue: "$125.70", 
      status: "active",
      customer: "Bella Simatupang",
      avatar: "BS"
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'bg-success', text: 'Active' },
      pending: { class: 'bg-warning text-dark', text: 'Pending' },
      completed: { class: 'bg-primary', text: 'Completed' },
      cancelled: { class: 'bg-danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">Recent Event List</h5>
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <span className="text-muted small mx-2">{currentPage}</span>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <i className="bi bi-arrow-right"></i>
            </button>
            <button className="btn btn-sm btn-outline-secondary ms-2">
              <i className="bi bi-three-dots"></i>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Tickets</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="event-icon me-3">
                        <i className="bi bi-calendar-event text-danger"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">{event.name}</div>
                        <small className="text-muted">ID: #00{event.id}451</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{event.date}</div>
                    <small className="text-muted">12:34 AM</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center me-2 ${getAvatarColor(event.customer)} text-white`}>
                        <small>{event.avatar}</small>
                      </div>
                      <div>
                        <div className="fw-semibold">{event.customer}</div>
                        <small className="text-muted">2m ago</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{event.location.split(',')[0]},</div>
                    <small className="text-muted">{event.location.split(',')[1]}</small>
                  </td>
                  <td>
                    <span className="fw-semibold">{event.tickets}</span>
                    <div>
                      <small className="text-muted">56% left</small>
                    </div>
                  </td>
                  <td>
                    <div className={`fw-semibold ${
                      event.status === 'completed' ? 'text-success' : 'text-dark'
                    }`}>
                      {event.revenue}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(event.status)}
                  </td>
                  <td>
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                        data-bs-toggle="dropdown"
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" href="#">
                            <i className="bi bi-eye me-2"></i>View Details
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="#">
                            <i className="bi bi-pencil me-2"></i>Edit
                          </a>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <a className="dropdown-item text-danger" href="#">
                            <i className="bi bi-trash me-2"></i>Delete
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
      </div>
    </div>
  );
};

export default RecentEvents;