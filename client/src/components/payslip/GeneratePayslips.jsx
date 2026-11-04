import { Plus, X, Loader2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { generatePayslip } from "../../services/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GeneratePayslips = ({ employees, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      employeeId: Number(fd.get("employeeId")),
      month: Number(fd.get("month")),
      year: Number(fd.get("year")),
      status: fd.get("status") || "DRAFT",
      notes: fd.get("notes") || "",
    };
    const basic = fd.get("basicSalary");
    const allow = fd.get("allowances");
    const deduct = fd.get("deductions");
    if (basic) payload.basicSalary = basic;
    if (allow) payload.allowances = allow;
    if (deduct) payload.deductions = deduct;

    try {
      const ps = await generatePayslip(payload);
      toast.success(
        `Payslip generated: $${parseFloat(ps.netSalary).toLocaleString()} net`
      );
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      const detail = err.response?.data;
      const msg =
        typeof detail === "object"
          ? Object.entries(detail)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : detail?.detail || "Failed to generate payslip";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" /> Generate Payslip
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="card max-w-lg w-full p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Generate Payslip</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Employee
            </label>
            <select name="employeeId" required>
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Salary fields will pre-fill from the employee's current record
              unless you override them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Month
              </label>
              <select name="month" defaultValue={now.getMonth() + 1}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Year
              </label>
              <input
                type="number"
                name="year"
                defaultValue={now.getFullYear()}
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Basic (opt.)
              </label>
              <input type="number" name="basicSalary" step="0.01" placeholder="auto" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Allow. (opt.)
              </label>
              <input type="number" name="allowances" step="0.01" placeholder="auto" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Deduct. (opt.)
              </label>
              <input type="number" name="deductions" step="0.01" placeholder="auto" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select name="status" defaultValue="PAID">
              <option value="DRAFT">Draft</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (optional)
            </label>
            <input name="notes" placeholder="e.g. November payroll" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="btn-primary flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneratePayslips;