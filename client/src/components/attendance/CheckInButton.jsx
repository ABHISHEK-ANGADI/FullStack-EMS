import { Loader2Icon, LogInIcon, LogOutIcon, CheckCircle2Icon } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { checkIn as apiCheckIn, checkOut as apiCheckOut } from "../../services/api";

const CheckInButton = ({ todayRecord, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCompleted = !!todayRecord?.checkOut;

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isCheckedIn) {
        await apiCheckOut();
        toast.success("Clocked out successfully");
      } else {
        await apiCheckIn();
        toast.success("Clocked in successfully");
      }
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.detail || "Action failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-2xl border border-emerald-200">
        <CheckCircle2Icon className="w-10 h-10 text-emerald-500 mb-2" />
        <h3 className="text-lg font-semibold text-slate-900">Work Day Completed</h3>
        <p className="text-slate-500 text-sm mt-1">
          Great job! See you tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <button
        onClick={handleAction}
        disabled={loading}
        className={`w-full max-w-sm flex items-center justify-center gap-4 p-5 rounded-xl text-white transition-all duration-200 ${
          loading
            ? "bg-slate-400 cursor-not-allowed"
            : isCheckedIn
            ? "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black active:scale-95"
            : "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95"
        }`}
      >
        {loading ? (
          <Loader2Icon className="size-7 animate-spin" />
        ) : isCheckedIn ? (
          <LogOutIcon className="size-7" />
        ) : (
          <LogInIcon className="size-7" />
        )}
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-medium mb-0.5">
            {loading
              ? "Processing..."
              : isCheckedIn
              ? "Clock Out"
              : "Clock In"}
          </h2>
          <p className="text-xs opacity-80">
            {isCheckedIn
              ? "Click to end your shift"
              : "Start your work day"}
          </p>
        </div>
      </button>

      {todayRecord?.checkIn && (
        <p className="text-xs text-slate-500">
          Checked in at{" "}
          {new Date(todayRecord.checkIn).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
};

export default CheckInButton;