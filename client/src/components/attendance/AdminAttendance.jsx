import React, { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { listAllAttendance, listEmployees } from "../../services/api";

const formatHours = (h) => {
  if (h == null) return "—";
  const total = parseFloat(h);
  if (isNaN(total) || total === 0) return total === 0 ? "0h 0m" : "—";
  const hh = Math.floor(total);
  const mm = Math.round((total - hh) * 60);
  return `${hh}h ${mm}m`;
};

const dayTypeBadgeClass = (dayType) => {
  const map = {
    "Full Day": "badge-success",
    "Three Quarter Day": "bg-blue-100 text-blue-700",
    "Half Day": "badge-warning",
    "Short Day": "badge-danger",
  };
  return map[dayType] || "bg-slate-100 text-slate-600";
};

const statusBadgeClass = (status) => {
  if (status === "PRESENT") return "badge-success";
  if (status === "LATE") return "badge-warning";
  if (status === "ABSENT") return "badge-danger";
  return "bg-slate-100 text-slate-600";
};

const AdminAttendance = () => {
  const now = new Date();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [search, setSearch] = useState("");

  const pageSize = 20;

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data.results || []);
    } catch {
      toast.error("Failed to load employees");
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year, page };
      if (selectedEmployee) params.employee = selectedEmployee;
      if (search) params.search = search;
      const data = await listAllAttendance(params);
      setRecords(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load attendance");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [month, year, selectedEmployee, search, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const t = setTimeout(() => fetchRecords(), 300);
    return () => clearTimeout(t);
  }, [fetchRecords]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [month, year, selectedEmployee, search]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          View attendance records across all employees
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Search employee..."
              className="w-full pl-10!"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeId})
              </option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {count} record{count === 1 ? "" : "s"} found
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Day Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium text-slate-900">
                        {r.employeeName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.employeeCode}
                      </div>
                    </td>
                    <td className="text-slate-600">{r.department || "—"}</td>
                    <td className="text-slate-600">
                      {format(new Date(r.date), "MMM dd, yyyy")}
                    </td>
                    <td className="text-slate-600">
                      {r.checkIn ? format(new Date(r.checkIn), "hh:mm a") : "—"}
                    </td>
                    <td className="text-slate-600">
                      {r.checkOut ? format(new Date(r.checkOut), "hh:mm a") : "—"}
                    </td>
                    <td className="text-slate-600 font-medium">
                      {formatHours(r.workingHours)}
                    </td>
                    <td>
                      {r.dayType ? (
                        <span className={`badge ${dayTypeBadgeClass(r.dayType)}`}>
                          {r.dayType}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {count > pageSize && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <p className="text-slate-500">
              Page {page} of {totalPages} ({count} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;