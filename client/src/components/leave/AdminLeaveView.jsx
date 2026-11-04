import React, { useCallback, useEffect, useState } from "react";
import { Check, X, Loader2Icon, Search, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { listLeaves, approveLeave, rejectLeave, listEmployees } from "../../services/api";

const statusBadge = (status) => {
  if (status === "APPROVED") return "badge-success";
  if (status === "REJECTED") return "badge-danger";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-600";
  return "badge-warning";
};

const AdminLeaveView = ({ onStatsUpdate }) => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data.results || []);
    } catch {
      toast.error("Failed to load employees");
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employee = employeeFilter;
      const data = await listLeaves(params);
      let results = data.results || [];
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (l) =>
            l.employeeName.toLowerCase().includes(q) ||
            l.employeeCode.toLowerCase().includes(q)
        );
      }
      setLeaves(results);
      onStatsUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, employeeFilter, search, onStatsUpdate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const t = setTimeout(() => fetchLeaves(), 300);
    return () => clearTimeout(t);
  }, [fetchLeaves]);

  const handleAction = async (id, action) => {
    setProcessing(id);
    try {
      if (action === "approve") {
        await approveLeave(id);
        toast.success("Leave approved");
      } else {
        await rejectLeave(id);
        toast.success("Leave rejected");
      }
      await fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || `${action} failed`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeId})
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <div className="font-medium text-slate-900">
                        {leave.employeeName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {leave.employeeCode}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-800">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="text-slate-600 text-sm">
                      {format(new Date(leave.startDate), "MMM dd")} –{" "}
                      {format(new Date(leave.endDate), "MMM dd, yyyy")}
                    </td>
                    <td className="text-slate-600">{leave.days}</td>
                    <td className="max-w-xs">
                      <div className="truncate text-slate-600" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === "PENDING" ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleAction(leave.id, "approve")}
                            disabled={processing === leave.id}
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {processing === leave.id ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, "reject")}
                            disabled={processing === leave.id}
                            className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            {processing === leave.id ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveView;