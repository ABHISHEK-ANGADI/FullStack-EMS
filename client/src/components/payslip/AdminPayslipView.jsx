import React, { useCallback, useEffect, useState } from "react";
import { Download, Search, CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import GeneratePayslips from "./GeneratePayslips";
import { listPayslips, listEmployees } from "../../services/api";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const AdminPayslipView = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data.results || []);
    } catch {
      toast.error("Failed to load employees");
    }
  }, []);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = { year: yearFilter };
      if (employeeFilter) params.employee = employeeFilter;
      const data = await listPayslips(params);
      let results = data.results || [];
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (p) =>
            p.employeeName.toLowerCase().includes(q) ||
            p.employeeCode.toLowerCase().includes(q)
        );
      }
      setPayslips(results);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load payslips");
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, yearFilter, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const t = setTimeout(() => fetchPayslips(), 300);
    return () => clearTimeout(t);
  }, [fetchPayslips]);

  const years = [2024, 2025, 2026, 2027];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
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
          className="max-w-56"
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName} ({e.employeeId})
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(Number(e.target.value))}
          className="max-w-32"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <GeneratePayslips employees={employees} onSuccess={fetchPayslips} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No payslips found for {yearFilter}
                  </td>
                </tr>
              ) : (
                payslips.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium text-slate-900">{p.employeeName}</div>
                      <div className="text-xs text-slate-400">{p.employeeCode}</div>
                    </td>
                    <td className="text-slate-600">
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td className="text-slate-600">
                      ${parseFloat(p.basicSalary).toLocaleString()}
                    </td>
                    <td className="text-emerald-600">
                      +${parseFloat(p.allowances).toLocaleString()}
                    </td>
                    <td className="text-rose-600">
                      -${parseFloat(p.deductions).toLocaleString()}
                    </td>
                    <td className="font-semibold text-slate-900">
                      ${parseFloat(p.netSalary).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === "PAID" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() =>
                          window.open(`/print/payslips/${p.id}`, "_blank")
                        }
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ring-1 ring-blue-600/10"
                      >
                        <Download className="w-3 h-3 mr-1.5" /> Download
                      </button>
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

export default AdminPayslipView;