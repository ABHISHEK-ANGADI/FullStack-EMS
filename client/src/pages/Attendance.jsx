import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminAttendance from "../components/attendance/AdminAttendance";
import EmployeeAttendance from "../components/attendance/EmployeeAttendance";

const Attendance = () => {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <AdminAttendance />;
  return <EmployeeAttendance />;
};

export default Attendance;