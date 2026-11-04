import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listLeaves } from "../services/api";
import AdminLeaveView from "../components/leave/AdminLeaveView";
import EmployeeLeaveView from "../components/leave/EmployeeLeaveView";

const Leave = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [stats, setStats] = useState({ pending: 0 });

  const refreshStats = useCallback(async () => {
    try {
      const data = await listLeaves();
      const results = data.results || [];
      setStats({
        pending: results.filter((l) => l.status === "PENDING").length,
      });
    } catch {
      // silent — stats are non-critical
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">
            {isAdmin
              ? `Manage leave applications${stats.pending ? ` — ${stats.pending} pending` : ""}`
              : "Your leave history and requests"}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <AdminLeaveView onStatsUpdate={refreshStats} />
      ) : (
        <EmployeeLeaveView onStatsUpdate={refreshStats} />
      )}
    </div>
  );
};

export default Leave;