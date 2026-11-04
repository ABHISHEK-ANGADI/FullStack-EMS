import React, { useCallback, useEffect, useState } from "react";
import { PalmtreeIcon, PlusIcon, ThermometerIcon, UmbrellaIcon, X } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import ApplyLeaveModal from "./ApplyLeaveModal";
import {
  listLeaves,
  getLeaveBalance,
  cancelLeave,
} from "../../services/api";

const statusBadge = (status) => {
  if (status === "APPROVED") return "badge-success";
  if (status === "REJECTED") return "badge-danger";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-600";
  return "badge-warning";
};

const EmployeeLeaveView = ({ onStatsUpdate }) => {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, balancesRes] = await Promise.all([
        listLeaves(),
        getLeaveBalance(),
      ]);
      setLeaves(leavesRes.results || []);
      setBalances(balancesRes.results || []);
      onStatsUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [onStatsUpdate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave request?")) return;
    setCancelling(id);
    try {
      await cancelLeave(id);
      toast.success("Leave cancelled");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  const statFor = (type) => {
    const b = balances.find((x) => x.leaveType === type);
    return {
      used: b?.used ?? 0,
      remaining: b?.remaining ?? 0,
      allocated: b?.allocated ?? 0,
    };
  };

  const leaveStats = [
    {
      label: "Sick Leave",
      icon: ThermometerIcon,
      ...statFor("SICK"),
    },
    {
      label: "Casual Leave",
      icon: UmbrellaIcon,
      ...statFor("CASUAL"),
    },
    {
      label: "Annual Leave",
      icon: PalmtreeIcon,
      ...statFor("ANNUAL"),
    },
  ];

  return (
    <div>
      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {leaveStats.map((s) => (
          <div
            key={s.label}
            className="card card-hover p-5 sm:p-6 flex items-center gap-4 relative overflow-hidden group"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
            <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
              <s.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {s.remaining}{" "}
                <span className="text-sm font-normal text-slate-400">
                  / {s.allocated} left
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.used} used
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Apply button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* History table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">My Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
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
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id}>
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
                    <td className="text-center">
                      {leave.status === "PENDING" ? (
                        <button
                          onClick={() => handleCancel(leave.id)}
                          disabled={cancelling === leave.id}
                          className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          {cancelling === leave.id ? "Cancelling..." : "Cancel"}
                        </button>
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

      <ApplyLeaveModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default EmployeeLeaveView;