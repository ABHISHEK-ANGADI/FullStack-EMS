import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loading from "../Loading";
import CheckInButton from "./CheckInButton";
import AttendanceStats from "./AttendanceStats";
import AttendanceHistory from "./AttendanceHistory";
import { getTodayAttendance, getMyAttendance } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [hasEmployee, setHasEmployee] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance(),
        getMyAttendance(),
      ]);
      setTodayRecord(todayRes.record);
      setHasEmployee(todayRes.hasEmployee);
      setHistory(historyRes.results || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Loading />;

  if (!hasEmployee) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            Track your work hours and daily check-ins
          </p>
        </div>
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="text-amber-700 font-medium">
            No employee record found for {user?.email}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            Attendance is only available for users with an employee profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          Track your work hours and daily check-ins
        </p>
      </div>

      <div className="mb-8">
        <CheckInButton todayRecord={todayRecord} onSuccess={fetchData} />
      </div>

      <AttendanceStats history={history} />
      <AttendanceHistory history={history} />
    </div>
  );
};

export default EmployeeAttendance;