import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { createEmployee, updateEmployee } from "../services/api";

const EmployeeForm = ({ initialData, departments = [], onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      firstName: fd.get("firstName")?.trim(),
      lastName: fd.get("lastName")?.trim(),
      phone: fd.get("phone")?.trim() || "",
      position: fd.get("position")?.trim(),
      basicSalary: fd.get("basicSalary"),
      allowances: fd.get("allowances") || 0,
      deductions: fd.get("deductions") || 0,
      employmentStatus: fd.get("employmentStatus") || "ACTIVE",
      joinDate: fd.get("joinDate"),
      bio: fd.get("bio") || "",
      department_id: Number(fd.get("department_id")),
    };

    const password = fd.get("password");
    if (password) payload.password = password;

    try {
      if (isEditMode) {
        await updateEmployee(initialData.id, payload);
        toast.success("Employee updated");
      } else {
        payload.email = fd.get("email")?.trim().toLowerCase();
        payload.role = fd.get("role") || "EMPLOYEE";
        await createEmployee(payload);
        toast.success("Employee created");
      }
      onSuccess ? onSuccess() : navigate(-1);
    } catch (err) {
      const detail = err.response?.data;
      const msg =
        typeof detail === "object"
          ? Object.entries(detail)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : detail?.detail || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">
      {/* Personal info */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-medium mb-6 pb-4 border-b border-slate-100">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          <div>
            <label className="block mb-2">First Name</label>
            <input name="firstName" required defaultValue={initialData?.firstName} />
          </div>
          <div>
            <label className="block mb-2">Last Name</label>
            <input name="lastName" required defaultValue={initialData?.lastName} />
          </div>
          <div>
            <label className="block mb-2">Phone Number</label>
            <input name="phone" defaultValue={initialData?.phone} />
          </div>
          <div>
            <label className="block mb-2">Join Date</label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={
                initialData?.joinDate
                  ? new Date(initialData.joinDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block mb-2">Bio (Optional)</label>
            <textarea
              name="bio"
              defaultValue={initialData?.bio}
              rows={3}
              className="resize-none"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </div>

      {/* Employment info */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Employment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          <div>
            <label className="block mb-2">Department</label>
            <select
              name="department_id"
              required
              defaultValue={initialData?.department_id || ""}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Position</label>
            <input name="position" required defaultValue={initialData?.position} />
          </div>
          <div>
            <label className="block mb-2">Basic Salary</label>
            <input
              type="number"
              name="basicSalary"
              required
              min="0"
              step="0.01"
              defaultValue={initialData?.basicSalary || 0}
            />
          </div>
          <div>
            <label className="block mb-2">Allowances</label>
            <input
              type="number"
              name="allowances"
              min="0"
              step="0.01"
              defaultValue={initialData?.allowances || 0}
            />
          </div>
          <div>
            <label className="block mb-2">Deductions</label>
            <input
              type="number"
              name="deductions"
              min="0"
              step="0.01"
              defaultValue={initialData?.deductions || 0}
            />
          </div>
          {isEditMode && (
            <div>
              <label className="block mb-2">Status</label>
              <select
                name="employmentStatus"
                defaultValue={initialData?.employmentStatus || "ACTIVE"}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Account setup */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Account Setup
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          {!isEditMode && (
            <div className="sm:col-span-2">
              <label className="block mb-2">Work Email</label>
              <input type="email" name="email" required />
            </div>
          )}
          {isEditMode && (
            <div className="sm:col-span-2">
              <label className="block mb-2">
                Work Email — read only ({initialData?.email})
              </label>
              <input
                type="email"
                value={initialData?.email || ""}
                disabled
                className="bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
          )}
          <div>
            <label className="block mb-2">
              {isEditMode ? "New Password (leave blank to keep)" : "Temporary Password"}
            </label>
            <input
              type="password"
              name="password"
              required={!isEditMode}
              minLength={6}
              placeholder={isEditMode ? "Leave blank to keep current" : ""}
            />
          </div>
          {!isEditMode && (
            <div>
              <label className="block mb-2">System Role</label>
              <select name="role" defaultValue="EMPLOYEE">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center justify-center"
        >
          {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? "Update Employee" : "Create Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;