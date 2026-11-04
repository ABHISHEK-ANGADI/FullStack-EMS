import {
  ArrowRightIcon,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  PalmtreeIcon,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const EmployeeDashboard = ({ data }) => {
  if (!data.hasEmployee) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to the Employee Portal</p>
        </div>
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="text-amber-700 font-medium">
            No employee record found for your account
          </p>
          <p className="text-sm text-amber-600 mt-1">
            Please contact your administrator to set up your employee profile.
          </p>
        </div>
      </div>
    );
  }

  const emp = data.employee;
  const latest = data.latestPayslip;

  const cards = [
    {
      icon: CalendarIcon,
      value: data.currentMonthAttendance,
      title: "Days Present",
      subtitle: "This month",
    },
    {
      icon: FileTextIcon,
      value: data.pendingLeaves,
      title: "Pending Leaves",
      subtitle: "Awaiting approval",
    },
    {
      icon: PalmtreeIcon,
      value: `${data.leaveRemaining} / ${data.leaveAllocated}`,
      title: "Leave Balance",
      subtitle: "Days remaining",
    },
    {
      icon: DollarSignIcon,
      value: latest
        ? `$${parseFloat(latest.netSalary).toLocaleString()}`
        : "N/A",
      title: "Latest Payslip",
      subtitle: latest ? `${latest.month}/${latest.year}` : "No payslips yet",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, {emp?.firstName}!</h1>
        <p className="page-subtitle">
          {emp?.position} — {emp?.department || "No Department"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between"
          >
            <div>
              <div className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
              <p className="text-sm font-medium text-slate-700">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {card.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
            </div>
            <card.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/attendance"
          className="btn-primary text-center inline-flex items-center justify-center gap-2"
        >
          Mark Attendance <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link to="/leave" className="btn-secondary text-center">
          Apply for Leave
        </Link>
        <Link to="/payslips" className="btn-secondary text-center">
          View Payslips
        </Link>
      </div>
    </div>
  );
};

export default EmployeeDashboard;