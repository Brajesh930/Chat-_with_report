import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportList from './pages/ReportList';
import ReportUpload from './pages/ReportUpload';
import ReportDetail from './pages/ReportDetail';
import AdminUsers from './pages/AdminUsers';
import AdminClients from './pages/AdminClients';
import AdminChatSettings from './pages/AdminChatSettings';
import AdminAlerts from './pages/AdminAlerts';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportList /></PrivateRoute>} />
          <Route path="/reports/upload" element={<PrivateRoute><ReportUpload /></PrivateRoute>} />
          <Route path="/reports/:id" element={<PrivateRoute><ReportDetail /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/clients" element={<PrivateRoute><AdminClients /></PrivateRoute>} />
          <Route path="/admin/chat-settings" element={<PrivateRoute><AdminChatSettings /></PrivateRoute>} />
          <Route path="/admin/alerts" element={<PrivateRoute><AdminAlerts /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
