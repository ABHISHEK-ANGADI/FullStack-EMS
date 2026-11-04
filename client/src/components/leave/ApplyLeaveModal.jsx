import { CalendarDays, FileText, Loader2, Send, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { applyLeave } from "../../services/api";

const ApplyLeaveModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      leaveType: fd.get("type"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      reason: fd.get("reason")?.trim(),
    };

    try {
      await applyLeave(payload);
      toast.success("Leave request submitted");
      e.target.reset();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const detail = err.response?.data;
      const msg =
        typeof detail === "object"
          ? Object.entries(detail)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : detail?.detail || "Failed to apply";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Apply for leave</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Submit your leave request for approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Leave Type
            </label>
            <select name="type" required>
              <option value="SICK">Sick Leave</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="ANNUAL">Annual Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              Duration
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-400 mb-1">From</span>
                <input type="date" name="startDate" required min={minDate} />
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">To</span>
                <input type="date" name="endDate" required min={minDate} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Reason
            </label>
            <textarea
              name="reason"
              required
              rows={3}
              className="resize-none"
              placeholder="Briefly describe why you need this leave..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Submitting" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;