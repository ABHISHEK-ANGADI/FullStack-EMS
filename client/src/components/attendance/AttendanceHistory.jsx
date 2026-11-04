import React from "react";
import { format } from "date-fns";

const formatWorkingHours = (hours) => {
  if (hours == null) return "—";
  const total = parseFloat(hours);
  if (isNaN(total)) return "—";
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return `${h}h ${m}m`;
};

const dayTypeBadge = (record) => {
  if (record.dayType) {
    const map = {
      "Full Day": "badge-success",
      "Three Quarter Day": "bg-blue-100 text-blue-700",
      "Half Day": "badge-warning",
      "Short Day": "badge-danger",
    };
    return {
      label: record.dayType,
      className: map[record.dayType] || "bg-slate-100 text-slate-600",
    };
  }
  if (record.checkIn && !record.checkOut) {
    return { label: "In Progress", className: "bg-indigo-100 text-indigo-700" };
  }
  return null;
};

const AttendanceHistory = ({ history }) => {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="p-6 py-4">Date</th>
              <th className="p-6 py-4">Check In</th>
              <th className="p-6 py-4">Check Out</th>
              <th className="p-6 py-4">Working Hours</th>
              <th className="p-6 py-4">Day Type</th>
              <th className="p-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              history.map((record) => {
                const badge = dayTypeBadge(record);
                const statusClass =
                  record.status === "PRESENT"
                    ? "badge-success"
                    : record.status === "LATE"
                    ? "badge-warning"
                    : "badge-danger";
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {format(new Date(record.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.checkIn
                        ? format(new Date(record.checkIn), "hh:mm a")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.checkOut
                        ? format(new Date(record.checkOut), "hh:mm a")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatWorkingHours(record.workingHours)}
                    </td>
                    <td className="px-6 py-4">
                      {badge ? (
                        <span className={`badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusClass}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistory;