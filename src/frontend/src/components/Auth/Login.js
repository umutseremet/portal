import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/production/weekly-calendar" replace />;
  }

  // Clear error when component mounts or credentials change
  // useEffect(() => {
  //   if (clearError) {
  //     clearError();
  //   }
  // }, [credentials, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      return;
    }

    const result = await login(credentials);

    console.log(credentials);

    console.log(result);
    if (result.success) {
      navigate('/dashboard');
    }
    // Error handling is done in the AuthContext
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  // Test credentials for development
  const handleTestLogin = () => {
    setCredentials({
      email: 'test',
      password: 'test1234'
    });
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
              <h1 className="display-4 fw-bold mb-0">VERVO PORTAL</h1>
              <p className="lead mb-0">VERVO İş Yönetim Sistemi</p>
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
                  <div className="flex-grow-1">
                    {error}
                  </div>
                  {clearError && (
                    <button
                      type="button"
                      className="btn-close"
                      onClick={clearError}
                      aria-label="Close"
                    ></button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    Kullanıcı Adı
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className={`form-control form-control-lg border-start-0 ${error ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleInputChange}
                      placeholder="admin"
                      required
                      disabled={loading}
                      autoComplete="username"
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
                      type={showPassword ? "text" : "password"}
                      className={`form-control form-control-lg border-start-0 border-end-0 ${error ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="password123"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      disabled={loading}
                    />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Beni hatırla
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-danger small p-0"
                    disabled={loading}
                  >
                    Şifremi unuttum?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger btn-lg w-100 mb-3"
                  disabled={loading || !credentials.email || !credentials.password}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Giriş Yap
                    </>
                  )}
                </button>

                {/* Development Helper */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100 mb-3"
                    onClick={handleTestLogin}
                    disabled={loading}
                  >
                    <i className="bi bi-gear me-1"></i>
                    Test Kullanıcısı ile Giriş
                  </button>
                )}

                <div className="text-center">
                  <div className="bg-info bg-opacity-10 border border-info rounded p-3">
                    <small className="text-dark">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>API Test Bilgileri:</strong><br />
                      Kullanıcı Adı: test<br />
                      Şifre: test1234
                    </small>
                  </div>
                </div>

                {/* API Status */}
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">API Durumu:</small>
                    <small className="text-success">
                      <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                      Bağlı (localhost:5154)
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