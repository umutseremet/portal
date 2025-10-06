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
import './App.css';
import WeeklyProductionCalendarPage from './pages/WeeklyProductionCalendarPage';

function App() {
  return (
    <div className="App">
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
            path="/vehicles"
            element={
              <ProtectedRoute>
                <Layout>
                  <VehiclesPage />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;