import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(credentials);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-container">
      <div className="container-fluid min-vh-100">
        <div className="row min-vh-100">
          {/* Left Side - Brand */}
          <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center login-bg">
            <div className="text-center text-white">
              <div className="mb-4">
                <i className="bi bi-calendar-event-fill display-1"></i>
              </div>
              <h1 className="display-4 fw-bold mb-4">Vervo Portal</h1>
              <p className="lead mb-0">Vervo Portal İş Yönetim Sistemi</p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="col-md-6 d-flex align-items-center justify-content-center bg-light">
            <div className="login-form-container w-100" style={{ maxWidth: '400px' }}>
              {/* Mobile Brand */}
              <div className="text-center mb-4 d-md-none">
                <i className="bi bi-calendar-event-fill text-danger" style={{ fontSize: '3rem' }}></i>
                <h2 className="text-danger fw-bold">acara</h2>
              </div>

              <div className="text-center mb-4">
                <h2 className="fw-bold text-dark mb-2">Giriş Yap</h2>
                <p className="text-muted">Hesabınıza giriş yaparak devam edin</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    Email Adresi
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-lg border-start-0"
                      id="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleInputChange}
                      placeholder="admin@admin.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-semibold">
                    Şifre
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control form-control-lg border-start-0"
                      id="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="admin123"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Beni hatırla
                    </label>
                  </div>
                  <a href="#" className="text-decoration-none text-danger small">
                    Şifremi unuttum?
                  </a>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-danger btn-lg w-100 mb-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Giriş Yap
                    </>
                  )}
                </button>

                <div className="text-center">
                  <div className="bg-warning bg-opacity-25 border border-warning rounded p-3">
                    <small className="text-dark">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Demo Hesabı:</strong><br />
                      Email: admin@admin.com<br />
                      Şifre: admin123
                    </small>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;