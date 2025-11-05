// src/frontend/src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ProductionPage from './pages/ProductionPage';
import VisitorsPage from './pages/VisitorsPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage'; // YENİ
import VehicleFuelPurchasesPage from './pages/VehicleFuelPurchasesPage'; // YENİ
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
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          <Route path="/definitions/items/detail" element={
            <ProtectedRoute><Layout><ItemDetailPage /></Layout></ProtectedRoute>
          } />
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

          {/* Item Edit/New Page - YENİ */}
          <Route path="/definitions/items/edit" element={
            <ProtectedRoute><Layout><ItemEditPage /></Layout></ProtectedRoute>
          } />

          <Route path="/definitions/items/new" element={
            <ProtectedRoute><Layout><ItemEditPage /></Layout></ProtectedRoute>
          } />
          
          {/* Items Management Routes */}
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


          Routes içinde
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

          {/* YENİ ROUTE - Araç Detay Sayfası */}
          <Route
            path="/vehicles/detail"
            element={
              <ProtectedRoute>
                <Layout>
                  <VehicleDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* YENİ ROUTE - Araç Yakıt Alım Bilgileri Sayfası */}
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

          {/* Redirect routes */}
          <Route path="/" element={<Navigate to="/production/weekly-calendar" replace />} />
          <Route path="*" element={<Navigate to="/production/weekly-calendar" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;