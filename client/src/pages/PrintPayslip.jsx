import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loading from "../components/Loading";
import { getPayslip } from "../services/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PrintPaySlip = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPayslip(id);
        setPayslip(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Payslip not found");
        toast.error("Failed to load payslip");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error || !payslip) {
    return (
      <p className="text-center py-12 text-slate-400">
        {error || "Payslip not found"}
      </p>
    );
  }

  const fmt = (v) => `$${parseFloat(v || 0).toLocaleString()}`;
  const period = `${MONTHS[payslip.month - 1]} ${payslip.year}`;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white animate-fade-in">
      <div className="text-center border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PAYSLIP</h1>
        <p className="text-slate-500 text-sm mt-1">{period}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Employee Name
          </p>
          <p className="font-semibold text-slate-900">{payslip.employeeName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Employee ID
          </p>
          <p className="font-semibold text-slate-900">{payslip.employeeCode}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Position
          </p>
          <p className="font-semibold text-slate-900">{payslip.position}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Email
          </p>
          <p className="font-semibold text-slate-900">{payslip.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Department
          </p>
          <p className="font-semibold text-slate-900">{payslip.department}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Period
          </p>
          <p className="font-semibold text-slate-900">{period}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-right py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Basic Salary</td>
              <td className="text-right py-3 px-4 text-slate-900 font-medium">
                {fmt(payslip.basicSalary)}
              </td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Allowances</td>
              <td className="text-right py-3 px-4 text-emerald-600 font-medium">
                +{fmt(payslip.allowances)}
              </td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Deductions</td>
              <td className="text-right py-3 px-4 text-rose-600 font-medium">
                -{fmt(payslip.deductions)}
              </td>
            </tr>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td className="py-3 px-4 font-bold text-slate-900">Net Salary</td>
              <td className="text-right py-3 px-4 font-bold text-slate-900 text-lg">
                {fmt(payslip.netSalary)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {payslip.notes && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
          <span className="font-medium text-slate-700">Notes: </span>
          {payslip.notes}
        </div>
      )}

      <div className="text-center">
        <button
          className="btn-primary print:hidden"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
};

export default PrintPaySlip;