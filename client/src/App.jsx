import React from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginLanding from "./pages/LoginLanding";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import PaySlips from "./pages/PaySlips";
import Settings from "./pages/Settings";
import PrintPaySlip from "./pages/PrintPaySlip";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginLanding />} />
        <Route path="/login/admin" element={<LoginForm role="admin" title="Admin Portal" subtitle="Sign in to manage the organization" />} />
        <Route path="/login/employee" element={<LoginForm role="employee" title="Employee Portal" subtitle="Sign in to access your account" />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/employees"
            element={
              <ProtectedRoute role="ADMIN">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payslips" element={<PaySlips />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/print/payslips/:id" element={<PrintPaySlip />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
};

export default App;