import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminPayslipView from "../components/payslip/AdminPayslipView";
import EmployeePayslipView from "../components/payslip/EmployeePayslipView";

const PaySlips = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Generate and manage employee payslips"
              : "Your payslip history"}
          </p>
        </div>
      </div>

      {isAdmin ? <AdminPayslipView /> : <EmployeePayslipView />}
    </div>
  );
};

export default PaySlips;