// src/frontend/src/App.js
// ✅ ROUTE SIRALAMA SORUNU DÜZELTİLDİ

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
import VehicleFormPage from './pages/VehicleFormPage';
import VehicleFuelPurchasesPage from './pages/VehicleFuelPurchasesPage';
import WeeklyProductionCalendarPage from './pages/WeeklyProductionCalendarPage';
import IssueDetailsPage from './pages/IssueDetailsPage';
import BOMTransferPage from './pages/BOMTransferPage';
import DataCamPreparationPage from './pages/DataCamPreparationPage';
import ItemsPage from './pages/ItemsPage';
import ItemGroupsPage from './pages/ItemGroupsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemEditPage from './pages/ItemEditPage';
import './App.css';
import TechnicalDrawingPreparationPage from './pages/TechnicalDrawingPreparationPage';

function App() {
  return (
    <div className="App">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* ============================================
                PUBLIC ROUTES
                ============================================ */}
            <Route path="/login" element={<Login />} />

            {/* ============================================
                DASHBOARD
                ============================================ */}
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
                ARAÇ YÖNETİMİ ROUTES
                SPESİFİK ROUTES ÖNCE!
                ============================================ */}
            
            {/* Araç Yakıt Alımları */}
            <Route
              path="/vehicles/:id/fuel-purchases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleFuelPurchasesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Düzenleme */}
            <Route
              path="/vehicles/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Yeni Araç */}
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

            {/* Araç Detay */}
            <Route
              path="/vehicles/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Araç Listesi */}
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
                TANIMLAMALAR ROUTES
                SPESİFİK ROUTES ÖNCE!
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

            {/* ✅ DÜZELTİLDİ: Ürün Düzenleme - Her iki pattern için de route tanımlandı */}
            <Route 
              path="/definitions/items/:id/edit" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ItemEditPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Eski pattern için backward compatibility */}
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
                SPESİFİK ROUTES ÖNCE, WILDCARD EN SONA!
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

            {/* Data/CAM Hazırlama */}
            <Route
              path="/production/data-cam"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataCamPreparationPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Teknik Resim Hazırlama */}
            <Route
              path="/production/technical-drawing-preparation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TechnicalDrawingPreparationPage />
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

            {/* ⚠️ WILDCARD ROUTE - EN SONA KOYULDU! */}
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