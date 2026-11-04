import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loading from "../components/Loading";
import AdminDashboard from "../components/AdminDashboard";
import EmployeeDashboard from "../components/EmployeeDashboard";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard, getEmployeeDashboard } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === "ADMIN") {
        const res = await getAdminDashboard();
        setData(res);
      } else {
        const res = await getEmployeeDashboard();
        setData(res);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Loading />;
  if (!data) {
    return (
      <p className="text-center text-slate-500 py-12">
        Failed to load the dashboard.
      </p>
    );
  }

  if (data.role === "ADMIN") {
    return <AdminDashboard data={data} />;
  }
  return <EmployeeDashboard data={data} />;
};

export default Dashboard;