// src/frontend/src/App.js
// ✅ DÜZELTİLMİŞ VERSİYON - Route sıralaması ve VehicleFormPage import'u eklendi

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ProductionPage from './pages/ProductionPage';
import VisitorsPage from './pages/VisitorsPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehicleFormPage from './pages/VehicleFormPage'; // ✅ EKLENDİ
import VehicleFuelPurchasesPage from './pages/VehicleFuelPurchasesPage';
import WeeklyProductionCalendarPage from './pages/WeeklyProductionCalendarPage';
import IssueDetailsPage from './pages/IssueDetailsPage';
import './App.css';
import BOMTransferPage from './pages/BOMTransferPage';
import ItemsPage from './pages/ItemsPage';
import ItemGroupsPage from './pages/ItemGroupsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemEditPage from './pages/ItemEditPage';

function App() {
  return (
    <div className="App">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ============================================
                ARAÇ YÖNETİMİ ROUTES - SIRALAMA ÖNEMLİ!
                ============================================
                ✅ Spesifik route'lar ÖNCE gelmeli
                ✅ Genel route (/vehicles) EN SONDA
            */}
            
            {/* Yeni Araç Ekleme - /vehicles/new */}
            <Route
              path="/vehicles/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Düzenleme - /vehicles/edit/:id */}
            <Route
              path="/vehicles/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Detay - /vehicles/detail/:id */}
            <Route
              path="/vehicles/detail/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Yakıt Alımları - /vehicles/fuel-purchases */}
            <Route
              path="/vehicles/fuel-purchases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleFuelPurchasesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Listesi - /vehicles (EN SONA KOYULDU) */}
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehiclesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ============================================
                ÜRÜN YÖNETİMİ ROUTES - SIRALAMA ÖNEMLİ!
                ============================================ */}
            
            {/* Yeni Ürün Ekleme */}
            <Route 
              path="/definitions/items/new" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemEditPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Ürün Detay */}
            <Route 
              path="/definitions/items/detail/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemDetailPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Ürün Düzenleme */}
            <Route 
              path="/definitions/items/edit/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemEditPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Ürün Listesi */}
            <Route
              path="/definitions/items"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Ürün Grupları */}
            <Route
              path="/definitions/item-groups"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemGroupsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ============================================
                ÜRETİM YÖNETİMİ ROUTES
                ============================================ */}

            {/* BOM Transfer */}
            <Route
              path="/production/bom-transfer"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BOMTransferPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Haftalık Üretim Takvimi */}
            <Route
              path="/production/weekly-calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WeeklyProductionCalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* İş Detayları */}
            <Route
              path="/production/issue-details"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IssueDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Genel Üretim Sayfası (wildcard) */}
            <Route
              path="/production/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductionPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ============================================
                ZİYARETÇİ YÖNETİMİ
                ============================================ */}

            <Route
              path="/visitors"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VisitorsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ============================================
                REDIRECT ROUTES
                ============================================ */}

            {/* Ana sayfa - Haftalık takvime yönlendir */}
            <Route path="/" element={<Navigate to="/production/weekly-calendar" replace />} />
            
            {/* Tanımsız route'lar - Haftalık takvime yönlendir */}
            <Route path="*" element={<Navigate to="/production/weekly-calendar" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}

export default App;