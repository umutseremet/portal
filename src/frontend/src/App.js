// src/frontend/src/App.js
// ✅ ARAÇ YÖNETİMİ ROUTE SIRALAMA SORUNU DÜZELTİLDİ

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
import TechnicalDrawingPreparationPage from './pages/TechnicalDrawingPreparationPage';
import ItemsPage from './pages/ItemsPage';
import ItemGroupsPage from './pages/ItemGroupsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemEditPage from './pages/ItemEditPage';
import PermissionManagementPage from './pages/PermissionManagementPage';
import PermissionDetailPage from './pages/PermissionDetailPage';

// ✅ SATINALMA YÖNETİMİ IMPORT'LARI
import PurchaseRequestsListPage from './pages/PurchaseRequestsListPage';
import PurchaseRequestDetailPage from './pages/PurchaseRequestDetailPage';
import PurchaseRequestFormPage from './pages/PurchaseRequestFormPage';
import PurchaseOrdersListPage from './pages/PurchaseOrdersListPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';

// ✅ ARVENTO SAYFALARI
import VehicleWorkingReportPage from './pages/VehicleWorkingReportPage';
import VehicleLocationMapPage from './pages/VehicleLocationMapPage';

import RevisedIssuesPage from './pages/RevisedIssuesPage';

import OpenIssuesReportPage from './pages/Reports/OpenIssuesReportPage';
import ProjectAnalyticsReportPage from './pages/Reports/ProjectAnalyticsReportPage';
import LogoInvoiceApprovalPage from './pages/LogoInvoiceApprovalPage';
import './App.css';
import ProjectStatusReportPage from './pages/Reports/ProjectStatusReportPage';

function App() {
  return (
    <div className="App">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<Login />} />

            {/* DASHBOARD */}
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

            {/* ========================================
                SATINALMA YÖNETİMİ
                ======================================== */}

            {/* SATINALMA TALEPLERİ */}
            <Route
              path="/purchase-requests/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseRequestFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-requests/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseRequestFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-requests/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseRequestDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseRequestsListPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* SATINALMA SİPARİŞLERİ */}
            <Route
              path="/purchase-orders/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrderFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrderFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrderDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrdersListPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ONAY BEKLEYENLER */}
            <Route
              path="/pending-approvals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PendingApprovalsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logo-invoice-approval"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LogoInvoiceApprovalPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/reports/project-status" element={
              <ProtectedRoute>
                  <Layout>
                    <ProjectStatusReportPage />
                  </Layout>
                </ProtectedRoute>
              } />

            {/* ========================================
                ARAÇ YÖNETİMİ - ✅ SIRALAMA DÜZELTİLDİ
                ⚠️ KRİTİK: Spesifik route'lar MUTLAKA parametrik route'lardan ÖNCE!
                ======================================== */}

            {/* ✅ ARVENTO ROUTE'LARI - EN ÜST ÖNCE */}
            <Route
              path="/vehicles/arvento/working-report"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleWorkingReportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles/arvento/location-map"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleLocationMapPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ✅ YENİ ARAÇ - ÖNCE */}
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

            {/* ✅ ARAÇ DETAY - SPESİFİK ROUTE ÖNCE */}
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

            {/* ✅ ARAÇ DÜZENLEME - SPESİFİK ROUTE ÖNCE */}
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

            {/* ✅ YAKIT ALIMLARI - SPESİFİK ROUTE */}
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

            {/* ⚠️ ALTERNATİF FORMAT ROUTE'LARI - UYUMLULUK İÇİN (SONRA) */}
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
            <Route
              path="/vehicles/:id/detail"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ✅ ARAÇ LİSTESİ - EN SONDA */}
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


            {/* ========================================
              RAPORLAR
              ======================================== */}
            <Route path="/reports/open-issues" element={
              <ProtectedRoute>
                <Layout><OpenIssuesReportPage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/reports/project-analytics" element={
              <ProtectedRoute>
                <Layout><ProjectAnalyticsReportPage /></Layout>
              </ProtectedRoute>
            } />


            {/* ========================================
                ÜRÜN YÖNETİMİ
                ======================================== */}
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

            {/* ========================================
                YETKİ YÖNETİMİ
                ======================================== */}
            <Route
              path="/permissions/:type/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/definitions/permissions"
              element={<Navigate to="/permissions" replace />}
            />

            {/* ========================================
                ÜRETİM YÖNETİMİ
                ======================================== */}
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

            {/* ✅ YENİ ROUTE: Revize İşler Listesi */}
            <Route
              path="/production/revised-issues"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RevisedIssuesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ✅ YENİ EKLEME - ISSUE DETAILS SPESİFİK ROUTE */}
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
              path="/production/issue/:issueId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IssueDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/production/datacam-preparation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataCamPreparationPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
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

            {/* ========================================
                ZİYARETÇİ YÖNETİMİ
                ======================================== */}
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

            {/* ========================================
                REDIRECT ROUTES
                ======================================== */}
            <Route path="/" element={<Navigate to="/production/weekly-calendar" replace />} />
            <Route path="*" element={<Navigate to="/production/weekly-calendar" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}

export default App;