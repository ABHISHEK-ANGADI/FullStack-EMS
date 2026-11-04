import React, { useCallback, useEffect, useState } from "react";
import { Download, CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import { listPayslips } from "../../services/api";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EmployeePayslipView = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPayslips();
      setPayslips(data.results || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load payslips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
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
                <td colSpan={7} className="text-center py-12">
                  <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No payslips available yet
                </td>
              </tr>
            ) : (
              payslips.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-900">
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
  );
};

export default EmployeePayslipView;