import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-white border-top py-3">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="d-flex align-items-center text-muted small">
              <span>&copy; {currentYear} Aslan Group Portal. Tüm hakları saklıdır.</span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="d-flex align-items-center justify-content-md-end text-muted small">
              <span className="me-3">Versiyon 1.0.0</span>
              <div className="d-flex gap-3">
                <a href="#" className="text-muted text-decoration-none">Gizlilik</a>
                <a href="#" className="text-muted text-decoration-none">Şartlar</a>
                <a href="#" className="text-muted text-decoration-none">Destek</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;