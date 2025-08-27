import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, error } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <h5 className="text-muted mb-2">Sistem yükleniyor...</h5>
          <p className="text-muted small">Kimlik doğrulaması kontrol ediliyor</p>
          
          {/* API Connection Status */}
          <div className="mt-3">
            <div className="d-flex justify-content-center align-items-center">
              <div className="spinner-grow spinner-grow-sm text-info me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <small className="text-muted">API bağlantısı kontrol ediliyor...</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's an authentication error
  if (error && !isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="alert alert-danger d-inline-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <strong>Kimlik Doğrulama Hatası</strong>
              <div className="small mt-1">{error}</div>
            </div>
          </div>
          <div className="mt-3">
            <button 
              className="btn btn-danger"
              onClick={() => window.location.href = '/login'}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Giriş Sayfasına Git
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;