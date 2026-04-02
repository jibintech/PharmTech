import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminMedicines from './pages/AdminMedicines';
import BillingPage from './pages/BillingPage';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/biller/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="ADMIN">
              <AdminMedicines />
            </ProtectedRoute>
          } />

          <Route path="/biller/dashboard" element={
            <ProtectedRoute role="BILLER">
              <BillingPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
